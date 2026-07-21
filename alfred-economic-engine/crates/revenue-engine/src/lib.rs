use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContractType {
    SaaSMonthlySubscription,
    SaaSAnnualSubscription,
    ProfessionalServicesFixedPrice,
    ManagedServiceProviderFlatRate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerContract {
    pub id: String,
    pub customer_id: String,
    pub contract_type: ContractType,
    pub value: Money,
    pub start_date: String,
    pub end_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessServiceRevenue {
    pub service_name: String,
    pub monthly_license_revenue: Money,
    pub variable_usage_revenue: Money,
}

pub struct RevenueEngine;

impl RevenueEngine {
    pub fn calculate_mrr(contracts: &[CustomerContract]) -> Money {
        let mut total = Decimal::ZERO;
        let currency = Currency::USD;

        for contract in contracts {
            // Normalize values to monthly recurring
            let monthly_contrib = match contract.contract_type {
                ContractType::SaaSMonthlySubscription => contract.value.amount,
                ContractType::SaaSAnnualSubscription => contract.value.amount / Decimal::from(12),
                ContractType::ProfessionalServicesFixedPrice => Decimal::ZERO, // project based, non-recurring
                ContractType::ManagedServiceProviderFlatRate => contract.value.amount,
            };
            total += monthly_contrib;
        }

        Money {
            amount: total,
            currency,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Contract,
        }
    }

    pub fn calculate_arr(contracts: &[CustomerContract]) -> Money {
        let mrr = Self::calculate_mrr(contracts);
        Money {
            amount: mrr.amount * Decimal::from(12),
            currency: mrr.currency,
            region: mrr.region,
            tax: mrr.tax,
            source: mrr.source,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_revenue_calculations() {
        let contracts = vec![
            CustomerContract {
                id: "CON-1".to_string(),
                customer_id: "CUST-A".to_string(),
                contract_type: ContractType::SaaSMonthlySubscription,
                value: Money::usd(5000.0),
                start_date: "2026-01-01".to_string(),
                end_date: "2026-12-31".to_string(),
            },
            CustomerContract {
                id: "CON-2".to_string(),
                customer_id: "CUST-B".to_string(),
                contract_type: ContractType::SaaSAnnualSubscription,
                value: Money::usd(120000.0), // 10000/month
                start_date: "2026-01-01".to_string(),
                end_date: "2026-12-31".to_string(),
            },
            CustomerContract {
                id: "CON-3".to_string(),
                customer_id: "CUST-C".to_string(),
                contract_type: ContractType::ProfessionalServicesFixedPrice,
                value: Money::usd(50000.0), // non-recurring
                start_date: "2026-03-01".to_string(),
                end_date: "2026-06-30".to_string(),
            },
        ];

        let mrr = RevenueEngine::calculate_mrr(&contracts);
        assert_eq!(mrr.amount, Decimal::from(15000)); // 5000 + (120000/12)

        let arr = RevenueEngine::calculate_arr(&contracts);
        assert_eq!(arr.amount, Decimal::from(180000));
    }
}
