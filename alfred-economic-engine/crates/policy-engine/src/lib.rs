use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyLimits {
    pub max_auto_approve_cost: Money,
    pub max_auto_approve_risk: f32,
    pub require_governance_review: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyEvaluation {
    pub allowed: bool,
    pub escalation_required: bool,
    pub reason: String,
}

pub struct PolicyEngine;

impl PolicyEngine {
    pub fn evaluate_action(limits: &PolicyLimits, cost: &Money, risk_score: f32) -> PolicyEvaluation {
        if limits.require_governance_review {
            return PolicyEvaluation {
                allowed: false,
                escalation_required: true,
                reason: "Governance review is globally required for this environment.".to_string(),
            };
        }

        // Compare currency if applicable
        if cost.currency == limits.max_auto_approve_cost.currency && cost.amount > limits.max_auto_approve_cost.amount {
            return PolicyEvaluation {
                allowed: false,
                escalation_required: true,
                reason: format!("Proposed action cost ({}) exceeds the auto-approval threshold of ({}).", cost.amount, limits.max_auto_approve_cost.amount),
            };
        }

        if risk_score > limits.max_auto_approve_risk {
            return PolicyEvaluation {
                allowed: false,
                escalation_required: true,
                reason: format!("Proposed action risk score ({:.2}) exceeds the auto-approval threshold of ({:.2}).", risk_score, limits.max_auto_approve_risk),
            };
        }

        PolicyEvaluation {
            allowed: true,
            escalation_required: false,
            reason: "Action is within policy thresholds and is auto-approved.".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_policy_evaluation() {
        let limits = PolicyLimits {
            max_auto_approve_cost: Money::usd(1000.0),
            max_auto_approve_risk: 0.60,
            require_governance_review: false,
        };

        let ev1 = PolicyEngine::evaluate_action(&limits, &Money::usd(200.0), 0.35);
        assert!(ev1.allowed);
        assert!(!ev1.escalation_required);

        let ev2 = PolicyEngine::evaluate_action(&limits, &Money::usd(1200.0), 0.35);
        assert!(!ev2.allowed);
        assert!(ev2.escalation_required);
        assert!(ev2.reason.contains("exceeds the auto-approval threshold"));
    }
}
