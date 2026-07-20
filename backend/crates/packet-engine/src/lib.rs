use event_bus::{EventBus, AlfredEvent};
use serde_json::Value;
use tokio::net::UdpSocket;

pub struct PacketAnalyzer;

impl PacketAnalyzer {
    pub fn new() -> Self {
        Self
    }

    pub fn analyze_telemetry(&self, host: &str, packet_loss: f64, metrics: &Value, event_bus: &EventBus) {
        if packet_loss > 0.0 {
            tracing::warn!("Packet Engine: Analyzing packet drops ({:.2}%) on host: {}", packet_loss, host);
            
            let cpu = metrics.get("cpu_usage").and_then(|v| v.as_f64()).unwrap_or(0.0);
            if packet_loss > 8.0 && cpu < 80.0 {
                tracing::error!("Packet Engine Detected: Potential MTU mismatch path drop on {}", host);
                let event = AlfredEvent::AiAnalysisCompleted {
                    incident_id: format!("packet-anomaly-{}", host),
                    tags: vec!["MTU_Mismatch".to_string(), "Layer_3".to_string(), host.to_string()],
                    confidence: 0.96,
                };
                let _ = event_bus.publish(event);
            }
        }
    }
}

pub fn init_packet_engine(event_bus: EventBus) {
    tracing::info!("Initializing Packet Engine (Deep Packet Inspection on UDP Port 9999)...");
    
    tokio::spawn(async move {
        let socket = match UdpSocket::bind("127.0.0.1:9999").await {
            Ok(s) => {
                tracing::info!("Packet Engine: Bound UDP active listener to 127.0.0.1:9999");
                s
            }
            Err(e) => {
                tracing::error!("Packet Engine: Failed to bind UDP listener on port 9999: {}", e);
                return;
            }
        };

        let mut buf = [0u8; 2048];
        loop {
            match socket.recv_from(&mut buf).await {
                Ok((size, addr)) => {
                    tracing::info!("Packet Engine: Intercepted raw socket frame of {} bytes from {}", size, addr);
                    // Standard MTU size check (jumbo frame anomaly)
                    if size > 1500 {
                        tracing::warn!("Packet Engine Detected: Jumbo frame (size={}) intercepted from {}", size, addr);
                        let event = AlfredEvent::AiAnalysisCompleted {
                            incident_id: format!("packet-jumbo-{}", addr),
                            tags: vec!["Jumbo_Frame".to_string(), "Size_Anomaly".to_string(), addr.to_string()],
                            confidence: 0.98,
                        };
                        let _ = event_bus.publish(event);
                    }
                }
                Err(e) => {
                    tracing::error!("Packet Engine: Error reading from UDP socket: {}", e);
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use event_bus::EventBus;
    use std::net::UdpSocket as StdUdpSocket;

    #[tokio::test]
    async fn test_packet_engine_jumbo_frame() {
        let event_bus = EventBus::new(None);
        let mut rx = event_bus.subscribe();

        // Initialize packet engine
        init_packet_engine(event_bus.clone());
        
        // Wait briefly for socket to bind
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Send a jumbo UDP frame (> 1500 bytes)
        let sender = StdUdpSocket::bind("127.0.0.1:0").expect("Failed to bind test sender");
        let payload = vec![0u8; 1600];
        sender.send_to(&payload, "127.0.0.1:9999").expect("Failed to send test payload");

        // Wait for telemetry event
        let mut success = false;
        for _ in 0..10 {
            if let Ok(event) = rx.try_recv() {
                if let AlfredEvent::AiAnalysisCompleted { incident_id, tags, .. } = event {
                    if incident_id.contains("packet-jumbo-") && tags.contains(&"Jumbo_Frame".to_string()) {
                        success = true;
                        break;
                    }
                }
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        }

        assert!(success, "Packet Engine did not alert on jumbo frame!");
    }
}

