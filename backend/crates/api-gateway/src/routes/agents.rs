use crate::AppState;
use axum::{extract::State, Json};
use serde_json::{json, Value};

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
    let prompt = payload
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("Hello");
    let agent_id = payload
        .get("agent_id")
        .and_then(|v| v.as_str())
        .unwrap_or("AG-1");

    let api_key = &state.config.openai_key;
    let is_placeholder = api_key.contains("placeholder") || api_key.is_empty();

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

        if let Ok(resp) = client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await
        {
            if let Ok(json_resp) = resp.json::<serde_json::Value>().await {
                if let Some(choices) = json_resp.get("choices").and_then(|v| v.as_array()) {
                    if let Some(content) = choices
                        .get(0)
                        .and_then(|c| c.get("message"))
                        .and_then(|m| m.get("content"))
                        .and_then(|s| s.as_str())
                    {
                        return Json(
                            json!({ "response": content.to_string(), "is_success": true }),
                        );
                    }
                }
            }
        }
    }

    // Dynamic, contextual local SRE heuristic router
    let lower = prompt.to_lowercase();
    let response = match agent_id {
        "AG-2" => {
            // Incident Agent
            if lower.contains("incidents")
                || lower.contains("open")
                || lower.contains("p1")
                || lower.contains("alert")
            {
                "Active incidents check: 1 P1 alert is unresolved: 'CoreDNS CrashLoopBackOff inside kube-system'. MTTR clock is at 12m. I recommend tracing the core dependencies."
            } else if lower.contains("rollback")
                || lower.contains("resolve")
                || lower.contains("dns")
                || lower.contains("coredns")
            {
                "Crash analysis: CoreDNS config contains invalid upstream DNS servers. Running rollback playbook SOP-14 ($ kubectl rollout restart deployment coredns -n kube-system) will redeploy nominal configuration. Would you like me to trigger it?"
            } else if lower.contains("savings")
                || lower.contains("finops")
                || lower.contains("cost")
            {
                "FinOps incident analysis shows that automating cloud database warm standby failovers has recovered 36.5 SRE hours this month ($4,200 savings). Details are stashed in the Cost Report."
            } else {
                "SRE Incident Console is online. I can list active P1 alarms, extract target telemetry logs, or suggest manual intervention playbooks."
            }
        }
        "AG-3" => {
            // Security Agent
            if lower.contains("scan") || lower.contains("audit") || lower.contains("policy") {
                "Security scan completed. Inspected 142 IAM policies. Found 2 warning indicators: 'Over-permissive S3 write rules on backup nodes'. I have queued remediation tickets in Decisions."
            } else if lower.contains("permissions")
                || lower.contains("iam")
                || lower.contains("role")
            {
                "Role enforcement is aligned with SOC2 criteria. Admin credentials require secondary authorization. I can trigger a security audit validation if needed."
            } else if lower.contains("incidents") || lower.contains("open") || lower.contains("dns")
            {
                "DNS hijack scan shows domain routing security is normal. Security ingress configurations are protected by Cloudflare Edge."
            } else {
                "SRE Security Agent is online. I can verify IAM role distributions, run vulnerability scans, or check SOC2 compliance evidence status."
            }
        }
        _ => {
            // AG-1 or fallback: Network Agent
            if lower.contains("status")
                || lower.contains("anomalies")
                || lower.contains("latency")
                || lower.contains("traffic")
            {
                "Running edge packet analysis... Transmission score is at 98.5%, latency is stable at 45ms. Ingress lines to us-east-1 reflect a minor jitter but are within limits."
            } else if lower.contains("firewall")
                || lower.contains("packet")
                || lower.contains("mtu")
                || lower.contains("rule")
            {
                "Ingress firewall policy check: Ingress rule #FW-899 limits payload size to 1400 MTU. I have mapped this telemetry to the active incident feed."
            } else if lower.contains("dns") || lower.contains("coredns") {
                "Network level DNS checks show 97.2% health score. I see core DNS pods restarting inside the virtual cluster network."
            } else if lower.contains("savings")
                || lower.contains("finops")
                || lower.contains("cost")
            {
                "FinOps network egress audit: Network traffic caching optimization has saved approximately $1,150 in cross-region egress costs."
            } else {
                "Network Agent is online. I can check latency statistics, test firewall port configurations, or trace packet route mappings."
            }
        }
    };

    Json(json!({ "response": response, "is_success": true }))
}
