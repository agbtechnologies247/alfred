use serde::{Deserialize, Serialize};

/// All possible entity types in the Enterprise Knowledge Graph
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    Server,
    VirtualMachine,
    Application,
    Database,
    CloudResource,
    Team,
    Person,
    Customer,
    BusinessService,
    Sla,
    Incident,
    Change,
    Deployment,
    Alert,
    SecurityFinding,
    Runbook,
    Playbook,
    CiCdPipeline,
    NetworkDevice,
    Cluster,
    Region,
}

/// All possible relationship types in the graph
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RelationType {
    DependsOn,
    HostedOn,
    Owns,
    Impacts,
    ConnectsTo,
    Runs,
    GeneratesAlert,
    ApprovedBy,
    TriggeredBy,
    FixedBy,
    ReportedBy,
    PartOf,
    ChangedBy,
    MitigatedBy,
    DeployedTo,
}

/// A node in the enterprise knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEntity {
    pub id: String,
    pub entity_type: EntityType,
    pub name: String,
    pub properties: serde_json::Value,
}

/// A directed relationship between two entities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRelation {
    pub from_id: String,
    pub to_id: String,
    pub relation_type: RelationType,
    pub weight: f64,
}

impl GraphEntity {
    pub fn new(id: &str, entity_type: EntityType, name: &str) -> Self {
        Self {
            id: id.to_string(),
            entity_type,
            name: name.to_string(),
            properties: serde_json::json!({}),
        }
    }
}
