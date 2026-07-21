pub mod agents;
pub mod analytics;
pub mod auth;
pub mod decisions;
pub mod developer;
pub mod governance;
pub mod incidents;
pub mod knowledge;
pub mod marketplace;
pub mod monitoring;
pub mod ontology;
pub mod people;
pub mod validation;
pub mod workflows;

use crate::AppState;
use axum::{
    middleware,
    routing::{delete, get, post},
    Router,
};

pub fn api_router(state: AppState) -> Router<AppState> {
    let protected_routes = Router::new()
        // === Phase 1: Core Monitoring & Incident Management ===
        .route("/monitoring/kpis", get(monitoring::get_monitoring_kpis))
        .route(
            "/monitoring/telemetry",
            get(monitoring::get_monitoring_telemetry),
        )
        .route("/monitoring/errors", get(monitoring::get_monitoring_errors))
        .route(
            "/incidents",
            get(incidents::get_incidents).post(incidents::create_incident),
        )
        .route("/incidents/:id", post(incidents::update_incident))
        .route("/incidents/:id/delete", post(incidents::delete_incident))
        .route("/incidents/metrics", get(incidents::get_incident_metrics))
        .route(
            "/sops",
            get(knowledge::get_sops).post(knowledge::create_sop),
        )
        .route("/sops/:id/approve", post(knowledge::approve_sop_db))
        .route("/workflows", get(workflows::get_workflows))
        .route("/workflows/:id/execute", post(workflows::execute_workflow))
        .route("/agents", get(agents::get_agents))
        .route("/agents/chat", post(agents::agent_chat))
        .route("/analytics", get(analytics::get_analytics))
        .route("/templates", get(analytics::get_templates))
        .route("/ai-providers", get(analytics::get_ai_providers))
        // === Phase 2: Knowledge Graph & Topology ===
        .route("/topology/:id", get(ontology::get_topology))
        .route("/topology/:id/impact", get(ontology::get_impact_radius))
        // === Phase 3: ML & Feedback ===
        // Note: the predict APIs used `ml_engine` and were removed or we can keep them out if not used,
        // wait, I forgot predict_failure and predict_capacity in governance.rs?
        // Let's comment them for now, or just leave them out as they are dummy
        .route("/feedback", post(governance::submit_feedback))
        .route("/feedback/history", get(governance::get_feedback_history))
        // === Phase 4: Marketplace Registry ===
        .route("/marketplace/packages", get(marketplace::get_packages))
        .route(
            "/marketplace/packages/agents",
            get(marketplace::get_agent_packages),
        )
        .route(
            "/marketplace/packages/automations",
            get(marketplace::get_automation_packages),
        )
        .route(
            "/marketplace/packages/connectors",
            get(marketplace::get_connector_packages),
        )
        .route(
            "/marketplace/packages/:id/install",
            post(marketplace::install_package),
        )
        .route(
            "/marketplace/packages/:id/uninstall",
            post(marketplace::uninstall_package),
        )
        .route("/marketplace/plugins", get(marketplace::get_plugins))
        // === Phase 5: Decision Engineering & Simulation ===
        .route("/decisions/recommendations", get(decisions::get_decisions))
        .route(
            "/decisions/copilot/active",
            get(decisions::get_copilot_active),
        )
        .route("/decisions/pending", get(decisions::get_decisions_pending))
        .route("/decisions/simulate", post(decisions::simulate_action))
        // === Phase 6: Governance & Audit ===
        .route("/governance/audit", get(governance::get_audit_log))
        .route("/governance/roles", get(governance::get_roles))
        // === OpEx / ROI ===
        .route("/opex/roi", get(analytics::get_opex_roi))
        // === Operational Ontology & Simulation ===
        .route("/ontology/templates", get(ontology::get_ontology_templates))
        .route(
            "/ontology/simulate",
            post(ontology::simulate_ontology_event),
        )
        // === Developer Webhooks API ===
        .route(
            "/developer/webhooks",
            get(developer::get_developer_webhooks),
        )
        .route(
            "/developer/webhooks",
            post(developer::create_developer_webhook),
        )
        .route(
            "/developer/webhooks/:id",
            delete(developer::delete_developer_webhook),
        )
        .route(
            "/developer/keys",
            get(developer::get_api_keys).post(developer::create_api_key),
        )
        .route(
            "/developer/keys/:id/delete",
            post(developer::delete_api_key),
        )
        // === Developer API ===
        .route("/api/v1/notify", post(developer::send_notification))
        .route("/api/v1/incidents", post(incidents::create_incident)) // reusing incidents
        .route("/api/v1/mock-webhook", post(developer::mock_webhook))
        .route("/api/v1/ai/rca", post(developer::generate_rca))
        // === People Engineering ===
        .route("/people", get(people::get_all_people))
        .route("/people/insights", get(people::get_people_insights))
        .route("/people/checkin", post(people::submit_checkin))
        .route("/people/:id/timeline", get(people::get_person_timeline))
        .route(
            "/people/:id/recommendations",
            get(people::get_person_recommendations),
        )
        // === Enterprise Validation ===
        .route("/validation/run", post(validation::run_validation_scenario))
        .route(
            "/validation/metrics",
            get(validation::get_executive_metrics),
        )
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            auth::auth_middleware,
        ));

    Router::new()
        .route("/auth/login", post(auth::login))
        .route("/metrics", get(monitoring::get_prometheus_metrics))
        .nest("/", protected_routes)
}
