use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Core Entities ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub email: String,
    pub team_id: Option<Uuid>,
    pub role: String,
    pub department: String,
    pub skills: Vec<String>,
    pub status: PersonStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PersonStatus {
    Active,
    OnLeave,
    Inactive,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Team {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub department: String,
    pub manager_id: Option<Uuid>,
}

// ── Daily Check-In ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyCheckIn {
    pub id: Uuid,
    pub person_id: Uuid,
    pub date: NaiveDate,
    pub check_in_type: CheckInType,
    pub plan: Option<String>,
    pub completed: Option<String>,
    pub blockers: Option<String>,
    pub mood: Mood,
    pub priority: String,
    pub risk: Option<String>,
    pub needs_help: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CheckInType {
    Morning,
    Evening,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Mood {
    Great,
    Good,
    Neutral,
    Stressed,
    Frustrated,
    Exhausted,
}

impl Mood {
    pub fn score(&self) -> f64 {
        match self {
            Mood::Great => 1.0,
            Mood::Good => 0.8,
            Mood::Neutral => 0.6,
            Mood::Stressed => 0.35,
            Mood::Frustrated => 0.2,
            Mood::Exhausted => 0.1,
        }
    }
}

// ── Activity Timeline ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub id: Uuid,
    pub person_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub event_type: String, // login, deployment, incident, standup, checkin, meeting, code_commit
    pub description: String,
    pub linked_entity_id: Option<String>,
    pub metadata: serde_json::Value,
}

// ── Sentiment Analysis ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentimentResult {
    pub person_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub stress_level: f64, // 0.0 (calm) - 1.0 (extreme stress)
    pub confidence: f64,
    pub emotion: Emotion,
    pub burnout_risk: BurnoutRisk,
    pub triggers: Vec<String>, // detected keywords/phrases
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Emotion {
    Positive,
    Neutral,
    Stress,
    Frustration,
    Confusion,
    Burnout,
    Escalation,
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BurnoutRisk {
    Low,
    Moderate,
    High,
    Critical,
}

// ── Behaviour Profile ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviourProfile {
    pub person_id: Uuid,
    pub focus_score: f64,             // 0-100
    pub collaboration_score: f64,     // 0-100
    pub workload_score: f64,          // 0-100 (higher = heavier)
    pub knowledge_sharing_score: f64, // 0-100
    pub risk_pattern: String,         // "stable", "overloaded", "isolated", "at_risk"
    pub working_style: String,        // "deep_focus", "collaborative", "responsive", "firefighter"
    pub recommendations: Vec<String>,
}

// ── People Health Insights (Team-Level KPIs) ───────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeopleInsights {
    pub total_persons: u32,
    pub total_teams: u32,
    pub active_blockers: u32,
    pub avg_mood_score: f64,
    pub avg_focus_score: f64,
    pub avg_collaboration_score: f64,
    pub burnout_risk_count: u32, // persons with high/critical burnout risk
    pub checkins_today: u32,
    pub escalation_count_7d: u32,
    pub knowledge_gap_count: u32,
    pub top_blockers: Vec<String>,
}

// ── API Request/Response DTOs ──────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct CheckInRequest {
    pub person_id: Uuid,
    pub check_in_type: CheckInType,
    pub plan: Option<String>,
    pub completed: Option<String>,
    pub blockers: Option<String>,
    pub mood: Mood,
    pub priority: String,
    pub risk: Option<String>,
    pub needs_help: bool,
}

#[derive(Debug, Deserialize)]
pub struct ConversationRequest {
    pub person_id: Uuid,
    pub source: String, // "slack", "teams", "email", "standup"
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct ConversationAnalysis {
    pub intents: Vec<String>,
    pub entities: Vec<String>,
    pub sentiment: SentimentResult,
    pub suggested_actions: Vec<String>,
}
