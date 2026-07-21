use economic_core::{Currency, Money, Region, PricingSource, PlatformLicenseTier, ServiceBundleType};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use marketplace_engine::{ManagedPackage, MarketplaceEngine};
use billing_engine::ConsumptionUsage;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CustomerTier {
    Standard,
    Gold,
    Enterprise,
    MspPartner,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingContext {
    pub base_price: Money,
    pub region_multiplier: Decimal,
    pub customer_tier: CustomerTier,
    pub discount_pct: Decimal, // e.g. 0.10 for 10%
    pub usage_units: u64,
    pub sla_penalty: Money,
    pub partner_margin_pct: Decimal, // e.g. 0.15 for 15%
    pub tax_rate: Decimal, // e.g. 0.08 for 8%
}

pub struct PricingEngine;

impl PricingEngine {
    pub fn calculate_final_price(ctx: &PricingContext) -> Money {
        // 1. Adjust base price by region multiplier
        let mut amount = ctx.base_price.amount * ctx.region_multiplier;

        // 2. Adjust for usage units if usage-based pricing applies
        if ctx.usage_units > 0 {
            amount = amount * Decimal::from(ctx.usage_units);
        }

        // 3. Apply Tier Discounts / Markups
        let tier_discount = match ctx.customer_tier {
            CustomerTier::Standard => Decimal::ZERO,
            CustomerTier::Gold => Decimal::new(1, 1),      // 10% discount
            CustomerTier::Enterprise => Decimal::new(2, 1), // 20% discount
            CustomerTier::MspPartner => Decimal::new(25, 2), // 25% discount
        };

        let total_discount = (ctx.discount_pct + tier_discount).min(Decimal::ONE);
        amount = amount * (Decimal::ONE - total_discount);

        // 4. Add Partner Margin
        if ctx.partner_margin_pct > Decimal::ZERO {
            amount = amount * (Decimal::ONE + ctx.partner_margin_pct);
        }

        // 5. Apply SLA Penalty
        if ctx.sla_penalty.currency == ctx.base_price.currency {
            amount = if amount > ctx.sla_penalty.amount {
                amount - ctx.sla_penalty.amount
            } else {
                Decimal::ZERO
            };
        }

        // 6. Calculate Taxes
        let tax = amount * ctx.tax_rate;
        let final_amount = amount + tax;

        Money {
            amount: final_amount,
            currency: ctx.base_price.currency,
            region: ctx.base_price.region.clone(),
            tax,
            source: PricingSource::Marketplace,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pricing_calculation() {
        let base = Money {
            amount: Decimal::from(100),
            currency: Currency::USD,
            region: Region::Global,
            tax: Decimal::ZERO,
            source: PricingSource::ManualRateCard,
        };

        let ctx = PricingContext {
            base_price: base,
            region_multiplier: Decimal::from(1),
            customer_tier: CustomerTier::Gold, // 10% discount
            discount_pct: Decimal::new(5, 2), // additional 5% discount
            usage_units: 0,
            sla_penalty: Money::zero(Currency::USD),
            partner_margin_pct: Decimal::ZERO,
            tax_rate: Decimal::new(1, 1), // 10% tax
        };

        let final_price = PricingEngine::calculate_final_price(&ctx);
        // Base: 100
        // Discount: 15% -> 85
        // Partner Margin: 0% -> 85
        // SLA Penalty: 0 -> 85
        // Tax: 10% -> 8.5
        // Final: 93.5
        assert_eq!(final_price.amount, Decimal::new(935, 1));
        assert_eq!(final_price.tax, Decimal::new(85, 1));
    }

    #[test]
    fn test_layered_pricing_aggregation() {
        let req = LayeredPricingRequest {
            license_tier: PlatformLicenseTier::Smb, // $1666.67 / month
            active_bundles: vec![ServiceBundleType::Foundation], // $1500 / month
            individual_packages: vec![
                ManagedPackage::Endpoint, // covered -> $0
                ManagedPackage::DevOps,   // not covered -> $2000
            ],
            consumption: ConsumptionUsage {
                tickets_resolved: 50, // $100
                ai_investigations: 0,
                ai_conversations: 0,
                signals_ingested: 0,
                remote_sessions: 0,
                deployments: 0,
                security_scans: 0,
                endpoint_actions: 0,
                reports_generated: 0,
                simulations_run: 0,
            },
        };

        let invoice = PricingEngine::calculate_layered_invoice(&req);
        // Platform: 1666.67
        // Bundles: 1500 (Foundation) + 2000 (DevOps) = 3500.00
        // Consumption: 100.00
        // Subtotal: 1666.67 + 3500.00 + 100.00 = 5266.67
        // Tax (8%): 5266.67 * 0.08 = 421.33
        // Total: 5688.00
        assert_eq!(invoice.platform_cost.amount, Decimal::new(166667, 2));
        assert_eq!(invoice.bundles_cost.amount, Decimal::new(3500, 0));
        assert_eq!(invoice.consumption_cost.amount, Decimal::new(100, 0));
        assert_eq!(invoice.subtotal.amount, Decimal::new(526667, 2));
        assert_eq!(invoice.tax.amount, Decimal::new(42133, 2));
        assert_eq!(invoice.total.amount, Decimal::new(568800, 2));
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayeredPricingRequest {
    pub license_tier: PlatformLicenseTier,
    pub active_bundles: Vec<ServiceBundleType>,
    pub individual_packages: Vec<ManagedPackage>,
    pub consumption: ConsumptionUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayeredPricingInvoice {
    pub platform_cost: Money,
    pub bundles_cost: Money,
    pub consumption_cost: Money,
    pub subtotal: Money,
    pub tax: Money,
    pub total: Money,
}

impl PricingEngine {
    pub fn calculate_layered_invoice(req: &LayeredPricingRequest) -> LayeredPricingInvoice {
        let platform_cost = req.license_tier.monthly_price();
        let bundles_cost = MarketplaceEngine::calculate_marketplace_bill(&req.active_bundles, &req.individual_packages);
        let consumption_cost = req.consumption.calculate_cost();

        let subtotal_amt = platform_cost.amount + bundles_cost.amount + consumption_cost.amount;
        let tax_rate = Decimal::new(8, 2); // 8% standard tax
        let tax_amt = (subtotal_amt * tax_rate).round_dp(2);
        let total_amt = subtotal_amt + tax_amt;

        LayeredPricingInvoice {
            platform_cost,
            bundles_cost,
            consumption_cost,
            subtotal: Money {
                amount: subtotal_amt,
                currency: Currency::USD,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Contract,
            },
            tax: Money {
                amount: tax_amt,
                currency: Currency::USD,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Contract,
            },
            total: Money {
                amount: total_amt,
                currency: Currency::USD,
                region: Region::Global,
                tax: tax_amt,
                source: PricingSource::Contract,
            },
        }
    }
}
