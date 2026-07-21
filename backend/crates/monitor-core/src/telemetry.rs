use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TelemetryPayload {
    pub timestamp: String,
    pub host: String,
    pub layer: String,
    pub metrics: Metrics,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metrics {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub packet_loss: f64,
    pub latency: f64,
}

pub fn process_telemetry(payload: &TelemetryPayload) {
    tracing::info!(
        "Received telemetry from {}: CPU={:.1}% Latency={:.1}ms",
        payload.host,
        payload.metrics.cpu_usage,
        payload.metrics.latency
    );

    // Simulate rule engine
    if payload.metrics.packet_loss > 5.0 {
        tracing::warn!(
            "ALERT: High packet loss detected on {} ({}%)",
            payload.host,
            payload.metrics.packet_loss
        );
    }
}
