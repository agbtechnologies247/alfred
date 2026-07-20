use axum::{
    Json, extract::State,
};
use serde_json::{json, Value};
use crate::AppState;
use crate::routes::auth::AuthenticatedUser;
use prometheus::{Registry, Counter, Gauge, Encoder, TextEncoder};
use lazy_static::lazy_static;

lazy_static! {
    pub static ref REGISTRY: Registry = Registry::new();
    
    pub static ref TELEMETRY_REQUESTS_TOTAL: Counter = Counter::new(
        "alfred_telemetry_requests_total",
        "Total number of telemetry requests received"
    ).unwrap();
    
    pub static ref SYSTEM_CPU_USAGE: Gauge = Gauge::new(
        "alfred_system_cpu_usage_ratio",
        "System CPU usage percentage"
    ).unwrap();
    
    pub static ref SYSTEM_MEM_USAGE: Gauge = Gauge::new(
        "alfred_system_memory_usage_bytes",
        "System used memory in bytes"
    ).unwrap();
}

pub fn register_custom_metrics() {
    let _ = REGISTRY.register(Box::new(TELEMETRY_REQUESTS_TOTAL.clone()));
    let _ = REGISTRY.register(Box::new(SYSTEM_CPU_USAGE.clone()));
    let _ = REGISTRY.register(Box::new(SYSTEM_MEM_USAGE.clone()));
}

pub async fn get_prometheus_metrics() -> impl axum::response::IntoResponse {
    use sysinfo::{System, RefreshKind, CpuRefreshKind, MemoryRefreshKind};
    
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything())
    );
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_info().cpu_usage() as f64;
    let used_mem = sys.used_memory() as f64;
    
    SYSTEM_CPU_USAGE.set(cpu_usage);
    SYSTEM_MEM_USAGE.set(used_mem);
    
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    let mut buffer = vec![];
    let _ = encoder.encode(&metric_families, &mut buffer);
    
    (
        [("content-type", "text/plain; version=0.0.4")],
        buffer
    )
}

pub async fn get_monitoring_kpis() -> Json<Value> {
    use sysinfo::{System, RefreshKind, CpuRefreshKind, MemoryRefreshKind};
    
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything())
    );
    // A quick sleep is required to get a non-zero CPU delta reading
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let memory_pct = if total_mem > 0 {
        (used_mem as f64 / total_mem as f64) * 100.0
    } else {
        0.0
    };

    Json(json!({
        "health_score": (100.0f64 - (cpu_usage as f64 * 0.05)).clamp(50.0f64, 100.0f64),
        "critical_alerts": 3,
        "open_incidents": 18,
        "automation_success": 97.0,
        "transmission_score": 98.5,
        "packet_score": 99.1,
        "connection_score": 100.0,
        "dns_score": 97.2,
        "system_cpu_usage": cpu_usage,
        "system_memory_pct": memory_pct,
        "system_total_memory_gb": total_mem as f64 / 1_073_741_824.0,
        "system_used_memory_gb": used_mem as f64 / 1_073_741_824.0
    }))
}

pub async fn get_monitoring_telemetry() -> Json<Value> {
    Json(json!({
        "packet_data": [
            { "time": "10:00", "sent": 4000, "received": 4000, "dropped": 0 },
            { "time": "10:05", "sent": 3000, "received": 2980, "dropped": 20 },
            { "time": "10:10", "sent": 2000, "received": 1900, "dropped": 100 },
            { "time": "10:15", "sent": 2780, "received": 2700, "dropped": 80 },
            { "time": "10:20", "sent": 1890, "received": 1890, "dropped": 0 },
            { "time": "10:25", "sent": 2390, "received": 2390, "dropped": 0 },
            { "time": "10:30", "sent": 3490, "received": 3400, "dropped": 90 }
        ],
        "latency_data": [
            { "time": "10:00", "latency": 45 },
            { "time": "10:05", "latency": 48 },
            { "time": "10:10", "latency": 120 },
            { "time": "10:15", "latency": 85 },
            { "time": "10:20", "latency": 46 },
            { "time": "10:25", "latency": 44 },
            { "time": "10:30", "latency": 90 }
        ]
    }))
}

pub async fn get_monitoring_errors() -> Json<Value> {
    Json(json!([
        { "timestamp": "10:30:14", "layer": "Layer 3", "protocol": "TCP", "severity": "High", "error": "Packet Loss (MTU)", "region": "us-east-1" },
        { "timestamp": "10:15:02", "layer": "Layer 5", "protocol": "DNS", "severity": "Critical", "error": "DNS Resolution Failure", "region": "eu-central-1" },
        { "timestamp": "10:10:45", "layer": "Layer 4", "protocol": "TCP", "severity": "High", "error": "Connection Refused", "region": "ap-south-1" }
    ]))
}
