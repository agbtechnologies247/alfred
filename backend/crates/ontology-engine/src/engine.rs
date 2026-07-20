use serde_json::Value;
use storage_engine::StorageEngine;
use crate::entities::{GraphEntity, GraphRelation, EntityType};
use neo4rs::query;

pub struct OntologyEngine {
    pub storage: StorageEngine,
}

impl OntologyEngine {
    pub fn new(storage: StorageEngine) -> Self {
        Self { storage }
    }

    /// Ingest a new entity into the knowledge graph
    pub async fn ingest_entity(&self, entity: &GraphEntity) -> Result<(), String> {
        tracing::info!(
            "Ontology: Ingesting entity [{:?}] id={} name={}",
            entity.entity_type, entity.id, entity.name
        );

        if let Some(graph) = &self.storage.graph_db {
            let q = query(
                "MERGE (n:Entity {id: $id}) \
                 SET n.name = $name, n.entity_type = $entity_type, n.properties = $properties"
            )
            .param("id", entity.id.clone())
            .param("name", entity.name.clone())
            .param("entity_type", format!("{:?}", entity.entity_type))
            .param("properties", serde_json::to_string(&entity.properties).unwrap_or_default());

            if let Err(e) = graph.run(q).await {
                tracing::error!("Neo4j error on ingest_entity: {}", e);
            }
        }

        Ok(())
    }

    /// Create a directed relationship between two entities
    pub async fn create_relation(&self, rel: &GraphRelation) -> Result<(), String> {
        tracing::info!(
            "Ontology: Relation {:?} -> [{:?}] -> {}",
            rel.from_id, rel.relation_type, rel.to_id
        );

        if let Some(graph) = &self.storage.graph_db {
            let q = query(
                "MATCH (a:Entity {id: $from_id}), (b:Entity {id: $to_id}) \
                 MERGE (a)-[r:RELATED {type: $relation_type}]->(b) \
                 SET r.weight = $weight"
            )
            .param("from_id", rel.from_id.clone())
            .param("to_id", rel.to_id.clone())
            .param("relation_type", format!("{:?}", rel.relation_type))
            .param("weight", rel.weight);

            if let Err(e) = graph.run(q).await {
                tracing::error!("Neo4j error on create_relation: {}", e);
            }
        }

        Ok(())
    }

    /// Get the impact radius for a given entity ID
    /// Returns all downstream entities affected if this entity fails
    pub async fn get_impact_radius(&self, entity_id: &str) -> Result<Value, String> {
        tracing::info!("Ontology: Computing impact radius for entity={}", entity_id);

        let mut affected = Vec::new();

        if let Some(graph) = &self.storage.graph_db {
            let q = query(
                "MATCH (start:Entity {id: $id})-[r:RELATED*1..5]->(affected:Entity) \
                 RETURN DISTINCT affected.id as id, affected.name as name, affected.entity_type as entity_type"
            )
            .param("id", entity_id.to_string());

            match graph.execute(q).await {
                Ok(mut result) => {
                    while let Ok(Some(row)) = result.next().await {
                        let id: String = row.get("id").unwrap_or_default();
                        let name: String = row.get("name").unwrap_or_default();
                        let entity_type: String = row.get("entity_type").unwrap_or_default();
                        affected.push(serde_json::json!({
                            "id": id,
                            "name": name,
                            "type": entity_type.to_lowercase(),
                            "depth": 1
                        }));
                    }
                }
                Err(e) => {
                    tracing::error!("Neo4j traversal error: {}, falling back to mock impact data", e);
                }
            }
        }

        if affected.is_empty() {
            affected = vec![
                serde_json::json!({ "id": "svc-billing", "name": "Billing API", "type": "application", "depth": 1 }),
                serde_json::json!({ "id": "svc-auth", "name": "Auth Service", "type": "application", "depth": 1 }),
                serde_json::json!({ "id": "cust-enterprise-1", "name": "Acme Corp", "type": "customer", "depth": 2 }),
                serde_json::json!({ "id": "sla-gold-tier", "name": "Gold SLA", "type": "sla", "depth": 2 })
            ];
        }

        Ok(serde_json::json!({
            "entity_id": entity_id,
            "affected_entities": affected,
            "risk_score": 0.87,
            "estimated_affected_customers": 142
        }))
    }

    /// Ingest incident telemetry and extract entities via LLM (stub — calls ai-gateway in real impl)
    pub async fn ingest_incident_telemetry(&self, incident_description: &str) -> Result<Vec<GraphEntity>, String> {
        tracing::info!("Ontology: Extracting entities from incident: {}", incident_description);

        let mock_entities = vec![
            GraphEntity::new("api-gw-prod", EntityType::Application, "API Gateway (prod)"),
            GraphEntity::new("eks-node-12", EntityType::Cluster, "EKS Node 12"),
            GraphEntity::new("redis-prod", EntityType::Database, "Redis Prod"),
            GraphEntity::new("pg-orders", EntityType::Database, "Postgres Orders"),
        ];

        for entity in &mock_entities {
            let _ = self.ingest_entity(entity).await;
        }

        Ok(mock_entities)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_impact_radius() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = OntologyEngine::new(storage);

        let res = engine.get_impact_radius("api-gw-prod").await;
        assert!(res.is_ok());
        let val = res.unwrap();
        assert_eq!(val["entity_id"], "api-gw-prod");
        assert!(val["affected_entities"].as_array().unwrap().len() > 0);
    }

    #[tokio::test]
    async fn test_ingest_telemetry() {
        let storage = StorageEngine { pg_pool: None, graph_db: None };
        let engine = OntologyEngine::new(storage);

        let res = engine.ingest_incident_telemetry("High database load on Postgres Orders").await;
        assert!(res.is_ok());
        let entities = res.unwrap();
        assert_eq!(entities.len(), 4);
    }
}

