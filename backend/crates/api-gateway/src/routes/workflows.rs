use axum::{
    Json, extract::State,
};
use serde_json::{json, Value};
use crate::AppState;
use crate::routes::auth::{AuthenticatedUser, require_permission};

pub async fn get_workflows() -> Json<Value> {
    Json(json!([
        { "id": "WF-1", "title": "Auto-Restart CoreDNS on CrashLoop", "trigger": "P1 DNS Failure inside Kubernetes", "executions": 12, "last_run": "2 days ago", "icon": "webhook" },
        { "id": "WF-2", "title": "Scale Database Storage (AWS RDS)", "trigger": "Storage Capacity > 85%", "executions": 3, "last_run": "Requires Manual Approval", "icon": "server" }
    ]))
}

pub async fn execute_workflow(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    axum::Json(payload): axum::Json<Value>,
) -> Json<Value> {
    if let Err((_status, err_json)) = require_permission(&user, &["super_admin", "sr_engineer", "engineer"]) {
        return Json(json!({ "success": false, "error": err_json["error"] }));
    }
    let workflow_id = payload.get("id").and_then(|v| v.as_str()).unwrap_or("unknown");
    tracing::info!("Executing workflow: {}", workflow_id);

    // Build a simple test graph if no graph_json provided
    let graph_json = payload.get("graph").cloned().unwrap_or_else(|| json!({
        "id": workflow_id,
        "name": "Ad-hoc Execution",
        "nodes": {},
        "edges": []
    }));

    match state.workflow_engine.execute_graph(&graph_json, json!({})).await {
        Ok(()) => Json(json!({ "success": true, "message": "Workflow executed successfully", "workflow_id": workflow_id })),
        Err(e) => Json(json!({ "success": false, "error": e }))
    }
}
