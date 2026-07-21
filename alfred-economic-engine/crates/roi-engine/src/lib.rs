use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoiContext {
    pub cost: Money,
    pub labor_time_saved_hours: Decimal,
    pub labor_rate_per_hour: Money,
    pub risk_reduction_value: Money,
    pub revenue_protected: Money,
}

pub struct RoiEngine;

impl RoiEngine {
    pub fn calculate_roi(ctx: &RoiContext) -> Decimal {
        let cost_amt = ctx.cost.amount;
        if cost_amt == Decimal::ZERO {
            return Decimal::ZERO;
        }

        // Total benefit = (Time Saved * Labor Rate) + Risk Reduced + Revenue Protected
        let labor_savings = ctx.labor_rate_per_hour.amount * ctx.labor_time_saved_hours;
        let total_benefit = labor_savings + ctx.risk_reduction_value.amount + ctx.revenue_protected.amount;

        // ROI = Benefit / Cost (expressed as a factor, e.g. 1500 for 1500x)
        total_benefit / cost_amt
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_roi_calculation() {
        let ctx = RoiContext {
            cost: Money::usd(12.0),
            labor_time_saved_hours: Decimal::from(100),
            labor_rate_per_hour: Money::usd(80.0), // $8000 labor savings
            risk_reduction_value: Money::usd(10000.0),
            revenue_protected: Money::zero(Currency::USD),
        };

        let roi = RoiEngine::calculate_roi(&ctx);
        // Cost: 12
        // Benefit: (100 * 80) + 10000 = 8000 + 10000 = 18000
        // ROI: 18000 / 12 = 1500
        assert_eq!(roi, Decimal::from(1500));
    }
}
