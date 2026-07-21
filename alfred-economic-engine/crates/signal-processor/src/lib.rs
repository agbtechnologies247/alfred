use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetrySignal {
    pub entity_id: String,
    pub signal_type: String,
    pub severity: String, // Info, Warning, Critical
    pub value: f64,
}

pub struct SignalAdjustment {
    pub trust_delta: f32,
    pub risk_delta: f32,
}

pub struct SignalProcessor;

impl SignalProcessor {
    pub fn process_signal(signal: &TelemetrySignal) -> SignalAdjustment {
        match signal.severity.as_str() {
            "Critical" => SignalAdjustment {
                trust_delta: -0.25,
                risk_delta: 0.30,
            },
            "Warning" => SignalAdjustment {
                trust_delta: -0.08,
                risk_delta: 0.10,
            },
            _ => SignalAdjustment {
                trust_delta: -0.01,
                risk_delta: 0.02,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_signal_processing() {
        let sig = TelemetrySignal {
            entity_id: "host-45".to_string(),
            signal_type: "CpuOverload".to_string(),
            severity: "Warning".to_string(),
            value: 88.5,
        };

        let adj = SignalProcessor::process_signal(&sig);
        assert_eq!(adj.trust_delta, -0.08f32);
        assert_eq!(adj.risk_delta, 0.10f32);
    }
}
