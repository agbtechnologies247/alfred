use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Currency {
    USD,
    EUR,
    GBP,
    INR,
    JPY,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlatformLicenseTier {
    Startup,
    Smb,
    MidMarket,
    Enterprise,
}

impl PlatformLicenseTier {
    pub fn annual_price(&self) -> Money {
        let amount = match self {
            Self::Startup => Decimal::from(5000),      // $5k - $20k
            Self::Smb => Decimal::from(20000),         // $20k - $80k
            Self::MidMarket => Decimal::from(80000),   // $80k - $250k
            Self::Enterprise => Decimal::from(250000), // $250k - $1M+
        };
        Money {
            amount,
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Contract,
        }
    }

    pub fn monthly_price(&self) -> Money {
        let annual = self.annual_price();
        Money {
            amount: (annual.amount / Decimal::from(12)).round_dp(2),
            currency: annual.currency,
            region: annual.region,
            tax: annual.tax,
            source: annual.source,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ServiceBundleType {
    Foundation,
    Operations,
    SecureEnterprise,
    OrgIntelligence,
    EnterpriseComplete,
}

impl ServiceBundleType {
    pub fn monthly_price(&self) -> Money {
        let amount = match self {
            Self::Foundation => Decimal::from(1500),         // Identity, Endpoint, Helpdesk, Knowledge
            Self::Operations => Decimal::from(5000),         // Infra, DevOps, Network, Observability
            Self::SecureEnterprise => Decimal::from(8000),   // Security, Compliance, SIAM, Identity Gov
            Self::OrgIntelligence => Decimal::from(12000),  // People, Business, Digital Twin, AI Ops
            Self::EnterpriseComplete => Decimal::from(25000), // All services bundle
        };
        Money {
            amount,
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Contract,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Region {
    Global,
    Aws(String),
    Azure(String),
    Gcp(String),
    OnPremise(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PricingSource {
    CloudBillingApi,
    Contract,
    ManualRateCard,
    Marketplace,
    Estimated,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Money {
    pub amount: Decimal,
    pub currency: Currency,
    pub region: Region,
    pub tax: Decimal,
    pub source: PricingSource,
}

impl Money {
    pub fn new(amount: Decimal, currency: Currency, region: Region, tax: Decimal, source: PricingSource) -> Self {
        Self {
            amount,
            currency,
            region,
            tax,
            source,
        }
    }

    pub fn zero(currency: Currency) -> Self {
        Self {
            amount: Decimal::ZERO,
            currency,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Estimated,
        }
    }

    pub fn usd(amount: f64) -> Self {
        Self {
            amount: Decimal::from_f64_retain(amount).unwrap_or(Decimal::ZERO),
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::Estimated,
        }
    }
}

pub trait EconomicEntity {
    fn acquisition_cost(&self) -> Money;
    fn operational_cost(&self) -> Money;
    fn business_value(&self) -> Money;
    fn revenue_supported(&self) -> Money;
    fn replacement_cost(&self) -> Money;
    fn downtime_cost(&self) -> Money;
    fn trust_score(&self) -> f32;
    fn risk_score(&self) -> f32;
    fn roi(&self) -> f32;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EconomicProfile {
    pub acquisition_cost: Money,
    pub operational_cost: Money,
    pub business_value: Money,
    pub revenue_supported: Money,
    pub replacement_cost: Money,
    pub downtime_cost: Money,
    pub trust_score: f32,
    pub risk_score: f32,
    pub roi: f32,
}

impl EconomicEntity for EconomicProfile {
    fn acquisition_cost(&self) -> Money {
        self.acquisition_cost.clone()
    }
    fn operational_cost(&self) -> Money {
        self.operational_cost.clone()
    }
    fn business_value(&self) -> Money {
        self.business_value.clone()
    }
    fn revenue_supported(&self) -> Money {
        self.revenue_supported.clone()
    }
    fn replacement_cost(&self) -> Money {
        self.replacement_cost.clone()
    }
    fn downtime_cost(&self) -> Money {
        self.downtime_cost.clone()
    }
    fn trust_score(&self) -> f32 {
        self.trust_score
    }
    fn risk_score(&self) -> f32 {
        self.risk_score
    }
    fn roi(&self) -> f32 {
        self.roi
    }
}
