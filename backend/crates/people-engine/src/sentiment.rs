use crate::models::*;
use chrono::Utc;
use uuid::Uuid;

/// Keyword-based sentiment analysis engine.
/// Falls back to local keyword detection when no LLM is available.
pub struct SentimentAnalyzer;

impl SentimentAnalyzer {
    /// Analyze the sentiment of a text message.
    /// Returns a SentimentResult with stress level, emotion classification, and burnout risk.
    pub fn analyze(person_id: Uuid, text: &str) -> SentimentResult {
        let lower = text.to_lowercase();
        let mut stress_level: f64 = 0.0;
        let mut triggers = Vec::new();
        let mut emotion = Emotion::Neutral;

        // ── Stress / Frustration indicators ────────────────────────────
        let stress_keywords = [
            ("blocked", 0.25),
            ("waiting", 0.15),
            ("frustrated", 0.40),
            ("angry", 0.50),
            ("stuck", 0.30),
            ("overloaded", 0.45),
            ("overwhelmed", 0.50),
            ("impossible", 0.35),
            ("broken", 0.25),
            ("failed", 0.20),
            ("down", 0.15),
            ("critical", 0.20),
            ("urgent", 0.20),
            ("escalat", 0.30),
            ("customer is angry", 0.45),
            ("can't", 0.15),
            ("no support", 0.35),
            ("too many", 0.25),
            ("exhausted", 0.55),
            ("burnout", 0.60),
            ("tired", 0.30),
            ("late night", 0.25),
            ("weekend work", 0.30),
            ("stress", 0.40),
            ("deadline", 0.20),
            ("pressure", 0.30),
            ("conflict", 0.35),
        ];

        for (keyword, weight) in &stress_keywords {
            if lower.contains(keyword) {
                stress_level += weight;
                triggers.push(keyword.to_string());
            }
        }

        // ── Positive indicators (reduce stress) ────────────────────────
        let positive_keywords = [
            ("completed", -0.15),
            ("resolved", -0.15),
            ("fixed", -0.10),
            ("great", -0.10),
            ("good progress", -0.15),
            ("on track", -0.10),
            ("ahead of schedule", -0.20),
            ("happy", -0.15),
            ("excited", -0.10),
            ("thank", -0.05),
            ("helped", -0.10),
            ("learned", -0.05),
        ];

        for (keyword, weight) in &positive_keywords {
            if lower.contains(keyword) {
                stress_level += weight;
                triggers.push(format!("positive:{}", keyword));
            }
        }

        // Clamp to [0.0, 1.0]
        stress_level = stress_level.clamp(0.0, 1.0);

        // ── Classify emotion ───────────────────────────────────────────
        if stress_level > 0.7 {
            emotion = if lower.contains("conflict") || lower.contains("angry") {
                Emotion::Conflict
            } else if lower.contains("burnout") || lower.contains("exhausted") {
                Emotion::Burnout
            } else {
                Emotion::Frustration
            };
        } else if stress_level > 0.4 {
            emotion = if lower.contains("confused") || lower.contains("unclear") {
                Emotion::Confusion
            } else if lower.contains("escalat") {
                Emotion::Escalation
            } else {
                Emotion::Stress
            };
        } else if stress_level < 0.15 && triggers.iter().any(|t| t.starts_with("positive:")) {
            emotion = Emotion::Positive;
        }

        // ── Burnout risk ───────────────────────────────────────────────
        let burnout_risk = if stress_level > 0.7 {
            BurnoutRisk::Critical
        } else if stress_level > 0.5 {
            BurnoutRisk::High
        } else if stress_level > 0.3 {
            BurnoutRisk::Moderate
        } else {
            BurnoutRisk::Low
        };

        // Confidence is higher when more keywords are matched
        let confidence = if triggers.is_empty() {
            0.45 // low confidence if no keywords found
        } else {
            (0.70 + (triggers.len() as f64 * 0.05)).min(0.98)
        };

        SentimentResult {
            person_id,
            timestamp: Utc::now(),
            stress_level,
            confidence,
            emotion,
            burnout_risk,
            triggers,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stressed_message() {
        let result = SentimentAnalyzer::analyze(
            Uuid::new_v4(),
            "I'm blocked waiting for QA. Customer is angry and deadline is tomorrow.",
        );
        assert!(result.stress_level > 0.4);
        assert!(matches!(
            result.burnout_risk,
            BurnoutRisk::High | BurnoutRisk::Critical | BurnoutRisk::Moderate
        ));
        assert!(!result.triggers.is_empty());
    }

    #[test]
    fn test_positive_message() {
        let result = SentimentAnalyzer::analyze(
            Uuid::new_v4(),
            "Great progress today! Completed the migration and everything is on track.",
        );
        assert!(result.stress_level < 0.2);
        assert!(matches!(
            result.emotion,
            Emotion::Positive | Emotion::Neutral
        ));
    }

    #[test]
    fn test_burnout_message() {
        let result = SentimentAnalyzer::analyze(
            Uuid::new_v4(),
            "I'm exhausted from weekend work. Feeling burnout and overwhelmed with too many tasks.",
        );
        assert!(result.stress_level > 0.6);
        assert!(matches!(
            result.burnout_risk,
            BurnoutRisk::Critical | BurnoutRisk::High
        ));
    }

    #[test]
    fn test_neutral_message() {
        let result = SentimentAnalyzer::analyze(
            Uuid::new_v4(),
            "Working on the API integration today. No issues so far.",
        );
        assert!(result.stress_level < 0.3);
        assert_eq!(result.emotion, Emotion::Neutral);
    }
}
