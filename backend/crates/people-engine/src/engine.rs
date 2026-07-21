use crate::models::*;
use crate::sentiment::SentimentAnalyzer;
use chrono::Utc;
use storage_engine::StorageEngine;
use uuid::Uuid;

/// People Engineering Engine — the core orchestrator for organizational intelligence.
///
/// Handles daily check-ins, timeline tracking, sentiment analysis,
/// behaviour profiling, and AI coaching recommendations.
pub struct PeopleEngine {
    storage: StorageEngine,
}

impl PeopleEngine {
    pub fn new(storage: StorageEngine) -> Self {
        tracing::info!("People Engineering Engine initialized");
        Self { storage }
    }

    /// Record a daily check-in (morning or evening) and run sentiment analysis
    pub async fn record_checkin(&self, req: &CheckInRequest) -> Result<DailyCheckIn, String> {
        let checkin = DailyCheckIn {
            id: Uuid::new_v4(),
            person_id: req.person_id,
            date: Utc::now().date_naive(),
            check_in_type: req.check_in_type.clone(),
            plan: req.plan.clone(),
            completed: req.completed.clone(),
            blockers: req.blockers.clone(),
            mood: req.mood.clone(),
            priority: req.priority.clone(),
            risk: req.risk.clone(),
            needs_help: req.needs_help,
            created_at: Utc::now(),
        };

        // Persist to database
        if let Some(pg) = &self.storage.pg_pool {
            sqlx::query(
                "INSERT INTO daily_checkins (id, person_id, date, check_in_type, plan, completed, blockers, mood, priority, risk, needs_help) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
            )
            .bind(checkin.id)
            .bind(checkin.person_id)
            .bind(checkin.date)
            .bind(serde_json::to_string(&checkin.check_in_type).unwrap_or_default().trim_matches('"').to_string())
            .bind(&checkin.plan)
            .bind(&checkin.completed)
            .bind(&checkin.blockers)
            .bind(serde_json::to_string(&checkin.mood).unwrap_or_default().trim_matches('"').to_string())
            .bind(&checkin.priority)
            .bind(&checkin.risk)
            .bind(checkin.needs_help)
            .execute(pg)
            .await
            .map_err(|e| format!("Failed to persist check-in: {}", e))?;
        }

        // Run sentiment analysis on blockers text if present
        if let Some(blockers) = &checkin.blockers {
            if !blockers.is_empty() {
                let sentiment = SentimentAnalyzer::analyze(checkin.person_id, blockers);
                if sentiment.burnout_risk == BurnoutRisk::High
                    || sentiment.burnout_risk == BurnoutRisk::Critical
                {
                    tracing::warn!(
                        "People: Burnout risk detected for person {} — stress={:.2}, emotion={:?}",
                        checkin.person_id,
                        sentiment.stress_level,
                        sentiment.emotion
                    );
                }
            }
        }

        tracing::info!(
            "People: Check-in recorded for person {} ({:?}), mood={:?}, has_blockers={}",
            checkin.person_id,
            checkin.check_in_type,
            checkin.mood,
            checkin.blockers.is_some()
        );

        Ok(checkin)
    }

    /// Get activity timeline for a specific person
    pub async fn get_timeline(&self, person_id: Uuid) -> Vec<TimelineEvent> {
        if let Some(pg) = &self.storage.pg_pool {
            let rows = sqlx::query(
                "SELECT id, person_id, timestamp, event_type, description, linked_entity_id, metadata \
                 FROM timeline_events WHERE person_id = $1 ORDER BY timestamp DESC LIMIT 50"
            )
            .bind(person_id)
            .fetch_all(pg)
            .await;

            if let Ok(records) = rows {
                use sqlx::Row;
                return records
                    .iter()
                    .map(|r| TimelineEvent {
                        id: r.get("id"),
                        person_id: r.get("person_id"),
                        timestamp: r.get("timestamp"),
                        event_type: r.get("event_type"),
                        description: r.get("description"),
                        linked_entity_id: r.try_get("linked_entity_id").ok(),
                        metadata: r.try_get("metadata").unwrap_or(serde_json::json!({})),
                    })
                    .collect();
            }
        }

        // Mock fallback
        vec![
            TimelineEvent {
                id: Uuid::new_v4(),
                person_id,
                timestamp: Utc::now(),
                event_type: "login".into(),
                description: "Logged into A.L.F.R.E.D. platform".into(),
                linked_entity_id: None,
                metadata: serde_json::json!({"ip": "192.168.1.50"}),
            },
            TimelineEvent {
                id: Uuid::new_v4(),
                person_id,
                timestamp: Utc::now() - chrono::Duration::minutes(30),
                event_type: "checkin".into(),
                description: "Morning check-in submitted. Priority: Deploy billing fix.".into(),
                linked_entity_id: None,
                metadata: serde_json::json!({"mood": "good"}),
            },
            TimelineEvent {
                id: Uuid::new_v4(),
                person_id,
                timestamp: Utc::now() - chrono::Duration::hours(1),
                event_type: "deployment".into(),
                description: "Deployed billing-api v3.2.1 to production".into(),
                linked_entity_id: Some("deploy-4521".into()),
                metadata: serde_json::json!({"status": "success"}),
            },
            TimelineEvent {
                id: Uuid::new_v4(),
                person_id,
                timestamp: Utc::now() - chrono::Duration::hours(2),
                event_type: "incident".into(),
                description: "Joined war room for INC-1042 (CoreDNS CrashLoop)".into(),
                linked_entity_id: Some("INC-1042".into()),
                metadata: serde_json::json!({"role": "responder"}),
            },
        ]
    }

    /// Get aggregated People Health insights across the organization
    pub async fn get_insights(&self) -> PeopleInsights {
        let mut total_persons = 0u32;
        let mut total_teams = 0u32;
        let mut checkins_today = 0u32;

        if let Some(pg) = &self.storage.pg_pool {
            use sqlx::Row;
            if let Ok(row) = sqlx::query("SELECT COUNT(*) as c FROM persons")
                .fetch_one(pg)
                .await
            {
                total_persons = row.get::<i64, _>("c") as u32;
            }
            if let Ok(row) = sqlx::query("SELECT COUNT(*) as c FROM teams")
                .fetch_one(pg)
                .await
            {
                total_teams = row.get::<i64, _>("c") as u32;
            }
            let today = Utc::now().date_naive();
            if let Ok(row) = sqlx::query("SELECT COUNT(*) as c FROM daily_checkins WHERE date = $1")
                .bind(today)
                .fetch_one(pg)
                .await
            {
                checkins_today = row.get::<i64, _>("c") as u32;
            }
        }

        // Use sensible defaults when DB has no data yet
        if total_persons == 0 {
            total_persons = 24;
        }
        if total_teams == 0 {
            total_teams = 5;
        }

        PeopleInsights {
            total_persons,
            total_teams,
            active_blockers: 3,
            avg_mood_score: 0.72,
            avg_focus_score: 78.0,
            avg_collaboration_score: 84.0,
            burnout_risk_count: 2,
            checkins_today,
            escalation_count_7d: 4,
            knowledge_gap_count: 6,
            top_blockers: vec![
                "Waiting for QA approval on billing release".into(),
                "Production database access pending HR review".into(),
                "Jenkins pipeline blocked by certificate expiry".into(),
            ],
        }
    }

    /// Get AI coaching recommendations for a specific person
    pub fn get_recommendations(&self, person_id: Uuid) -> BehaviourProfile {
        // In production, this would aggregate from timeline events, check-ins, and git data
        BehaviourProfile {
            person_id,
            focus_score: 72.0,
            collaboration_score: 85.0,
            workload_score: 78.0,
            knowledge_sharing_score: 65.0,
            risk_pattern: "overloaded".into(),
            working_style: "firefighter".into(),
            recommendations: vec![
                "Reduce meeting hours — currently 18hrs/week (team avg: 12hrs)".into(),
                "Document deployment runbooks — last documentation update was 45 days ago".into(),
                "Delegate P3/P4 incident triage to junior engineers".into(),
                "Complete Kubernetes certification — knowledge gap detected".into(),
                "Schedule focus blocks — deep work ratio is 28% (target: 50%)".into(),
                "Take a recovery day — 3 consecutive weeks of after-hours work detected".into(),
            ],
        }
    }

    /// Analyze a conversation message — extract intents, entities, and sentiment
    pub fn analyze_conversation(&self, req: &ConversationRequest) -> ConversationAnalysis {
        let sentiment = SentimentAnalyzer::analyze(req.person_id, &req.message);
        let lower = req.message.to_lowercase();

        // Intent detection (keyword-based, LLM fallback in production)
        let mut intents = Vec::new();
        let mut entities = Vec::new();
        let mut suggested_actions = Vec::new();

        if lower.contains("down") || lower.contains("outage") || lower.contains("failed") {
            intents.push("incident_report".into());
            suggested_actions.push("Create P1 incident ticket".into());
            suggested_actions.push("Notify on-call engineer".into());
        }
        if lower.contains("access") || lower.contains("permission") || lower.contains("vpn") {
            intents.push("access_request".into());
            suggested_actions.push("Generate access request workflow".into());
            suggested_actions.push("Notify approval matrix owner".into());
        }
        if lower.contains("blocked") || lower.contains("waiting") || lower.contains("stuck") {
            intents.push("blocker_report".into());
            suggested_actions.push("Identify dependency owner and notify".into());
            suggested_actions.push("Update sprint board with blocker".into());
        }
        if lower.contains("deploy") || lower.contains("release") {
            intents.push("deployment_activity".into());
            entities.push("deployment_pipeline".into());
        }
        if lower.contains("customer") || lower.contains("client") {
            entities.push("customer_context".into());
            suggested_actions.push("Flag for customer success team review".into());
        }
        if lower.contains("jenkins") {
            entities.push("Jenkins".into());
        }
        if lower.contains("aws") || lower.contains("ec2") || lower.contains("s3") {
            entities.push("AWS".into());
        }
        if lower.contains("kubernetes") || lower.contains("k8s") || lower.contains("pod") {
            entities.push("Kubernetes".into());
        }
        if lower.contains("postgres") || lower.contains("database") || lower.contains("db") {
            entities.push("Database".into());
        }

        if intents.is_empty() {
            intents.push("general_update".into());
        }

        ConversationAnalysis {
            intents,
            entities,
            sentiment,
            suggested_actions,
        }
    }

    /// Get all persons (from DB or mock)
    pub async fn get_all_persons(&self) -> Vec<serde_json::Value> {
        if let Some(pg) = &self.storage.pg_pool {
            let rows = sqlx::query(
                "SELECT id, name, email, role, department, status FROM persons ORDER BY name",
            )
            .fetch_all(pg)
            .await;

            if let Ok(records) = rows {
                use sqlx::Row;
                let result: Vec<serde_json::Value> = records
                    .iter()
                    .map(|r| {
                        serde_json::json!({
                            "id": r.get::<Uuid, _>("id").to_string(),
                            "name": r.get::<String, _>("name"),
                            "email": r.get::<String, _>("email"),
                            "role": r.get::<String, _>("role"),
                            "department": r.get::<String, _>("department"),
                            "status": r.get::<String, _>("status"),
                        })
                    })
                    .collect();
                if !result.is_empty() {
                    return result;
                }
            }
        }

        // Mock data
        vec![
            serde_json::json!({"id": "11111111-1111-1111-1111-111111111111", "name": "Alice Brown", "email": "alice@agbtech.com", "role": "Senior SRE", "department": "Engineering", "status": "active", "team": "Platform", "mood": "good", "focus_score": 82}),
            serde_json::json!({"id": "22222222-2222-2222-2222-222222222222", "name": "Rahul Sharma", "email": "rahul@agbtech.com", "role": "DevOps Lead", "department": "Engineering", "status": "active", "team": "DevOps", "mood": "stressed", "focus_score": 55}),
            serde_json::json!({"id": "33333333-3333-3333-3333-333333333333", "name": "Priya Patel", "email": "priya@agbtech.com", "role": "QA Engineer", "department": "Quality", "status": "active", "team": "QA", "mood": "neutral", "focus_score": 74}),
            serde_json::json!({"id": "44444444-4444-4444-4444-444444444444", "name": "James Wilson", "email": "james@agbtech.com", "role": "Backend Engineer", "department": "Engineering", "status": "active", "team": "Platform", "mood": "good", "focus_score": 91}),
            serde_json::json!({"id": "55555555-5555-5555-5555-555555555555", "name": "Sarah Chen", "email": "sarah@agbtech.com", "role": "Security Analyst", "department": "Security", "status": "active", "team": "Security", "mood": "great", "focus_score": 88}),
            serde_json::json!({"id": "66666666-6666-6666-6666-666666666666", "name": "Bhramit Pardhi", "email": "bhramit@agbtech.com", "role": "CTO", "department": "Executive", "status": "active", "team": "Leadership", "mood": "good", "focus_score": 70}),
        ]
    }

    /// Get all teams (from DB or mock)
    pub async fn get_all_teams(&self) -> Vec<serde_json::Value> {
        if let Some(pg) = &self.storage.pg_pool {
            let rows = sqlx::query("SELECT id, name, department FROM teams ORDER BY name")
                .fetch_all(pg)
                .await;

            if let Ok(records) = rows {
                use sqlx::Row;
                let result: Vec<serde_json::Value> = records
                    .iter()
                    .map(|r| {
                        serde_json::json!({
                            "id": r.get::<Uuid, _>("id").to_string(),
                            "name": r.get::<String, _>("name"),
                            "department": r.get::<String, _>("department"),
                        })
                    })
                    .collect();
                if !result.is_empty() {
                    return result;
                }
            }
        }

        vec![
            serde_json::json!({"id": "t-001", "name": "Platform", "department": "Engineering", "members": 8, "health_score": 82, "avg_mood": "good"}),
            serde_json::json!({"id": "t-002", "name": "DevOps", "department": "Engineering", "members": 5, "health_score": 68, "avg_mood": "stressed"}),
            serde_json::json!({"id": "t-003", "name": "QA", "department": "Quality", "members": 4, "health_score": 75, "avg_mood": "neutral"}),
            serde_json::json!({"id": "t-004", "name": "Security", "department": "Security", "members": 3, "health_score": 90, "avg_mood": "great"}),
            serde_json::json!({"id": "t-005", "name": "Leadership", "department": "Executive", "members": 4, "health_score": 78, "avg_mood": "good"}),
        ]
    }
}
