use axum::{
    Json, extract::State,
    middleware::Next,
    response::Response,
    http::{Request, StatusCode},
};
use serde_json::{json, Value};
use argon2::{
    password_hash::{
        PasswordHash, PasswordVerifier,
    },
    Argon2
};
use crate::AppState;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AuthenticatedUser {
    pub user_id: uuid::Uuid,
    pub username: String,
    pub tenant_id: uuid::Uuid,
    pub role: String,
}

pub fn require_permission(user: &AuthenticatedUser, allowed_roles: &[&str]) -> Result<(), (StatusCode, Json<Value>)> {
    if allowed_roles.contains(&user.role.as_str()) {
        Ok(())
    } else {
        Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "success": false, "error": format!("Access Denied: role '{}' lacks required permissions", user.role) }))
        ))
    }
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, (StatusCode, Json<Value>)> {
    let auth_header = request
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());

    let token = match auth_header {
        Some(auth) if auth.starts_with("Bearer ") => &auth[7..],
        _ => return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Missing or invalid authorization header" })),
        )),
    };

    let mut authenticated_user = None;

    // 1. Check api_keys table in database for API access
    if let Some(pg) = &state.storage.pg_pool {
        use blake2::{Blake2s256, Digest};
        let mut hasher = Blake2s256::new();
        hasher.update(token.as_bytes());
        let hash_hex = format!("{:x}", hasher.finalize());

        if let Ok(Some(row)) = sqlx::query(
            "SELECT tenant_id, type, scopes FROM api_keys WHERE key_hash = $1"
        )
        .bind(&hash_hex)
        .fetch_optional(pg)
        .await {
            use sqlx::Row;
            let tenant_id: uuid::Uuid = row.get("tenant_id");
            let scopes: Vec<String> = row.get("scopes");
            authenticated_user = Some(AuthenticatedUser {
                user_id: uuid::Uuid::new_v4(),
                username: format!("api_key_{}", row.get::<String, _>("type")),
                tenant_id,
                role: if scopes.contains(&"admin".to_string()) || scopes.contains(&"incident.*".to_string()) {
                    "super_admin".to_string()
                } else {
                    "sr_engineer".to_string()
                },
            });
        }
    }

    // 2. Check session in database if not yet authenticated
    if authenticated_user.is_none() {
        if let Some(pg) = &state.storage.pg_pool {
            let session_opt = sqlx::query(
                "SELECT s.tenant_id, s.user_id, u.username, u.role, s.expires_at \
                 FROM sessions s \
                 JOIN users u ON s.user_id = u.id \
                 WHERE s.token = $1"
            )
            .bind(token)
            .fetch_optional(pg)
            .await
            .map_err(|e| (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Database error: {}", e) })),
            ))?;

            if let Some(row) = session_opt {
                use sqlx::Row;
                let expires_at: chrono::DateTime<chrono::Utc> = row.get("expires_at");
                if expires_at >= chrono::Utc::now() {
                    authenticated_user = Some(AuthenticatedUser {
                        user_id: row.get("user_id"),
                        username: row.get("username"),
                        tenant_id: row.get("tenant_id"),
                        role: row.get("role"),
                    });
                }
            }
        }
    }

    if let Some(user) = authenticated_user {
        request.extensions_mut().insert(user);
        Ok(next.run(request).await)
    } else {
        Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid session token or API key" })),
        ))
    }
}

pub async fn login(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let username = payload.get("username").and_then(|v| v.as_str()).ok_or_else(|| {
        (StatusCode::BAD_REQUEST, Json(json!({ "error": "Missing username" })))
    })?;
    let password = payload.get("password").and_then(|v| v.as_str()).ok_or_else(|| {
        (StatusCode::BAD_REQUEST, Json(json!({ "error": "Missing password" })))
    })?;

    if let Some(pg) = &state.storage.pg_pool {
        let user_opt = sqlx::query(
            "SELECT id, tenant_id, username, password_hash, role FROM users WHERE username = $1"
        )
        .bind(username)
        .fetch_optional(pg)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Database error: {}", e) })))
        })?;

        if let Some(row) = user_opt {
            use sqlx::Row;
            let db_password_hash: String = row.get("password_hash");
            let user_id: uuid::Uuid = row.get("id");
            let tenant_id: uuid::Uuid = row.get("tenant_id");
            let role: String = row.get("role");

            // Verify password hash
            let parsed_hash = PasswordHash::new(&db_password_hash).map_err(|e| {
                tracing::error!("Failed to parse password hash from DB: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal authentication error" })))
            })?;
            
            if Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok() {
                let token = uuid::Uuid::new_v4().to_string();
                let expires_at = chrono::Utc::now() + chrono::Duration::hours(24);

                sqlx::query(
                    "INSERT INTO sessions (token, user_id, tenant_id, expires_at) VALUES ($1, $2, $3, $4)"
                )
                .bind(&token)
                .bind(user_id)
                .bind(tenant_id)
                .bind(expires_at)
                .execute(pg)
                .await
                .map_err(|e| {
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Session error: {}", e) })))
                })?;

                return Ok(Json(json!({
                    "success": true,
                    "token": token,
                    "user": {
                        "username": username,
                        "role": role,
                        "tenant_id": tenant_id.to_string()
                    }
                })));
            }
        }
    }

    Err((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Invalid username or password" }))))
}
