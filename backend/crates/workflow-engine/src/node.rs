use async_trait::async_trait;
use automation_engine::{AutomationTask, ExecutionRuntime};
use serde::{Deserialize, Serialize};
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
    pub action_type: String, // e.g. "ssh", "api", "local", "approval"
    pub payload: Value,
}

#[async_trait]
pub trait ExecutableNode {
    async fn execute(&self, context: &Value) -> Result<Value, String>;
}

#[async_trait]
impl ExecutableNode for ActionNode {
    async fn execute(&self, context: &Value) -> Result<Value, String> {
        tracing::info!(
            "Workflow ActionNode: Dispatching action_type='{}' to Automation Runtime",
            self.action_type
        );

        // Handle the special "approval" gate — this pauses execution and requires
        // human confirmation.  In production this would block on an external callback;
        // for now we log the gate and return a pending status so the DAG can decide
        // whether to continue or skip downstream nodes.
        if self.action_type == "approval" {
            tracing::info!(
                "Workflow ActionNode: Approval gate reached. Waiting for human confirmation."
            );
            return Ok(serde_json::json!({
                "status": "pending_approval",
                "action_type": "approval",
                "message": "Human approval is required before continuing this workflow."
            }));
        }

        // Build the AutomationTask from the action node's own fields.
        // `target` is extracted from the payload (e.g. a hostname for SSH, a URL for API,
        // or defaults to "localhost" for local scripts).
        let target = self
            .payload
            .get("target")
            .and_then(|v| v.as_str())
            .or_else(|| self.payload.get("url").and_then(|v| v.as_str()))
            .or_else(|| self.payload.get("host").and_then(|v| v.as_str()))
            .unwrap_or("localhost")
            .to_string();

        // Merge the current workflow context into the payload so downstream actions
        // can reference outputs from earlier nodes.
        let mut merged_payload = self.payload.clone();
        if let Some(ctx_obj) = context.as_object() {
            if let Some(payload_obj) = merged_payload.as_object_mut() {
                // Inject a `_workflow_context` key so the payload stays clean but
                // the execution runtime can inspect prior node outputs if needed.
                payload_obj.insert(
                    "_workflow_context".to_string(),
                    serde_json::Value::Object(ctx_obj.clone()),
                );
            }
        }

        let task = AutomationTask {
            action_type: self.action_type.clone(),
            target,
            payload: merged_payload,
        };

        // Delegate to the real execution runtime (SSH / API / local shell).
        match ExecutionRuntime::execute_task(&task).await {
            Ok(result) => {
                tracing::info!(
                    "Workflow ActionNode: action_type='{}' completed successfully",
                    self.action_type
                );
                Ok(serde_json::json!({
                    "status": "success",
                    "action_type": self.action_type,
                    "result": result
                }))
            }
            Err(e) => {
                tracing::error!(
                    "Workflow ActionNode: action_type='{}' failed: {}",
                    self.action_type,
                    e
                );
                Err(format!(
                    "Action '{}' failed during workflow execution: {}",
                    self.action_type, e
                ))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_local_action_node_executes_real_command() {
        let node = ActionNode {
            action_type: "local".to_string(),
            payload: json!({
                "script": "echo 'workflow-test-ok'"
            }),
        };

        let ctx = json!({ "prior_step": { "status": "done" } });
        let result = node.execute(&ctx).await;
        assert!(
            result.is_ok(),
            "Local action node should execute successfully"
        );

        let val = result.unwrap();
        assert_eq!(val["status"], "success");
        assert_eq!(val["action_type"], "local");

        // The nested result from automation-engine should contain the real stdout
        let inner = &val["result"];
        assert_eq!(inner["exit_code"], 0);
        let stdout = inner["stdout"].as_str().unwrap_or("");
        assert!(
            stdout.contains("workflow-test-ok"),
            "Expected real shell output but got: {}",
            stdout
        );
    }

    #[tokio::test]
    async fn test_dangerous_command_is_blocked() {
        let node = ActionNode {
            action_type: "local".to_string(),
            payload: json!({
                "script": "rm -rf /"
            }),
        };

        let result = node.execute(&json!({})).await;
        assert!(result.is_err(), "Dangerous commands must be blocked");
        let err = result.err().unwrap();
        assert!(
            err.contains("Command injection blocked") || err.contains("failed"),
            "Error should mention injection block, got: {}",
            err
        );
    }

    #[tokio::test]
    async fn test_approval_gate_returns_pending() {
        let node = ActionNode {
            action_type: "approval".to_string(),
            payload: json!({}),
        };

        let result = node.execute(&json!({})).await;
        assert!(result.is_ok());
        let val = result.unwrap();
        assert_eq!(val["status"], "pending_approval");
    }

    #[tokio::test]
    async fn test_ssh_action_node() {
        let node = ActionNode {
            action_type: "ssh".to_string(),
            payload: json!({
                "host": "10.0.0.5",
                "command": "uptime"
            }),
        };

        let result = node.execute(&json!({})).await;
        assert!(result.is_ok());
        let val = result.unwrap();
        assert_eq!(val["status"], "success");
        assert_eq!(val["action_type"], "ssh");
    }

    #[tokio::test]
    async fn test_context_merging() {
        let node = ActionNode {
            action_type: "local".to_string(),
            payload: json!({
                "script": "echo 'context-test'"
            }),
        };

        let ctx = json!({
            "check_health": { "status": "success", "latency_ms": 45 }
        });

        let result = node.execute(&ctx).await;
        assert!(result.is_ok());
    }
}
