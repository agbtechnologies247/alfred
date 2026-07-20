use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Clone)]
pub struct OpenAiClient {
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RcaResult {
    pub tags: Vec<String>,
    pub confidence: f64,
}

impl OpenAiClient {
    pub fn new(api_key: &str, model: &str) -> Self {
        Self {
            api_key: api_key.to_string(),
            model: model.to_string(),
        }
    }

    pub async fn generate_rca_tags(&self, incident_description: &str) -> Result<RcaResult, Box<dyn std::error::Error + Send + Sync>> {
        let client = reqwest::Client::new();
        let prompt = format!(
            "Analyze the following incident and provide root cause tags and a confidence score between 0.0 and 1.0. \
            Output strictly as JSON in the format {{ \"tags\": [\"Tag1\", \"Tag2\"], \"confidence\": 0.95 }}. \
            Incident: {}",
            incident_description
        );

        let body = json!({
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a specialized Root Cause Analysis AI for enterprise infrastructure. Return only raw JSON without markdown formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        });

        tracing::info!("Calling OpenAI with model: {}", self.model);
        
        let res = client.post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await?;

        let res_json: serde_json::Value = res.json().await?;
        
        if let Some(content) = res_json["choices"][0]["message"]["content"].as_str() {
            let rca_result: RcaResult = serde_json::from_str(content)?;
            Ok(rca_result)
        } else {
            Err("Failed to parse response from OpenAI".into())
        }
    }
}

#[derive(Clone)]
pub struct VoiceAiClient {
    pub stt_model: String,
    pub tts_model: String,
    pub timeout_ms: u64,
    pub confidence_threshold: f64,
}

impl VoiceAiClient {
    pub fn new(stt_model: &str, tts_model: &str, timeout_ms: u64, confidence_threshold: f64) -> Self {
        Self {
            stt_model: stt_model.to_string(),
            tts_model: tts_model.to_string(),
            timeout_ms,
            confidence_threshold,
        }
    }

    pub async fn transcribe_audio(&self, _audio_bytes: &[u8]) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("Mock STT: Transcribing audio using {} with {} threshold", self.stt_model, self.confidence_threshold);
        // Stub for actual HTTP call to Whisper/Deepgram
        Ok("System is down".to_string())
    }

    pub async fn generate_speech(&self, text: &str) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("Mock TTS: Generating speech for '{}' using {}", text, self.tts_model);
        // Stub for actual HTTP call to ElevenLabs/XTTS
        Ok(vec![0, 1, 2, 3]) 
    }
}
