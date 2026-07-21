use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationProposal {
    pub resource_id: String,
    pub recommendation_type: String,
    pub monthly_cost_before: Money,
    pub monthly_cost_after: Money,
    pub implementation_cost: Money,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationResult {
    pub resource_id: String,
    pub recommendation_type: String,
    pub monthly_savings: Money,
    pub annual_savings: Money,
    pub payback_period_months: Decimal,
    pub roi_percent: Decimal,
}

pub struct RecommendationEngine;

impl RecommendationEngine {
    pub fn evaluate_proposal(proposal: &OptimizationProposal) -> Option<OptimizationResult> {
        if proposal.monthly_cost_before.amount <= proposal.monthly_cost_after.amount {
            return None; // No savings
        }

        let monthly_savings_amt = proposal.monthly_cost_before.amount - proposal.monthly_cost_after.amount;
        let annual_savings_amt = monthly_savings_amt * Decimal::from(12);

        let payback_period = if monthly_savings_amt > Decimal::ZERO {
            proposal.implementation_cost.amount / monthly_savings_amt
        } else {
            Decimal::ZERO
        };

        let roi_percent = if proposal.implementation_cost.amount > Decimal::ZERO {
            (annual_savings_amt / proposal.implementation_cost.amount) * Decimal::from(100)
        } else {
            Decimal::from(9999) // Infinite ROI
        };

        Some(OptimizationResult {
            resource_id: proposal.resource_id.clone(),
            recommendation_type: proposal.recommendation_type.clone(),
            monthly_savings: Money {
                amount: monthly_savings_amt,
                currency: proposal.monthly_cost_before.currency,
                region: proposal.monthly_cost_before.region.clone(),
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            annual_savings: Money {
                amount: annual_savings_amt,
                currency: proposal.monthly_cost_before.currency,
                region: proposal.monthly_cost_before.region.clone(),
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            payback_period_months: payback_period,
            roi_percent,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recommendation_evaluation() {
        let proposal = OptimizationProposal {
            resource_id: "aws-ec2-vm1".to_string(),
            recommendation_type: "ResizeInstance".to_string(),
            monthly_cost_before: Money::usd(180.0),
            monthly_cost_after: Money::usd(80.0),
            implementation_cost: Money::usd(50.0),
        };

        let result = RecommendationEngine::evaluate_proposal(&proposal).unwrap();
        assert_eq!(result.monthly_savings.amount, Decimal::from(100)); // 180 - 80
        assert_eq!(result.annual_savings.amount, Decimal::from(1200));
        assert_eq!(result.payback_period_months, Decimal::from_f64_retain(0.5).unwrap()); // 50 / 100
        assert_eq!(result.roi_percent, Decimal::from(2400)); // 1200 / 50 = 24 * 100
    }
}
