use axum::{
    Json, extract::State,
};
use serde_json::{json, Value};
use crate::AppState;

pub async fn get_agents() -> Json<Value> {
    Json(json!([
        { "id": "AG-1", "name": "Network Agent", "status": "active", "task": "Currently monitoring edge router traffic.", "icon": "network" },
        { "id": "AG-2", "name": "Incident Agent", "status": "active", "task": "Standing by for next P1 alert.", "icon": "zap" },
        { "id": "AG-3", "name": "Security Agent", "status": "warning", "task": "Scanning IAM policies.", "icon": "shield" }
    ]))
}

pub async fn agent_chat(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<Value>,
) -> Json<Value> {
    let prompt = payload.get("message").and_then(|v| v.as_str()).unwrap_or("Hello");
    let agent_id = payload.get("agent_id").and_then(|v| v.as_str()).unwrap_or("AG-1");

    let api_key = &state.config.openai_key;
    let is_placeholder = api_key.contains("placeholder");

    if !is_placeholder {
        let client = reqwest::Client::new();
        let prompt_text = format!(
            "You are an SRE AI Agent (ID: {}) in the A.L.F.R.E.D. console. \
             Your role is to diagnose production anomalies, write emergency SOP rollback plans, or restart services. \
             The user is asking: '{}'. Respond helpfully as a senior SRE agent. Keep the response professional and concise.",
            agent_id, prompt
        );
        let body = serde_json::json!({
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional SRE Copilot."
                },
                {
                    "role": "user",
                    "content": prompt_text
                }
            ]
        });

        if let Ok(resp) = client.post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await 
        {
            if let Ok(json_resp) = resp.json::<serde_json::Value>().await {
                if let Some(choices) = json_resp.get("choices").and_then(|v| v.as_array()) {
                    if let Some(content) = choices.get(0).and_then(|c| c.get("message")).and_then(|m| m.get("content")).and_then(|s| s.as_str()) {
                        return Json(json!({ "response": content.to_string(), "is_success": true }));
                    }
                }
            }
        }
    }

    let lower = prompt.to_lowercase();
    let response = if lower.contains("firewall") || lower.contains("packet") || lower.contains("mtu") {
        "Confirmed. The firewall policy update #FW-899 is dropping packets exceeding 1400 MTU. I have drafted an emergency rollback script."
    } else if lower.contains("dns") || lower.contains("coredns") {
        "I detected a CoreDNS CrashLoopBackOff inside kube-system. I recommend running the automated rollback playbook SOP-14."
    } else if lower.contains("db") || lower.contains("database") || lower.contains("storage") {
        "The 'orders-prod' database is running low on disk space (84.5% utilized). I can trigger a storage resize task if you approve."
    } else {
        "Received. I've scanned the active topology nodes. No critical anomalies are currently detected on the network gateway interface."
    };

    Json(json!({ "response": response, "is_success": true }))
}
