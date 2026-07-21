use axum::{
    Json, extract::{State, Path},
};
use serde_json::{json, Value};
use crate::AppState;

pub async fn get_all_people(State(state): State<AppState>) -> Json<Value> {
    let persons = state.people_engine.get_all_persons().await;
    Json(json!(persons))
}

pub async fn get_people_insights(State(state): State<AppState>) -> Json<Value> {
    let insights = state.people_engine.get_insights().await;
    Json(json!(insights))
}

pub async fn get_person_timeline(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<Value> {
    if let Ok(pid) = uuid::Uuid::parse_str(&id) {
        let events = state.people_engine.get_timeline(pid).await;
        return Json(json!(events));
    }
    Json(json!([]))
}

pub async fn get_person_recommendations(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<Value> {
    if let Ok(pid) = uuid::Uuid::parse_str(&id) {
        let profile = state.people_engine.get_recommendations(pid);
        return Json(json!(profile));
    }
    Json(json!({ "error": "Invalid person ID" }))
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
        let parsed_mood = match payload.mood.to_lowercase().as_str() {
            "great" => people_engine::models::Mood::Great,
            "good" => people_engine::models::Mood::Good,
            "stressed" => people_engine::models::Mood::Stressed,
            "frustrated" => people_engine::models::Mood::Frustrated,
            "exhausted" => people_engine::models::Mood::Exhausted,
            _ => people_engine::models::Mood::Neutral,
        };

        let parsed_type = match payload.check_in_type.to_lowercase().as_str() {
            "morning" | "daily standup" => people_engine::models::CheckInType::Morning,
            _ => people_engine::models::CheckInType::Evening,
        };

        let req = people_engine::models::CheckInRequest {
            person_id: pid,
            check_in_type: parsed_type,
            plan: None,
            completed: None,
            blockers: payload.blockers.clone(),
            mood: parsed_mood,
            priority: payload.priority.clone(),
            risk: None,
            needs_help: payload.needs_help,
        };

        match state.people_engine.record_checkin(&req).await {
            Ok(checkin) => {
                let _ = state.event_bus.publish(event_bus::AlfredEvent::CheckInSubmitted {
                    person_id: pid.to_string(),
                    date: checkin.date.to_string(),
                });

                return Json(json!({ "success": true, "checkin_id": checkin.id.to_string() }));
            }
            Err(e) => {
                return Json(json!({ "success": false, "error": e }));
            }
        }
    }
    Json(json!({ "success": false, "error": "Invalid person ID format" }))
}
