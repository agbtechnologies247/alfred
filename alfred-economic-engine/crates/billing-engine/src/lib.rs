use economic_core::{Currency, Money, Region, PricingSource};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageBill {
    pub customer_id: String,
    pub usage_amount: Decimal,
    pub rate_per_unit: Money,
    pub discount_applied: Money,
    pub threshold_limit: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub customer_id: String,
    pub subtotal: Money,
    pub tax: Money,
    pub total: Money,
    pub threshold_exceeded: bool,
}

pub struct BillingEngine;

impl BillingEngine {
    pub fn generate_invoice(bill: &UsageBill) -> Invoice {
        let base_amount = bill.usage_amount * bill.rate_per_unit.amount;
        let mut subtotal = if base_amount > bill.discount_applied.amount {
            base_amount - bill.discount_applied.amount
        } else {
            Decimal::ZERO
        };

        let tax_rate = Decimal::new(8, 2); // 8% tax
        let tax_amount = subtotal * tax_rate;
        let total_amount = subtotal + tax_amount;

        let threshold_exceeded = bill.usage_amount > bill.threshold_limit;

        Invoice {
            customer_id: bill.customer_id.clone(),
            subtotal: Money {
                amount: subtotal,
                currency: bill.rate_per_unit.currency,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Marketplace,
            },
            tax: Money {
                amount: tax_amount,
                currency: bill.rate_per_unit.currency,
                region: Region::Global,
                tax: Decimal::ZERO,
                source: PricingSource::Marketplace,
            },
            total: Money {
                amount: total_amount,
                currency: bill.rate_per_unit.currency,
                region: Region::Global,
                tax: tax_amount,
                source: PricingSource::Marketplace,
            },
            threshold_exceeded,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsumptionUsage {
    pub tickets_resolved: u64,
    pub ai_investigations: u64,
    pub ai_conversations: u64,
    pub signals_ingested: u64, // absolute count of signals
    pub remote_sessions: u64,
    pub deployments: u64,
    pub security_scans: u64,
    pub endpoint_actions: u64,
    pub reports_generated: u64,
    pub simulations_run: u64,
}

impl ConsumptionUsage {
    pub fn calculate_cost(&self) -> Money {
        let mut total = Decimal::ZERO;

        total += Decimal::from(self.tickets_resolved) * Decimal::from(2); // $2.00 per ticket
        total += Decimal::from(self.ai_investigations) * Decimal::from(5); // $5.00 per investigation
        total += Decimal::from(self.ai_conversations) * Decimal::new(1, 1); // $0.10 per conversation
        
        // Signals: $50 per million
        let million = Decimal::from(1_000_000);
        let signals_cost = (Decimal::from(self.signals_ingested) * Decimal::from(50)) / million;
        total += signals_cost;

        total += Decimal::from(self.remote_sessions) * Decimal::new(15, 1); // $1.50 per remote session
        total += Decimal::from(self.deployments) * Decimal::from(3); // $3.00 per deployment
        total += Decimal::from(self.security_scans) * Decimal::from(10); // $10.00 per scan
        total += Decimal::from(self.endpoint_actions) * Decimal::new(5, 1); // $0.50 per endpoint action
        total += Decimal::from(self.reports_generated) * Decimal::from(1); // $1.00 per report
        total += Decimal::from(self.simulations_run) * Decimal::from(15); // $15.00 per simulation

        Money {
            amount: total.round_dp(2),
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
    fn test_billing_invoice() {
        let bill = UsageBill {
            customer_id: "cust-102".to_string(),
            usage_amount: Decimal::from(1200),
            rate_per_unit: Money::usd(0.50), // subtotal 600
            discount_applied: Money::usd(100.0), // subtotal 500
            threshold_limit: Decimal::from(1000), // exceeded!
        };

        let invoice = BillingEngine::generate_invoice(&bill);
        assert_eq!(invoice.subtotal.amount, Decimal::from(500));
        assert_eq!(invoice.tax.amount, Decimal::from(40)); // 500 * 0.08 = 40
        assert_eq!(invoice.total.amount, Decimal::from(540));
        assert!(invoice.threshold_exceeded);
    }

    #[test]
    fn test_consumption_billing() {
        let usage = ConsumptionUsage {
            tickets_resolved: 100, // 200
            ai_investigations: 10, // 50
            ai_conversations: 500, // 50
            signals_ingested: 2_000_000, // 100 (2 * 50)
            remote_sessions: 20, // 30 (20 * 1.5)
            deployments: 5, // 15
            security_scans: 2, // 20
            endpoint_actions: 50, // 25
            reports_generated: 10, // 10
            simulations_run: 4, // 60
        };

        let cost = usage.calculate_cost();
        // 200 + 50 + 50 + 100 + 30 + 15 + 20 + 25 + 10 + 60 = 560
        assert_eq!(cost.amount, Decimal::from(560));
    }
}
