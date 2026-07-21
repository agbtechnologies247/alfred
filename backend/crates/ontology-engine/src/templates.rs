use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedEventTemplate {
    pub event_type: String,
    pub category: String,
    pub object_type: String,
    pub object_id: String,
    pub actor: String,
    pub team: Option<String>,
    pub environment: String,
    pub severity: String,
    pub status: String,
    pub before_state: Value,
    pub after_state: Value,
    pub linked_records: Value,
    pub ai_analysis: Value,
    pub audit_metadata: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyTemplateCategory {
    pub id: String,
    pub name: String,
    pub description: String,
    pub schema_desc: String,
    pub example_events: Vec<UnifiedEventTemplate>,
}

pub fn get_all_templates() -> Vec<OntologyTemplateCategory> {
    vec![
        // 1. Core Infrastructure Objects
        OntologyTemplateCategory {
            id: "core_infrastructure_objects".into(),
            name: "Core Infrastructure Objects".into(),
            description: "System registration, configuration changes, and structural properties"
                .into(),
            schema_desc:
                "Tracks configurations, environment metadata, technology stacks, owners, and URLs"
                    .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "system_registered".into(),
                category: "infrastructure".into(),
                object_type: "system".into(),
                object_id: "sys-billing-api".into(),
                actor: "terraform_operator".into(),
                team: Some("DevOps".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "exists": false }),
                after_state: json!({
                    "system_id": "sys-billing-api",
                    "display_name": "Billing API Core",
                    "description": "Processes payment transactions",
                    "owners": { "app_owner": "Alice Brown", "business_owner": "Bob Vance" },
                    "criticality": "high",
                    "technology_stack": { "os": "Linux Ubuntu 22.04", "cpu_cores": 16, "memory_gb": 64 },
                    "network": { "private_ip": "10.0.4.12", "public_ip": "54.210.43.1", "dns": "billing.corp.internal" },
                    "sla_target_pct": 99.99
                }),
                linked_records: json!({ "change_id": "RFC-2104" }),
                ai_analysis: json!({ "summary": "System registered with compliance tags", "anomaly_score": 0.0, "confidence": 1.0 }),
                audit_metadata: json!({ "ip": "192.168.1.100", "correlation_id": "corr-reg-11" }),
            }],
        },
        // 2. User Activities
        OntologyTemplateCategory {
            id: "user_activities".into(),
            name: "User Activities".into(),
            description:
                "Interactive logins, dashboard activities, administrative actions, and updates"
                    .into(),
            schema_desc: "Tracks user audit traces, sessions, and security constraints".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "user_login".into(),
                category: "security".into(),
                object_type: "user".into(),
                object_id: "usr-admin-1".into(),
                actor: "user_session".into(),
                team: Some("ITSM".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "active_sessions": 0 }),
                after_state: json!({
                    "login_method": "saml_okta",
                    "mfa_success": true,
                    "session_expires_at": "2026-07-20T23:59:59Z"
                }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Login conforms to normal working hours", "anomaly_score": 0.02, "confidence": 0.98 }),
                audit_metadata: json!({ "ip": "198.51.100.45", "browser": "Chrome 122", "geo": "US-New York" }),
            }],
        },
        // 3. User Behavior Analytics
        OntologyTemplateCategory {
            id: "user_behavior_analytics".into(),
            name: "User Behavior Analytics".into(),
            description: "Anomaly calculations, abnormal login times, and transaction spikes"
                .into(),
            schema_desc: "Stores anomaly scores, trust ratings, and confidence bounds".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "behavior_anomaly_detected".into(),
                category: "security".into(),
                object_type: "user".into(),
                object_id: "usr-dev-9".into(),
                actor: "anomaly_engine".into(),
                team: Some("Security".into()),
                environment: "Production".into(),
                severity: "high".into(),
                status: "completed".into(),
                before_state: json!({ "daily_api_calls_baseline": 45 }),
                after_state: json!({
                    "api_calls_in_2min": 350,
                    "abnormal_time": true,
                    "accessed_records": 500
                }),
                linked_records: json!({ "incident_id": "INC-8802" }),
                ai_analysis: json!({
                    "risk_score": 0.89,
                    "trust_score": 0.12,
                    "anomaly_score": 0.92,
                    "confidence_score": 0.97,
                    "summary": "Sudden bulk export of customer accounts at midnight"
                }),
                audit_metadata: json!({ "ip": "203.0.113.88", "geo": "unknown" }),
            }],
        },
        // 4. Action Trail
        OntologyTemplateCategory {
            id: "action_trail".into(),
            name: "Action Trail".into(),
            description: "Step-by-step histories of critical operations (e.g. server deletion)"
                .into(),
            schema_desc:
                "Links actions with user request parameters, approvals, changes, and reasons".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "server_deleted".into(),
                category: "infrastructure".into(),
                object_type: "system".into(),
                object_id: "sys-dev-sandbox".into(),
                actor: "user_admin".into(),
                team: Some("DevOps".into()),
                environment: "Development".into(),
                severity: "medium".into(),
                status: "completed".into(),
                before_state: json!({ "status": "online", "vm_id": "i-098abc" }),
                after_state: json!({ "status": "terminated" }),
                linked_records: json!({ "change_id": "CHG-903", "incident_id": "INC-772" }),
                ai_analysis: json!({ "summary": "Terminated dev server to recover sandbox budget limits", "rollback_available": true }),
                audit_metadata: json!({ "reason": "Monthly cleanup", "approval": "auto-approved", "ip": "10.0.1.20" }),
            }],
        },
        // 5. DevOps Activities
        OntologyTemplateCategory {
            id: "devops_activities".into(),
            name: "DevOps Activities".into(),
            description: "Git changes, continuous integration builds, and deployment statuses"
                .into(),
            schema_desc: "Tracks commits, branches, container actions, and clusters".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "pipeline_build_failed".into(),
                category: "devops".into(),
                object_type: "pipeline".into(),
                object_id: "pipe-backend-deploy".into(),
                actor: "jenkins_runner".into(),
                team: Some("DevOps".into()),
                environment: "QA".into(),
                severity: "medium".into(),
                status: "failed".into(),
                before_state: json!({ "build_number": 432, "status": "building" }),
                after_state: json!({
                    "exit_code": 1,
                    "failed_tests": ["test_auth_handshake", "test_database_pool_leak"]
                }),
                linked_records: json!({ "commit_hash": "a4d87cf" }),
                ai_analysis: json!({ "summary": "Build broke due to unit test validation errors in auth layer", "anomaly_score": 0.0 }),
                audit_metadata: json!({ "cicd_provider": "GitHub Actions", "job_id": "job-8722" }),
            }],
        },
        // 6. Cloud Activities
        OntologyTemplateCategory {
            id: "cloud_activities".into(),
            name: "Cloud Activities".into(),
            description: "Hyperscaler adjustments (AWS/Azure/GCP) and billing spikes".into(),
            schema_desc: "Tracks cloud operations, lambdas, S3, IAM, and quota violations".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "cloud_cost_spike".into(),
                category: "finops".into(),
                object_type: "cloud_provider".into(),
                object_id: "aws-billing-us-east".into(),
                actor: "billing_monitor".into(),
                team: Some("DevOps".into()),
                environment: "Production".into(),
                severity: "high".into(),
                status: "completed".into(),
                before_state: json!({ "daily_spend_limit_usd": 500.0 }),
                after_state: json!({ "actual_daily_spend_usd": 1820.0, "spike_source": "NAT Gateway bandwidth egress" }),
                linked_records: json!({ "alert_id": "alert-fin-99" }),
                ai_analysis: json!({ "summary": "Unusual egress traffic volume causing cost spikes", "confidence": 0.94 }),
                audit_metadata: json!({ "cloud_region": "us-east-1" }),
            }],
        },
        // 7. Monitoring Activities
        OntologyTemplateCategory {
            id: "monitoring_activities".into(),
            name: "Monitoring Activities".into(),
            description: "Spikes in CPU/Memory usage, disk full notifications, and SSL outages"
                .into(),
            schema_desc: "Exposes system diagnostic limits, alerts, and heartbeat status".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "filesystem_growth_warning".into(),
                category: "monitoring".into(),
                object_type: "system".into(),
                object_id: "sys-postgres-primary".into(),
                actor: "datadog_connector".into(),
                team: Some("L1".into()),
                environment: "Production".into(),
                severity: "high".into(),
                status: "running".into(),
                before_state: json!({ "disk_used_pct": 74.5 }),
                after_state: json!({ "disk_used_pct": 92.1, "available_gb": 15 }),
                linked_records: json!({ "incident_id": "INC-0922" }),
                ai_analysis: json!({ "summary": "Rapid filesystem growth due to Postgres transaction log accumulation", "anomaly_score": 0.65 }),
                audit_metadata: json!({ "collector": "node_exporter" }),
            }],
        },
        // 8. AI Agent Activities
        OntologyTemplateCategory {
            id: "ai_agent_activities".into(),
            name: "AI Agent Activities".into(),
            description: "Actions and workflow runs triggered by AI execution instances".into(),
            schema_desc: "Tracks execution status, retrieved information, and model decisions"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "sop_executed".into(),
                category: "automation".into(),
                object_type: "ai_agent".into(),
                object_id: "agent-aws-cloud".into(),
                actor: "alfred_agent_engine".into(),
                team: Some("DevOps".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "target_health": "degraded" }),
                after_state: json!({ "target_health": "nominal", "action_taken": "restart_ecs_service" }),
                linked_records: json!({ "workflow_id": "wf-ecs-reboot", "sop_id": "sop-ecs-remedy" }),
                ai_analysis: json!({
                    "summary": "AI Agent resolved health check failure automatically by scaling ECS task size",
                    "confidence": 0.95,
                    "decision_approved": true
                }),
                audit_metadata: json!({ "agent_model": "claude-3.5-sonnet" }),
            }],
        },
        // 9. L1 Team Activities
        OntologyTemplateCategory {
            id: "l1_team_activities".into(),
            name: "L1 Team Activities".into(),
            description: "Initial alert acknowledgements, triage routing, and basic operations"
                .into(),
            schema_desc: "Stores ticket ownership, notes, and SOP trigger requests".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "alert_acknowledged".into(),
                category: "itsm".into(),
                object_type: "incident".into(),
                object_id: "INC-8812".into(),
                actor: "l1_operator_john".into(),
                team: Some("L1".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "status": "unassigned" }),
                after_state: json!({ "status": "assigned_to_l1", "assignee": "John Doe" }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Operator acknowledged ticket and executed service verify check", "confidence": 1.0 }),
                audit_metadata: json!({ "session_id": "sess-l1-002" }),
            }],
        },
        // 10. L2 Activities
        OntologyTemplateCategory {
            id: "l2_activities".into(),
            name: "L2 Activities".into(),
            description: "Deeper investigation logs, configuration reviews, and hotfixes".into(),
            schema_desc: "Tracks manual dependency evaluations and patch rollouts".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "patch_applied".into(),
                category: "infrastructure".into(),
                object_type: "system".into(),
                object_id: "sys-api-gateway".into(),
                actor: "l2_engineer_sarah".into(),
                team: Some("L2".into()),
                environment: "Production".into(),
                severity: "medium".into(),
                status: "completed".into(),
                before_state: json!({ "patch_version": "1.4.3" }),
                after_state: json!({ "patch_version": "1.4.4", "hotfix_applied": true }),
                linked_records: json!({ "change_id": "CHG-1022", "knowledge_article_id": "KB-882" }),
                ai_analysis: json!({ "summary": "Applied security advisory log-parser patch to prevent resource exhaustion", "confidence": 1.0 }),
                audit_metadata: json!({ "approval_method": "manual" }),
            }],
        },
        // 11. L3 Activities
        OntologyTemplateCategory {
            id: "l3_activities".into(),
            name: "L3 Activities".into(),
            description: "Redesigns, code fixes, database indexing, and problem resolution".into(),
            schema_desc: "Identifies permanent resolution adjustments and architecture reviews"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "database_optimized".into(),
                category: "database".into(),
                object_type: "system".into(),
                object_id: "sys-postgres-primary".into(),
                actor: "l3_architect_dave".into(),
                team: Some("L3".into()),
                environment: "Production".into(),
                severity: "medium".into(),
                status: "completed".into(),
                before_state: json!({ "queries_slower_than_2s": 140 }),
                after_state: json!({ "queries_slower_than_2s": 0, "indexes_created": ["idx_payments_user_id"] }),
                linked_records: json!({ "problem_id": "PRB-290" }),
                ai_analysis: json!({ "summary": "Redesigned indexing strategy for payment ledger following recurring locking incidents", "confidence": 1.0 }),
                audit_metadata: json!({}),
            }],
        },
        // 12. Incident Activities
        OntologyTemplateCategory {
            id: "incident_activities".into(),
            name: "Incident Activities".into(),
            description: "Incident lifecycle events (create, assign, RCA start, resolve)".into(),
            schema_desc: "Tracks ticket numbers, priority shifts, and vendor mappings".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "incident_resolved".into(),
                category: "itsm".into(),
                object_type: "incident".into(),
                object_id: "INC-8812".into(),
                actor: "workflow_engine".into(),
                team: Some("L1".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "status": "active" }),
                after_state: json!({ "status": "resolved", "resolution_notes": "Redis cache cleared" }),
                linked_records: json!({ "problem_id": "PRB-220", "sop_id": "sop-redis-flush" }),
                ai_analysis: json!({ "summary": "Cleared cluster cache node resolved latency bottleneck", "anomaly_score": 0.0 }),
                audit_metadata: json!({ "resolution_duration_mins": 14 }),
            }],
        },
        // 13. Problem Management
        OntologyTemplateCategory {
            id: "problem_management".into(),
            name: "Problem Management".into(),
            description: "Investigating errors, tracking trends, and developing permanent fixes"
                .into(),
            schema_desc: "Exposes root causes, error reports, and links to automation work".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "known_error_documented".into(),
                category: "itsm".into(),
                object_type: "problem".into(),
                object_id: "PRB-0082".into(),
                actor: "l3_engineer".into(),
                team: Some("L3".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "status": "investigating" }),
                after_state: json!({
                    "status": "known_error",
                    "root_cause": "AWS NAT Gateway pool exhaustion under heavy traffic spikes",
                    "workaround": "Set client HTTP keep-alive timeout to 30s max"
                }),
                linked_records: json!({ "incidents": ["INC-443", "INC-551"] }),
                ai_analysis: json!({ "summary": "Identified recurrence of connection pool timeout errors" }),
                audit_metadata: json!({}),
            }],
        },
        // 14. Change Management
        OntologyTemplateCategory {
            id: "change_management".into(),
            name: "Change Management".into(),
            description: "Requests for change (RFCs), approvals, reviews, and validation".into(),
            schema_desc: "Tracks approval authority, CAB audits, change types, and window bounds"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "rfc_approved".into(),
                category: "itsm".into(),
                object_type: "change".into(),
                object_id: "CHG-9981".into(),
                actor: "cab_board".into(),
                team: Some("L3".into()),
                environment: "Production".into(),
                severity: "medium".into(),
                status: "completed".into(),
                before_state: json!({ "status": "requested" }),
                after_state: json!({
                    "status": "approved",
                    "change_type": "Normal",
                    "scheduled_start": "2026-07-25T02:00:00Z",
                    "maintenance_window": "Saturday 02:00-04:00 UTC"
                }),
                linked_records: json!({ "change_id": "CHG-9981" }),
                ai_analysis: json!({ "summary": "CAB reviewed and approved planned schema modification", "confidence": 1.0 }),
                audit_metadata: json!({ "approval_signoff": "CAB-2026-07" }),
            }],
        },
        // 15. Release Management
        OntologyTemplateCategory {
            id: "release_management".into(),
            name: "Release Management".into(),
            description: "Release rollouts, feature flags adjustments, and validation checks"
                .into(),
            schema_desc: "Tracks QA/UAT status, rollbacks, and active feature flag tags".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "production_release_completed".into(),
                category: "devops".into(),
                object_type: "release".into(),
                object_id: "rel-v2-4-0".into(),
                actor: "deployment_pipeline".into(),
                team: Some("DevOps".into()),
                environment: "Production".into(),
                severity: "medium".into(),
                status: "completed".into(),
                before_state: json!({ "active_release": "v2.3.9" }),
                after_state: json!({
                    "active_release": "v2.4.0",
                    "qa_passed": true,
                    "uat_passed": true,
                    "feature_flags": { "enable_payments_v2": true }
                }),
                linked_records: json!({ "change_id": "CHG-9022" }),
                ai_analysis: json!({ "summary": "Production release completed and verified via synthetic checks", "confidence": 1.0 }),
                audit_metadata: json!({}),
            }],
        },
        // 16. RFP Activities
        OntologyTemplateCategory {
            id: "rfp_activities".into(),
            name: "RFP Activities".into(),
            description:
                "Requests for Proposal (RFPs), evaluations, compliance checks, and contracts".into(),
            schema_desc: "Stores RFP requirements, cost analysis tables, scoring values, and signs"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "rfp_evaluated".into(),
                category: "business".into(),
                object_type: "rfp".into(),
                object_id: "rfp-cloud-security-2026".into(),
                actor: "vendor_review_committee".into(),
                team: Some("L3".into()),
                environment: "QA".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "status": "draft" }),
                after_state: json!({
                    "status": "evaluated",
                    "vendor_scores": { "vendor_a": 92.5, "vendor_b": 84.0 },
                    "compliance_passed": true,
                    "cost_analysis_usd": 125000.0
                }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Vendor evaluation completed with secure score compliance checks", "confidence": 0.88 }),
                audit_metadata: json!({}),
            }],
        },
        // 17. Certificate Management
        OntologyTemplateCategory {
            id: "certificate_management".into(),
            name: "Certificate Management".into(),
            description: "SSL/TLS additions, expiration schedules, and renewals".into(),
            schema_desc:
                "Tracks domains, days to expiration (30/15/7), CSR logs, and verification state"
                    .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "certificate_expiration_alert".into(),
                category: "security".into(),
                object_type: "certificate".into(),
                object_id: "cert-corp-wildcard".into(),
                actor: "cert_tracker".into(),
                team: Some("Security".into()),
                environment: "Production".into(),
                severity: "high".into(),
                status: "running".into(),
                before_state: json!({ "days_left": 45 }),
                after_state: json!({
                    "days_left": 15,
                    "domain": "*.corp.internal",
                    "ssl_issuer": "DigiCert Wildcard G2"
                }),
                linked_records: json!({ "incident_id": "INC-9912" }),
                ai_analysis: json!({ "summary": "SSL Certificate will expire in 15 days, auto-renewal playbook has been triggered", "confidence": 1.0 }),
                audit_metadata: json!({}),
            }],
        },
        // 18. Access Management
        OntologyTemplateCategory {
            id: "access_management".into(),
            name: "Access Management".into(),
            description: "IAM roles, requests, approvals, dormancy audits, and token revocations"
                .into(),
            schema_desc: "Tracks identity permission configurations and recertifications".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "privileged_access_approved".into(),
                category: "security".into(),
                object_type: "user".into(),
                object_id: "usr-dev-2".into(),
                actor: "iam_admin".into(),
                team: Some("Security".into()),
                environment: "Production".into(),
                severity: "medium".into(),
                status: "completed".into(),
                before_state: json!({ "role": "developer" }),
                after_state: json!({
                    "role": "developer_admin_elevated",
                    "duration_hours": 4,
                    "reason": "Emergency production database connection optimization"
                }),
                linked_records: json!({ "incident_id": "INC-0091", "change_id": "CHG-998" }),
                ai_analysis: json!({ "summary": "Temporary privilege escalation granted under active change ticket scope", "confidence": 1.0 }),
                audit_metadata: json!({ "ip": "10.4.4.120" }),
            }],
        },
        // 19. Compliance Activities
        OntologyTemplateCategory {
            id: "compliance_activities".into(),
            name: "Compliance Activities".into(),
            description: "Audits (ISO/SOC/PCI/HIPAA), evidence collections, and risk acceptances"
                .into(),
            schema_desc: "Registers target frameworks, policy definitions, and exception approvals"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "compliance_evidence_uploaded".into(),
                category: "compliance".into(),
                object_type: "system".into(),
                object_id: "sys-billing-api".into(),
                actor: "compliance_bot".into(),
                team: Some("Security".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "audit_framework": "SOC2_Type_II", "evidence_count": 4 }),
                after_state: json!({
                    "audit_framework": "SOC2_Type_II",
                    "evidence_type": "access_revocation_log",
                    "compliance_status": "compliant"
                }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Evidence package uploaded and verified via compliance checker rules", "confidence": 0.99 }),
                audit_metadata: json!({}),
            }],
        },
        // 20. Downtime Management
        OntologyTemplateCategory {
            id: "downtime_management".into(),
            name: "Downtime Management".into(),
            description:
                "Downtimes (planned/emergency), REST outages, restoral steps, and SLA logs".into(),
            schema_desc:
                "Tracks business impacts, customers notified, downtime minutes, and breaches".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "sla_breach_outage".into(),
                category: "business".into(),
                object_type: "system".into(),
                object_id: "sys-checkout-gateway".into(),
                actor: "availability_tracker".into(),
                team: Some("L2".into()),
                environment: "Production".into(),
                severity: "critical".into(),
                status: "failed".into(),
                before_state: json!({ "health": "online" }),
                after_state: json!({
                    "health": "offline",
                    "unexpected_outage": true,
                    "downtime_minutes": 25.0,
                    "sla_breach": true,
                    "estimated_affected_customers": 1400
                }),
                linked_records: json!({ "incident_id": "INC-2201" }),
                ai_analysis: json!({ "summary": "Payment gateway outage breached checkout availability target SLA limit", "anomaly_score": 0.99 }),
                audit_metadata: json!({}),
            }],
        },
        // 21. Notification Activities
        OntologyTemplateCategory {
            id: "notification_activities".into(),
            name: "Notification Activities".into(),
            description: "Auditing dispatch channels (Slack, Teams, PagerDuty, SMS, webhooks)"
                .into(),
            schema_desc: "Saves notification types, targets, send metrics, and retry counts".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "slack_notification_sent".into(),
                category: "monitoring".into(),
                object_type: "system".into(),
                object_id: "sys-api-gateway".into(),
                actor: "alert_engine".into(),
                team: Some("L1".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "slack_channel": "#prod-alerts", "retry_count": 0 }),
                after_state: json!({
                    "slack_channel": "#prod-alerts",
                    "status": "delivered",
                    "dispatch_latency_ms": 42
                }),
                linked_records: json!({ "incident_id": "INC-0922" }),
                ai_analysis: json!({ "summary": "Slack incident notify alert delivered to on-call engineers", "confidence": 1.0 }),
                audit_metadata: json!({}),
            }],
        },
        // 22. AI Hold / Pause Activities
        OntologyTemplateCategory {
            id: "ai_hold_pause_activities".into(),
            name: "AI Hold / Pause Activities".into(),
            description: "Agent holds, freeze windows, compliance controls, and manual resumptions"
                .into(),
            schema_desc: "Tracks execution constraints, freeze window limits, and manual overrides"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "agent_execution_paused".into(),
                category: "automation".into(),
                object_type: "ai_agent".into(),
                object_id: "agent-aws-cloud".into(),
                actor: "governance_engine".into(),
                team: Some("L2".into()),
                environment: "Production".into(),
                severity: "medium".into(),
                status: "running".into(),
                before_state: json!({ "workflow_status": "executing" }),
                after_state: json!({
                    "workflow_status": "paused_on_hold",
                    "hold_reason": "active_deployment_freeze_window",
                    "auto_resume_at": "2026-07-20T18:00:00Z"
                }),
                linked_records: json!({ "workflow_id": "wf-ecs-reboot" }),
                ai_analysis: json!({ "summary": "Governance layer halted remediation run due to active system change lock window", "confidence": 0.99 }),
                audit_metadata: json!({}),
            }],
        },
        // 23. Knowledge Base Activities
        OntologyTemplateCategory {
            id: "knowledge_base_activities".into(),
            name: "Knowledge Base Activities".into(),
            description: "Creating SOP articles, updates, reviews, and AI feedback learnings"
                .into(),
            schema_desc: "Registers content edits, confidence adjustments, and feedback scores"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "sop_article_created".into(),
                category: "itsm".into(),
                object_type: "knowledge_article".into(),
                object_id: "sop-dns-recovery".into(),
                actor: "knowledge_engine".into(),
                team: Some("L2".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "exists": false }),
                after_state: json!({
                    "title": "DNS Recovery Playbook",
                    "version": 1,
                    "sop_generated": true,
                    "ai_learned": true
                }),
                linked_records: json!({ "created_from_incident_id": "INC-0992" }),
                ai_analysis: json!({ "summary": "Extracted SOP steps from incident logs and stored new playbook version", "confidence": 0.96 }),
                audit_metadata: json!({}),
            }],
        },
        // 24. Decision Engineering Activities
        OntologyTemplateCategory {
            id: "decision_engineering_activities".into(),
            name: "Decision Engineering Activities".into(),
            description: "Decision logs, human overrides, cost comparisons, and outcomes".into(),
            schema_desc: "Tracks AI recommendations, human choices, cost values, and risk analysis"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "decision_evaluated".into(),
                category: "automation".into(),
                object_type: "decision".into(),
                object_id: "dec-db-failover".into(),
                actor: "decision_engine".into(),
                team: Some("L3".into()),
                environment: "Production".into(),
                severity: "high".into(),
                status: "completed".into(),
                before_state: json!({ "decision_status": "pending_evaluation" }),
                after_state: json!({
                    "decision_status": "approved_by_human",
                    "ai_recommendation": "FAILOVER",
                    "cost_savings_usd": 15000.0,
                    "risk_score": 0.72
                }),
                linked_records: json!({ "incident_id": "INC-0922" }),
                ai_analysis: json!({ "summary": "Human operator approved failover alternative to mitigate database locks", "confidence": 0.91 }),
                audit_metadata: json!({ "approved_by": "user-admin-1" }),
            }],
        },
        // 25. Asset Lifecycle Activities
        OntologyTemplateCategory {
            id: "asset_lifecycle_activities".into(),
            name: "Asset Lifecycle Activities".into(),
            description: "Asset updates, lifecycle registers, patches, and warranty alerts".into(),
            schema_desc: "Stores asset properties, discovery dates, and decommission codes".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "asset_decommissioned".into(),
                category: "infrastructure".into(),
                object_type: "system".into(),
                object_id: "sys-legacy-db".into(),
                actor: "lifecycle_operator".into(),
                team: Some("DevOps".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "lifecycle_state": "active" }),
                after_state: json!({
                    "lifecycle_state": "retired",
                    "data_disposed": true,
                    "reason": "Eol server hardware replacement"
                }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Asset successfully decommissioned following compliance signoff", "confidence": 1.0 }),
                audit_metadata: json!({}),
            }],
        },
        // 26. Security Activities
        OntologyTemplateCategory {
            id: "security_activities".into(),
            name: "Security Activities".into(),
            description: "Threat matches, suspicious ports, IOCs, and zero-trust checks".into(),
            schema_desc: "Tracks security findings, vulnerability records, and malware checks"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "security_threat_detected".into(),
                category: "security".into(),
                object_type: "security_finding".into(),
                object_id: "sc-find-102".into(),
                actor: "crowdstrike_connector".into(),
                team: Some("Security".into()),
                environment: "Production".into(),
                severity: "critical".into(),
                status: "completed".into(),
                before_state: json!({ "threat_status": "none" }),
                after_state: json!({
                    "threat_status": "mitigated",
                    "threat_type": "Suspicious Port Activity",
                    "vulnerability_cve": "CVE-2024-9981",
                    "port_closed": true
                }),
                linked_records: json!({ "incident_id": "INC-9912" }),
                ai_analysis: json!({ "summary": "Detected and isolated suspicious connection attempt on port 8089", "anomaly_score": 0.98 }),
                audit_metadata: json!({ "ioc_matched": "suspicious_ip_subnet" }),
            }],
        },
        // 27. Financial / FinOps Activities
        OntologyTemplateCategory {
            id: "financial_finops_activities".into(),
            name: "Financial / FinOps Activities".into(),
            description: "Reserved instances updates, sizing limits, and unused items".into(),
            schema_desc: "Logs optimization recommendations, license budgets, and chargebacks"
                .into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "rightsizing_recommendation".into(),
                category: "finops".into(),
                object_type: "cloud_resource".into(),
                object_id: "sys-payments-node-3".into(),
                actor: "finops_agent".into(),
                team: Some("DevOps".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "vm_instance_size": "c6g.4xlarge" }),
                after_state: json!({
                    "recommended_instance_size": "c6g.2xlarge",
                    "estimated_monthly_savings_usd": 180.0,
                    "utilization_avg_cpu_pct": 14.5
                }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Identified low average CPU node for potential rightsizing cost savings", "confidence": 0.98 }),
                audit_metadata: json!({}),
            }],
        },
        // 28. Business Activities
        OntologyTemplateCategory {
            id: "business_activities".into(),
            name: "Business Activities".into(),
            description: "Service mapping, critical path shifts, and executive updates".into(),
            schema_desc: "Registers business service maps, risk scores, and executive notes".into(),
            example_events: vec![UnifiedEventTemplate {
                event_type: "business_service_mapped".into(),
                category: "business".into(),
                object_type: "business_service".into(),
                object_id: "bs-customer-checkout".into(),
                actor: "ontology_engine".into(),
                team: Some("L3".into()),
                environment: "Production".into(),
                severity: "low".into(),
                status: "completed".into(),
                before_state: json!({ "dependencies_count": 0 }),
                after_state: json!({
                    "service_name": "Checkout Flow",
                    "dependencies_count": 8,
                    "critical_path_changed": true,
                    "risk_level": "medium"
                }),
                linked_records: json!({}),
                ai_analysis: json!({ "summary": "Updated checkout service dependency mapping in graph model following system adjustments", "confidence": 1.0 }),
                audit_metadata: json!({}),
            }],
        },
    ]
}
