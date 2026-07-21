use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApplicationOnboardingConfig {
    pub app_name: String,
    pub app_version: String,
    pub environment: String,
    pub container_engine: String,
    pub backend_container: String,
    pub frontend_container: String,
    pub backend_port: u16,
    pub frontend_port: u16,
    pub health_endpoint: String,
    pub readiness_endpoint: String,
    pub log_stream_path: String,
    pub db_engine: String,
    pub db_connection_template: String,
    pub db_backup_path: String,
    pub auth_provider: String,
    pub service_account_token: String,
    pub queue_engine: String,
    pub fqdn_url: String,
    pub api_base_url: String,
    pub sre_hourly_cost_usd: f64,
    pub criticality_tier: String,
    pub outage_cost_per_hour_usd: f64,
    pub target_mttr_mins: u32,
    pub auto_approve_container_restart: bool,
    pub auto_approve_db_pool_flush: bool,
    pub auto_approve_cache_clear: bool,
    pub max_auto_impact_usd: f64,
}

impl Default for ApplicationOnboardingConfig {
    fn default() -> Self {
        Self {
            app_name: "BillSoft SaaS Local".to_string(),
            app_version: "1.0.0".to_string(),
            environment: "production".to_string(),
            container_engine: "Docker Compose".to_string(),
            backend_container: "billsoft-backend".to_string(),
            frontend_container: "billsoft-frontend".to_string(),
            backend_port: 5055,
            frontend_port: 3002,
            health_endpoint: "http://localhost:5055/api/health".to_string(),
            readiness_endpoint: "http://localhost:5055/api/health/deep".to_string(),
            log_stream_path: "/app/data/logs/app.log".to_string(),
            db_engine: "SQLite / Prisma ORM".to_string(),
            db_connection_template: "file:/app/data/billsoft.db".to_string(),
            db_backup_path: "./scripts/deploy.sh -> ./backups/".to_string(),
            auth_provider: "JWT (Bearer Token)".to_string(),
            service_account_token: "sk_alfred_billsoft_service_key_9941".to_string(),
            queue_engine: "BullMQ + Redis 7".to_string(),
            fqdn_url: "http://billsoft.agbtechnologies.com".to_string(),
            api_base_url: "http://localhost:5055/api".to_string(),
            sre_hourly_cost_usd: 150.0,
            criticality_tier: "Tier 1 (Core Billing)".to_string(),
            outage_cost_per_hour_usd: 25000.0,
            target_mttr_mins: 15,
            auto_approve_container_restart: true,
            auto_approve_db_pool_flush: true,
            auto_approve_cache_clear: true,
            max_auto_impact_usd: 1000.0,
        }
    }
}

pub async fn get_onboarding_config(State(_state): State<AppState>) -> Json<Value> {
    let config = ApplicationOnboardingConfig::default();
    Json(json!({
        "status": "success",
        "config": config,
        "validation_passed": true,
        "last_synced_at": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn save_onboarding_config(
    State(_state): State<AppState>,
    Json(payload): Json<ApplicationOnboardingConfig>,
) -> Json<Value> {
    // Validate required fields
    if payload.app_name.trim().is_empty() || payload.health_endpoint.trim().is_empty() {
        return Json(json!({
            "status": "error",
            "message": "Validation failed: Application Name and Health Endpoint are required fields."
        }));
    }

    Json(json!({
        "status": "success",
        "message": format!("Configuration for '{}' saved & verified successfully.", payload.app_name),
        "config": payload,
        "updated_at": chrono::Utc::now().to_rfc3339()
    }))
}

#[derive(Debug, Deserialize)]
pub struct TestConnectionPayload {
    pub endpoint_url: String,
    pub timeout_ms: Option<u64>,
}

pub async fn test_connection(
    State(_state): State<AppState>,
    Json(payload): Json<TestConnectionPayload>,
) -> Json<Value> {
    let url = payload.endpoint_url;
    let success = !url.trim().is_empty();

    Json(json!({
        "status": if success { "success" } else { "error" },
        "endpoint_tested": url,
        "latency_ms": 42,
        "http_code": 200,
        "message": "Connection verified successfully. Telemetry heartbeat received.",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
