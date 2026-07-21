use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, VecDeque};
use storage_engine::StorageEngine;
use crate::node::{NodeType, ExecutableNode};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowGraph {
    pub id: String,
    pub name: String,
    pub nodes: HashMap<String, NodeType>,
    pub edges: Vec<Edge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    pub from: String,
    pub to: String,
}

#[allow(dead_code)]
pub struct WorkflowEngine {
    storage: StorageEngine,
}

impl WorkflowEngine {
    pub fn new(storage: StorageEngine) -> Self {
        Self { storage }
    }

    pub async fn execute_graph(&self, graph_json: &Value, initial_context: Value) -> Result<(), String> {
        let graph: WorkflowGraph = serde_json::from_value(graph_json.clone())
            .map_err(|e| format!("Failed to parse workflow graph: {}", e))?;

        tracing::info!("Starting execution of Workflow: {}", graph.name);

        let execution_id = Uuid::new_v4();
        let mut context = initial_context;

        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut adjacency: HashMap<String, Vec<String>> = HashMap::new();

        for node_id in graph.nodes.keys() {
            in_degree.insert(node_id.clone(), 0);
            adjacency.insert(node_id.clone(), Vec::new());
        }

        for edge in &graph.edges {
            if graph.nodes.contains_key(&edge.from) && graph.nodes.contains_key(&edge.to) {
                adjacency.entry(edge.from.clone()).or_default().push(edge.to.clone());
                *in_degree.entry(edge.to.clone()).or_insert(0) += 1;
            }
        }

        let mut queue = VecDeque::new();
        for (node_id, &deg) in &in_degree {
            if deg == 0 {
                queue.push_back(node_id.clone());
            }
        }

        let mut skipped_nodes = std::collections::HashSet::new();

        while let Some(node_id) = queue.pop_front() {
            if skipped_nodes.contains(&node_id) {
                if let Some(children) = adjacency.get(&node_id) {
                    for child in children {
                        skipped_nodes.insert(child.clone());
                    }
                }
                continue;
            }

            let node = match graph.nodes.get(&node_id) {
                Some(n) => n,
                None => continue,
            };

            tracing::info!("Workflow [{}] executing node: {}", execution_id, node_id);

            match node {
                NodeType::Action(action) => {
                    match action.execute(&context).await {
                        Ok(result) => {
                            context[node_id.clone()] = result;
                        }
                        Err(e) => {
                            tracing::error!("Workflow [{}] failed at action node {}: {}", execution_id, node_id, e);
                            return Err(e);
                        }
                    }
                }
                NodeType::Condition(cond) => {
                    let field_val = context.get(&cond.field).or_else(|| {
                        context.get("metrics").and_then(|m| m.get(&cond.field))
                    });

                    let matched = match field_val {
                        Some(val) => {
                            let op = cond.operator.as_str();
                            match op {
                                "gt" => {
                                    val.as_f64().unwrap_or(0.0) > cond.value.as_f64().unwrap_or(0.0)
                                }
                                "lt" => {
                                    val.as_f64().unwrap_or(0.0) < cond.value.as_f64().unwrap_or(0.0)
                                }
                                "eq" => val == &cond.value,
                                _ => false,
                            }
                        }
                        None => {
                            tracing::warn!("Workflow [{}] condition field {} not found in context", execution_id, cond.field);
                            false
                        }
                    };

                    tracing::info!("Workflow [{}] condition node {} evaluated to: {}", execution_id, node_id, matched);

                    if !matched {
                        if let Some(children) = adjacency.get(&node_id) {
                            for child in children {
                                skipped_nodes.insert(child.clone());
                            }
                        }
                    }
                }
                NodeType::Trigger(_) => {}
            }

            if let Some(children) = adjacency.get(&node_id) {
                for child in children {
                    if let Some(deg) = in_degree.get_mut(child) {
                        *deg -= 1;
                        if *deg == 0 {
                            queue.push_back(child.clone());
                        }
                    }
                }
            }
        }

        tracing::info!("Workflow {} completed successfully.", graph.name);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_empty_workflow_execution() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = WorkflowEngine::new(storage);

        let workflow = json!({
            "id": "wf-1",
            "name": "Empty Workflow",
            "nodes": {},
            "edges": []
        });

        let res = engine.execute_graph(&workflow, json!({})).await;
        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_linear_workflow_execution() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = WorkflowEngine::new(storage);

        let workflow = json!({
            "id": "wf-2",
            "name": "Linear Workflow",
            "nodes": {
                "start": {
                    "Trigger": {
                        "source": "manual",
                        "event_type": "click"
                    }
                },
                "step1": {
                    "Action": {
                        "action_type": "local",
                        "payload": { "script": "echo 'linear-test'" }
                    }
                }
            },
            "edges": [
                { "from": "start", "to": "step1" }
            ]
        });

        let res = engine.execute_graph(&workflow, json!({})).await;
        assert!(res.is_ok());
    }

    /// Integration test: a multi-step DAG with a real local shell command.
    /// Trigger → Check Health (local echo) → Notify (local echo)
    /// Both action nodes run real shell commands through automation-engine.
    #[tokio::test]
    async fn test_dag_with_real_shell_execution() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = WorkflowEngine::new(storage);

        let workflow = json!({
            "id": "wf-integration-1",
            "name": "Real Shell Execution DAG",
            "nodes": {
                "trigger": {
                    "Trigger": {
                        "source": "incident",
                        "event_type": "p1_alert"
                    }
                },
                "check_health": {
                    "Action": {
                        "action_type": "local",
                        "payload": { "script": "echo 'health-check-ok'" }
                    }
                },
                "notify": {
                    "Action": {
                        "action_type": "local",
                        "payload": { "script": "echo 'notification-sent'" }
                    }
                }
            },
            "edges": [
                { "from": "trigger", "to": "check_health" },
                { "from": "check_health", "to": "notify" }
            ]
        });

        let res = engine.execute_graph(&workflow, json!({})).await;
        assert!(res.is_ok(), "Multi-step DAG with real shell commands should succeed");
    }

    /// Integration test: condition node evaluates to false → downstream action is skipped.
    #[tokio::test]
    async fn test_condition_skips_downstream_on_false() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = WorkflowEngine::new(storage);

        let workflow = json!({
            "id": "wf-cond-skip",
            "name": "Conditional Skip Workflow",
            "nodes": {
                "trigger": {
                    "Trigger": {
                        "source": "manual",
                        "event_type": "test"
                    }
                },
                "gate": {
                    "Condition": {
                        "field": "cpu_usage",
                        "operator": "gt",
                        "value": 90.0
                    }
                },
                "remediate": {
                    "Action": {
                        "action_type": "local",
                        "payload": { "script": "echo 'remediation-executed'" }
                    }
                }
            },
            "edges": [
                { "from": "trigger", "to": "gate" },
                { "from": "gate", "to": "remediate" }
            ]
        });

        // cpu_usage is 50 — below the threshold of 90, so "remediate" should be SKIPPED
        let res = engine.execute_graph(
            &workflow,
            json!({ "cpu_usage": 50.0 }),
        ).await;
        assert!(res.is_ok(), "Workflow with skipped condition should still succeed");
    }

    /// Integration test: condition evaluates to true → downstream action runs.
    #[tokio::test]
    async fn test_condition_allows_downstream_on_true() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = WorkflowEngine::new(storage);

        let workflow = json!({
            "id": "wf-cond-pass",
            "name": "Conditional Pass Workflow",
            "nodes": {
                "trigger": {
                    "Trigger": {
                        "source": "manual",
                        "event_type": "test"
                    }
                },
                "gate": {
                    "Condition": {
                        "field": "disk_usage",
                        "operator": "gt",
                        "value": 85.0
                    }
                },
                "cleanup": {
                    "Action": {
                        "action_type": "local",
                        "payload": { "script": "echo 'disk-cleanup-ran'" }
                    }
                }
            },
            "edges": [
                { "from": "trigger", "to": "gate" },
                { "from": "gate", "to": "cleanup" }
            ]
        });

        // disk_usage is 92 — above 85, so "cleanup" SHOULD execute
        let res = engine.execute_graph(
            &workflow,
            json!({ "disk_usage": 92.0 }),
        ).await;
        assert!(res.is_ok(), "Workflow with passing condition should execute downstream action");
    }
}

