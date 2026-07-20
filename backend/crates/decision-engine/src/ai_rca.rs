pub fn generate_rca_for_incident(incident_id: &str) -> String {
    tracing::info!("Generating AI RCA for incident {}...", incident_id);
    format!("AI Analysis for {}: Likely caused by MTU mismatch leading to packet fragmentation.", incident_id)
}
