use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfrastructureCost {
    pub cloud_compute: Money,
    pub storage: Money,
    pub bandwidth: Money,
    pub software_licenses: Money,
    pub carbon_credits: Money,
    pub electricity: Money,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HumanResourceCost {
    pub employee_salary: Money,
    pub contractor_rates: Money,
    pub support_overhead: Money,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetDepreciation {
    pub initial_value: Money,
    pub age_months: u32,
    pub useful_life_months: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpExProfile {
    pub infrastructure: InfrastructureCost,
    pub human_resources: HumanResourceCost,
    pub depreciation: AssetDepreciation,
}

pub struct CostEngine;

impl CostEngine {
    pub fn calculate_total_opex(profile: &OpExProfile) -> Money {
        let mut total = Decimal::ZERO;
        let currency = profile.infrastructure.cloud_compute.currency;

        // Sum infrastructure
        total += profile.infrastructure.cloud_compute.amount;
        total += profile.infrastructure.storage.amount;
        total += profile.infrastructure.bandwidth.amount;
        total += profile.infrastructure.software_licenses.amount;
        total += profile.infrastructure.carbon_credits.amount;
        total += profile.infrastructure.electricity.amount;

        // Sum HR
        total += profile.human_resources.employee_salary.amount;
        total += profile.human_resources.contractor_rates.amount;
        total += profile.human_resources.support_overhead.amount;

        // Add monthly depreciation
        let dep = &profile.depreciation;
        if dep.useful_life_months > 0 && dep.age_months < dep.useful_life_months {
            let monthly_dep = dep.initial_value.amount / Decimal::from(dep.useful_life_months);
            total += monthly_dep;
        }

        Money {
            amount: total,
            currency,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Estimated,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_opex_calculation() {
        let infra = InfrastructureCost {
            cloud_compute: Money::usd(500.00),
            storage: Money::usd(100.00),
            bandwidth: Money::usd(50.00),
            software_licenses: Money::usd(150.00),
            carbon_credits: Money::usd(10.00),
            electricity: Money::usd(40.00),
        };

        let hr = HumanResourceCost {
            employee_salary: Money::usd(8000.00),
            contractor_rates: Money::usd(2000.00),
            support_overhead: Money::usd(300.00),
        };

        let dep = AssetDepreciation {
            initial_value: Money::usd(12000.00),
            age_months: 12,
            useful_life_months: 60, // 200/month
        };

        let profile = OpExProfile {
            infrastructure: infra,
            human_resources: hr,
            depreciation: dep,
        };

        let opex = CostEngine::calculate_total_opex(&profile);
        // Infra: 500+100+50+150+10+40 = 850
        // HR: 8000+2000+300 = 10300
        // Dep: 12000 / 60 = 200
        // Total: 850 + 10300 + 200 = 11350
        assert_eq!(opex.amount, Decimal::from(11350));
    }
}
