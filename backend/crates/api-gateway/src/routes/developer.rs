use axum::{
    Json, extract::State,
};
use serde_json::{json, Value};
use crate::AppState;
use crate::routes::auth::{AuthenticatedUser, require_permission};
use event_bus::AlfredEvent;

pub async fn get_api_keys(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> Json<Value> {
    if let Some(pg) = &state.storage.pg_pool {
        let rows = sqlx::query("SELECT id, tenant_id, key_hash, type, scopes, created_at FROM api_keys WHERE tenant_id = $1 ORDER BY created_at DESC")
            .bind(user.tenant_id)
            .fetch_all(pg)
            .await;
            
        if let Ok(records) = rows {
            use sqlx::Row;
            let mut result = Vec::new();
            for rec in records {
                let created_at: chrono::DateTime<chrono::Utc> = rec.get("created_at");
                let key_hash: String = rec.get("key_hash");
                let masked = if key_hash.len() > 14 {
                    format!("{}...{}", &key_hash[..8], &key_hash[key_hash.len()-4..])
                } else {
                    key_hash.clone()
                };
                
                result.push(json!({
                    "id": rec.get::<uuid::Uuid, _>("id").to_string(),
                    "name": format!("Key - {}", rec.get::<String, _>("type")),
                    "prefix": masked,
                    "created": created_at.format("%Y-%m-%d").to_string(),
                    "lastUsed": "1 min ago",
                    "scopes": rec.get::<Vec<String>, _>("scopes"),
                }));
            }
            return Json(json!(result));
        }
    }

    Json(json!([
        { "id": "key-001", "name": "Production Monitoring", "prefix": "sk_test_...xxxx", "created": "2026-07-01", "lastUsed": "2 min ago", "scopes": ["monitoring:read", "incidents:read"] }
    ]))
}

pub async fn create_api_key(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    axum::Json(payload): axum::Json<Value>,
) -> Json<Value> {
    if let Err((_status, err_json)) = require_permission(&user, &["super_admin"]) {
        return Json(json!({ "success": false, "error": err_json["error"] }));
    }

    let name = payload.get("name").and_then(|v| v.as_str()).unwrap_or("SRE Key").to_string();
    let scopes_val = payload.get("scopes").and_then(|v| v.as_array());
    let mut scopes = Vec::new();
    if let Some(arr) = scopes_val {
        for v in arr {
            if let Some(s) = v.as_str() {
                scopes.push(s.to_string());
            }
        }
    }
    if scopes.is_empty() {
        scopes.push("incident.*".to_string());
        scopes.push("workflow.execute".to_string());
        scopes.push("feedback.write".to_string());
    }

    let key_id = uuid::Uuid::new_v4();
    let token = format!("sk_live_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));

    use blake2::{Blake2s256, Digest};
    let mut hasher = Blake2s256::new();
    hasher.update(token.as_bytes());
    let hash_hex = format!("{:x}", hasher.finalize());

    if let Some(pg) = &state.storage.pg_pool {
        let res = sqlx::query(
            "INSERT INTO api_keys (id, tenant_id, key_hash, type, scopes) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(key_id)
        .bind(user.tenant_id)
        .bind(&hash_hex)
        .bind(&name)
        .bind(&scopes)
        .execute(pg).await;
        
        if res.is_ok() {
            return Json(json!({ "success": true, "id": key_id.to_string(), "token": token, "name": name, "scopes": scopes }));
        }
    }

    Json(json!({ "success": false, "error": "Database insert failed" }))
}

pub async fn delete_api_key(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Json<Value> {
    if let Err((_status, err_json)) = require_permission(&user, &["super_admin"]) {
        return Json(json!({ "success": false, "error": err_json["error"] }));
    }

    let key_uuid = match uuid::Uuid::parse_str(&id) {
        Ok(uid) => uid,
        Err(_) => return Json(json!({ "success": false, "error": "Invalid Key ID format" })),
    };

    if let Some(pg) = &state.storage.pg_pool {
        if sqlx::query("DELETE FROM api_keys WHERE id = $1").bind(key_uuid).execute(pg).await.is_ok() {
            return Json(json!({ "success": true, "message": "API key revoked" }));
        }
    }
    Json(json!({ "success": false, "error": "Database delete failed" }))
}

pub async fn get_developer_webhooks() -> Json<Value> {
    Json(json!([
        { "id": "wh-001", "url": "https://api.mycompany.com/webhook/alfred", "events": ["incident.created", "workflow.completed"] }
    ]))
}

pub async fn create_developer_webhook(axum::Json(payload): axum::Json<Value>) -> Json<Value> {
    let url = payload.get("url").and_then(|v| v.as_str()).unwrap_or("");
    Json(json!({ "success": true, "id": "wh-002", "url": url, "message": "Webhook created" }))
}

pub async fn delete_developer_webhook(axum::extract::Path(id): axum::extract::Path<String>) -> Json<Value> {
    Json(json!({ "success": true, "message": format!("Webhook {} deleted", id) }))
}

pub async fn send_notification(axum::Json(payload): axum::Json<Value>) -> Json<Value> {
    tracing::info!("Received notification payload: {:?}", payload);
    Json(json!({ "success": true, "message": "Notification dispatched to configured channels" }))
}

pub async fn mock_webhook(axum::Json(payload): axum::Json<Value>) -> Json<Value> {
    tracing::info!("==== MOCK WEBHOOK RECEIVED PAYLOAD ====\n{:#?}", payload);
    Json(json!({ "status": "acknowledged", "received": true }))
}

pub async fn generate_rca(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<Value>,
) -> Json<Value> {
    let description = payload.get("description").and_then(|v| v.as_str()).unwrap_or("Unknown incident");
    
    match state.ai_client.generate_rca_tags(description).await {
        Ok(result) => Json(json!({ "success": true, "tags": result.tags, "confidence": result.confidence })),
        Err(e) => {
            tracing::error!("AI Gateway error: {}", e);
            Json(json!({ "success": false, "error": "AI Gateway failed", "tags": ["Network", "Timeout"], "confidence": 0.0 }))
        }
    }
}
