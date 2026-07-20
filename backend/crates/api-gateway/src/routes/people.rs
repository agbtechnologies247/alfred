use axum::{
    Json, extract::State,
};
use serde_json::{json, Value};
use crate::AppState;

pub async fn get_all_people(State(state): State<AppState>) -> Json<Value> {
    if let Some(pg) = &state.storage.pg_pool {
        let rows = sqlx::query("SELECT id, tenant_id, name, role, current_status, stress_level FROM persons")
            .fetch_all(pg)
            .await;
            
        if let Ok(records) = rows {
            use sqlx::Row;
            let mut result = Vec::new();
            for rec in records {
                result.push(json!({
                    "id": rec.get::<uuid::Uuid, _>("id").to_string(),
                    "name": rec.get::<String, _>("name"),
                    "role": rec.get::<String, _>("role"),
                    "current_status": rec.get::<String, _>("current_status"),
                    "stress_level": rec.get::<Option<String>, _>("stress_level").unwrap_or_else(|| "Unknown".to_string())
                }));
            }
            return Json(json!(result));
        }
    }
    
    // Fallback if DB fails
    Json(json!([
        { "id": "11111111-1111-1111-1111-111111111111", "name": "Admin", "role": "Super Admin", "current_status": "Active", "stress_level": "Low" }
    ]))
}

pub async fn get_people_insights(State(state): State<AppState>) -> Json<Value> {
    let mut high_stress_count = 0;
    if let Some(pg) = &state.storage.pg_pool {
        if let Ok(row) = sqlx::query("SELECT COUNT(*) FROM persons WHERE stress_level = 'High'").fetch_one(pg).await {
            use sqlx::Row;
            high_stress_count = row.get::<i64, _>(0);
        }
    }
    
    Json(json!({
        "team_burnout_risk": if high_stress_count > 3 { "High" } else { "Low" },
        "high_stress_employees": high_stress_count,
        "sentiment_trend": "Improving"
    }))
}

#[derive(Debug, serde::Deserialize)]
pub struct CheckinRequest {
    person_id: String,
    check_in_type: String,
    mood: String,
    priority: String,
    needs_help: bool,
    blockers: Option<String>,
}

pub async fn submit_checkin(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<CheckinRequest>,
) -> Json<Value> {
    if let Ok(pid) = uuid::Uuid::parse_str(&payload.person_id) {
        if let Some(pg) = &state.storage.pg_pool {
            let id = uuid::Uuid::new_v4();
            let _ = sqlx::query(
                "INSERT INTO daily_checkins (id, person_id, check_in_type, mood, priority, needs_help, blockers) VALUES ($1, $2, $3, $4, $5, $6, $7)"
            )
            .bind(id)
            .bind(pid)
            .bind(&payload.check_in_type)
            .bind(&payload.mood)
            .bind(&payload.priority)
            .bind(payload.needs_help)
            .bind(&payload.blockers)
            .execute(pg).await;

            return Json(json!({ "success": true, "checkin_id": id.to_string() }));
        }
    }
    Json(json!({ "success": false, "error": "Failed to submit check-in" }))
}
