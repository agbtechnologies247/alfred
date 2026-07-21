use economic_core::{Currency, Money, Region, PricingSource, ServiceBundleType};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PricingModel {
    FlatRate,
    UsageBased,
    Tiered,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagedService {
    pub id: String,
    pub package: String,
    pub price_model: PricingModel,
    pub included_actions: u32,
    pub usage_limits: u64,
    pub overage_cost_per_unit: Money,
    pub sla_uptime_percentage: f32,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ManagedPackage {
    DigitalWorkplace,
    Infrastructure,
    Network,
    DevOps,
    Security,
    Siam,
    ServiceDesk,
    Endpoint,
    Identity,
    BusinessOperations,
    Knowledge,
    Observability,
    Compliance,
    AiOperations,
    PeopleEngineering,
    DigitalTwin,
}

impl ManagedPackage {
    pub fn monthly_base_price(&self) -> Money {
        let amount = match self {
            Self::DigitalWorkplace => Decimal::from(500),
            Self::Endpoint => Decimal::from(500),
            Self::DevOps => Decimal::from(2000),
            Self::Infrastructure => Decimal::from(2000),
            Self::Security => Decimal::from(5000),
            Self::Siam => Decimal::from(3000),
            Self::DigitalTwin => Decimal::from(10000),
            Self::PeopleEngineering => Decimal::from(2000),
            Self::Network => Decimal::from(1000),
            Self::ServiceDesk => Decimal::from(800),
            Self::Identity => Decimal::from(600),
            Self::BusinessOperations => Decimal::from(1500),
            Self::Knowledge => Decimal::from(400),
            Self::Observability => Decimal::from(1200),
            Self::Compliance => Decimal::from(2500),
            Self::AiOperations => Decimal::from(3500),
        };
        Money {
            amount,
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Marketplace,
        }
    }
}

pub struct MarketplaceEngine;

impl MarketplaceEngine {
    pub fn calculate_service_cost(service: &ManagedService, base_price: Money, current_usage: u64) -> Money {
        let mut total = base_price.amount;

        if current_usage > service.usage_limits {
            let overage = current_usage - service.usage_limits;
            let overage_cost = Decimal::from(overage) * service.overage_cost_per_unit.amount;
            total += overage_cost;
        }

        Money {
            amount: total,
            currency: base_price.currency,
            region: base_price.region.clone(),
            tax: Decimal::ZERO,
            source: PricingSource::Marketplace,
        }
    }

    pub fn is_covered_by_bundle(pkg: ManagedPackage, bundle: ServiceBundleType) -> bool {
        match bundle {
            ServiceBundleType::Foundation => matches!(
                pkg,
                ManagedPackage::Identity
                    | ManagedPackage::Endpoint
                    | ManagedPackage::ServiceDesk
                    | ManagedPackage::Knowledge
            ),
            ServiceBundleType::Operations => matches!(
                pkg,
                ManagedPackage::Infrastructure
                    | ManagedPackage::DevOps
                    | ManagedPackage::Network
                    | ManagedPackage::Observability
            ),
            ServiceBundleType::SecureEnterprise => matches!(
                pkg,
                ManagedPackage::Security
                    | ManagedPackage::Compliance
                    | ManagedPackage::Siam
                    | ManagedPackage::Identity
            ),
            ServiceBundleType::OrgIntelligence => matches!(
                pkg,
                ManagedPackage::PeopleEngineering
                    | ManagedPackage::BusinessOperations
                    | ManagedPackage::DigitalTwin
                    | ManagedPackage::AiOperations
            ),
            ServiceBundleType::EnterpriseComplete => true,
        }
    }

    pub fn calculate_marketplace_bill(
        bundles: &[ServiceBundleType],
        individual_packages: &[ManagedPackage],
    ) -> Money {
        let mut total = Decimal::ZERO;

        // 1. Sum up all active bundle monthly fees
        for bundle in bundles {
            total += bundle.monthly_price().amount;
        }

        // 2. Add individual packages only if they are not covered by any active bundle
        for &pkg in individual_packages {
            let covered = bundles.iter().any(|&b| Self::is_covered_by_bundle(pkg, b));
            if !covered {
                total += pkg.monthly_base_price().amount;
            }
        }

        Money {
            amount: total,
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Marketplace,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_marketplace_pricing() {
        let service = ManagedService {
            id: "pkg-ai-soc".to_string(),
            package: "AI SOC".to_string(),
            price_model: PricingModel::UsageBased,
            included_actions: 100,
            usage_limits: 1000,
            overage_cost_per_unit: Money {
                amount: Decimal::new(1, 1),
                currency: Currency::USD,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Estimated,
            },
            sla_uptime_percentage: 99.9,
            dependencies: vec!["pkg-digital-twin".to_string()],
        };

        let base_price = Money {
            amount: Decimal::from(500),
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Estimated,
        };
        let cost = MarketplaceEngine::calculate_service_cost(&service, base_price, 1200); // 200 overage units

        // Total cost = 500 + (200 * 0.10) = 520
        assert_eq!(cost.amount, Decimal::from(520));
    }

    #[test]
    fn test_bundle_billing() {
        let bundles = vec![ServiceBundleType::Foundation]; // $1,500
        let individual = vec![
            ManagedPackage::Endpoint,       // covered by Foundation -> $0
            ManagedPackage::DevOps,         // not covered -> $2,000
            ManagedPackage::Infrastructure, // not covered -> $2,000
        ];

        let bill = MarketplaceEngine::calculate_marketplace_bill(&bundles, &individual);
        // Total = 1500 (Foundation) + 2000 (DevOps) + 2000 (Infra) = 5500
        assert_eq!(bill.amount, Decimal::from(5500));
    }
}
