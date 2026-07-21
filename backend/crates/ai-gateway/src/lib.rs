use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RcaResult {
    pub tags: Vec<String>,
    pub confidence: f64,
}

#[async_trait]
pub trait AiProvider: Send + Sync {
    async fn generate_rca_tags(&self, incident_description: &str) -> Result<RcaResult, String>;
    // Future: async fn automate_action(...) -> ...
}

pub struct OpenAiClient {
    pub api_key: String,
    pub model: String,
    pub client: reqwest::Client,
}

impl OpenAiClient {
    pub fn new(api_key: &str, model: &str) -> Self {
        Self {
            api_key: api_key.to_string(),
            model: model.to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn local_keyword_rca(&self, desc: &str) -> RcaResult {
        let desc_lower = desc.to_lowercase();
        let mut tags = Vec::new();
        let mut confidence = 0.85;

        if desc_lower.contains("timeout")
            || desc_lower.contains("latency")
            || desc_lower.contains("slow")
        {
            tags.push("Network".to_string());
            tags.push("Timeout".to_string());
        }
        if desc_lower.contains("auth")
            || desc_lower.contains("login")
            || desc_lower.contains("password")
            || desc_lower.contains("mfa")
        {
            tags.push("Identity".to_string());
            tags.push("Authentication".to_string());
        }
        if desc_lower.contains("db")
            || desc_lower.contains("database")
            || desc_lower.contains("postgres")
            || desc_lower.contains("sql")
        {
            tags.push("Database".to_string());
            tags.push("Query_Lock".to_string());
        }
        if desc_lower.contains("disk")
            || desc_lower.contains("storage")
            || desc_lower.contains("space")
            || desc_lower.contains("full")
        {
            tags.push("Storage".to_string());
            tags.push("Disk_Full".to_string());
        }

        if tags.is_empty() {
            tags.push("Systems".to_string());
            tags.push("Unclassified".to_string());
            confidence = 0.50;
        }

        RcaResult { tags, confidence }
    }
}

#[async_trait]
impl AiProvider for OpenAiClient {
    async fn generate_rca_tags(&self, incident_description: &str) -> Result<RcaResult, String> {
        let is_placeholder = self.api_key.contains("placeholder");

        if is_placeholder {
            tracing::info!(
                "AI Gateway: Placeholder API key detected. Using local keyword fallback engine."
            );
            return Ok(self.local_keyword_rca(incident_description));
        }

        let prompt = format!(
            "Analyze this incident and provide RCA tags: {}\nReturn JSON format with 'tags' and 'confidence'.",
            incident_description
        );

        let body = serde_json::json!({
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are A.L.F.R.E.D. RCA engine. Output valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": { "type": "json_object" }
        });

        match self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
        {
            Ok(resp) => {
                if !resp.status().is_success() {
                    let err = resp.text().await.unwrap_or_default();
                    tracing::warn!(
                        "OpenAI Error response: {}. Falling back to local keyword fallback engine.",
                        err
                    );
                    return Ok(self.local_keyword_rca(incident_description));
                }

                if let Ok(json_resp) = resp.json::<serde_json::Value>().await {
                    if let Some(content) = json_resp["choices"][0]["message"]["content"].as_str() {
                        if let Ok(parsed) = serde_json::from_str::<RcaResult>(content) {
                            return Ok(parsed);
                        }
                    }
                }

                tracing::warn!("Failed to parse OpenAI JSON response. Falling back to local keyword fallback engine.");
                Ok(self.local_keyword_rca(incident_description))
            }
            Err(e) => {
                tracing::warn!(
                    "OpenAI request failed: {}. Falling back to local keyword fallback engine.",
                    e
                );
                Ok(self.local_keyword_rca(incident_description))
            }
        }
    }
}
