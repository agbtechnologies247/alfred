use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustFactors {
    pub operational_health: f32, // 0.0 to 1.0
    pub compliance: f32,
    pub security: f32,
    pub availability: f32,
    pub reliability: f32,
    pub knowledge_quality: f32,
    pub vendor_rating: f32,
    pub ai_confidence: f32,
}

pub struct TrustEngine;

impl TrustEngine {
    pub fn calculate_aggregate_trust(factors: &TrustFactors) -> f32 {
        // Define weights for each factor (must sum to 1.0)
        let weights = [
            (factors.operational_health, 0.15),
            (factors.compliance, 0.15),
            (factors.security, 0.20),
            (factors.availability, 0.15),
            (factors.reliability, 0.10),
            (factors.knowledge_quality, 0.05),
            (factors.vendor_rating, 0.05),
            (factors.ai_confidence, 0.15),
        ];

        let mut sum = 0.0;
        for &(val, weight) in &weights {
            // Bound values between 0.0 and 1.0
            let bounded_val = val.clamp(0.0, 1.0);
            sum += bounded_val * weight;
        }

        sum
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trust_aggregation() {
        let factors = TrustFactors {
            operational_health: 0.90,
            compliance: 0.95,
            security: 0.85,
            availability: 0.99,
            reliability: 0.90,
            knowledge_quality: 0.80,
            vendor_rating: 1.00,
            ai_confidence: 0.88,
        };

        let aggregate = TrustEngine::calculate_aggregate_trust(&factors);
        // aggregate = (0.90*0.15) + (0.95*0.15) + (0.85*0.20) + (0.99*0.15) + (0.90*0.10) + (0.80*0.05) + (1.00*0.05) + (0.88*0.15)
        // aggregate = 0.135 + 0.1425 + 0.170 + 0.1485 + 0.090 + 0.040 + 0.050 + 0.132
        // aggregate = 0.908
        assert!((aggregate - 0.908).abs() < 0.001);
    }
}
