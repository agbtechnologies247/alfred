use neo4rs::Graph;
use sqlx::{Pool, Postgres};

#[derive(Clone)]
pub struct StorageEngine {
    pub pg_pool: Option<Pool<Postgres>>,
    pub graph_db: Option<Graph>,
}

impl StorageEngine {
    pub async fn new(pg_url: &str, neo4j_url: &str, neo4j_user: &str, neo4j_pass: &str) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let pg = sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect(pg_url)
            .await?;

        let graph = Graph::new(neo4j_url, neo4j_user, neo4j_pass).await?;

        tracing::info!("Storage Engine connected to PostgreSQL and Neo4J successfully");

        // Run Migrations
        sqlx::migrate!("./migrations").run(&pg).await?;

        // Seed default Tenant
        let default_tenant_id = uuid::Uuid::parse_str("00000000-0000-0000-0000-000000000000").unwrap();
        sqlx::query(
            "INSERT INTO tenants (id, name) VALUES ($1, 'Default Tenant') ON CONFLICT (id) DO NOTHING"
        )
        .bind(default_tenant_id)
        .execute(&pg)
        .await?;

        // Seed default admin User: admin / alfredpassword
        // Password hash: argon2id of 'alfredpassword'
        let admin_pass_hash = "$argon2id$v=19$m=102400,t=2,p=8$YRDdQCnsbc1WTSXYLCW6ow$mn/gPmtc4zpGQpdf7HukVg";
        let admin_id = uuid::Uuid::parse_str("11111111-1111-1111-1111-111111111111").unwrap();
        sqlx::query(
            "INSERT INTO users (id, tenant_id, username, password_hash, role) VALUES ($1, $2, 'admin', $3, 'super_admin') ON CONFLICT (username) DO NOTHING"
        )
        .bind(admin_id)
        .bind(default_tenant_id)
        .bind(admin_pass_hash)
        .execute(&pg)
        .await?;

        // Seed demo user: demo / alfredpassword
        let demo_id = uuid::Uuid::parse_str("33333333-3333-3333-3333-333333333333").unwrap();
        sqlx::query(
            "INSERT INTO users (id, tenant_id, username, password_hash, role) VALUES ($1, $2, 'demo', $3, 'sr_engineer') ON CONFLICT (username) DO NOTHING"
        )
        .bind(demo_id)
        .bind(default_tenant_id)
        .bind(admin_pass_hash)
        .execute(&pg)
        .await?;

        // Seed API key for start.ps1 tests
        let api_key_id = uuid::Uuid::parse_str("22222222-2222-2222-2222-222222222222").unwrap();
        
        use blake2::{Blake2s256, Digest};
        let mut hasher = Blake2s256::new();
        hasher.update(b"sk_test_xxxxx");
        let hash_hex = format!("{:x}", hasher.finalize());
        
        sqlx::query(
            "INSERT INTO api_keys (id, tenant_id, key_hash, type, scopes) VALUES ($1, $2, $3, 'test', $4) ON CONFLICT DO NOTHING"
        )
        .bind(api_key_id)
        .bind(default_tenant_id)
        .bind(&hash_hex)
        .bind(&vec!["incident.*".to_string(), "workflow.execute".to_string(), "feedback.write".to_string()])
        .execute(&pg)
        .await?;

        // Seed default webhooks
        let wh_id1 = uuid::Uuid::parse_str("33333333-3333-3333-3333-333333333333").unwrap();
        sqlx::query(
            "INSERT INTO webhooks (id, url, events, status) VALUES ($1, 'https://company.service-now.com/api/alfred/webhook', $2, 'active') ON CONFLICT DO NOTHING"
        )
        .bind(wh_id1)
        .bind(&vec!["incident.created".to_string(), "incident.resolved".to_string()])
        .execute(&pg)
        .await?;

        let wh_id2 = uuid::Uuid::parse_str("44444444-4444-4444-4444-444444444444").unwrap();
        sqlx::query(
            "INSERT INTO webhooks (id, url, events, status) VALUES ($1, 'http://127.0.0.1:3000/api/v1/mock-webhook', $2, 'active') ON CONFLICT DO NOTHING"
        )
        .bind(wh_id2)
        .bind(&vec!["incident.created".to_string(), "incident.resolved".to_string()])
        .execute(&pg)
        .await?;

        let wh_id3 = uuid::Uuid::parse_str("55555555-5555-5555-5555-555555555555").unwrap();
        sqlx::query(
            "INSERT INTO webhooks (id, url, events, status) VALUES ($1, 'http://billsoft.agbtechnologies.com/api/webhook', $2, 'active') ON CONFLICT DO NOTHING"
        )
        .bind(wh_id3)
        .bind(&vec!["incident.created".to_string(), "incident.resolved".to_string()])
        .execute(&pg)
        .await?;

        // Neo4J Constraints
        let _ = graph.execute(
            neo4rs::query("CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (i:Incident) REQUIRE i.id IS UNIQUE")
        ).await;
        
        let _ = graph.execute(
            neo4rs::query("CREATE CONSTRAINT sop_id IF NOT EXISTS FOR (s:Sop) REQUIRE s.id IS UNIQUE")
        ).await;

        Ok(Self { pg_pool: Some(pg), graph_db: Some(graph) })
    }

    pub async fn create_sop(&self, id: uuid::Uuid, parent_id: Option<uuid::Uuid>, version: i32, title: &str, content: &str, incident_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(pg) = &self.pg_pool {
            sqlx::query(
                "INSERT INTO sops (id, parent_id, version, title, content, created_from_incident_id) VALUES ($1, $2, $3, $4, $5, $6)"
            )
            .bind(id)
            .bind(parent_id)
            .bind(version)
            .bind(title)
            .bind(content)
            .bind(uuid::Uuid::parse_str(incident_id).unwrap_or_default())
            .execute(pg)
            .await?;
        }
        Ok(())
    }

    pub async fn log_unified_event(&self, event: &UnifiedEvent) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(pg) = &self.pg_pool {
            sqlx::query(
                "INSERT INTO unified_events (event_id, timestamp, event_type, category, object_type, object_id, \
                 actor, team, environment, severity, status, before_state, after_state, linked_records, ai_analysis, audit_metadata) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)"
            )
            .bind(event.event_id)
            .bind(event.timestamp)
            .bind(&event.event_type)
            .bind(&event.category)
            .bind(&event.object_type)
            .bind(&event.object_id)
            .bind(&event.actor)
            .bind(&event.team)
            .bind(&event.environment)
            .bind(&event.severity)
            .bind(&event.status)
            .bind(&event.before_state)
            .bind(&event.after_state)
            .bind(&event.linked_records)
            .bind(&event.ai_analysis)
            .bind(&event.audit_metadata)
            .execute(pg)
            .await?;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct UnifiedEvent {
    pub event_id: uuid::Uuid,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub event_type: String,
    pub category: String,
    pub object_type: String,
    pub object_id: String,
    pub actor: String,
    pub team: Option<String>,
    pub environment: String,
    pub severity: String,
    pub status: String,
    pub before_state: serde_json::Value,
    pub after_state: serde_json::Value,
    pub linked_records: serde_json::Value,
    pub ai_analysis: serde_json::Value,
    pub audit_metadata: serde_json::Value,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct WebhookSubscription {
    pub id: uuid::Uuid,
    pub tenant_id: uuid::Uuid,
    pub url: String,
    pub events: Vec<String>,
    pub status: String,
}

impl StorageEngine {
    pub async fn get_all_webhooks(&self) -> Result<Vec<WebhookSubscription>, Box<dyn std::error::Error + Send + Sync>> {
        if let Some(pg) = &self.pg_pool {
            let list = sqlx::query_as::<_, WebhookSubscription>("SELECT id, tenant_id, url, events, status FROM webhooks")
                .fetch_all(pg)
                .await?;
            Ok(list)
        } else {
            Ok(Vec::new())
        }
    }

    pub async fn create_webhook(&self, id: uuid::Uuid, url: &str, events: Vec<String>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(pg) = &self.pg_pool {
            sqlx::query("INSERT INTO webhooks (id, url, events, status) VALUES ($1, $2, $3, 'active')")
                .bind(id)
                .bind(url)
                .bind(&events)
                .execute(pg)
                .await?;
        }
        Ok(())
    }

    pub async fn delete_webhook(&self, id: uuid::Uuid) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(pg) = &self.pg_pool {
            sqlx::query("DELETE FROM webhooks WHERE id = $1")
                .bind(id)
                .execute(pg)
                .await?;
        }
        Ok(())
    }
}
