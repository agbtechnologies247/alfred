use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    Trigger(TriggerNode),
    Condition(ConditionNode),
    Action(ActionNode),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerNode {
    pub source: String,
    pub event_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConditionNode {
    pub field: String,
    pub operator: String,
    pub value: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionNode {
    pub action_type: String, // e.g. "ssh", "api", "approval"
    pub payload: Value,
}

#[async_trait]
pub trait ExecutableNode {
    async fn execute(&self, context: &Value) -> Result<Value, String>;
}

#[async_trait]
impl ExecutableNode for ActionNode {
    async fn execute(&self, context: &Value) -> Result<Value, String> {
        tracing::info!("Executing ActionNode: {} with context: {:?}", self.action_type, context);
        // Basic mock execution
        Ok(serde_json::json!({
            "status": "success",
            "action_executed": self.action_type
        }))
    }
}
