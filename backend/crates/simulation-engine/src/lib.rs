use ml_engine::{MlEngine, RiskScore};
use ontology_engine::OntologyEngine;
use serde::{Deserialize, Serialize};

/// A proposed action to be simulated before execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProposedAction {
    pub action_type: String,
    pub target_entity_id: String,
    pub payload: serde_json::Value,
}

/// Full simulation result — shown in the Decision Center UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResult {
    pub action: ProposedAction,
    pub risk_score: RiskScore,
    pub estimated_blast_radius: u32, // number of downstream entities affected
    pub estimated_affected_customers: u32,
    pub estimated_downtime_minutes: f64,
    pub estimated_cost_impact_usd: f64,
    pub sla_breach_probability: f64,
    pub approval_required: bool,
    pub recommended_decision: String,
    pub alternatives: Vec<Alternative>,
    pub simulation_confidence: f64,
}

/// Alternative action the AI recommends instead
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alternative {
    pub action_type: String,
    pub description: String,
    pub risk_reduction: f64,
    pub cost_savings_usd: f64,
}

pub struct SimulationEngine {
    ml: MlEngine,
}

impl SimulationEngine {
    pub fn new() -> Self {
        tracing::info!("Simulation Engine initialized");
        Self {
            ml: MlEngine::new(),
        }
    }

    /// Simulate the full impact of a proposed action before executing it
    /// This is the core of the Decision Engineering module
    pub async fn simulate(
        &self,
        action: ProposedAction,
        ontology: &OntologyEngine,
    ) -> SimulationResult {
        tracing::info!(
            "Simulation: Evaluating '{}' on entity '{}'",
            action.action_type,
            action.target_entity_id
        );

        // 1. Get impact radius from knowledge graph
        let impact = ontology
            .get_impact_radius(&action.target_entity_id)
            .await
            .unwrap_or_else(|_| serde_json::json!({"affected_entities": [], "risk_score": 0.5}));

        let mut active_sessions_count = 0u64;
        if let Some(pg) = &ontology.storage.pg_pool {
            if let Ok(row) = sqlx::query("SELECT COUNT(*) as count FROM sessions")
                .fetch_one(pg)
                .await
            {
                let count: i64 = sqlx::Row::get(&row, "count");
                active_sessions_count = count as u64;
            }
        }

        let blast_radius = impact["affected_entities"]
            .as_array()
            .map(|a| a.len() as u32)
            .unwrap_or(2);
        let affected_customers = if active_sessions_count > 0 {
            active_sessions_count as u32
        } else {
            impact["estimated_affected_customers"]
                .as_u64()
                .unwrap_or(50) as u32
        };

        // 2. Compute ML risk score
        let risk_context = serde_json::json!({ "impact_radius": blast_radius as f64 / 20.0 });
        let risk_score = self.ml.compute_risk_score(&risk_context);

        // 3. Estimate business impact using live cloud instance pricing indexes
        let downtime_mins = match risk_score.severity.as_str() {
            "critical" => 45.0,
            "high" => 15.0,
            "medium" => 5.0,
            _ => 1.0,
        };

        let mut rate_per_min = 0.83;
        let client = reqwest::Client::new();
        if let Ok(resp) = client
            .get("https://raw.githubusercontent.com/LGUG2Z/komiser/master/aws/pricing.json")
            .timeout(std::time::Duration::from_millis(600))
            .send()
            .await
        {
            if let Ok(json_val) = resp.json::<serde_json::Value>().await {
                if let Some(rate) = json_val.get("t3.medium").and_then(|v| v.as_f64()) {
                    rate_per_min = (rate / 60.0).max(0.01);
                }
            }
        }

        let cost_impact = affected_customers as f64 * downtime_mins * rate_per_min;
        let sla_breach_prob = (risk_score.score * 0.7).min(1.0);

        // 4. Determine if human approval is needed
        let approval_required = risk_score.score > 0.4 || affected_customers > 100;

        // 5. Build recommendation
        let recommended = if risk_score.score < 0.3 {
            "AUTO_APPROVE — Risk is low. Safe to execute immediately.".into()
        } else if risk_score.score < 0.6 {
            "RECOMMEND_APPROVAL — Medium risk. Notify on-call before proceeding.".into()
        } else {
            "ESCALATE — High risk. Requires senior engineer + change window.".into()
        };

        // 6. Suggest alternatives
        let alternatives = vec![
            Alternative {
                action_type: format!("{}_canary", action.action_type),
                description: "Run action on 10% of instances first, monitor for 5 minutes before full rollout".into(),
                risk_reduction: 0.45,
                cost_savings_usd: cost_impact * 0.3,
            },
            Alternative {
                action_type: "schedule_maintenance".into(),
                description: "Schedule during next maintenance window (Sunday 02:00-04:00 UTC)".into(),
                risk_reduction: 0.70,
                cost_savings_usd: cost_impact * 0.8,
            },
        ];

        SimulationResult {
            action,
            risk_score,
            estimated_blast_radius: blast_radius,
            estimated_affected_customers: affected_customers,
            estimated_downtime_minutes: downtime_mins,
            estimated_cost_impact_usd: cost_impact,
            sla_breach_probability: sla_breach_prob,
            approval_required,
            recommended_decision: recommended,
            alternatives,
            simulation_confidence: 0.87,
        }
    }
}

impl Default for SimulationEngine {
    fn default() -> Self {
        Self::new()
    }
}
