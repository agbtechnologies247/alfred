use crate::AppState;
use axum::{extract::State, Json};
use serde_json::{json, Value};

pub async fn get_audit_log(State(state): State<AppState>) -> Json<Value> {
    let entries = state.governance.get_audit_log(50).await;
    Json(json!({
        "total": entries.len(),
        "entries": entries
    }))
}

pub async fn get_roles() -> Json<Value> {
    Json(json!([
        { "role": "super_admin", "description": "Full platform access", "permissions": ["all"] },
        { "role": "tenant_admin", "description": "Full tenant access", "permissions": ["incidents", "workflows", "marketplace", "settings", "audit"] },
        { "role": "sr_engineer", "description": "Can approve high-risk actions", "permissions": ["incidents", "workflows", "decisions", "cloud"] },
        { "role": "engineer", "description": "Can create and execute workflows", "permissions": ["incidents", "workflows"] },
        { "role": "read_only", "description": "View-only access", "permissions": ["incidents.read", "audit.read"] }
    ]))
}

pub async fn submit_feedback(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<Value>,
) -> Json<Value> {
    use feedback_engine::{FeedbackRecord, HumanDecision};
    let record = FeedbackRecord {
        id: uuid::Uuid::new_v4().to_string(),
        decision_id: payload
            .get("decision_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        user_id: payload
            .get("user_id")
            .and_then(|v| v.as_str())
            .unwrap_or("anonymous")
            .to_string(),
        user_role: payload
            .get("user_role")
            .and_then(|v| v.as_str())
            .unwrap_or("engineer")
            .to_string(),
        action_type: payload
            .get("action_type")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        ai_recommendation: payload
            .get("recommendation")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        ai_confidence: payload
            .get("ai_confidence")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        human_decision: match payload
            .get("decision")
            .and_then(|v| v.as_str())
            .unwrap_or("approved")
        {
            "rejected" => HumanDecision::Rejected,
            "modified" => HumanDecision::Modified,
            _ => HumanDecision::Approved,
        },
        rejection_reason: payload
            .get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        environment: payload
            .get("environment")
            .and_then(|v| v.as_str())
            .unwrap_or("production")
            .to_string(),
        outcome: None,
    };
    match state.feedback_engine.record_feedback(&record).await {
        Ok(id) => Json(json!({ "success": true, "feedback_id": id })),
        Err(e) => Json(json!({ "success": false, "error": e })),
    }
}

pub async fn get_feedback_history(State(state): State<AppState>) -> Json<Value> {
    let history = state.feedback_engine.get_recent_feedback(20).await;
    Json(json!(history))
}
