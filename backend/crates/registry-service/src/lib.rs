use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// Category of marketplace item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ManifestKind {
    AiAgent,
    AutomationPack,
    Connector,
    Widget,
    KnowledgePack,
}

/// Installation state of a marketplace item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum InstallState {
    Available,
    Installing,
    Installed,
    UpdateAvailable,
    Failed,
}

/// Package manifest — equivalent to VSCode extension manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub publisher: String,
    pub kind: ManifestKind,
    pub description: String,
    pub icon: String,
    pub required_permissions: Vec<String>,
    pub required_connectors: Vec<String>,
    pub supported_models: Vec<String>,
    pub pricing: String,
    pub tags: Vec<String>,
    pub install_state: InstallState,
    pub rating: f64,
    pub downloads: u64,
}

/// The in-memory registry of all available and installed packages
pub struct RegistryService {
    pg_pool: Option<sqlx::PgPool>,
    packages: Arc<RwLock<HashMap<String, PackageManifest>>>,
}

impl RegistryService {
    pub fn new(pg_pool: Option<sqlx::PgPool>) -> Self {
        let mut initial = HashMap::new();

        // Seed the marketplace with built-in packages
        let builtins = vec![
            PackageManifest {
                id: "agent-itsm".into(), name: "ITSM Agent".into(), version: "1.0.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::AiAgent,
                description: "AI agent for ServiceNow, Jira, and Zendesk ticket automation".into(),
                icon: "ticket".into(),
                required_permissions: vec!["incidents.read".into(), "incidents.write".into()],
                required_connectors: vec!["servicenow".into()],
                supported_models: vec!["gpt-4o".into(), "claude-3.5-sonnet".into()],
                pricing: "included".into(), tags: vec!["itsm".into(), "tickets".into()],
                install_state: InstallState::Installed, rating: 4.9, downloads: 12400,
            },
            PackageManifest {
                id: "agent-aws".into(), name: "AWS Cloud Agent".into(), version: "2.1.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::AiAgent,
                description: "Monitors and auto-remediates AWS EC2, RDS, EKS, Lambda, and S3".into(),
                icon: "cloud".into(),
                required_permissions: vec!["cloud.read".into(), "cloud.write".into()],
                required_connectors: vec!["aws".into()],
                supported_models: vec!["gpt-4o".into(), "llama3-local".into()],
                pricing: "included".into(), tags: vec!["aws".into(), "cloud".into(), "ec2".into()],
                install_state: InstallState::Installed, rating: 4.8, downloads: 9800,
            },
            PackageManifest {
                id: "agent-finops".into(), name: "FinOps Agent".into(), version: "1.3.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::AiAgent,
                description: "Continuously optimizes cloud spend — idle resources, rightsizing, reserved instances".into(),
                icon: "trending_down".into(),
                required_permissions: vec!["cloud.read".into(), "billing.read".into()],
                required_connectors: vec!["aws".into(), "azure".into()],
                supported_models: vec!["gpt-4o".into()],
                pricing: "professional".into(), tags: vec!["cost".into(), "finops".into()],
                install_state: InstallState::Available, rating: 4.7, downloads: 6200,
            },
            PackageManifest {
                id: "agent-security".into(), name: "Security Agent".into(), version: "1.5.2".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::AiAgent,
                description: "IAM policy analysis, CVE scanning, CrowdStrike threat correlation".into(),
                icon: "shield".into(),
                required_permissions: vec!["security.read".into()],
                required_connectors: vec!["okta".into(), "crowdstrike".into()],
                supported_models: vec!["claude-3.5-sonnet".into(), "gpt-4o".into()],
                pricing: "enterprise".into(), tags: vec!["security".into(), "iam".into()],
                install_state: InstallState::Available, rating: 4.9, downloads: 8100,
            },
            // Automation Packs
            PackageManifest {
                id: "auto-restart-ec2".into(), name: "Restart EC2 Instance".into(), version: "1.0.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::AutomationPack,
                description: "Safely restart an EC2 instance with pre/post health checks".into(),
                icon: "server".into(),
                required_permissions: vec!["cloud.write".into()],
                required_connectors: vec!["aws".into()],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["aws".into(), "ec2".into()],
                install_state: InstallState::Installed, rating: 4.8, downloads: 22000,
            },
            PackageManifest {
                id: "auto-reset-password".into(), name: "Reset User Password".into(), version: "1.1.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::AutomationPack,
                description: "Reset user passwords via Okta or Azure AD with audit log".into(),
                icon: "key".into(),
                required_permissions: vec!["identity.write".into()],
                required_connectors: vec!["okta".into()],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["identity".into(), "password".into()],
                install_state: InstallState::Installed, rating: 4.9, downloads: 18500,
            },
            // Connectors
            PackageManifest {
                id: "conn-servicenow".into(), name: "ServiceNow".into(), version: "3.0.1".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Bi-directional sync: incidents, changes, CMDB, and approvals".into(),
                icon: "database".into(),
                required_permissions: vec!["servicenow.connect".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["itsm".into(), "servicenow".into()],
                install_state: InstallState::Installed, rating: 4.7, downloads: 31000,
            },
            PackageManifest {
                id: "conn-datadog".into(), name: "Datadog".into(), version: "2.2.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Ingest Datadog monitors, metrics, logs, and traces".into(),
                icon: "activity".into(),
                required_permissions: vec!["monitoring.read".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["monitoring".into(), "datadog".into()],
                install_state: InstallState::Available, rating: 4.8, downloads: 14200,
            },
            PackageManifest {
                id: "conn-slack".into(), name: "Slack".into(), version: "1.8.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Bi-directional Slack integration: interactive blocks, chatops commands, alerts".into(),
                icon: "message-square".into(),
                required_permissions: vec!["chat.write".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["chat".into(), "slack".into(), "notifications".into()],
                install_state: InstallState::Installed, rating: 4.9, downloads: 42000,
            },
            PackageManifest {
                id: "conn-jira".into(), name: "Jira Software".into(), version: "2.5.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Sync, transition, and update Jira issues, custom fields, and ticket priorities".into(),
                icon: "clipboard".into(),
                required_permissions: vec!["incidents.write".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["itsm".into(), "jira".into(), "tickets".into()],
                install_state: InstallState::Available, rating: 4.6, downloads: 28000,
            },
            PackageManifest {
                id: "conn-github".into(), name: "GitHub".into(), version: "2.0.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Manage pull requests, trigger GitHub Action workflows, and ingest code scan reports".into(),
                icon: "github".into(),
                required_permissions: vec!["code.read".into(), "code.write".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["code".into(), "github".into(), "devops".into()],
                install_state: InstallState::Available, rating: 4.8, downloads: 21500,
            },
            PackageManifest {
                id: "conn-pagerduty".into(), name: "PagerDuty".into(), version: "1.4.0".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Trigger, acknowledge, and resolve incident alerts, and sync on-call schedules".into(),
                icon: "bell".into(),
                required_permissions: vec!["incidents.write".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "professional".into(), tags: vec!["oncall".into(), "pagerduty".into(), "alerts".into()],
                install_state: InstallState::Available, rating: 4.7, downloads: 15400,
            },
            PackageManifest {
                id: "conn-k8s".into(), name: "Kubernetes".into(), version: "3.2.1".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Active cluster pod restarts, deployment scaling, ingress checks, logs streaming".into(),
                icon: "cpu".into(),
                required_permissions: vec!["cloud.read".into(), "cloud.write".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "enterprise".into(), tags: vec!["kubernetes".into(), "k8s".into(), "containers".into()],
                install_state: InstallState::Available, rating: 4.9, downloads: 19800,
            },
            PackageManifest {
                id: "conn-prometheus".into(), name: "Prometheus".into(), version: "1.1.2".into(),
                publisher: "A.L.F.R.E.D. Official".into(), kind: ManifestKind::Connector,
                description: "Ingest Prometheus Alertmanager alerts and run active PromQL telemetry queries".into(),
                icon: "bar-chart-2".into(),
                required_permissions: vec!["monitoring.read".into()],
                required_connectors: vec![],
                supported_models: vec![],
                pricing: "included".into(), tags: vec!["monitoring".into(), "prometheus".into(), "metrics".into()],
                install_state: InstallState::Available, rating: 4.8, downloads: 13000,
            },
        ];

        for pkg in builtins {
            initial.insert(pkg.id.clone(), pkg);
        }

        Self {
            pg_pool,
            packages: Arc::new(RwLock::new(initial)),
        }
    }

    pub async fn sync_states_from_db(&self) {
        if let Some(pool) = &self.pg_pool {
            let rows = sqlx::query("SELECT package_id, install_state FROM installed_packages")
                .fetch_all(pool)
                .await;
            if let Ok(records) = rows {
                use sqlx::Row;
                let mut packages = self.packages.write().unwrap();
                for row in records {
                    let id: String = row.get("package_id");
                    let state_str: String = row.get("install_state");
                    if let Some(pkg) = packages.get_mut(&id) {
                        pkg.install_state = match state_str.as_str() {
                            "installed" => InstallState::Installed,
                            "installing" => InstallState::Installing,
                            "update_available" => InstallState::UpdateAvailable,
                            "failed" => InstallState::Failed,
                            _ => InstallState::Available,
                        };
                    }
                }
            }
        }
    }

    pub async fn list_all(&self) -> Vec<PackageManifest> {
        self.sync_states_from_db().await;
        self.packages.read().unwrap().values().cloned().collect()
    }

    pub async fn list_by_kind(&self, kind: &ManifestKind) -> Vec<PackageManifest> {
        self.sync_states_from_db().await;
        self.packages
            .read()
            .unwrap()
            .values()
            .filter(|p| &p.kind == kind)
            .cloned()
            .collect()
    }

    pub async fn install(&self, id: &str) -> Result<(), String> {
        {
            let mut packages = self.packages.write().unwrap();
            if let Some(pkg) = packages.get_mut(id) {
                tracing::info!("Registry: Installing package '{}'", pkg.name);
                pkg.install_state = InstallState::Installed;
            } else {
                return Err(format!("Package '{}' not found in registry", id));
            }
        }

        if let Some(pool) = &self.pg_pool {
            let _ = sqlx::query(
                "INSERT INTO installed_packages (package_id, install_state) VALUES ($1, 'installed') \
                 ON CONFLICT (package_id) DO UPDATE SET install_state = 'installed'"
            )
            .bind(id)
            .execute(pool)
            .await;
        }
        Ok(())
    }

    pub async fn uninstall(&self, id: &str) -> Result<(), String> {
        {
            let mut packages = self.packages.write().unwrap();
            if let Some(pkg) = packages.get_mut(id) {
                tracing::info!("Registry: Uninstalling package '{}'", pkg.name);
                pkg.install_state = InstallState::Available;
            } else {
                return Err(format!("Package '{}' not found", id));
            }
        }

        if let Some(pool) = &self.pg_pool {
            let _ = sqlx::query(
                "INSERT INTO installed_packages (package_id, install_state) VALUES ($1, 'available') \
                 ON CONFLICT (package_id) DO UPDATE SET install_state = 'available'"
            )
            .bind(id)
            .execute(pool)
            .await;
        }
        Ok(())
    }

    pub fn get(&self, id: &str) -> Option<PackageManifest> {
        self.packages.read().unwrap().get(id).cloned()
    }
}

impl Default for RegistryService {
    fn default() -> Self {
        Self::new(None)
    }
}
