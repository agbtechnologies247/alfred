use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub failure_probability: Decimal,             // 0.00 to 1.00 (e.g. 0.12 for 12%)
    pub financial_impact: Money,                  // Total direct cost of outage/incident
    pub business_criticality_multiplier: Decimal, // 1.0 (Low) to 5.0 (Mission Critical)
    pub recovery_time_hours: Decimal,             // Expected duration to recover
}

pub struct RiskEngine;

impl RiskEngine {
    pub fn calculate_expected_loss(assessment: &RiskAssessment) -> Money {
        // Expected Loss = Probability * (Financial Impact * Recovery Time) * Criticality
        let total_impact_base = assessment.financial_impact.amount * assessment.recovery_time_hours;
        let weighted_impact = total_impact_base * assessment.business_criticality_multiplier;
        let expected_loss_amount = weighted_impact * assessment.failure_probability;

        Money {
            amount: expected_loss_amount,
            currency: assessment.financial_impact.currency,
            region: assessment.financial_impact.region.clone(),
            tax: Decimal::ZERO,
            source: PricingSource::Estimated,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_calculation() {
        let assessment = RiskAssessment {
            failure_probability: Decimal::new(12, 2), // 12%
            financial_impact: Money {
                amount: Decimal::from(4_000_000),
                currency: Currency::USD,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            business_criticality_multiplier: Decimal::from(1),
            recovery_time_hours: Decimal::from(1),
        };

        let loss = RiskEngine::calculate_expected_loss(&assessment);
        assert_eq!(loss.amount, Decimal::from(480_000));
    }
}
