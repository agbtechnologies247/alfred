use std::collections::HashMap;

/// Configuration Engine handling Developer API Keys, Webhooks, and Secrets
pub struct ConfigEngine {
    api_keys: HashMap<String, Vec<String>>, // Key -> Scopes
    webhooks: Vec<String>,
    pub openai_key: String,
    pub slack_webhook: Option<String>,
    pub pagerduty_routing_key: Option<String>,
    pub database_url: String,
    pub neo4j_url: String,
    pub neo4j_user: String,
    pub neo4j_pass: String,
}

impl ConfigEngine {
    pub fn new() -> Self {
        let mut api_keys = HashMap::new();
        // Seed with test keys
        api_keys.insert(
            "sk_live_xxxxx".to_string(),
            vec!["incident.read".into(), "incident.write".into()],
        );
        api_keys.insert(
            "sk_test_xxxxx".to_string(),
            vec!["incident.*".into(), "workflow.execute".into()],
        );

        // Simulated Vault/secrets JSON loader if present in workspace config
        let mut vault_secrets: HashMap<String, String> = HashMap::new();
        if let Ok(content) = std::fs::read_to_string("config/secrets.json") {
            if let Ok(parsed) = serde_json::from_str::<HashMap<String, String>>(&content) {
                tracing::info!("Config: Secrets successfully loaded from secure configuration vault (config/secrets.json)");
                vault_secrets = parsed;
            }
        }

        let openai_key = vault_secrets
            .get("OPENAI_API_KEY")
            .cloned()
            .or_else(|| std::env::var("OPENAI_API_KEY").ok())
            .unwrap_or_else(|| {
                tracing::warn!(
                    "OPENAI_API_KEY environment variable not set! Using development placeholder."
                );
                "sk-proj-placeholder-replace-with-real-key-in-prod".to_string()
            });

        let slack_webhook = vault_secrets
            .get("SLACK_WEBHOOK_URL")
            .cloned()
            .or_else(|| std::env::var("SLACK_WEBHOOK_URL").ok())
            .or_else(|| Some("https://hooks.slack.com/services/mock/webhook/url".to_string()));

        let pagerduty_routing_key = vault_secrets
            .get("PAGERDUTY_ROUTING_KEY")
            .cloned()
            .or_else(|| std::env::var("PAGERDUTY_ROUTING_KEY").ok())
            .or_else(|| Some("mock_pagerduty_routing_key_123".to_string()));

        let database_url = vault_secrets
            .get("DATABASE_URL")
            .cloned()
            .or_else(|| std::env::var("DATABASE_URL").ok())
            .unwrap_or_else(|| {
                "postgres://alfred:alfredpassword@localhost:5432/alfred_db".to_string()
            });

        let neo4j_url = vault_secrets
            .get("NEO4J_URL")
            .cloned()
            .or_else(|| std::env::var("NEO4J_URL").ok())
            .unwrap_or_else(|| "bolt://localhost:7687".to_string());

        let neo4j_user = vault_secrets
            .get("NEO4J_USER")
            .cloned()
            .or_else(|| std::env::var("NEO4J_USER").ok())
            .unwrap_or_else(|| "neo4j".to_string());

        let neo4j_pass = vault_secrets
            .get("NEO4J_PASSWORD")
            .cloned()
            .or_else(|| std::env::var("NEO4J_PASSWORD").ok())
            .unwrap_or_else(|| "alfredpassword".to_string());

        Self {
            api_keys,
            webhooks: vec![
                "https://company.service-now.com/api/alfred/webhook".to_string(),
                "http://127.0.0.1:3000/api/v1/mock-webhook".to_string(),
            ],
            openai_key,
            slack_webhook,
            pagerduty_routing_key,
            database_url,
            neo4j_url,
            neo4j_user,
            neo4j_pass,
        }
    }

    pub fn validate_token(&self, token: &str, required_scope: &str) -> bool {
        if let Some(scopes) = self.api_keys.get(token) {
            scopes.iter().any(|s| {
                s == required_scope
                    || s.ends_with(".*") && required_scope.starts_with(s.trim_end_matches(".*"))
            })
        } else {
            false
        }
    }

    pub fn get_webhooks(&self) -> Vec<String> {
        self.webhooks.clone()
    }
}
