use crate::KnowledgeEngine;
use event_bus::{EventBus, AlfredEvent};
use tokio::task;

impl KnowledgeEngine {
    pub async fn run(self, event_bus: EventBus) {
        tracing::info!("Knowledge Engine Background Worker Started");
        let mut rx = event_bus.subscribe();

        task::spawn(async move {
            loop {
                if let Ok(event) = rx.recv().await {
                    match event {
                        AlfredEvent::IncidentResolved { incident_id, resolution_notes, .. } => {
                            tracing::info!("Knowledge Engine received IncidentResolved for {}", incident_id);
                            
                            // Extract title or default
                            let title = format!("Resolution for Incident {}", incident_id);
                            let steps = resolution_notes.split('\n').map(|s| s.to_string()).collect();

                            if let Err(e) = self.learn_from_incident(&incident_id, &title, steps, None).await {
                                tracing::error!("Failed to generate SOP: {}", e);
                            }
                        }
                        _ => {} // Ignore other events
                    }
                }
            }
        });
    }
}
