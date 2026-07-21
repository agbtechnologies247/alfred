use serde::{Deserialize, Serialize};
use storage_engine::StorageEngine;
use uuid::Uuid;

/// A human feedback record — stores every approval/rejection with full context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackRecord {
    pub id: String,
    pub decision_id: String,
    pub user_id: String,
    pub user_role: String,
    pub action_type: String,
    pub ai_recommendation: String,
    pub ai_confidence: f64,
    pub human_decision: HumanDecision,
    pub rejection_reason: Option<String>,
    pub environment: String,
    pub outcome: Option<String>, // filled in after execution
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum HumanDecision {
    Approved,
    Rejected,
    Modified, // Human changed the recommendation before approving
}

pub struct FeedbackEngine {
    storage: StorageEngine,
}

impl FeedbackEngine {
    pub fn new(storage: StorageEngine) -> Self {
        Self { storage }
    }

    /// Record a human approval or rejection
    pub async fn record_feedback(&self, record: &FeedbackRecord) -> Result<String, String> {
        let id = Uuid::new_v4().to_string();
        tracing::info!(
            "Feedback: User '{}' ({}) {:?} AI recommendation '{}' for decision={}",
            record.user_id,
            record.user_role,
            record.human_decision,
            record.ai_recommendation,
            record.decision_id
        );

        if let Some(pg) = &self.storage.pg_pool {
            sqlx::query(
                "INSERT INTO human_feedback (id, decision_id, user_id, user_role, action_type, \
                 ai_recommendation, ai_confidence, human_decision, rejection_reason, environment) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            )
            .bind(uuid::Uuid::parse_str(&id).unwrap())
            .bind(&record.decision_id)
            .bind(&record.user_id)
            .bind(&record.user_role)
            .bind(&record.action_type)
            .bind(&record.ai_recommendation)
            .bind(record.ai_confidence)
            .bind(format!("{:?}", record.human_decision))
            .bind(&record.rejection_reason)
            .bind(&record.environment)
            .execute(pg)
            .await
            .map_err(|e| e.to_string())?;
        }

        Ok(id)
    }

    /// Calculate approval rate for a given action type
    /// Used by ML engine to calibrate ApprovalPrediction
    pub async fn get_approval_rate(&self, action_type: &str) -> f64 {
        if let Some(pg) = &self.storage.pg_pool {
            let result = sqlx::query(
                "SELECT COUNT(*) FILTER (WHERE human_decision = 'Approved') as approved, \
                 COUNT(*) as total \
                 FROM human_feedback WHERE action_type = $1",
            )
            .bind(action_type)
            .fetch_one(pg)
            .await;

            if let Ok(row) = result {
                use sqlx::Row;
                let approved: i64 = row.try_get("approved").unwrap_or(0);
                let total: i64 = row.try_get("total").unwrap_or(1);
                return approved as f64 / total.max(1) as f64;
            }
        }
        // Default: 75% approval if no history
        0.75
    }

    /// Get recent feedback for dashboard display
    pub async fn get_recent_feedback(&self, limit: i64) -> Vec<serde_json::Value> {
        if let Some(pg) = &self.storage.pg_pool {
            let rows = sqlx::query(
                "SELECT id, decision_id, user_role, action_type, human_decision, created_at \
                 FROM human_feedback ORDER BY created_at DESC LIMIT $1",
            )
            .bind(limit)
            .fetch_all(pg)
            .await;

            if let Ok(records) = rows {
                use sqlx::Row;
                return records.iter().map(|r| serde_json::json!({
                    "id": r.try_get::<String, _>("id").unwrap_or_default(),
                    "decision_id": r.try_get::<String, _>("decision_id").unwrap_or_default(),
                    "user_role": r.try_get::<String, _>("user_role").unwrap_or_default(),
                    "action_type": r.try_get::<String, _>("action_type").unwrap_or_default(),
                    "decision": r.try_get::<String, _>("human_decision").unwrap_or_default(),
                })).collect();
            }
        }

        // Mock fallback
        vec![
            serde_json::json!({ "id": "fb-1", "decision_id": "DEC-901", "user_role": "SRE", "action_type": "restart_service", "decision": "Approved" }),
            serde_json::json!({ "id": "fb-2", "decision_id": "DEC-899", "user_role": "DBA", "action_type": "scale_database", "decision": "Rejected", "reason": "Scheduled maintenance window" }),
        ]
    }
}
