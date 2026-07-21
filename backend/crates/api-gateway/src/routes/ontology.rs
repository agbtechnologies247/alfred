use crate::AppState;
use axum::{extract::State, http::StatusCode, Json};
use event_bus::AlfredEvent;
use ontology_engine::{get_all_templates, EntityType, GraphEntity};
use serde_json::{json, Value};

pub async fn get_topology(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Json<Value> {
    let mut nodes = Vec::new();
    let mut edges = Vec::new();

    if let Some(graph) = &state.storage.graph_db {
        let q_nodes = neo4rs::query(
            "MATCH (n:Entity) RETURN n.id as id, n.name as name, n.entity_type as entity_type",
        );
        if let Ok(mut result) = graph.execute(q_nodes).await {
            while let Ok(Some(row)) = result.next().await {
                let id_val: String = row.get("id").unwrap_or_default();
                let name_val: String = row.get("name").unwrap_or_default();
                let type_val: String = row.get("entity_type").unwrap_or_default();
                nodes.push(json!({
                    "id": id_val,
                    "type": type_val.to_lowercase(),
                    "name": name_val,
                    "status": "healthy"
                }));
            }
        }

        let q_edges = neo4rs::query(
            "MATCH (a:Entity)-[r]->(b:Entity) RETURN a.id as from, b.id as to, r.type as relation",
        );
        if let Ok(mut result) = graph.execute(q_edges).await {
            while let Ok(Some(row)) = result.next().await {
                let from_val: String = row.get("from").unwrap_or_default();
                let to_val: String = row.get("to").unwrap_or_default();
                let rel_val: String = row.get("relation").unwrap_or_default();
                edges.push(json!({
                    "from": from_val,
                    "to": to_val,
                    "relation": rel_val
                }));
            }
        }
    }

    if nodes.is_empty() {
        nodes = vec![
            json!({ "id": id.clone(), "type": "application", "name": "API Gateway", "status": "healthy" }),
            json!({ "id": "db-postgres", "type": "database", "name": "PostgreSQL", "status": "healthy" }),
            json!({ "id": "cache-redis", "type": "database", "name": "Redis", "status": "degraded" }),
            json!({ "id": "eks-cluster", "type": "cluster", "name": "EKS Prod", "status": "healthy" }),
        ];
        edges = vec![
            json!({ "from": id.clone(), "to": "db-postgres", "relation": "DEPENDS_ON" }),
            json!({ "from": id.clone(), "to": "cache-redis", "relation": "DEPENDS_ON" }),
            json!({ "from": id.clone(), "to": "eks-cluster", "relation": "HOSTED_ON" }),
        ];
    }

    Json(json!({
        "entity_id": id,
        "nodes": nodes,
        "edges": edges
    }))
}

pub async fn get_impact_radius(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Json<Value> {
    match state.ontology_engine.get_impact_radius(&id).await {
        Ok(result) => Json(result),
        Err(e) => Json(json!({ "error": e })),
    }
}

pub async fn get_ontology_templates() -> Json<Value> {
    let templates = get_all_templates();
    Json(json!(templates))
}

#[derive(Debug, serde::Deserialize)]
pub struct SimulateOntologyRequest {
    template_id: String,
    severity_override: Option<String>,
}

pub async fn simulate_ontology_event(
    State(state): State<AppState>,
    Json(payload): Json<SimulateOntologyRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let templates = get_all_templates();
    let template = templates
        .iter()
        .find(|t| t.id == payload.template_id)
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(
                    json!({ "error": format!("Template id '{}' not found", payload.template_id) }),
                ),
            )
        })?;

    let base_event = template.example_events.first().ok_or_else(|| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Template has no example events" })),
        )
    })?;

    let event_id = uuid::Uuid::new_v4();
    let timestamp = chrono::Utc::now();
    let severity = payload
        .severity_override
        .unwrap_or_else(|| base_event.severity.clone());

    let db_event = storage_engine::UnifiedEvent {
        event_id,
        timestamp,
        event_type: base_event.event_type.clone(),
        category: base_event.category.clone(),
        object_type: base_event.object_type.clone(),
        object_id: base_event.object_id.clone(),
        actor: base_event.actor.clone(),
        team: base_event.team.clone(),
        environment: base_event.environment.clone(),
        severity,
        status: base_event.status.clone(),
        before_state: base_event.before_state.clone(),
        after_state: base_event.after_state.clone(),
        linked_records: base_event.linked_records.clone(),
        ai_analysis: base_event.ai_analysis.clone(),
        audit_metadata: base_event.audit_metadata.clone(),
    };

    // Log to DB
    state
        .storage
        .log_unified_event(&db_event)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Failed to log event: {}", e) })),
            )
        })?;

    // Log to Neo4J representation (Graph Database)
    let graph_entity = GraphEntity::new(
        &db_event.object_id,
        match db_event.object_type.as_str() {
            "system" => EntityType::Server,
            "user" => EntityType::Person,
            "ai_agent" => EntityType::Application,
            "incident" => EntityType::Incident,
            "change" => EntityType::Change,
            _ => EntityType::CloudResource,
        },
        &db_event.object_id,
    );
    let _ = state.ontology_engine.ingest_entity(&graph_entity).await;

    // Publish to EventBus
    let bus_event = AlfredEvent::AiAnalysisCompleted {
        incident_id: format!("ontology-simulate-{}", event_id),
        tags: vec![db_event.event_type.clone(), db_event.category.clone()],
        confidence: 0.99,
    };
    let _ = state.event_bus.publish(bus_event);

    Ok(Json(json!({
        "success": true,
        "event_id": event_id.to_string(),
        "event": db_event
    })))
}
