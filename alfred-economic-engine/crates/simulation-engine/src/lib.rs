use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationRequest {
    pub action: String,
    pub target_entity_id: String,
    pub base_sla_penalty: Money,
    pub revenue_per_minute: Money,
    pub estimated_downtime_minutes: u32,
    pub affected_customers: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResult {
    pub action: String,
    pub target_entity_id: String,
    pub customers_affected: u64,
    pub revenue_lost: Money,
    pub sla_breach_probability: f32,
    pub trust_impact: f32,
    pub recommendation: String,
}

pub struct SimulationEngine;

impl SimulationEngine {
    pub fn simulate_event(req: &SimulationRequest) -> SimulationResult {
        // Calculate direct revenue lost: revenue_per_minute * downtime
        let direct_revenue_lost = req.revenue_per_minute.amount * Decimal::from(req.estimated_downtime_minutes);

        // Calculate SLA breach probability based on downtime minutes
        let sla_breach_probability = if req.estimated_downtime_minutes == 0 {
            0.0
        } else if req.estimated_downtime_minutes < 5 {
            0.05
        } else if req.estimated_downtime_minutes < 15 {
            0.25
        } else if req.estimated_downtime_minutes < 30 {
            0.60
        } else {
            0.95
        };

        // Calculate total expected cost including SLA penalties
        let expected_penalty = (req.base_sla_penalty.amount * Decimal::from_f64_retain(sla_breach_probability as f64).unwrap_or(Decimal::ZERO)).round_dp(2);
        let total_revenue_lost = direct_revenue_lost + expected_penalty;

        // Trust impact correlates with breach probability and customers affected
        let trust_impact = (sla_breach_probability * 0.5) + ((req.affected_customers as f32 / 1000.0).min(0.5));

        // Generate recommendation based on risk
        let recommendation = if trust_impact > 0.6 || sla_breach_probability > 0.5 {
            format!("ESCALATE: High risk of SLA breach. Delay action until low-traffic window and obtain senior SRE sign-off.")
        } else if trust_impact > 0.2 {
            format!("PROCEED_WITH_CAUTION: Medium impact detected. Notify on-call team before triggering.")
        } else {
            format!("AUTO_APPROVE: Low impact detected. Safe to execute immediately.")
        };

        SimulationResult {
            action: req.action.clone(),
            target_entity_id: req.target_entity_id.clone(),
            customers_affected: req.affected_customers,
            revenue_lost: Money {
                amount: total_revenue_lost,
                currency: req.revenue_per_minute.currency,
                region: req.revenue_per_minute.region.clone(),
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            sla_breach_probability,
            trust_impact,
            recommendation,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simulation_run() {
        let req = SimulationRequest {
            action: "restart_db".to_string(),
            target_entity_id: "db-orders-prod".to_string(),
            base_sla_penalty: Money::usd(10000.0),
            revenue_per_minute: Money::usd(500.0),
            estimated_downtime_minutes: 20, // breach prob 0.60
            affected_customers: 250,
        };

        let result = SimulationEngine::simulate_event(&req);
        // Direct revenue lost = 500 * 20 = 10000
        // Expected SLA penalty = 10000 * 0.60 = 6000
        // Total expected revenue lost = 16000
        assert_eq!(result.revenue_lost.amount, Decimal::from(16000));
        assert_eq!(result.sla_breach_probability, 0.60f32);
        assert!(result.recommendation.contains("ESCALATE"));
    }
}
