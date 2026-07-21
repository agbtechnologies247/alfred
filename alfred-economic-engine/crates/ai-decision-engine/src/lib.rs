use economic_core::{Currency, Money, Region, PricingSource};
use policy_engine::{PolicyLimits, PolicyEngine};
use roi_engine::{RoiContext, RoiEngine};
use trust_engine::{TrustFactors, TrustEngine};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionRequest {
    pub action: String,
    pub entity_id: String,
    pub estimated_cost: Money,
    pub estimated_revenue: Money,
    pub risk_probability: Decimal,
    pub trust_factors: TrustFactors,
    pub policy_limits: PolicyLimits,
    pub ai_confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionOutcome {
    pub decision: String, // Execute, Reject, Delay, Escalate, Recommend
    pub risk_score: f32,
    pub expected_cost: Money,
    pub expected_savings: Money,
    pub roi: Decimal,
    pub business_impact: String,
    pub confidence: f32,
    pub reasoning: String,
    pub suggested_action: String,
}

pub struct AiDecisionEngine;

impl AiDecisionEngine {
    pub fn evaluate_decision(req: &DecisionRequest) -> DecisionOutcome {
        // 1. Calculate trust score
        let agg_trust = TrustEngine::calculate_aggregate_trust(&req.trust_factors);

        // 2. Adjust risk probability by trust factor (lower trust increases risk)
        let trust_penalty = Decimal::from_f64_retain((1.0 - agg_trust) as f64).unwrap_or(Decimal::ZERO);
        let adjusted_risk = (req.risk_probability + trust_penalty).min(Decimal::ONE);
        let risk_score = adjusted_risk.to_f32().unwrap_or(0.5);

        // 3. Compute ROI
        let roi_ctx = RoiContext {
            cost: req.estimated_cost.clone(),
            labor_time_saved_hours: Decimal::from(5), // typical default SRE savings hours
            labor_rate_per_hour: Money::usd(75.0),
            risk_reduction_value: Money {
                amount: req.estimated_revenue.amount * Decimal::from_f64_retain(0.20).unwrap(), // prevent 20% risk impact
                currency: Currency::USD,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            revenue_protected: req.estimated_revenue.clone(),
        };
        let roi = RoiEngine::calculate_roi(&roi_ctx);

        // 4. Policy evaluation
        let pol_eval = PolicyEngine::evaluate_action(&req.policy_limits, &req.estimated_cost, risk_score);

        // 5. Determine decision state
        let decision = if !pol_eval.allowed {
            if pol_eval.escalation_required {
                "Escalate".to_string()
            } else {
                "Reject".to_string()
            }
        } else if agg_trust < 0.50 {
            "Delay".to_string()
        } else if req.ai_confidence < 0.70 {
            "Recommend".to_string()
        } else {
            "Execute".to_string()
        };

        let reasoning = format!(
            "Policy Allowed: {}. Reason: {}. Trust Score: {:.2}. Adjusted Risk: {:.2}. ROI Factor: {:.1}x.",
            pol_eval.allowed, pol_eval.reason, agg_trust, risk_score, roi
        );

        let suggested_action = match decision.as_str() {
            "Execute" => format!("Trigger immediate execution of: {}", req.action),
            "Escalate" => "Request manual review by enterprise security/finance team.".to_string(),
            "Delay" => "Wait for trust indicators to improve or schedule during maintenance hours.".to_string(),
            "Recommend" => "Present recommendation in developer cockpit for operator review.".to_string(),
            _ => "Abort planned action immediately.".to_string(),
        };

        DecisionOutcome {
            decision,
            risk_score,
            expected_cost: req.estimated_cost.clone(),
            expected_savings: Money {
                amount: req.estimated_revenue.amount - req.estimated_cost.amount,
                currency: req.estimated_cost.currency,
                region: req.estimated_cost.region.clone(),
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            roi,
            business_impact: if roi > Decimal::from(10) { "High Positive Impact".to_string() } else { "Moderate Impact".to_string() },
            confidence: req.ai_confidence,
            reasoning,
            suggested_action,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decision_evaluation() {
        let req = DecisionRequest {
            action: "reboot_api_gateway".to_string(),
            entity_id: "api-gw-prod".to_string(),
            estimated_cost: Money::usd(50.0),
            estimated_revenue: Money::usd(2000.0),
            risk_probability: Decimal::from_f64_retain(0.10).unwrap(),
            trust_factors: TrustFactors {
                operational_health: 0.90,
                compliance: 0.95,
                security: 0.90,
                availability: 0.95,
                reliability: 0.90,
                knowledge_quality: 0.80,
                vendor_rating: 0.90,
                ai_confidence: 0.90,
            },
            policy_limits: PolicyLimits {
                max_auto_approve_cost: Money::usd(1000.0),
                max_auto_approve_risk: 0.40,
                require_governance_review: false,
            },
            ai_confidence: 0.95,
        };

        let outcome = AiDecisionEngine::evaluate_decision(&req);
        assert_eq!(outcome.decision, "Execute");
        assert!(outcome.roi > Decimal::ZERO);
        assert!(outcome.suggested_action.contains("Trigger immediate execution"));
    }
}
