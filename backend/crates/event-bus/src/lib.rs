use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use std::sync::Arc;
use futures::stream::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlfredEvent {
    IncidentCreated { incident_id: String, priority: String, source: String },
    IncidentResolved { incident_id: String, resolution_notes: String },
    AiAnalysisRequested { incident_id: String },
    AiAnalysisCompleted { incident_id: String, tags: Vec<String>, confidence: f64 },
    ApprovalRequired { workflow_id: String, context: String },
    WorkflowExecuted { workflow_id: String },
    // People Engineering events
    CheckInSubmitted { person_id: String, date: String },
    SentimentAlert { person_id: String, stress_level: f64, confidence: f64 },
    BlockerDetected { person_id: String, blocker_description: String, dependency: Option<String> },
}

#[derive(Debug, Serialize, Deserialize)]
struct EventEnvelope {
    sender_id: String,
    event: AlfredEvent,
}

#[derive(Clone)]
pub struct EventBus {
    instance_id: String,
    sender: broadcast::Sender<AlfredEvent>,
    redis_client: Option<redis::Client>,
}

impl EventBus {
    pub fn new(redis_url: Option<&str>) -> Self {
        let (sender, _) = broadcast::channel(1024);
        let instance_id = uuid::Uuid::new_v4().to_string();

        let redis_client = if let Some(url) = redis_url {
            match redis::Client::open(url) {
                Ok(client) => {
                    tracing::info!("EventBus: Initialized Redis client at {}", url);
                    Some(client)
                }
                Err(e) => {
                    tracing::warn!("EventBus: Failed to initialize Redis client: {}", e);
                    None
                }
            }
        } else {
            None
        };

        let this = Self {
            instance_id,
            sender,
            redis_client,
        };

        // Start background PubSub listener if Redis is configured
        if let Some(client) = &this.redis_client {
            let tx = this.sender.clone();
            let my_id = this.instance_id.clone();
            let client_clone = client.clone();
            
            tokio::spawn(async move {
                tracing::info!("EventBus: Connecting to Redis for Streams consumer group...");
                if let Ok(mut conn) = client_clone.get_async_connection().await {
                    // Try to create the consumer group alfred_consumers. MKSTREAM makes the stream if it does not exist.
                    let _: Result<(), redis::RedisError> = redis::cmd("XGROUP")
                        .arg("CREATE")
                        .arg("alfred_stream")
                        .arg("alfred_consumers")
                        .arg("$")
                        .arg("MKSTREAM")
                        .query_async(&mut conn)
                        .await;

                    tracing::info!("EventBus: Stream consumer group 'alfred_consumers' verified. Polling for events...");

                    loop {
                        let reply: Result<redis::Value, redis::RedisError> = redis::cmd("XREADGROUP")
                            .arg("GROUP")
                            .arg("alfred_consumers")
                            .arg(&my_id)
                            .arg("BLOCK")
                            .arg("2000")
                            .arg("COUNT")
                            .arg("10")
                            .arg("STREAMS")
                            .arg("alfred_stream")
                            .arg(">")
                            .query_async(&mut conn)
                            .await;

                        match reply {
                            Ok(redis::Value::Bulk(streams)) => {
                                for stream_val in streams {
                                    if let redis::Value::Bulk(stream_data) = stream_val {
                                        if stream_data.len() >= 2 {
                                            if let redis::Value::Bulk(messages) = &stream_data[1] {
                                                for msg_val in messages {
                                                    if let redis::Value::Bulk(msg_data) = msg_val {
                                                        if msg_data.len() >= 2 {
                                                            let msg_id = match &msg_data[0] {
                                                                redis::Value::Data(bytes) => String::from_utf8_lossy(bytes).into_owned(),
                                                                _ => continue,
                             };
                                                            
                                                            if let redis::Value::Bulk(fields) = &msg_data[1] {
                                                                let mut event_payload: Option<String> = None;
                                                                for chunk in fields.chunks(2) {
                                                                    if chunk.len() == 2 {
                                                                        let key = match &chunk[0] {
                                                                            redis::Value::Data(bytes) => std::str::from_utf8(bytes).unwrap_or(""),
                                                                            _ => "",
                                                                        };
                                                                        if key == "event" {
                                                                            event_payload = match &chunk[1] {
                                                                                redis::Value::Data(bytes) => Some(String::from_utf8_lossy(bytes).into_owned()),
                                                                                _ => None,
                                                                            };
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                                
                                                                if let Some(payload_str) = event_payload {
                                                                    if let Ok(envelope) = serde_json::from_str::<EventEnvelope>(&payload_str) {
                                                                        if envelope.sender_id != my_id {
                                                                            tracing::info!("EventBus: Received external stream event from Redis: {:?}", envelope.event);
                                                                            let _ = tx.send(envelope.event);
                                                                        }
                                                                    }
                                                                }
                                                                
                                                                // Acknowledge the message
                                                                let _: Result<(), redis::RedisError> = redis::cmd("XACK")
                                                                    .arg("alfred_stream")
                                                                    .arg("alfred_consumers")
                                                                    .arg(&msg_id)
                                                                    .query_async(&mut conn)
                                                                    .await;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            Ok(redis::Value::Nil) => {
                                // Timeout (no new messages)
                            }
                            Ok(_) => {}
                            Err(e) => {
                                tracing::error!("EventBus: Redis Streams error: {}", e);
                                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
                            }
                        }
                    }
                } else {
                    tracing::error!("EventBus: Failed to establish Redis connection for Streams");
                }
            });
        }

        this
    }

    pub fn publish(&self, event: AlfredEvent) -> Result<usize, String> {
        tracing::info!("EventBus Publishing: {:?}", event);

        // Always publish to the local channel first
        let local_res = self.sender.send(event.clone())
            .map_err(|e| format!("Local broadcast send error: {}", e));

        // Publish to Redis Stream if configured
        if let Some(client) = &self.redis_client {
            let envelope = EventEnvelope {
                sender_id: self.instance_id.clone(),
                event,
            };
            if let Ok(payload) = serde_json::to_string(&envelope) {
                let client_clone = client.clone();
                tokio::spawn(async move {
                    if let Ok(mut conn) = client_clone.get_async_connection().await {
                        let _: Result<(), redis::RedisError> = redis::cmd("XADD")
                            .arg("alfred_stream")
                            .arg("*")
                            .arg("event")
                            .arg(payload)
                            .query_async(&mut conn)
                            .await;
                    }
                });
            }
        }

        local_res
    }

    pub fn subscribe(&self) -> broadcast::Receiver<AlfredEvent> {
        self.sender.subscribe()
    }
}

