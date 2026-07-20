use axum::{
    routing::{get, post},
    Router,
    Json,
    http::StatusCode,
};
use std::net::SocketAddr;
use std::sync::Arc;
use monitor_core::{init_monitor, telemetry::{TelemetryPayload, process_telemetry}};
use tower_http::cors::CorsLayer;
use event_bus::EventBus;
use config_engine::ConfigEngine;
use storage_engine::StorageEngine;
use knowledge_engine::KnowledgeEngine;
use ai_gateway::{OpenAiClient, AiProvider};
use workflow_engine::WorkflowEngine;
use ontology_engine::OntologyEngine;
use ml_engine::MlEngine;
use feedback_engine::FeedbackEngine;
use registry_service::RegistryService;
use simulation_engine::SimulationEngine;
use governance_engine::GovernanceEngine;
use reqwest::Client;
use dns_engine::DnsMonitor;
use latency_engine::LatencyMonitor;
use packet_engine::PacketAnalyzer;
use crc_engine::CrcValidator;
use alert_engine::AlertEngine;
use people_engine::PeopleEngine;

mod routes;
use routes::monitoring::{TELEMETRY_REQUESTS_TOTAL, register_custom_metrics};

#[derive(Clone)]
pub struct AppState {
    pub event_bus: EventBus,
    pub config: Arc<ConfigEngine>,
    pub storage: StorageEngine,
    pub ai_client: Arc<dyn AiProvider>,
    pub workflow_engine: Arc<WorkflowEngine>,
    pub ontology_engine: Arc<OntologyEngine>,
    pub ml_engine: Arc<MlEngine>,
    pub feedback_engine: Arc<FeedbackEngine>,
    pub registry: Arc<RegistryService>,
    pub simulation_engine: Arc<SimulationEngine>,
    pub governance: Arc<GovernanceEngine>,
    pub people_engine: Arc<PeopleEngine>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    register_custom_metrics();
    tracing::info!("Starting A.L.F.R.E.D Integration Platform...");
    tracing::info!("Developed by Bhramit Pardhi. All rights reserved under AGB Technologies LLP.");
    tracing::info!("Phase 1-6 Architecture Active: Workflow | AI Gateway | Ontology | ML | Feedback | Registry | Simulation | Governance");

    init_monitor();

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let event_bus = EventBus::new(Some(&redis_url));
    packet_engine::init_packet_engine(event_bus.clone());
    let config = Arc::new(ConfigEngine::new());
    
    // Connect to PostgreSQL and Neo4J using dynamic vault/config credentials
    let storage = StorageEngine::new(
        &config.database_url,
        &config.neo4j_url,
        &config.neo4j_user,
        &config.neo4j_pass
    ).await.expect("Failed to initialize StorageEngine! Production database is strictly required.");

    // Phase 1: AI Gateway — multi-model abstraction
    let ai_client: Arc<dyn AiProvider> = Arc::new(
        OpenAiClient::new(&config.openai_key, "gpt-4o")
    );

    // Phase 1: Workflow Engine — DAG execution
    let workflow_engine = Arc::new(WorkflowEngine::new(storage.clone()));

    // Phase 2: Ontology Engine — Enterprise Knowledge Graph
    let ontology_engine = Arc::new(OntologyEngine::new(storage.clone()));

    // Phase 3: ML Engine — Anomaly detection, risk scoring, approval prediction
    let ml_engine = Arc::new(MlEngine::new());

    // Phase 3: Feedback Engine — RLHF human feedback loop
    let feedback_engine = Arc::new(FeedbackEngine::new(storage.clone()));

    // Phase 4: Registry — Marketplace for AI Agents, Automations, Connectors
    let registry = Arc::new(RegistryService::new(storage.pg_pool.clone()));

    // Phase 5: Simulation Engine — Decision Engineering impact analysis
    let simulation_engine = Arc::new(SimulationEngine::new());

    let governance = Arc::new(GovernanceEngine::new(storage.pg_pool.clone()));

    // Phase 7: People Engineering — Organizational Intelligence
    let people_engine = Arc::new(PeopleEngine::new(storage.clone()));

    let state = AppState {
        event_bus: event_bus.clone(),
        config: config.clone(),
        storage: storage.clone(),
        ai_client,
        workflow_engine,
        ontology_engine,
        ml_engine,
        feedback_engine,
        registry,
        simulation_engine,
        governance,
        people_engine,
    };

    // Start Webhook Dispatcher
    tokio::spawn(start_webhook_dispatcher(event_bus.clone(), storage.clone()));

    // Start Alert Engine (Slack, PagerDuty reactive loops)
    let alert_engine = AlertEngine::new(config.slack_webhook.clone(), config.pagerduty_routing_key.clone());
    alert_engine.start(event_bus.clone());

    // Start Knowledge Engine Background Worker
    let knowledge_engine = KnowledgeEngine::new(storage.clone());
    tokio::spawn(knowledge_engine.run(event_bus.clone()));

    // Start DNS active monitoring background task (probes localhost and google.com every 15s)
    let dns_monitor = DnsMonitor::new(vec!["localhost".to_string(), "google.com".to_string()], 15);
    dns_monitor.start(event_bus.clone(), storage.clone());

    // Start Latency & Connection active monitoring task (probes Postgres and Neo4j sockets every 15s)
    let latency_monitor = LatencyMonitor::new(vec!["127.0.0.1:5432".to_string(), "127.0.0.1:7687".to_string()], 15);
    latency_monitor.start(event_bus.clone(), storage.clone());

    // Setup Rate Limiter
    use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};
    let governor_conf = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(20)
            .burst_size(100)
            .finish()
            .unwrap()
    );

    // Setup CORS
    use axum::http::{Method, HeaderValue};
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5174".parse::<HeaderValue>().unwrap())
        .allow_methods(vec![Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/telemetry", post(handle_telemetry))
        .nest("/api", routes::api_router(state.clone()))
        .layer(GovernorLayer { config: governor_conf })
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("A.L.F.R.E.D. listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "A.L.F.R.E.D. Decision Engineering Platform",
        "version": "0.1.0",
        "phases_active": ["workflow-engine", "ai-gateway", "ontology-engine", "ml-engine", "feedback-engine", "registry-service", "simulation-engine", "governance-engine", "people-engine"]
    }))
}

async fn handle_telemetry(
    axum::extract::State(state): axum::extract::State<AppState>,
    Json(payload): Json<TelemetryPayload>,
) -> StatusCode {
    process_telemetry(&payload);
    TELEMETRY_REQUESTS_TOTAL.inc();

    let analyzer = PacketAnalyzer::new();
    let validator = CrcValidator::new();
    let metrics_value = serde_json::to_value(&payload.metrics).unwrap_or(serde_json::Value::Null);

    analyzer.analyze_telemetry(&payload.host, payload.metrics.packet_loss, &metrics_value, &state.event_bus);
    
    let payload_bytes = payload.layer.as_bytes();
    let computed_crc = validator.compute_crc32(payload_bytes);
    // Corrupt the checksum to simulate frame errors if packet loss is high
    let expected_crc = if payload.metrics.packet_loss > 5.0 {
        computed_crc ^ 0xFFFFFFFF
    } else {
        computed_crc
    };
    validator.validate_frame(&payload.host, payload_bytes, expected_crc, &state.event_bus);

    StatusCode::ACCEPTED
}

async fn start_webhook_dispatcher(event_bus: EventBus, storage: StorageEngine) {
    let mut rx = event_bus.subscribe();
    let client = Client::new();

    tracing::info!("Webhook Dispatcher starting...");

    while let Ok(event) = rx.recv().await {
        if let Ok(webhooks) = storage.get_all_webhooks().await {
            for sub in webhooks {
                let event_name = match &event {
                    event_bus::AlfredEvent::IncidentCreated { .. } => "incident.created",
                    event_bus::AlfredEvent::IncidentResolved { .. } => "incident.resolved",
                    event_bus::AlfredEvent::AiAnalysisRequested { .. } => "ai_analysis.requested",
                    event_bus::AlfredEvent::AiAnalysisCompleted { .. } => "ai_analysis.completed",
                    event_bus::AlfredEvent::ApprovalRequired { .. } => "approval.required",
                    event_bus::AlfredEvent::WorkflowExecuted { .. } => "workflow.executed",
                    event_bus::AlfredEvent::CheckInSubmitted { .. } => "people.checkin",
                    event_bus::AlfredEvent::SentimentAlert { .. } => "people.sentiment_alert",
                    event_bus::AlfredEvent::BlockerDetected { .. } => "people.blocker",
                };

                if sub.events.iter().any(|e| e == event_name) {
                    tracing::info!("Dispatching event to {}: {:?}", sub.url, event);
                    let _ = client.post(&sub.url).json(&event).send().await;
                }
            }
        }
    }
}
