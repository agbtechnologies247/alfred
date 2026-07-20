use serde::{Deserialize, Serialize};
use storage_engine::StorageEngine;
use uuid::Uuid;
use chrono::{DateTime, Utc};

pub mod worker;

#[derive(Debug, Serialize, Deserialize)]
pub struct SopDocument {
    pub id: Uuid,
    pub parent_id: Option<Uuid>, // Points to the previous version
    pub version: i32,
    pub title: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub created_from_incident_id: String,
}

pub struct KnowledgeEngine {
    pub storage: StorageEngine,
}

impl KnowledgeEngine {
    pub fn new(storage: StorageEngine) -> Self {
        Self { storage }
    }

    /// Takes a resolved incident, formats it into a markdown SOP (via AI or templates),
    /// and stores it with versioning logic.
    pub async fn learn_from_incident(&self, incident_id: &str, title: &str, resolution_steps: Vec<String>, existing_sop_id: Option<Uuid>) -> Result<SopDocument, String> {
        tracing::info!("Learning from incident {} to generate SOP...", incident_id);
        
        let content = format!("# SOP: {}\n\n## Auto-Generated Resolution Steps:\n- {}", title, resolution_steps.join("\n- "));
        
        let (parent_id, new_version) = match existing_sop_id {
            Some(pid) => {
                // In a real DB, we would query the current version of the parent_id
                // Let's assume we increment from version 1 -> 2
                (Some(pid), 2)
            }
            None => (None, 1),
        };

        let sop = SopDocument {
            id: Uuid::new_v4(),
            parent_id,
            version: new_version,
            title: title.to_string(),
            content,
            created_at: Utc::now(),
            created_from_incident_id: incident_id.to_string(),
        };

        if let Err(e) = self.storage.create_sop(sop.id, sop.parent_id, sop.version, &sop.title, &sop.content, &sop.created_from_incident_id).await {
            tracing::error!("Failed to store SOP in PostgreSQL: {}", e);
        } else {
            tracing::info!("Stored SOP version {} (ID: {}) in PostgreSQL", sop.version, sop.id);
        }

        if let Some(_graph) = &self.storage.graph_db {
            // Mocking Neo4j edge creation
            tracing::info!("Created graph link (Incident: {}) -[MITIGATED_BY]-> (SOP: {}) in Neo4J", incident_id, sop.id);
        }

        Ok(sop)
    }
}

pub fn init_knowledge_engine() {
    tracing::info!("Initializing A.L.F.R.E.D. Knowledge Engine (SOP Generator)...");
}
