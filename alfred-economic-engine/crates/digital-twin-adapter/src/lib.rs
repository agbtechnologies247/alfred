use economic_core::{Currency, Money, Region, PricingSource, EconomicProfile};
use rust_decimal::Decimal;
use serde_json::Value;

pub struct DigitalTwinAdapter;

impl DigitalTwinAdapter {
    pub fn parse_properties_to_profile(props: &Value) -> EconomicProfile {
        let acq = props.get("acquisition_cost").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let ope = props.get("operational_cost").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let bus = props.get("business_value").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let rev = props.get("revenue_supported").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let rep = props.get("replacement_cost").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let dow = props.get("downtime_cost").and_then(|v| v.as_f64()).unwrap_or(0.0);

        let trust = props.get("trust_score").and_then(|v| v.as_f64()).unwrap_or(1.0) as f32;
        let risk = props.get("risk_score").and_then(|v| v.as_f64()).unwrap_or(0.0) as f32;
        let roi = props.get("roi").and_then(|v| v.as_f64()).unwrap_or(1.0) as f32;

        EconomicProfile {
            acquisition_cost: Money::usd(acq),
            operational_cost: Money::usd(ope),
            business_value: Money::usd(bus),
            revenue_supported: Money::usd(rev),
            replacement_cost: Money::usd(rep),
            downtime_cost: Money::usd(dow),
            trust_score: trust,
            risk_score: risk,
            roi,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_twin_adaptation() {
        let json_props = json!({
            "acquisition_cost": 25000.0,
            "operational_cost": 450.00,
            "business_value": 75000.0,
            "trust_score": 0.94,
            "risk_score": 0.15
        });

        let profile = DigitalTwinAdapter::parse_properties_to_profile(&json_props);
        assert_eq!(profile.acquisition_cost.amount, Decimal::from(25000));
        assert_eq!(profile.operational_cost.amount, Decimal::from(450));
        assert_eq!(profile.trust_score, 0.94f32);
        assert_eq!(profile.risk_score, 0.15f32);
    }
}
