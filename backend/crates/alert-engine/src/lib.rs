use event_bus::{EventBus, AlfredEvent};
use reqwest::Client;
use serde_json::json;

pub struct AlertEngine {
    slack_webhook: Option<String>,
    pagerduty_integration_key: Option<String>,
    client: Client,
}

impl AlertEngine {
    pub fn new(slack_webhook: Option<String>, pagerduty_integration_key: Option<String>) -> Self {
        Self {
            slack_webhook,
            pagerduty_integration_key,
            client: Client::new(),
        }
    }

    pub fn start(&self, event_bus: EventBus) {
        let mut rx = event_bus.subscribe();
        let client = self.client.clone();
        let slack_url = self.slack_webhook.clone();
        let pd_key = self.pagerduty_integration_key.clone();

        tokio::spawn(async move {
            tracing::info!("Alert Engine: Listening for incident and critical events on EventBus...");
            while let Ok(event) = rx.recv().await {
                match &event {
                    AlfredEvent::IncidentCreated { incident_id, priority, source } => {
                        tracing::info!("Alert Engine: Critical Incident Created: ID={} priority={} source={}", incident_id, priority, source);

                        if let Some(url) = &slack_url {
                            let payload = json!({
                                "text": format!("🚨 *New Incident Created!*\n*ID:* `{}`\n*Priority:* `{}`\n*Source:* `{}`", incident_id, priority, source)
                            });
                            let _ = client.post(url).json(&payload).send().await;
                        }

                        if let Some(key) = &pd_key {
                            let payload = json!({
                                "routing_key": key,
                                "event_action": "trigger",
                                "payload": {
                                    "summary": format!("Incident {} created via {}", incident_id, source),
                                    "severity": match priority.as_str() {
                                        "P1" | "Critical" => "critical",
                                        "P2" | "High" => "error",
                                        _ => "warning",
                                    },
                                    "source": "A.L.F.R.E.D. alert-engine"
                                }
                            });
                            let _ = client.post("https://events.pagerduty.com/v2/enqueue").json(&payload).send().await;
                        }
                    }
                    AlfredEvent::IncidentResolved { incident_id, resolution_notes } => {
                        tracing::info!("Alert Engine: Incident Resolved: ID={}", incident_id);

                        if let Some(url) = &slack_url {
                            let payload = json!({
                                "text": format!("✅ *Incident Resolved!*\n*ID:* `{}`\n*Notes:* {}", incident_id, resolution_notes)
                            });
                            let _ = client.post(url).json(&payload).send().await;
                        }
                    }
                    _ => {}
                }
            }
        });
    }
}

pub fn init_alert_engine() {
    tracing::info!("Initializing Alert Notification Engine (Slack, PagerDuty)...");
}
