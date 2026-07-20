use async_trait::async_trait;
use serde_json::Value;

#[async_trait]
pub trait PollingConnector: Send + Sync {
    async fn poll(&self) -> Result<Vec<Value>, String>;
    fn get_interval_seconds(&self) -> u64;
}

#[async_trait]
pub trait WebhookConnector: Send + Sync {
    async fn process_payload(&self, payload: Value) -> Result<Value, String>;
    fn expected_path(&self) -> &str;
}

#[async_trait]
pub trait ActionConnector: Send + Sync {
    async fn execute_action(&self, action_name: &str, payload: Value) -> Result<Value, String>;
    fn supported_actions(&self) -> Vec<&'static str>;
}
