use serde::{Deserialize, Serialize};

/// Role in the system with associated permission scopes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    SuperAdmin,
    TenantAdmin,
    SrEngineer, // Can approve high-risk actions
    Engineer,   // Can approve medium-risk actions
    ReadOnly,
    AiOnly, // AI agents — no human approvals
}

/// Permission scope
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Permission {
    IncidentRead,
    IncidentWrite,
    WorkflowExecute,
    WorkflowApprove,
    MarketplaceInstall,
    SettingsWrite,
    AuditRead,
    DecisionApprove,
    CloudWrite,
    IdentityWrite,
}

/// Audit log entry — immutable record of every action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub user_role: String,
    pub action: String,
    pub resource: String,
    pub outcome: String,
    pub ip_address: String,
    pub timestamp: String,
    pub risk_level: String,
}

pub struct GovernanceEngine {
    pg_pool: Option<sqlx::PgPool>,
    audit_log: std::sync::Arc<std::sync::RwLock<Vec<AuditEntry>>>,
}

impl GovernanceEngine {
    pub fn new(pg_pool: Option<sqlx::PgPool>) -> Self {
        tracing::info!("Governance Engine initialized — RBAC + Audit Trail active");
        Self {
            pg_pool,
            audit_log: std::sync::Arc::new(std::sync::RwLock::new(Vec::new())),
        }
    }

    /// Get all permissions for a given role
    pub fn get_permissions(&self, role: &Role) -> Vec<Permission> {
        match role {
            Role::SuperAdmin => vec![
                Permission::IncidentRead,
                Permission::IncidentWrite,
                Permission::WorkflowExecute,
                Permission::WorkflowApprove,
                Permission::MarketplaceInstall,
                Permission::SettingsWrite,
                Permission::AuditRead,
                Permission::DecisionApprove,
                Permission::CloudWrite,
                Permission::IdentityWrite,
            ],
            Role::TenantAdmin => vec![
                Permission::IncidentRead,
                Permission::IncidentWrite,
                Permission::WorkflowExecute,
                Permission::WorkflowApprove,
                Permission::MarketplaceInstall,
                Permission::SettingsWrite,
                Permission::AuditRead,
                Permission::DecisionApprove,
            ],
            Role::SrEngineer => vec![
                Permission::IncidentRead,
                Permission::IncidentWrite,
                Permission::WorkflowExecute,
                Permission::WorkflowApprove,
                Permission::DecisionApprove,
                Permission::CloudWrite,
            ],
            Role::Engineer => vec![
                Permission::IncidentRead,
                Permission::IncidentWrite,
                Permission::WorkflowExecute,
            ],
            Role::ReadOnly => vec![Permission::IncidentRead, Permission::AuditRead],
            Role::AiOnly => vec![Permission::WorkflowExecute],
        }
    }

    /// Check if a role has a specific permission
    pub fn can(&self, role: &Role, permission: &Permission) -> bool {
        self.get_permissions(role).contains(permission)
    }

    /// Write an immutable audit entry
    pub async fn audit(&self, entry: AuditEntry) {
        tracing::info!(
            "AUDIT [{}] user={} role={} action={} resource={} outcome={}",
            entry.tenant_id,
            entry.user_id,
            entry.user_role,
            entry.action,
            entry.resource,
            entry.outcome
        );
        if let Some(pool) = &self.pg_pool {
            let id = uuid::Uuid::parse_str(&entry.id).unwrap_or_else(|_| uuid::Uuid::new_v4());
            let tenant_id = uuid::Uuid::parse_str(&entry.tenant_id).unwrap_or_default();
            let user_id = uuid::Uuid::parse_str(&entry.user_id).unwrap_or_default();
            let timestamp = chrono::DateTime::parse_from_rfc3339(&entry.timestamp)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now());

            let _ = sqlx::query(
                "INSERT INTO audit_logs (id, tenant_id, user_id, user_role, action, resource, outcome, ip_address, timestamp, risk_level) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
            )
            .bind(id)
            .bind(tenant_id)
            .bind(user_id)
            .bind(&entry.user_role)
            .bind(&entry.action)
            .bind(&entry.resource)
            .bind(&entry.outcome)
            .bind(&entry.ip_address)
            .bind(timestamp)
            .bind(&entry.risk_level)
            .execute(pool)
            .await;
        } else {
            self.audit_log.write().unwrap().push(entry);
        }
    }

    /// Get recent audit entries for dashboard
    pub async fn get_audit_log(&self, limit: usize) -> Vec<AuditEntry> {
        if let Some(pool) = &self.pg_pool {
            let rows = sqlx::query("SELECT id, tenant_id, user_id, user_role, action, resource, outcome, ip_address, timestamp, risk_level FROM audit_logs ORDER BY timestamp DESC LIMIT $1")
                .bind(limit as i64)
                .fetch_all(pool)
                .await;

            if let Ok(records) = rows {
                use sqlx::Row;
                let mut result = Vec::new();
                for rec in records {
                    let id: uuid::Uuid = rec.get("id");
                    let tenant_id: uuid::Uuid = rec.get("tenant_id");
                    let user_id: uuid::Uuid = rec.get("user_id");
                    let timestamp: chrono::DateTime<chrono::Utc> = rec.get("timestamp");
                    result.push(AuditEntry {
                        id: id.to_string(),
                        tenant_id: tenant_id.to_string(),
                        user_id: user_id.to_string(),
                        user_role: rec.get("user_role"),
                        action: rec.get("action"),
                        resource: rec.get("resource"),
                        outcome: rec.get("outcome"),
                        ip_address: rec.get("ip_address"),
                        timestamp: timestamp.to_rfc3339(),
                        risk_level: rec.get("risk_level"),
                    });
                }
                return result;
            }
        }
        let log = self.audit_log.read().unwrap();
        log.iter().rev().take(limit).cloned().collect()
    }

    /// Multi-tenancy: validate tenant_id is present on a resource
    pub fn validate_tenant_access(&self, tenant_id: &str, resource_tenant_id: &str) -> bool {
        tenant_id == resource_tenant_id
    }
}

impl Default for GovernanceEngine {
    fn default() -> Self {
        Self::new(None)
    }
}
