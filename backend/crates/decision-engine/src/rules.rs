#[derive(Debug)]
pub struct Rule {
    pub name: String,
    pub condition_metric: String,
    pub threshold: f64,
}

pub fn evaluate_rules(metric_name: &str, value: f64) -> Option<&'static str> {
    if metric_name == "packet_loss" && value > 5.0 {
        return Some("Trigger: High Packet Loss");
    }
    if metric_name == "latency" && value > 300.0 {
        return Some("Trigger: High Latency");
    }
    None
}
