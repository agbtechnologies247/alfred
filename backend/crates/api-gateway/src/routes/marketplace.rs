use crate::routes::auth::{require_permission, AuthenticatedUser};
use crate::AppState;
use axum::{extract::State, Json};
use serde_json::{json, Value};

pub async fn get_packages(State(state): State<AppState>) -> Json<Value> {
    let packages = state.registry.list_all().await;
    Json(serde_json::to_value(packages).unwrap_or(json!([])))
}

pub async fn get_agent_packages(State(state): State<AppState>) -> Json<Value> {
    use registry_service::ManifestKind;
    let packages = state.registry.list_by_kind(&ManifestKind::AiAgent).await;
    Json(serde_json::to_value(packages).unwrap_or(json!([])))
}

pub async fn get_automation_packages(State(state): State<AppState>) -> Json<Value> {
    use registry_service::ManifestKind;
    let packages = state
        .registry
        .list_by_kind(&ManifestKind::AutomationPack)
        .await;
    Json(serde_json::to_value(packages).unwrap_or(json!([])))
}

pub async fn get_connector_packages(State(state): State<AppState>) -> Json<Value> {
    use registry_service::ManifestKind;
    let packages = state.registry.list_by_kind(&ManifestKind::Connector).await;
    Json(serde_json::to_value(packages).unwrap_or(json!([])))
}

pub async fn install_package(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Json<Value> {
    match state.registry.install(&id).await {
        Ok(()) => {
            Json(json!({ "success": true, "message": format!("Package '{}' installed", id) }))
        }
        Err(e) => Json(json!({ "success": false, "error": e })),
    }
}

pub async fn uninstall_package(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Json<Value> {
    match state.registry.uninstall(&id).await {
        Ok(()) => Json(json!({ "success": true, "message": format!("Package '{}' removed", id) })),
        Err(e) => Json(json!({ "success": false, "error": e })),
    }
}

pub async fn get_plugins() -> Json<Value> {
    Json(json!([
        { "id": "plg-1", "name": "AWS Plugin", "provider": "Official", "status": "Installed" },
        { "id": "plg-2", "name": "VMware Plugin", "provider": "Partner", "status": "Available" },
        { "id": "plg-3", "name": "SAP Plugin", "provider": "Enterprise", "status": "Update Required" }
    ]))
}
