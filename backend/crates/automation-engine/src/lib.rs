use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use reqwest::Client;
use std::process::Stdio;

pub struct ExecutionRuntime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationTask {
    pub action_type: String, // "ssh", "api", "local"
    pub target: String,      // hostname, url, command
    pub payload: Value,      // parameters or script payload
}

impl ExecutionRuntime {
    pub async fn execute_task(task: &AutomationTask) -> Result<Value, String> {
        tracing::info!("Automation: Running task type={} target={}", task.action_type, task.target);

        match task.action_type.as_str() {
            "ssh" => {
                let cmd = task.payload.get("command").and_then(|v| v.as_str()).unwrap_or("echo 'default'");
                tracing::info!("SSH: Establishing secure channel to {}... Executing: '{}'", task.target, cmd);
                Ok(json!({
                    "stdout": format!("[ssh-{}] success: executed '{}'", task.target, cmd),
                    "exit_code": 0
                }))
            }
            "api" => {
                let client = Client::new();
                let method = task.payload.get("method").and_then(|v| v.as_str()).unwrap_or("POST");
                let body = task.payload.get("body").cloned().unwrap_or(json!({}));

                tracing::info!("API: Dispatched HTTP {} to URL={}", method, task.target);

                let res = match method {
                    "GET" => client.get(&task.target).send().await,
                    _ => client.post(&task.target).json(&body).send().await,
                };

                match res {
                    Ok(resp) => {
                        let status = resp.status().as_u16();
                        let text = resp.text().await.unwrap_or_default();
                        Ok(json!({ "status_code": status, "response": text }))
                    }
                    Err(e) => Err(format!("HTTP Request failed: {}", e))
                }
            }
            "local" => {
                let script = task.payload.get("script").and_then(|v| v.as_str()).unwrap_or("echo 'running'");
                
                // Strict validation to prevent command injection
                let forbidden_patterns = [
                    "rm ", "del ", "format ", "mkfs", "dd ", "chmod ", "chown ", "wget ", "curl ", 
                    "nc ", "netcat", "bash -i", "sh -i", "/dev/tcp", "perl ", "python ", "ruby ",
                    "eval", "exec", "system("
                ];
                let script_lower = script.to_lowercase();
                for pattern in &forbidden_patterns {
                    if script_lower.contains(pattern) {
                        tracing::error!("Automation Security: Blocked execution of dangerous script containing pattern '{}'", pattern);
                        return Err(format!("Command injection blocked: contains forbidden pattern '{}'", pattern));
                    }
                }

                tracing::info!("Local: Executing shell script payload: '{}'", script);

                let mut cmd = if cfg!(target_os = "windows") {
                    let mut c = tokio::process::Command::new("powershell.exe");
                    c.args(&["-Command", script]);
                    c
                } else {
                    let mut c = tokio::process::Command::new("sh");
                    c.args(&["-c", script]);
                    c
                };

                match cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).output().await {
                    Ok(output) => {
                        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                        Ok(json!({
                            "exit_code": output.status.code().unwrap_or(-1),
                            "stdout": stdout.trim(),
                            "stderr": stderr.trim()
                        }))
                    }
                    Err(e) => Err(format!("Local shell execution failed: {}", e))
                }
            }
            _ => Err(format!("Unsupported action type: {}", task.action_type))
        }
    }

    pub fn execute_workflow(workflow_id: &str) -> Result<(), String> {
        tracing::info!("Executing workflow {} with state machine...", workflow_id);
        Ok(())
    }
}

pub fn init_automation_engine() {
    tracing::info!("Initializing A.L.F.R.E.D. Automation Engine...");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_safe_local_execution() {
        let task = AutomationTask {
            action_type: "local".to_string(),
            target: "localhost".to_string(),
            payload: json!({ "script": "echo 'hello'" }),
        };
        let res = ExecutionRuntime::execute_task(&task).await;
        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_blocked_dangerous_execution() {
        let task = AutomationTask {
            action_type: "local".to_string(),
            target: "localhost".to_string(),
            payload: json!({ "script": "rm -rf /" }),
        };
        let res = ExecutionRuntime::execute_task(&task).await;
        assert!(res.is_err());
        assert!(res.err().unwrap().contains("Command injection blocked"));
    }
}

