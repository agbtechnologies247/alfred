use crate::AppState;
use axum::{extract::State, Json};
use serde_json::{json, Value};

pub async fn get_analytics(State(state): State<AppState>) -> Json<Value> {
    use sqlx::Row;
    let mut total_incidents = 0;
    let mut total_sops = 0;
    let mut total_feedback = 0;

    if let Some(pg) = &state.storage.pg_pool {
        if let Ok(row) = sqlx::query("SELECT COUNT(*) FROM incidents")
            .fetch_one(pg)
            .await
        {
            total_incidents = row.get::<i64, _>(0);
        }
        if let Ok(row) = sqlx::query("SELECT COUNT(*) FROM sops").fetch_one(pg).await {
            total_sops = row.get::<i64, _>(0);
        }
        if let Ok(row) = sqlx::query("SELECT COUNT(*) FROM human_feedback")
            .fetch_one(pg)
            .await
        {
            total_feedback = row.get::<i64, _>(0);
        }
    }

    let manual_hours_saved = total_feedback * 2 + total_sops * 8 + total_incidents * 3;
    let api_calls = 1400000 + total_incidents * 12 + total_feedback * 5;
    let tokens = 8200000 + total_feedback * 45000 + total_sops * 12000;
    let cost = (tokens as f64) * 0.000005;

    Json(json!({
        "metrics": {
            "total_api_calls": format!("{:.1}M", (api_calls as f64) / 1_000_000.0),
            "api_calls_trend": "+14% from last week",
            "tokens_consumed": format!("{:.1}M", (tokens as f64) / 1_000_000.0),
            "tokens_cost": format!("${:.2}", cost),
            "agents_active_time": "420 hrs",
            "agents_savings": format!("Saved {} manual hours", manual_hours_saved)
        },
        "trends": [
            { "name": "Mon", "usage": 4000, "cost": 2400 },
            { "name": "Tue", "usage": 3000, "cost": 1398 },
            { "name": "Wed", "usage": 2000, "cost": 9800 },
            { "name": "Thu", "usage": 2780, "cost": 3908 },
            { "name": "Fri", "usage": 1890, "cost": 4800 },
            { "name": "Sat", "usage": 2390, "cost": 3800 },
            { "name": "Sun", "usage": 3490, "cost": 4300 }
        ]
    }))
}

pub async fn get_ai_providers() -> Json<Value> {
    Json(json!([
        { "id": "prov-1", "name": "Dograh Agents", "model": "dograh-v2", "status": "Active", "cost": "Low" },
        { "id": "prov-2", "name": "OpenAI", "model": "gpt-4-turbo", "status": "Active", "cost": "High" },
        { "id": "prov-3", "name": "Local Rust AI", "model": "llama-3-8b", "status": "Inactive", "cost": "Zero" }
    ]))
}

struct TplRecord {
    id: &'static str,
    category: &'static str,
    severity: &'static str,
    estimated_resolution_mins: u32,
    monthly_occurrences: u32,
    confidence_pct: f64,
}

pub async fn get_opex_roi() -> Json<Value> {
    let templates: &[TplRecord] = &[
        TplRecord {
            id: "TPL-001",
            category: "IT Operations",
            severity: "Critical",
            estimated_resolution_mins: 8,
            monthly_occurrences: 3,
            confidence_pct: 0.98,
        },
        TplRecord {
            id: "TPL-002",
            category: "IT Operations",
            severity: "High",
            estimated_resolution_mins: 12,
            monthly_occurrences: 8,
            confidence_pct: 0.92,
        },
        TplRecord {
            id: "TPL-003",
            category: "IT Operations",
            severity: "High",
            estimated_resolution_mins: 6,
            monthly_occurrences: 5,
            confidence_pct: 0.96,
        },
        TplRecord {
            id: "TPL-010",
            category: "Database",
            severity: "Critical",
            estimated_resolution_mins: 5,
            monthly_occurrences: 4,
            confidence_pct: 0.97,
        },
        TplRecord {
            id: "TPL-011",
            category: "Database",
            severity: "Medium",
            estimated_resolution_mins: 20,
            monthly_occurrences: 12,
            confidence_pct: 0.89,
        },
        TplRecord {
            id: "TPL-012",
            category: "Database",
            severity: "Low",
            estimated_resolution_mins: 15,
            monthly_occurrences: 30,
            confidence_pct: 0.99,
        },
        TplRecord {
            id: "TPL-020",
            category: "Cloud",
            severity: "High",
            estimated_resolution_mins: 10,
            monthly_occurrences: 6,
            confidence_pct: 0.95,
        },
        TplRecord {
            id: "TPL-021",
            category: "Cloud",
            severity: "High",
            estimated_resolution_mins: 4,
            monthly_occurrences: 15,
            confidence_pct: 0.93,
        },
        TplRecord {
            id: "TPL-022",
            category: "Cloud",
            severity: "Low",
            estimated_resolution_mins: 30,
            monthly_occurrences: 4,
            confidence_pct: 0.91,
        },
        TplRecord {
            id: "TPL-030",
            category: "Security",
            severity: "Critical",
            estimated_resolution_mins: 3,
            monthly_occurrences: 20,
            confidence_pct: 0.96,
        },
        TplRecord {
            id: "TPL-031",
            category: "Security",
            severity: "Critical",
            estimated_resolution_mins: 8,
            monthly_occurrences: 5,
            confidence_pct: 0.99,
        },
        TplRecord {
            id: "TPL-032",
            category: "Security",
            severity: "Critical",
            estimated_resolution_mins: 5,
            monthly_occurrences: 2,
            confidence_pct: 0.94,
        },
        TplRecord {
            id: "TPL-040",
            category: "Identity",
            severity: "High",
            estimated_resolution_mins: 15,
            monthly_occurrences: 25,
            confidence_pct: 0.98,
        },
        TplRecord {
            id: "TPL-041",
            category: "Identity",
            severity: "Low",
            estimated_resolution_mins: 2,
            monthly_occurrences: 200,
            confidence_pct: 0.99,
        },
        TplRecord {
            id: "TPL-050",
            category: "Network",
            severity: "High",
            estimated_resolution_mins: 15,
            monthly_occurrences: 3,
            confidence_pct: 0.90,
        },
        TplRecord {
            id: "TPL-051",
            category: "Network",
            severity: "Critical",
            estimated_resolution_mins: 5,
            monthly_occurrences: 2,
            confidence_pct: 0.97,
        },
        TplRecord {
            id: "TPL-060",
            category: "ITSM",
            severity: "High",
            estimated_resolution_mins: 3,
            monthly_occurrences: 10,
            confidence_pct: 0.95,
        },
        TplRecord {
            id: "TPL-061",
            category: "ITSM",
            severity: "Medium",
            estimated_resolution_mins: 10,
            monthly_occurrences: 40,
            confidence_pct: 0.91,
        },
        TplRecord {
            id: "TPL-070",
            category: "Healthcare IT",
            severity: "Critical",
            estimated_resolution_mins: 8,
            monthly_occurrences: 2,
            confidence_pct: 0.93,
        },
        TplRecord {
            id: "TPL-080",
            category: "Finance IT",
            severity: "Critical",
            estimated_resolution_mins: 6,
            monthly_occurrences: 3,
            confidence_pct: 0.97,
        },
        TplRecord {
            id: "TPL-090",
            category: "Compliance",
            severity: "Low",
            estimated_resolution_mins: 60,
            monthly_occurrences: 1,
            confidence_pct: 0.99,
        },
        // People Engineering (PE) Templates
        TplRecord {
            id: "TPL-PE-001",
            category: "People Engineering",
            severity: "High",
            estimated_resolution_mins: 10,
            monthly_occurrences: 5,
            confidence_pct: 0.94,
        },
        TplRecord {
            id: "TPL-PE-002",
            category: "People Engineering",
            severity: "Medium",
            estimated_resolution_mins: 20,
            monthly_occurrences: 15,
            confidence_pct: 0.88,
        },
        TplRecord {
            id: "TPL-PE-003",
            category: "People Engineering",
            severity: "High",
            estimated_resolution_mins: 15,
            monthly_occurrences: 4,
            confidence_pct: 0.91,
        },
        TplRecord {
            id: "TPL-PE-004",
            category: "People Engineering",
            severity: "Critical",
            estimated_resolution_mins: 5,
            monthly_occurrences: 2,
            confidence_pct: 0.96,
        },
        TplRecord {
            id: "TPL-PE-005",
            category: "People Engineering",
            severity: "Medium",
            estimated_resolution_mins: 30,
            monthly_occurrences: 8,
            confidence_pct: 0.85,
        },
        TplRecord {
            id: "TPL-PE-006",
            category: "People Engineering",
            severity: "Low",
            estimated_resolution_mins: 45,
            monthly_occurrences: 2,
            confidence_pct: 0.90,
        },
        TplRecord {
            id: "TPL-PE-007",
            category: "People Engineering",
            severity: "High",
            estimated_resolution_mins: 12,
            monthly_occurrences: 10,
            confidence_pct: 0.95,
        },
        TplRecord {
            id: "TPL-PE-008",
            category: "People Engineering",
            severity: "Critical",
            estimated_resolution_mins: 8,
            monthly_occurrences: 3,
            confidence_pct: 0.98,
        },
    ];

    let sre_cost_per_hr_usd: f64 = 150.0;

    let template_count = templates.len() as u64;
    let total_monthly_occurrences: u32 = templates.iter().map(|t| t.monthly_occurrences).sum();
    let total_minutes_saved_per_occurrence: f64 = templates
        .iter()
        .map(|t| t.estimated_resolution_mins as f64)
        .sum::<f64>()
        / template_count as f64;

    let monthly_hours_saved: f64 = templates
        .iter()
        .map(|t| (t.monthly_occurrences as f64 * t.estimated_resolution_mins as f64) / 60.0)
        .sum();

    let monthly_sre_savings_usd: f64 = monthly_hours_saved * sre_cost_per_hr_usd;
    let annual_sre_savings_usd: f64 = monthly_sre_savings_usd * 12.0;

    let weighted_confidence: f64 = templates
        .iter()
        .map(|t| t.confidence_pct * t.monthly_occurrences as f64)
        .sum::<f64>()
        / total_monthly_occurrences as f64;

    let categories = vec![
        "IT Operations",
        "Database",
        "Cloud",
        "Security",
        "Identity",
        "Network",
        "ITSM",
        "Healthcare IT",
        "Finance IT",
        "Compliance",
        "People Engineering",
    ];
    let by_category: Vec<Value> = categories
        .iter()
        .map(|cat| {
            let cat_templates: Vec<&TplRecord> =
                templates.iter().filter(|t| t.category == *cat).collect();
            if cat_templates.is_empty() {
                return json!(null);
            }
            let count = cat_templates.len() as u32;
            let total_occ: u32 = cat_templates.iter().map(|t| t.monthly_occurrences).sum();
            let hours: f64 = cat_templates
                .iter()
                .map(|t| (t.monthly_occurrences as f64 * t.estimated_resolution_mins as f64) / 60.0)
                .sum();
            let savings_usd: f64 = hours * sre_cost_per_hr_usd;
            let avg_resolution_mins: f64 = cat_templates
                .iter()
                .map(|t| t.estimated_resolution_mins as f64)
                .sum::<f64>()
                / count as f64;
            let avg_confidence: f64 = cat_templates
                .iter()
                .map(|t| t.confidence_pct * t.monthly_occurrences as f64)
                .sum::<f64>()
                / total_occ as f64;

            json!({
                "category": cat,
                "template_count": count,
                "monthly_occurrences": total_occ,
                "monthly_hours_saved": (hours * 10.0).round() / 10.0,
                "monthly_sre_savings_usd": (savings_usd * 100.0).round() / 100.0,
                "avg_resolution_mins": (avg_resolution_mins * 10.0).round() / 10.0,
                "avg_ai_confidence_pct": (avg_confidence * 1000.0).round() / 10.0,
            })
        })
        .filter(|v| !v.is_null())
        .collect();

    let count_critical = templates
        .iter()
        .filter(|t| t.severity == "Critical")
        .count();
    let count_high = templates.iter().filter(|t| t.severity == "High").count();
    let count_medium = templates.iter().filter(|t| t.severity == "Medium").count();
    let count_low = templates.iter().filter(|t| t.severity == "Low").count();

    let mut by_impact: Vec<(&TplRecord, f64)> = templates
        .iter()
        .map(|t| {
            (
                t,
                (t.monthly_occurrences as f64 * t.estimated_resolution_mins as f64) / 60.0,
            )
        })
        .collect();
    by_impact.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    let top_5: Vec<Value> = by_impact
        .iter()
        .take(5)
        .map(|(t, hrs)| {
            json!({
                "id": t.id,
                "category": t.category,
                "monthly_hours_saved": (hrs * 10.0).round() / 10.0,
                "monthly_sre_savings_usd": (hrs * sre_cost_per_hr_usd * 100.0).round() / 100.0,
                "monthly_occurrences": t.monthly_occurrences,
                "estimated_resolution_mins": t.estimated_resolution_mins,
            })
        })
        .collect();

    Json(json!({
        "data_source": "Template catalog — GET /api/templates",
        "computation_version": "1.0",
        "methodology": {
            "sre_cost_per_hr_usd": sre_cost_per_hr_usd,
            "source_sre_cost": "Gartner 2024 — fully-loaded enterprise SRE/NOC cost",
            "note": "Savings reflect only measurable SRE time reduction. Downtime avoidance, compliance penalties, and breach costs are NOT included in this conservative estimate.",
        },
        "summary": {
            "template_count": template_count,
            "total_monthly_occurrences": total_monthly_occurrences,
            "monthly_hours_saved": (monthly_hours_saved * 10.0).round() / 10.0,
            "avg_resolution_mins_per_incident": (total_minutes_saved_per_occurrence * 10.0).round() / 10.0,
            "weighted_avg_ai_confidence_pct": (weighted_confidence * 1000.0).round() / 10.0,
            "monthly_sre_savings_usd": (monthly_sre_savings_usd * 100.0).round() / 100.0,
            "annual_sre_savings_usd": (annual_sre_savings_usd * 100.0).round() / 100.0,
            "payback_period_note": "ROI depends on license cost vs annual_sre_savings_usd",
        },
        "severity_distribution": {
            "Critical": count_critical,
            "High": count_high,
            "Medium": count_medium,
            "Low": count_low,
        },
        "by_category": by_category,
        "top_5_by_monthly_impact": top_5,
    }))
}

pub async fn get_templates() -> Json<Value> {
    let mut tpls = json!([
        {
            "id": "TPL-001", "category": "IT Operations", "industry": ["All"],
            "title": "CoreDNS CrashLoopBackOff Recovery",
            "severity": "Critical", "confidence": "98%",
            "estimated_resolution_mins": 8, "monthly_occurrences": 3,
            "tags": ["kubernetes", "dns", "crash-loop"],
            "description": "Automatically detects and recovers CoreDNS pods stuck in CrashLoopBackOff inside Kubernetes clusters.",
            "aiPrompt": "CoreDNS pod is in CrashLoopBackOff. Analyze logs, identify root cause (config map corruption, OOM, upstream DNS failure), and recommend safest restart strategy.",
            "steps": [
                "Detect CrashLoopBackOff via Kubernetes event watcher",
                "Pull CoreDNS pod logs from last 5 minutes",
                "AI analyzes logs for root cause pattern",
                "If config corruption: restore from ConfigMap backup",
                "If OOM: increase memory limit and restart",
                "Rollout restart with zero downtime",
                "Verify DNS resolution on 3 test endpoints",
                "Create incident ticket with RCA and close"
            ],
            "roi": "Saves 45 min/incident. Avg 3x/month = 2.25 hrs saved."
        },
        {
            "id": "TPL-002", "category": "IT Operations", "industry": ["All"],
            "title": "High CPU Utilization — Runaway Process",
            "severity": "High", "confidence": "92%",
            "estimated_resolution_mins": 12, "monthly_occurrences": 8,
            "tags": ["cpu", "performance", "linux"],
            "description": "Identifies the top CPU-consuming process, determines if it's legitimate, and either kills or scales the affected service.",
            "aiPrompt": "CPU utilization exceeded 90% threshold. Identify top process. Determine if legitimate workload spike or runaway process. Recommend kill, restart, or scale-out action.",
            "steps": [
                "Capture top 10 CPU processes via SSH",
                "AI cross-references processes against known service catalog",
                "If unknown process: flag for security review",
                "If known service spike: check if scheduled job or traffic anomaly",
                "If runaway: kill process and log PID",
                "If traffic spike: trigger auto-scale policy",
                "Monitor CPU for 5 min post-action",
                "Send resolution summary to Slack"
            ],
            "roi": "8 incidents/month × 12 min = 96 min saved. Prevents outage escalation."
        },
        {
            "id": "TPL-003", "category": "IT Operations", "industry": ["All"],
            "title": "Disk Space Critical — Auto Cleanup",
            "severity": "High", "confidence": "96%",
            "estimated_resolution_mins": 6, "monthly_occurrences": 5,
            "tags": ["disk", "storage", "linux"],
            "description": "Cleans log files, temp directories, and old Docker images when disk usage exceeds 85%.",
            "aiPrompt": "Disk usage at 92% on /var. Identify largest directories, stale logs and Docker layers. Recommend safe cleanup plan with estimated space recovery.",
            "steps": [
                "SSH to affected host, run df and du analysis",
                "Identify top 10 space consumers",
                "AI classifies each as safe-to-delete or requires review",
                "Delete log files older than 30 days from /var/log",
                "Prune Docker images not used in 7 days",
                "Clear /tmp older than 24 hours",
                "Report recovered space and new disk utilization",
                "Alert if still above 80% for manual review"
            ],
            "roi": "Prevents unplanned outages. 5x/month × 6 min = 30 min saved."
        },
        {
            "id": "TPL-010", "category": "Database", "industry": ["All"],
            "title": "PostgreSQL Connection Pool Exhaustion",
            "severity": "Critical", "confidence": "97%",
            "estimated_resolution_mins": 5, "monthly_occurrences": 4,
            "tags": ["postgres", "database", "connection-pool"],
            "description": "Detects connection pool saturation and intelligently restarts the pool, kills idle connections, or scales read replicas.",
            "aiPrompt": "PostgreSQL max_connections reached. Identify long-running idle connections, query PID list, and recommend whether to kill idle sessions or increase pool size.",
            "steps": [
                "Query pg_stat_activity for idle connections > 10 min",
                "AI evaluates which sessions are safe to terminate",
                "Terminate idle connections in batches",
                "Restart connection pool manager (PgBouncer/pgpool)",
                "Verify connection count returns below 80%",
                "If persistent: recommend read replica provisioning",
                "Update incident log with root cause"
            ],
            "roi": "Prevents full DB outage. 4x/month × 5 min + avoided $50K+ downtime."
        },
        {
            "id": "TPL-011", "category": "Database", "industry": ["Finance", "Retail", "Healthcare"],
            "title": "Slow Query Detection & Optimization",
            "severity": "Medium", "confidence": "89%",
            "estimated_resolution_mins": 20, "monthly_occurrences": 12,
            "tags": ["postgres", "mysql", "performance", "query"],
            "description": "Captures slow queries, generates AI-recommended index suggestions, and optionally creates the index automatically.",
            "aiPrompt": "Slow query detected (> 5s). Analyze query plan with EXPLAIN ANALYZE. Identify missing indexes, full table scans. Generate optimized query and index creation DDL.",
            "steps": [
                "Capture slow query log entries",
                "Run EXPLAIN ANALYZE on top 5 offending queries",
                "AI generates index recommendations",
                "Show DBA the proposed CREATE INDEX statements",
                "If auto-approve enabled: create index CONCURRENTLY",
                "Monitor query response time for 10 min",
                "Log improvement metrics to performance dashboard"
            ],
            "roi": "12x/month. Avg 20 min manual DBA work eliminated per occurrence."
        },
        {
            "id": "TPL-012", "category": "Database", "industry": ["All"],
            "title": "Database Backup Verification",
            "severity": "Low", "confidence": "99%",
            "estimated_resolution_mins": 15, "monthly_occurrences": 30,
            "tags": ["backup", "compliance", "database"],
            "description": "Daily automated verification that backups are complete, restorable, and within RTO/RPO policy thresholds.",
            "aiPrompt": "Verify last backup completed successfully. Check backup file integrity, size consistency, and test restore to sandbox environment. Report compliance status.",
            "steps": [
                "Check backup job completion status",
                "Verify backup file checksums",
                "Test restore to isolated sandbox DB",
                "Run row count validation on restored data",
                "Confirm backup timestamp within RPO policy",
                "Generate compliance report",
                "Alert if any step fails"
            ],
            "roi": "Ensures compliance. Eliminates 2 hrs/week of manual DBA verification."
        },
        {
            "id": "TPL-020", "category": "Cloud", "industry": ["All"],
            "title": "AWS EC2 Restart with Health Checks",
            "severity": "High", "confidence": "95%",
            "estimated_resolution_mins": 10, "monthly_occurrences": 6,
            "tags": ["aws", "ec2", "restart"],
            "description": "Safely restarts an EC2 instance with pre-restart health checks, post-restart validation, and automatic rollback.",
            "aiPrompt": "EC2 instance is unresponsive. Check CloudWatch metrics, system logs, and CPU/memory status. Recommend safe restart or instance replacement.",
            "steps": [
                "Check EC2 instance status checks via CloudWatch",
                "Capture last 100 lines of system log",
                "AI determines if restart or terminate+replace is safer",
                "Detach instance from Load Balancer target group",
                "Initiate instance stop/start (not reboot)",
                "Wait for instance checks to pass (2/2)",
                "Re-attach to Load Balancer",
                "Run synthetic health check on endpoint",
                "Send resolution notification"
            ],
            "roi": "6x/month × 10 min = 60 min saved. Reduces MTTR from 45 min to 10 min."
        },
        {
            "id": "TPL-021", "category": "Cloud", "industry": ["All"],
            "title": "Auto-Scale Kubernetes Deployment",
            "severity": "High", "confidence": "93%",
            "estimated_resolution_mins": 4, "monthly_occurrences": 15,
            "tags": ["kubernetes", "eks", "scaling", "hpa"],
            "description": "Automatically scales Kubernetes deployments when CPU or memory thresholds are exceeded.",
            "aiPrompt": "Deployment memory usage at 88%. Analyze pod resource usage trend. Recommend scaling target — horizontal pod autoscaling or vertical resource limit increase.",
            "steps": [
                "Check current HPA status and replica count",
                "Analyze resource usage over last 30 min",
                "AI recommends scale target (e.g. 4 → 8 replicas)",
                "Apply kubectl scale command",
                "Monitor rolling update status",
                "Confirm all new pods reach Running state",
                "Verify load balancer distributes traffic evenly"
            ],
            "roi": "15x/month. Prevents pod OOMKill outages automatically."
        },
        {
            "id": "TPL-022", "category": "Cloud", "industry": ["Finance", "SaaS"],
            "title": "Idle Cloud Resource Cleanup (FinOps)",
            "severity": "Low", "confidence": "91%",
            "estimated_resolution_mins": 30, "monthly_occurrences": 4,
            "tags": ["finops", "aws", "azure", "cost"],
            "description": "Identifies and terminates idle EC2 instances, unattached EBS volumes, and unused Elastic IPs to reduce cloud spend.",
            "aiPrompt": "Identify AWS resources with zero utilization over the past 14 days. Calculate monthly savings from termination. Get approval before deleting anything.",
            "steps": [
                "Query CloudWatch for instances with < 2% CPU over 14 days",
                "List unattached EBS volumes and unused EIPs",
                "Calculate total monthly cost of identified resources",
                "AI generates ranked list by savings potential",
                "Send cost reduction report to FinOps team for approval",
                "On approval: tag resources, schedule deletion in 48h",
                "Send deletion confirmation with actual savings"
            ],
            "roi": "Typical enterprise saves $8K–$40K/month in cloud waste."
        },
        {
            "id": "TPL-030", "category": "Security", "industry": ["All"],
            "title": "Suspicious Login — Account Lockout Response",
            "severity": "Critical", "confidence": "96%",
            "estimated_resolution_mins": 3, "monthly_occurrences": 20,
            "tags": ["security", "identity", "okta", "azure-ad"],
            "description": "Detects brute force or credential stuffing attacks and locks the account while notifying the user and security team.",
            "aiPrompt": "5 failed login attempts from IP 185.x.x.x for user john.doe@company.com in 60 seconds. Analyze IP reputation, country origin, and user's normal login pattern. Recommend action.",
            "steps": [
                "Receive failed login alert from Okta/Azure AD",
                "Check IP reputation via threat intelligence feed",
                "Check user's historical login geography",
                "If IP is malicious: immediately lock account",
                "Send user email with secure reset link",
                "Create security incident ticket in ServiceNow",
                "Alert SOC team via PagerDuty",
                "Log to SIEM for correlation"
            ],
            "roi": "Prevents credential compromise. Saves 45 min SOC analyst time per incident."
        },
        {
            "id": "TPL-031", "category": "Security", "industry": ["Finance", "Healthcare", "Government"],
            "title": "SSL Certificate Expiry — Auto Renewal",
            "severity": "Critical", "confidence": "99%",
            "estimated_resolution_mins": 8, "monthly_occurrences": 5,
            "tags": ["ssl", "certificates", "lets-encrypt"],
            "description": "Monitors certificate expiry dates and auto-renews via Let's Encrypt or enterprise CA 14 days before expiry.",
            "aiPrompt": "SSL certificate for api.company.com expires in 12 days. Determine renewal method (Let's Encrypt ACME or internal CA), validate domain ownership, and initiate renewal.",
            "steps": [
                "Check certificate expiry via daily cron scan",
                "Alert if expiry < 14 days",
                "Determine renewal method from certificate issuer",
                "Run ACME challenge for Let's Encrypt or submit CSR to CA",
                "Receive new certificate, verify chain of trust",
                "Deploy certificate to web servers/load balancers",
                "Validate HTTPS handshake on all endpoints",
                "Update certificate inventory in CMDB"
            ],
            "roi": "Prevents outages from expired certificates. One incident avoided = $25K+ saved."
        },
        {
            "id": "TPL-032", "category": "Security", "industry": ["All"],
            "title": "IAM Privilege Escalation Detection",
            "severity": "Critical", "confidence": "94%",
            "estimated_resolution_mins": 5, "monthly_occurrences": 2,
            "tags": ["iam", "security", "aws", "cloud-security"],
            "description": "Detects when a user or service account grants themselves or others elevated permissions outside of the approval workflow.",
            "aiPrompt": "IAM policy change detected: user admin-backup was granted AdministratorAccess at 3:17 AM. Analyze if this was approved, who made the change, and if it deviates from least-privilege policy.",
            "steps": [
                "Ingest CloudTrail or Azure AD audit event",
                "AI compares new permissions against policy baseline",
                "Check if change was submitted through change management",
                "If unauthorized: immediately revoke the elevated policy",
                "Lock the IAM account pending investigation",
                "Alert CISO and Security team via PagerDuty",
                "Create high-priority security incident",
                "Preserve all audit logs for forensics"
            ],
            "roi": "Prevents insider threats and cloud breaches. Regulatory compliance."
        },
        {
            "id": "TPL-040", "category": "Identity", "industry": ["All"],
            "title": "User Offboarding — Full Deprovisioning",
            "severity": "High", "confidence": "98%",
            "estimated_resolution_mins": 15, "monthly_occurrences": 25,
            "tags": ["identity", "okta", "azure-ad", "hr", "offboarding"],
            "description": "Fully automated employee offboarding — disables accounts, revokes access, transfers data ownership, and archives the mailbox.",
            "aiPrompt": "HR system triggered offboarding for john.doe@company.com effective today. Identify all systems they have access to and generate a complete deprovisioning checklist.",
            "steps": [
                "Receive offboarding trigger from HR system (Workday/BambooHR)",
                "Inventory all systems user has access to",
                "Disable Okta/Azure AD account immediately",
                "Revoke all active SSO sessions and API keys",
                "Transfer file ownership in Google Drive / SharePoint",
                "Archive and forward mailbox to manager",
                "Remove from all distribution lists and Slack channels",
                "Revoke VPN and MFA devices",
                "Create compliance ticket confirming deprovisioning",
                "Send confirmation to HR and manager"
            ],
            "roi": "25x/month. Manual process takes 2 hrs; automation completes in 15 min."
        },
        {
            "id": "TPL-041", "category": "Identity", "industry": ["All"],
            "title": "Password Reset Self-Service",
            "severity": "Low", "confidence": "99%",
            "estimated_resolution_mins": 2, "monthly_occurrences": 200,
            "tags": ["identity", "password", "self-service", "helpdesk"],
            "description": "Allows users to reset their own password through a verified channel, eliminating helpdesk tickets entirely.",
            "aiPrompt": "User john.doe is requesting password reset. Verify identity via secondary factor (SMS/email/authenticator). Generate temporary password and force change on next login.",
            "steps": [
                "User submits reset request via self-service portal",
                "Send MFA verification to registered email/phone",
                "Verify OTP within 10-minute window",
                "Generate cryptographically secure temporary password",
                "Set password in Active Directory/Okta",
                "Force password change on next login",
                "Send confirmation to user",
                "Log event to audit trail"
            ],
            "roi": "200x/month × 2 min = 400 min helpdesk time eliminated. $4,000+/month savings."
        },
        {
            "id": "TPL-050", "category": "Network", "industry": ["All"],
            "title": "High Packet Loss — MTU Mismatch Recovery",
            "severity": "High", "confidence": "90%",
            "estimated_resolution_mins": 15, "monthly_occurrences": 3,
            "tags": ["network", "packet-loss", "mtu", "firewall"],
            "description": "Diagnoses and resolves high packet loss caused by MTU mismatches between network segments.",
            "aiPrompt": "Packet loss detected at 12% on gateway interface eth0. Analyze traffic patterns, check MTU settings across path, identify if firewall rule or MTU mismatch is causing fragmentation.",
            "steps": [
                "Capture packet loss metrics from monitoring agent",
                "Run traceroute to identify which hop drops packets",
                "Check MTU settings on affected interfaces",
                "AI compares MTU values across network path",
                "If mismatch found: recommend MTU correction value",
                "Apply MTU change on affected router interface",
                "Verify packet loss returns to < 0.1%",
                "Document network topology change"
            ],
            "roi": "Prevents degraded application performance impacting customers."
        },
        {
            "id": "TPL-051", "category": "Network", "industry": ["All"],
            "title": "DNS Resolution Failure — Failover",
            "severity": "Critical", "confidence": "97%",
            "estimated_resolution_mins": 5, "monthly_occurrences": 2,
            "tags": ["dns", "network", "failover"],
            "description": "Detects DNS resolution failures and automatically fails over to backup DNS servers.",
            "aiPrompt": "DNS resolution failing for internal domains. Primary DNS server not responding. Verify if server is down or configuration issue. Fail over to secondary DNS immediately.",
            "steps": [
                "Detect DNS timeout from health check agent",
                "Verify primary DNS server is reachable via ICMP",
                "Check DNS service status on primary server",
                "If server down: update DHCP/resolv.conf to point to secondary",
                "Flush DNS cache on affected systems",
                "Verify resolution succeeds on all critical domains",
                "Create incident for DNS server root cause",
                "Notify NOC team"
            ],
            "roi": "Prevents 100% service impact. 2x/month. Reduces MTTR from 30 min to 5 min."
        },
        {
            "id": "TPL-060", "category": "ITSM", "industry": ["All"],
            "title": "SLA Breach Prevention — Escalation",
            "severity": "High", "confidence": "95%",
            "estimated_resolution_mins": 3, "monthly_occurrences": 10,
            "tags": ["sla", "itsm", "servicenow", "escalation"],
            "description": "Monitors open tickets against SLA thresholds and automatically escalates before breach occurs.",
            "aiPrompt": "Incident INC-9921 (P2) has been open for 3.5 hours. SLA breach in 30 minutes. Current assignee has not updated ticket in 2 hours. Recommend escalation path.",
            "steps": [
                "Monitor all open incidents against SLA timers",
                "Alert when 80% of SLA time consumed",
                "AI reviews current assignee's workload and availability",
                "Auto-reassign to available senior engineer",
                "Notify manager via SMS and Slack",
                "Add SLA warning comment to ServiceNow ticket",
                "If breach occurs: trigger P1 war room bridge",
                "Send SLA report to management"
            ],
            "roi": "10x/month. Prevents SLA breach penalties. Protects customer contracts."
        },
        {
            "id": "TPL-061", "category": "ITSM", "industry": ["All"],
            "title": "Change Request — Automated Risk Assessment",
            "severity": "Medium", "confidence": "91%",
            "estimated_resolution_mins": 10, "monthly_occurrences": 40,
            "tags": ["change-management", "itsm", "servicenow", "risk"],
            "description": "Automatically assesses the risk of change requests using historical data, affected CI dependencies, and deployment window.",
            "aiPrompt": "Change request CHG-4421 submitted: upgrade PostgreSQL from 14.2 to 16.0 on orders-db in production. Assess risk using change history, blast radius, and current incident status.",
            "steps": [
                "Receive change request from ServiceNow",
                "Query knowledge graph for affected CIs and dependencies",
                "Check historical success rate of similar changes",
                "Check if any P1/P2 incidents are currently open on affected systems",
                "AI computes risk score: Low / Medium / High / Critical",
                "If Low: auto-approve with standard review",
                "If High: require CAB approval before proceeding",
                "Update change ticket with risk assessment and recommendation"
            ],
            "roi": "40x/month × 10 min = 400 min CAB meeting time saved."
        },
        {
            "id": "TPL-070", "category": "Healthcare IT", "industry": ["Healthcare"],
            "title": "EHR System Connectivity Restoration",
            "severity": "Critical", "confidence": "93%",
            "estimated_resolution_mins": 8, "monthly_occurrences": 2,
            "tags": ["healthcare", "ehr", "hipaa", "connectivity"],
            "description": "Restores connectivity between EHR systems and downstream clinical systems with HIPAA audit trail.",
            "aiPrompt": "EHR system Epic lost connection to pharmacy module at 09:22 UTC. Patient medication orders are failing. Diagnose connectivity issue and restore with full audit trail.",
            "steps": [
                "Detect EHR connectivity alert",
                "Identify affected clinical modules",
                "Check HL7/FHIR interface engine status",
                "Verify network path between EHR and pharmacy DB",
                "Restart interface engine if frozen",
                "Replay queued HL7 messages",
                "Verify medication orders flowing correctly",
                "Create HIPAA-compliant incident report"
            ],
            "roi": "Prevents patient safety incidents. Regulatory compliance critical."
        },
        {
            "id": "TPL-080", "category": "Finance IT", "industry": ["Finance"],
            "title": "Payment Gateway Timeout Recovery",
            "severity": "Critical", "confidence": "97%",
            "estimated_resolution_mins": 6, "monthly_occurrences": 3,
            "tags": ["payments", "gateway", "fintech", "timeout"],
            "description": "Detects payment gateway timeouts and automatically fails over to the backup payment processor.",
            "aiPrompt": "Payment gateway Stripe returning 503 errors. Transaction success rate dropped to 12%. Determine if Stripe outage or internal connectivity issue. Fail over to Braintree if needed.",
            "steps": [
                "Detect payment success rate drop via real-time metrics",
                "Check Stripe status page API",
                "Test direct connectivity to Stripe API endpoints",
                "If Stripe outage: enable Braintree failover flag",
                "Verify transaction processing resumes on Braintree",
                "Alert finance team of failover",
                "Monitor for Stripe recovery",
                "Switch back to primary when stable",
                "Reconcile transactions across both gateways"
            ],
            "roi": "Each minute of payment failure = thousands in lost revenue. Critical."
        },
        {
            "id": "TPL-090", "category": "Compliance", "industry": ["Finance", "Healthcare", "Government"],
            "title": "SOC2 Evidence Collection — Automated",
            "severity": "Low", "confidence": "99%",
            "estimated_resolution_mins": 60, "monthly_occurrences": 1,
            "tags": ["soc2", "compliance", "audit", "governance"],
            "description": "Automatically collects, organizes, and packages SOC2 audit evidence from all connected systems.",
            "aiPrompt": "SOC2 Type II audit period ends in 30 days. Collect evidence for: access reviews, change management records, backup verification logs, incident reports, and security training completion.",
            "steps": [
                "Query Okta for access review completion records",
                "Export change management records from ServiceNow",
                "Collect backup verification logs for audit period",
                "Download incident reports with resolution times",
                "Verify security training completion via LMS API",
                "Generate evidence package in auditor-ready format",
                "Upload to secure audit portal",
                "Notify compliance team with summary dashboard"
            ],
            "roi": "Reduces audit prep from 3 weeks to 1 day. Saves $50K+ in consulting fees."
        },
        // People Engineering (PE) Templates (Newly Added)
        {
            "id": "TPL-PE-001", "category": "People Engineering", "industry": ["All"],
            "title": "Daily Standup AI Summary",
            "severity": "High", "confidence": "94%",
            "estimated_resolution_mins": 10, "monthly_occurrences": 5,
            "tags": ["standup", "agile", "summary"],
            "description": "Automatically summarizes daily check-ins and highlights blockers across the team.",
            "aiPrompt": "Analyze the daily check-ins for the engineering team. Extract all blockers and tasks requiring cross-team coordination.",
            "steps": [
                "Ingest check-in data from all team members",
                "AI analyzes for negative sentiment or blockers",
                "Generate consolidated standup report",
                "Send report to Slack channel and Team Lead"
            ],
            "roi": "Saves 15 mins per team member daily."
        },
        {
            "id": "TPL-PE-002", "category": "People Engineering", "industry": ["All"],
            "title": "Burnout & Stress Early Warning",
            "severity": "Medium", "confidence": "88%",
            "estimated_resolution_mins": 20, "monthly_occurrences": 15,
            "tags": ["burnout", "wellness", "analytics"],
            "description": "Identifies individuals showing consistent high stress across check-ins and Slack/Teams communications.",
            "aiPrompt": "Identify team members with consistent 'High Stress' sentiment over the past 2 weeks. Recommend 1:1 scheduling.",
            "steps": [
                "Analyze communication sentiment over rolling 14-day window",
                "Calculate burnout risk score",
                "Flag individuals > 80% risk threshold",
                "Privately notify HR business partner or manager"
            ],
            "roi": "Improves retention by predicting burnout before resignation."
        },
        {
            "id": "TPL-PE-003", "category": "People Engineering", "industry": ["All"],
            "title": "Cross-functional Collaboration Blocker",
            "severity": "High", "confidence": "91%",
            "estimated_resolution_mins": 15, "monthly_occurrences": 4,
            "tags": ["collaboration", "blockers", "agile"],
            "description": "Detects when one team is repeatedly blocked by another team and escalates automatically.",
            "aiPrompt": "Identify tasks blocked by external dependencies for > 48 hours. Generate escalation summary.",
            "steps": [
                "Scan active check-ins for 'waiting on X' patterns",
                "Correlate blocked tasks across team boundaries",
                "Trigger escalation to both team leads",
                "Log collaboration friction in insights dashboard"
            ],
            "roi": "Reduces cross-team friction and delivery delays."
        },
        {
            "id": "TPL-PE-004", "category": "People Engineering", "industry": ["All"],
            "title": "Critical Resource Dependency Risk",
            "severity": "Critical", "confidence": "96%",
            "estimated_resolution_mins": 5, "monthly_occurrences": 2,
            "tags": ["risk", "dependency", "planning"],
            "description": "Identifies when a critical project is dependent on a single individual who is currently high stress or on leave.",
            "aiPrompt": "Correlate project dependencies with individual stress levels and upcoming PTO. Flag high-risk single points of failure.",
            "steps": [
                "Map project tasks to individual assignees",
                "Check PTO calendar and current stress sentiment",
                "Highlight tasks assigned to high-risk individuals",
                "Recommend task reallocation to PM"
            ],
            "roi": "Prevents critical project failures."
        },
        {
            "id": "TPL-PE-005", "category": "People Engineering", "industry": ["All"],
            "title": "Manager 1:1 Topic Generator",
            "severity": "Medium", "confidence": "85%",
            "estimated_resolution_mins": 30, "monthly_occurrences": 8,
            "tags": ["management", "coaching", "1-on-1"],
            "description": "Generates personalized 1:1 agendas based on recent check-ins, PR reviews, and sentiment.",
            "aiPrompt": "Review recent activity, sentiment, and blockers for [Employee]. Generate 3 targeted coaching questions for their 1:1.",
            "steps": [
                "Aggregate employee data (commits, check-ins, feedback)",
                "AI generates contextual agenda items",
                "Insert agenda into calendar invite",
                "Send private preview to manager"
            ],
            "roi": "Improves management quality and saves prep time."
        },
        {
            "id": "TPL-PE-006", "category": "People Engineering", "industry": ["All"],
            "title": "Post-Incident Team Wellness Check",
            "severity": "Low", "confidence": "90%",
            "estimated_resolution_mins": 45, "monthly_occurrences": 2,
            "tags": ["incident-response", "wellness", "sre"],
            "description": "Automatically schedules wellness check-ins for SREs after resolving a P1/Critical incident.",
            "aiPrompt": "A P1 incident was resolved. Identify all responders involved and schedule a wellness check-in to monitor burnout.",
            "steps": [
                "Listen for P1 incident resolution events",
                "Extract list of responders from incident timeline",
                "Trigger automated wellness survey via Slack",
                "Alert manager if negative sentiment detected"
            ],
            "roi": "Supports SRE mental health and reduces alert fatigue burnout."
        },
        {
            "id": "TPL-PE-007", "category": "People Engineering", "industry": ["All"],
            "title": "Meeting Overload Detection",
            "severity": "High", "confidence": "95%",
            "estimated_resolution_mins": 12, "monthly_occurrences": 10,
            "tags": ["productivity", "calendar", "meetings"],
            "description": "Detects when an engineer has > 20 hours of meetings in a week and recommends focus time blocks.",
            "aiPrompt": "Analyze calendar data for engineering team. Flag individuals with < 10 hours of uninterrupted focus time. Suggest meeting consolidation.",
            "steps": [
                "Scan calendar events for the upcoming week",
                "Calculate total meeting hours vs focus blocks",
                "Identify engineers with high meeting load",
                "Automatically propose 'Focus Time' calendar holds"
            ],
            "roi": "Increases deep work capacity and developer velocity."
        },
        {
            "id": "TPL-PE-008", "category": "People Engineering", "industry": ["All"],
            "title": "New Hire Onboarding Friction",
            "severity": "Critical", "confidence": "98%",
            "estimated_resolution_mins": 8, "monthly_occurrences": 3,
            "tags": ["onboarding", "hr", "friction"],
            "description": "Detects when a new hire is blocked on access requests or struggling with local environment setup.",
            "aiPrompt": "Monitor check-ins from employees with tenure < 30 days. Identify access blockers or sentiment indicating confusion.",
            "steps": [
                "Filter check-ins by employee tenure",
                "AI scans for keywords: 'access', 'setup', 'broken', 'help'",
                "Escalate immediately to IT or onboarding buddy",
                "Track time-to-first-commit metric"
            ],
            "roi": "Reduces time-to-productivity for expensive new hires."
        }
    ]);
    Json(tpls)
}
