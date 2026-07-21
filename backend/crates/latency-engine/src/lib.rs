use chrono::Utc;
use event_bus::{AlfredEvent, EventBus};
use serde_json::json;
use std::time::Instant;
use storage_engine::{StorageEngine, UnifiedEvent};
use tokio::net::TcpStream;
use uuid::Uuid;

pub struct LatencyMonitor {
    pub targets: Vec<String>,
    pub interval_seconds: u64,
}

impl LatencyMonitor {
    pub fn new(targets: Vec<String>, interval_seconds: u64) -> Self {
        Self {
            targets,
            interval_seconds,
        }
    }

    pub fn start(&self, event_bus: EventBus, storage: StorageEngine) {
        let targets = self.targets.clone();
        let interval = self.interval_seconds;

        tracing::info!("Starting active Latency & Connection Monitor background task...");

        tokio::spawn(async move {
            loop {
                for target in &targets {
                    let start = Instant::now();
                    match tokio::time::timeout(
                        tokio::time::Duration::from_millis(2000),
                        TcpStream::connect(&target),
                    )
                    .await
                    {
                        Ok(Ok(_)) => {
                            let duration = start.elapsed().as_millis() as f64;
                            tracing::info!("TCP probe to {}: success ({:.1}ms)", target, duration);

                            let ue = UnifiedEvent {
                                event_id: Uuid::new_v4(),
                                timestamp: Utc::now(),
                                event_type: "tcp_probe_success".to_string(),
                                category: "monitoring".to_string(),
                                object_type: "network_socket".to_string(),
                                object_id: target.clone(),
                                actor: "latency_engine".to_string(),
                                team: Some("Network".to_string()),
                                environment: "Production".to_string(),
                                severity: "low".to_string(),
                                status: "completed".to_string(),
                                before_state: json!({}),
                                after_state: json!({ "round_trip_time_ms": duration }),
                                linked_records: json!({}),
                                ai_analysis: json!({ "anomaly_score": 0.0, "confidence": 1.0, "summary": "TCP handshake completed successfully" }),
                                audit_metadata: json!({}),
                            };
                            let _ = storage.log_unified_event(&ue).await;

                            let event = AlfredEvent::AiAnalysisCompleted {
                                incident_id: format!(
                                    "latency-monitor-{}",
                                    target.replace(':', "-")
                                ),
                                tags: vec!["rtt_success".to_string(), target.clone()],
                                confidence: duration,
                            };
                            let _ = event_bus.publish(event);
                        }
                        Ok(Err(e)) => {
                            tracing::error!("TCP probe connection failed to {}: {}", target, e);

                            let ue = UnifiedEvent {
                                event_id: Uuid::new_v4(),
                                timestamp: Utc::now(),
                                event_type: "tcp_probe_failed".to_string(),
                                category: "monitoring".to_string(),
                                object_type: "network_socket".to_string(),
                                object_id: target.clone(),
                                actor: "latency_engine".to_string(),
                                team: Some("Network".to_string()),
                                environment: "Production".to_string(),
                                severity: "high".to_string(),
                                status: "failed".to_string(),
                                before_state: json!({}),
                                after_state: json!({ "error": e.to_string() }),
                                linked_records: json!({}),
                                ai_analysis: json!({ "anomaly_score": 0.8, "confidence": 0.95, "summary": "TCP connection refused or unreachable" }),
                                audit_metadata: json!({}),
                            };
                            let _ = storage.log_unified_event(&ue).await;

                            let event = AlfredEvent::IncidentCreated {
                                incident_id: uuid::Uuid::new_v4().to_string(),
                                priority: "P1".to_string(),
                                source: "latency-engine".to_string(),
                            };
                            let _ = event_bus.publish(event);
                        }
                        Err(_) => {
                            tracing::error!("TCP probe timed out for target {}", target);

                            let ue = UnifiedEvent {
                                event_id: Uuid::new_v4(),
                                timestamp: Utc::now(),
                                event_type: "tcp_probe_timeout".to_string(),
                                category: "monitoring".to_string(),
                                object_type: "network_socket".to_string(),
                                object_id: target.clone(),
                                actor: "latency_engine".to_string(),
                                team: Some("Network".to_string()),
                                environment: "Production".to_string(),
                                severity: "high".to_string(),
                                status: "failed".to_string(),
                                before_state: json!({}),
                                after_state: json!({ "timeout_ms": 2000 }),
                                linked_records: json!({}),
                                ai_analysis: json!({ "anomaly_score": 0.9, "confidence": 0.98, "summary": "TCP handshake timed out" }),
                                audit_metadata: json!({}),
                            };
                            let _ = storage.log_unified_event(&ue).await;

                            let event = AlfredEvent::IncidentCreated {
                                incident_id: uuid::Uuid::new_v4().to_string(),
                                priority: "P1".to_string(),
                                source: "latency-engine-timeout".to_string(),
                            };
                            let _ = event_bus.publish(event);
                        }
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_secs(interval)).await;
            }
        });
    }
}

pub fn init_latency_engine() {
    tracing::info!("Initializing Latency Engine...");
}
