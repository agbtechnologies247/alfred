use axum::{
    routing::{get, post},
    Router, Json, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use rust_decimal::Decimal;
use economic_core::{Currency, Money, Region, PricingSource, EconomicProfile};
use ai_decision_engine::{AiDecisionEngine, DecisionRequest, DecisionOutcome};
use simulation_engine::{SimulationEngine, SimulationRequest, SimulationResult};
use pricing_engine::{PricingEngine, LayeredPricingRequest, LayeredPricingInvoice};
use policy_engine::PolicyLimits;
use trust_engine::TrustFactors;

pub fn app_router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/economics/summary", get(get_summary))
        .route("/api/v1/economics/evaluate", post(evaluate_decision))
        .route("/api/v1/economics/entity/:id", get(get_entity_profile))
        .route("/api/v1/economics/simulate", post(run_simulation))
        .route("/api/v1/economics/package-pricing", post(calculate_package_pricing))
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "Enterprise Economics Engine (E³)",
        "version": "0.1.0"
    }))
}

async fn get_summary() -> Json<Value> {
    // Return aggregated enterprise-wide opex, savings, ROI
    Json(json!({
        "total_monthly_opex": 42500.0,
        "mrr_supported": 180000.0,
        "average_trust_score": 0.92,
        "expected_risk_loss": 1250.0,
        "active_contracts": 14,
        "overall_roi_factor": 15.4
    }))
}

async fn evaluate_decision(Json(payload): Json<DecisionRequest>) -> Json<DecisionOutcome> {
    let outcome = AiDecisionEngine::evaluate_decision(&payload);
    Json(outcome)
}

async fn get_entity_profile(axum::extract::Path(id): axum::extract::Path<String>) -> Result<Json<EconomicProfile>, StatusCode> {
    // Mock response for individual entities
    let profile = EconomicProfile {
        acquisition_cost: Money::usd(5000.0),
        operational_cost: Money::usd(120.0),
        business_value: Money::usd(25000.0),
        revenue_supported: Money::usd(50000.0),
        replacement_cost: Money::usd(6500.0),
        downtime_cost: Money::usd(1500.0),
        trust_score: 0.95,
        risk_score: 0.08,
        roi: 8.5,
    };
    Ok(Json(profile))
}

async fn run_simulation(Json(payload): Json<SimulationRequest>) -> Json<SimulationResult> {
    let result = SimulationEngine::simulate_event(&payload);
    Json(result)
}

async fn calculate_package_pricing(Json(payload): Json<LayeredPricingRequest>) -> Json<LayeredPricingInvoice> {
    let invoice = PricingEngine::calculate_layered_invoice(&payload);
    Json(invoice)
}
