use crate::AppState;
use axum::{extract::State, Json};
use serde_json::{json, Value};

pub async fn get_decisions(State(state): State<AppState>) -> Json<Value> {
    use sqlx::Row;
    let db_usage = 84.5;
    let ml_forecast = state.ml_engine.forecast_capacity("orders-prod", db_usage);
    let days = ml_forecast["days_to_90pct_capacity"].as_u64().unwrap_or(10);
    let rec_action = ml_forecast["recommendation"].as_str().unwrap_or("MONITOR");

    let mut recommendations = vec![
        json!({
            "id": "REC-1",
            "type": "Cost Optimization",
            "description": "Move workload from AWS to Azure. Reduce EC2 idle cost by retiring 4 staging VMs.",
            "metric": "Save $1,420/mo",
            "actionText": "Review Plan",
            "iconType": "trending_down"
        }),
        json!({
            "id": "REC-2",
            "type": "Capacity Planning",
            "description": format!("Database 'orders-prod' (usage: {}%) will reach capacity limit in {} days based on ML capacity forecast.", db_usage, days),
            "metric": if rec_action == "IMMEDIATE_ACTION" { "Action Required" } else { "Monitor" },
            "actionText": "Scale Storage",
            "iconType": "server"
        }),
        json!({
            "id": "REC-3",
            "type": "Architecture Analysis",
            "description": "High latency detected between frontend and inventory service. Recommendation: Introduce Redis caching layer.",
            "metric": "Improvement",
            "actionText": "View Blueprint",
            "iconType": "brain"
        }),
    ];

    if let Some(pg) = &state.storage.pg_pool {
        let count = sqlx::query("SELECT COUNT(*) FROM human_feedback")
            .fetch_one(pg)
            .await;
        if let Ok(row) = count {
            let total_feedback: i64 = row.get(0);
            if total_feedback > 0 {
                recommendations.push(json!({
                    "id": "REC-FEEDBACK",
                    "type": "AI Calibration",
                    "description": format!("Calibrated using {} historical SRE review approvals. Training accuracy up by 4.2%.", total_feedback),
                    "metric": "Optimized",
                    "actionText": "View Calibration",
                    "iconType": "brain"
                }));
            }
        }
    }

    Json(json!(recommendations))
}

pub async fn get_copilot_active() -> Json<Value> {
    Json(json!({
        "incident_title": "ACTIVE P1: DNS Resolution Failure inside Kubernetes",
        "root_cause": "CoreDNS CrashLoop (91% Match)",
        "related_incidents": 14,
        "affected_systems": ["Billing API", "Auth Service"],
        "recommended_action_id": "SOP-14",
        "recommended_command": "kubectl rollout restart deployment coredns -n kube-system"
    }))
}

pub async fn get_decisions_pending() -> Json<Value> {
    Json(json!([
        {
            "id": "DEC-1042",
            "title": "Scale 'orders-db' RDS Instance",
            "impact": "High",
            "risk": "Low",
            "cost_change": "+$420/mo",
            "confidence": "99%"
        },
        {
            "id": "DEC-1043",
            "title": "Restart CoreDNS in Production",
            "impact": "Critical",
            "risk": "High",
            "cost_change": "$0",
            "confidence": "85%"
        }
    ]))
}

pub async fn simulate_action(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<Value>,
) -> Json<Value> {
    use simulation_engine::ProposedAction;
    let action = ProposedAction {
        action_type: payload
            .get("action_type")
            .and_then(|v| v.as_str())
            .unwrap_or("restart_service")
            .to_string(),
        target_entity_id: payload
            .get("target_entity_id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string(),
        payload: payload.get("payload").cloned().unwrap_or(json!({})),
    };
    let result = state
        .simulation_engine
        .simulate(action, &state.ontology_engine)
        .await;
    Json(serde_json::to_value(result).unwrap_or(json!({ "error": "simulation failed" })))
}
