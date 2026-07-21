import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, Play, AlertTriangle, Activity, 
  Database, Network, Users, UserCheck, Flame, Compass, HeartPulse, 
  Terminal as TermIcon, FileSpreadsheet, Server, BarChart3, TrendingUp, 
  Cpu, Layers, Cloud, Clock, RefreshCw, Zap, Laptop, Search, Key, Lock, 
  Shield, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Route = createFileRoute('/validation')({
  component: ValidationDashboard,
});

const SCENARIOS = [
  { id: 1, name: "Identity Lifecycle", target: "Workday → Azure AD → ServiceNow", desc: "Employee joins: automatically provisions accounts, sets managers, assigns laptop, email, groups, and welcome notifications." },
  { id: 2, name: "Employee Transfer", target: "Workday → Okta → SAP", desc: "Employee moves from Finance to Security: revokes old system permissions and grants new ones dynamically without privilege creep." },
  { id: 3, name: "Manager Leaves", target: "Workday → Jira → ServiceNow", desc: "Manager exits: dynamically re-routes direct reports, approvals, asset custodians, and project ownership." },
  { id: 4, name: "Vendor Access", target: "Okta → Active Directory → Palo Alto", desc: "Temporary vendor credential expires after 30 days: auto disables AD account, revokes SSL-VPN certificates, and archives sessions." },
  { id: 5, name: "Insider Threat Mitigation", target: "CrowdStrike → Okta → Active Directory", desc: "Employee downloads 250 GB code at 2 AM from unknown laptop: auto-isolates host, revokes SSO tokens, and triggers AI audit." },
  { id: 6, name: "Cascading Incident", target: "Palo Alto → Kubernetes → AWS", desc: "Core firewall failure: maps topology to find affected servers, Kubernetes clusters, and calculates business impact & revenue loss." },
  { id: 7, name: "Failed Change Rollback", target: "GitLab CI/CD → ServiceNow → Datadog", desc: "Deployment fails: automatically rolls back to stable version, notifies stakeholders, and drafts Root Cause Analysis (RCA)." },
  { id: 8, name: "Compliance Audit Scan", target: "Azure AD → Okta → Governance Engine", desc: "Finds inactive admin accounts with no MFA: locks accounts, generates compliance logs, and publishes SOC2/GDPR evidence." },
  { id: 9, name: "People Engineering & Burnout", target: "SRE Check-ins → PagerDuty → Teams", desc: "Correlates check-in mood, off-hours work, and incident rosters to calculate burnout risk and recommend recovery." },
  { id: 10, name: "Multi-Hop Graph Tracer", target: "Ontology Graph → Splunk → SAP Finance", desc: "Dependency traversal: Alert → User → Laptop → VPN → Firewall → Server → Database → Customer → Executive Owner → Revenue." },
  { id: 11, name: "AI Disk Auto-Expansion", target: "Prometheus → AWS EBS → Linux Agent", desc: "Self-healing: disk storage reaches 95%. AI expands cloud volume, resizes file system, updates CMDB, and closes incident." },
  { id: 12, name: "Disaster Recovery Failover", target: "AWS Route53 → Cloudflare → GCP", desc: "Primary region outage: fails over databases, switches DNS profiles, verifies replica data integrity, and checks SLAs." },
  { id: 13, name: "Executive CEO Dashboard", target: "ED Corp Analytics Console", desc: "CEO view: real-time business health score, active MTTR/MTTD analytics, optimized cloud spend, and automated resolution rates." }
];

const ENDPOINT_SCENARIOS = [
  { id: 14, name: "Device Enrollment", target: "UEM Portal → TPM → Workday", desc: "Auto-enroll corporate assets with hardware TPM signatures, user identity mapping, and default profile deployments." },
  { id: 15, name: "Configuration Drift Remediation", target: "Local Agent → Desired State Baseline", desc: "Scan and detect configuration drift (e.g. firewall deactivated) and push silent auto-healing remediation." },
  { id: 16, name: "Phased Patch Management", target: "WSUS / APT → Pilot Group → Rollback", desc: "Deploy critical security patches to 10% pilot devices, detect failure telemetry, and trigger automated rollbacks." },
  { id: 17, name: "Autonomous Software Deployment", target: "Silent Installer → WSL2 Dependency", desc: "Deliver enterprise software packages checking runtime dependencies (WSL2), resource constraints, and licensing." },
  { id: 18, name: "Scale Remote Management", target: "Event Bus → 5,000+ Active Servers", desc: "Execute parallel diagnostic scripts across thousands of servers, aggregating real-time stdout streams." },
  { id: 19, name: "Zero-Trust Compliance Baseline", target: "Secure Boot + BitLocker + EDR State", desc: "Verify hardware state compliance (TPM, Secure Boot, EDR agent signatures) and quarantine non-compliant hosts." },
  { id: 20, name: "Asset Lifecycle Audit", target: "Procurement PO → NIST Wipe Retirement", desc: "Track devices from PO registry to active lifecycle monitoring and secure cryptographic wipe on asset disposal." },
  { id: 21, name: "AI Device Self-Healing", target: "Telemetry Streams → AI Diagnosis", desc: "Observe device crash statistics, recognize memory leaks, and autonomously perform cached cleanups and service restarts." },
  { id: 22, name: "Active Incident Security Response", target: "Mimikatz Detection → CrowdStrike Isolate", desc: "Contain credential-harvesting threats by network isolation, remote memory forensics, and Okta session revokes." },
  { id: 23, name: "High-Scale Telemetry Ingestion", target: "100k Agents → TimescaleDB → Graph", desc: "Verify A.L.F.R.E.D. pipeline ingest rate (35k/s) under synthetic load from 100,000 active telemetry channels." }
];

const ALL_SCENARIOS = [...SCENARIOS, ...ENDPOINT_SCENARIOS];

const SCENARIO_NODES: Record<number, { id: string; label: string; desc: string; icon: string; phase: number }[]> = {
  1: [
    { id: "hr", label: "Workday HR", desc: "Create employee", icon: "Users", phase: 20 },
    { id: "id", label: "Azure AD", desc: "Generate identity", icon: "UserCheck", phase: 40 },
    { id: "asset", label: "ServiceNow", desc: "Provision laptop", icon: "Server", phase: 60 },
    { id: "app", label: "Okta / Google", desc: "Grant group access", icon: "Layers", phase: 80 },
    { id: "comm", label: "Slack welcome", desc: "Welcome workflow", icon: "Zap", phase: 100 }
  ],
  2: [
    { id: "req", label: "Workday", desc: "Detect transfer", icon: "Users", phase: 20 },
    { id: "calc", label: "ALFRED Engine", desc: "Calculate access", icon: "Cpu", phase: 50 },
    { id: "auth", label: "Okta/Azure AD", desc: "Revoke/grant", icon: "Layers", phase: 80 },
    { id: "sap", label: "SAP / ServiceNow", desc: "Update cost assets", icon: "Database", phase: 100 }
  ],
  3: [
    { id: "exit", label: "Workday", desc: "Manager exit", icon: "Users", phase: 25 },
    { id: "alfred", label: "ALFRED Engine", desc: "Re-route reports", icon: "Cpu", phase: 60 },
    { id: "jira", label: "Jira / ServiceNow", desc: "Reassign boards", icon: "Layers", phase: 85 },
    { id: "cred", label: "Okta ID", desc: "Re-assign AI agents", icon: "UserCheck", phase: 100 }
  ],
  4: [
    { id: "okta", label: "Okta Scan", desc: "Detect 30-day age", icon: "UserCheck", phase: 30 },
    { id: "ad", label: "Active Directory", desc: "Disable login", icon: "Database", phase: 60 },
    { id: "fw", label: "Palo Alto FW", desc: "Revoke VPN cert", icon: "Network", phase: 85 },
    { id: "splunk", label: "Splunk Vault", desc: "Archive session", icon: "Server", phase: 100 }
  ],
  5: [
    { id: "cs", label: "CrowdStrike", desc: "Detect 250GB d/l", icon: "ShieldAlert", phase: 20 },
    { id: "ml", label: "ALFRED ML", desc: "Flag 98 Risk score", icon: "Cpu", phase: 50 },
    { id: "lock", label: "Okta / EDR", desc: "Isolate network", icon: "Layers", phase: 75 },
    { id: "graph", label: "Ontology Graph", desc: "Trace blast radius", icon: "Network", phase: 100 }
  ],
  6: [
    { id: "fw", label: "Palo Alto FW", desc: "Firewall failure", icon: "Network", phase: 30 },
    { id: "ont", label: "Ontology Engine", desc: "Map server paths", icon: "Database", phase: 60 },
    { id: "k8s", label: "K8s Monitor", desc: "Find offline pods", icon: "Server", phase: 80 },
    { id: "fin", label: "SAP Finance", desc: "Calc revenue loss", icon: "BarChart3", phase: 100 }
  ],
  7: [
    { id: "git", label: "GitLab CI", desc: "Deploy updates", icon: "Layers", phase: 25 },
    { id: "dd", label: "Datadog / Prom", desc: "Detect 500 error", icon: "Activity", phase: 50 },
    { id: "wf", label: "ALFRED Workflow", desc: "Rollback config", icon: "Zap", phase: 75 },
    { id: "rca", label: "AI Copilot", desc: "Generate RCA", icon: "Flame", phase: 100 }
  ],
  8: [
    { id: "auth", label: "Azure AD/Okta", desc: "Scan 120k users", icon: "Users", phase: 30 },
    { id: "calc", label: "ALFRED Engine", desc: "Find non-MFA admins", icon: "Cpu", phase: 60 },
    { id: "gov", label: "Governance Engine", desc: "Lock accounts & logs", icon: "ShieldCheck", phase: 100 }
  ],
  9: [
    { id: "mood", label: "SRE Check-ins", desc: "Sentiment analysis", icon: "HeartPulse", phase: 30 },
    { id: "comm", label: "Teams / Slack", desc: "Monitor chat rate", icon: "Activity", phase: 60 },
    { id: "pager", label: "PagerDuty/Jira", desc: "Incident correlation", icon: "Flame", phase: 85 },
    { id: "ai", label: "AI Agent", desc: "Queue HR rest days", icon: "UserCheck", phase: 100 }
  ],
  10: [
    { id: "alert", label: "EDR Alarm", desc: "Trigger alert", icon: "ShieldAlert", phase: 20 },
    { id: "user", label: "Azure AD", desc: "Find user & device", icon: "Users", phase: 40 },
    { id: "net", label: "Palo Alto / VPN", desc: "Check firewall route", icon: "Network", phase: 60 },
    { id: "db", label: "PostgreSQL", desc: "Database target", icon: "Database", phase: 80 },
    { id: "graph", label: "Ontology Graph", desc: "Trace BU & Revenue", icon: "BarChart3", phase: 100 }
  ],
  11: [
    { id: "mon", label: "Prometheus", desc: "Disk capacity 95%", icon: "Activity", phase: 20 },
    { id: "sop", label: "ALFRED SOP", desc: "Validate expansion rules", icon: "Cpu", phase: 50 },
    { id: "aws", label: "AWS EBS", desc: "Resize volume size", icon: "Cloud", phase: 75 },
    { id: "verify", label: "Linux Agent", desc: "Expand file system", icon: "Server", phase: 100 }
  ],
  12: [
    { id: "cloud", label: "AWS Health", desc: "Outage us-east-1", icon: "Cloud", phase: 30 },
    { id: "dns", label: "Cloudflare/Route53", desc: "Switch DNS profile", icon: "Network", phase: 60 },
    { id: "db", label: "PostgreSQL Replica", desc: "Verify sync latency", icon: "Database", phase: 85 },
    { id: "sla", label: "ALFRED Engine", desc: "Validate SLAs", icon: "BarChart3", phase: 100 }
  ],
  13: [
    { id: "alfred", label: "ALFRED Engine", desc: "Retrieve platform KPIs", icon: "Cpu", phase: 30 },
    { id: "people", label: "People Engine", desc: "Pull SRE sentiment", icon: "HeartPulse", phase: 60 },
    { id: "finance", label: "SAP Ledger", desc: "Compile cost savings", icon: "BarChart3", phase: 100 }
  ],
  14: [
    { id: "req", label: "UEM Agent", desc: "Enrollment request", icon: "Activity", phase: 20 },
    { id: "tpm", label: "TPM validation", desc: "Check signature", icon: "Key", phase: 40 },
    { id: "wd", label: "Workday lookup", desc: "Map ownership", icon: "Users", phase: 60 },
    { id: "policy", label: "Config Engine", desc: "Deploy security profile", icon: "Cpu", phase: 80 },
    { id: "neo4j", label: "Ontology Engine", desc: "Knowledge graph link", icon: "Database", phase: 100 }
  ],
  15: [
    { id: "agent", label: "Local Agent", desc: "Collect state configs", icon: "Activity", phase: 20 },
    { id: "scan", label: "Drift scan", desc: "Compare desired baseline", icon: "Search", phase: 50 },
    { id: "remedy", label: "Workflow Engine", desc: "Trigger self-healing SOP", icon: "Zap", phase: 80 },
    { id: "verify", label: "Governance", desc: "Verify compliance check", icon: "ShieldCheck", phase: 100 }
  ],
  16: [
    { id: "cve", label: "Security Bulletin", desc: "Identify vulnerability", icon: "Compass", phase: 20 },
    { id: "pilot", label: "Local Agent", desc: "Deploy pilot (10% nodes)", icon: "Layers", phase: 40 },
    { id: "crash", label: "Telemetry scan", desc: "Detect BSOD triggers", icon: "Flame", phase: 65 },
    { id: "rollback", label: "Workflow Engine", desc: "Roll back KB patch", icon: "Zap", phase: 85 },
    { id: "notify", label: "Jira / Slack", desc: "Halt run & alert team", icon: "ShieldAlert", phase: 100 }
  ],
  17: [
    { id: "req", label: "Registry Service", desc: "Package deploy request", icon: "Layers", phase: 25 },
    { id: "wsl", label: "ALFRED Engine", desc: "Verify WSL2 dependency", icon: "Cpu", phase: 50 },
    { id: "disk", label: "Local Agent", desc: "Confirm disk capacity", icon: "Server", phase: 75 },
    { id: "install", label: "Silent MSI", desc: "Deploy application", icon: "Zap", phase: 100 }
  ],
  18: [
    { id: "cmd", label: "ALFRED Engine", desc: "Parse mass check payload", icon: "Cpu", phase: 25 },
    { id: "bus", label: "Event Bus", desc: "Dispatch parallel script", icon: "Network", phase: 55 },
    { id: "targets", label: "5,000 Servers", desc: "Run commands", icon: "Server", phase: 80 },
    { id: "agg", label: "Governance", desc: "Aggregate output logs", icon: "ShieldCheck", phase: 100 }
  ],
  19: [
    { id: "state", label: "Local Agent", desc: "Query boot parameters", icon: "Activity", phase: 25 },
    { id: "tpm", label: "TPM & Secure Boot", desc: "Verify secure states", icon: "ShieldCheck", phase: 50 },
    { id: "edr", label: "CrowdStrike", desc: "Check EDR update time", icon: "ShieldAlert", phase: 75 },
    { id: "lock", label: "Palo Alto / Okta", desc: "Quarantine host", icon: "Lock", phase: 100 }
  ],
  20: [
    { id: "po", label: "SAP Finance", desc: "Intake PO records", icon: "BarChart3", phase: 25 },
    { id: "cmdb", label: "ServiceNow CMDB", desc: "Add inventory serials", icon: "Database", phase: 50 },
    { id: "wipe", label: "Local Agent", desc: "Cryptographic wipe", icon: "Zap", phase: 80 },
    { id: "proof", label: "Governance", desc: "Capture NIST compliance", icon: "ShieldCheck", phase: 100 }
  ],
  21: [
    { id: "telemetry", label: "Local Agent", desc: "Monitor crash statistics", icon: "Activity", phase: 25 },
    { id: "ml", label: "ML Engine", desc: "Identify memory leak", icon: "Cpu", phase: 50 },
    { id: "heal", label: "Local Agent", desc: "Purge cache & restart", icon: "Zap", phase: 80 },
    { id: "kb", label: "Knowledge Base", desc: "Save SOP resolution", icon: "BookOpen", phase: 100 }
  ],
  22: [
    { id: "edr", label: "CrowdStrike EDR", desc: "Mimikatz dump alarm", icon: "ShieldAlert", phase: 20 },
    { id: "score", label: "ML Engine", desc: "Calculate risk 100/100", icon: "Cpu", phase: 45 },
    { id: "isolate", label: "CrowdStrike UEM", desc: "Isolate network line", icon: "Layers", phase: 70 },
    { id: "forensic", label: "Local Agent", desc: "Capture memory dump", icon: "Server", phase: 85 },
    { id: "revoke", label: "Okta ID", desc: "Terminate sessions", icon: "UserCheck", phase: 100 }
  ],
  23: [
    { id: "load", label: "Monitor Core", desc: "Inject 100k threads", icon: "Server", phase: 30 },
    { id: "bus", label: "Event Bus", desc: "Stream 35k events/s", icon: "Network", phase: 60 },
    { id: "db", label: "Storage Engine", desc: "Ingest to TimescaleDB", icon: "Database", phase: 85 },
    { id: "graph", label: "Ontology Engine", desc: "Traverse graph links", icon: "BarChart3", phase: 100 }
  ]
};

const SCALE_STATS = [
  { label: "Employees", value: "120,000", sub: "Global staff across 42 countries" },
  { label: "Contractors", value: "20,000", sub: "Temporary & project staff" },
  { label: "Vendors", value: "15,000", sub: "Managed external partners" },
  { label: "Clients", value: "2,500", sub: "Enterprise clients served" },
  { label: "Business Units", value: "25", sub: "Diverse operations divisions" },
  { label: "Applications", value: "1,200", sub: "Connected SaaS & microservices" },
  { label: "Servers", value: "5,000", sub: "Hybrid cloud virtual instances" },
  { label: "Network Devices", value: "7,500", sub: "Core switches and routers" },
  { label: "Cloud Resources", value: "100,000+", sub: "AWS, Azure, and GCP resources" },
  { label: "Knowledge Graph Nodes", value: "25 Million", sub: "Enterprise model relationships" },
  { label: "Graph Relationships", value: "450 Million", sub: "Entity link connections" },
  { label: "Daily Events", value: "50 Million", sub: "Processed metric & event data" }
];

const MATRIX_DOMAINS = [
  { domain: "Functional", test: "Identity lifecycle, provisioning, approvals", outcome: "Correct workflows, data consistency", status: "Nominal" },
  { domain: "Integration", test: "SAP ↔ Workday ↔ Azure AD ↔ ServiceNow ↔ Jira", outcome: "Reliable synchronization with retries and reconciliation", status: "Nominal" },
  { domain: "Performance", test: "50M events/day, 30K concurrent users", outcome: "Meets latency, throughput, and resource targets", status: "Nominal" },
  { domain: "Scalability", test: "Growth from 120K to 500K employees", outcome: "Linear scaling with no architectural bottlenecks", status: "Nominal" },
  { domain: "Security", test: "RBAC, ABAC, MFA, PAM, zero trust", outcome: "Unauthorized actions blocked and fully audited", status: "Nominal" },
  { domain: "Resilience", test: "Regional outage, service failure, database failover", outcome: "Automatic recovery within defined RTO/RPO", status: "Nominal" },
  { domain: "Data Integrity", test: "Cross-system synchronization", outcome: "No orphaned identities, duplicate assets, or inconsistent ownership", status: "Nominal" },
  { domain: "AI Validation", test: "RCA generation, risk scoring, recommendations", outcome: "Accurate, explainable, and traceable AI outputs", status: "Nominal" },
  { domain: "Graph Intelligence", test: "Multi-hop dependency traversal", outcome: "Complete impact analysis across people, assets, applications, and business units", status: "Nominal" },
  { domain: "Automation", test: "Self-healing infrastructure and approval workflows", outcome: "Deterministic execution with rollback and audit trail", status: "Nominal" },
  { domain: "Compliance", test: "SOX, ISO 27001, SOC 2, GDPR, HIPAA, NIST", outcome: "Required evidence generated and policy violations detected", status: "Nominal" },
  { domain: "Observability", test: "Metrics, logs, traces, health dashboards", outcome: "End-to-end visibility with actionable alerts", status: "Nominal" },
  { domain: "Usability", test: "Executive, manager, analyst, HR, vendor personas", outcome: "Role-appropriate dashboards and efficient task completion", status: "Nominal" },
  { domain: "Disaster Recovery", test: "Region loss and backup restoration", outcome: "Services restored within SLA and data integrity maintained", status: "Nominal" },
  { domain: "Penetration & Adversarial", test: "Credential theft, privilege escalation, lateral movement", outcome: "Threats detected, contained, and investigated automatically", status: "Nominal" },
  { domain: "Business Continuity", test: "Major supplier failure or key executive departure", outcome: "Business processes continue with reassigned ownership and automated workflows", status: "Nominal" }
];

function ValidationDashboard() {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'scale' | 'matrix'>('scenarios');
  const [selectedCategory, setSelectedCategory] = useState<'resiliency' | 'endpoints'>('resiliency');
  const [selectedScenarioId, setSelectedScenarioId] = useState<number>(1);
  const [simulating, setSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<any[]>([]);
  const [simResults, setSimResults] = useState<any>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch executive dashboard metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['validation-metrics'],
    queryFn: api.validation.getMetrics,
  });

  const runSimulationMutation = useMutation({
    mutationFn: (id: number) => api.validation.run(id),
    onSuccess: (data) => {
      setSimResults(data);
      refetchMetrics();
    }
  });

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const handleStartSimulation = async (scenarioId: number) => {
    setSimulating(true);
    setSimProgress(0);
    setCompletedSteps([]);
    setSimResults(null);
    setConsoleLogs([`[INFO] Starting Enterprise Validation Scenario ${scenarioId}: '${ALL_SCENARIOS.find(s => s.id === scenarioId)?.name}'...`]);

    const activeScenario = ALL_SCENARIOS.find(s => s.id === scenarioId);
    if (!activeScenario) return;

    // Simulate progressive log loading
    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += 20;
      setSimProgress(currentProgress);

      if (currentProgress === 20) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Initializing Ontology knowledge graph connectivity...`,
          `[INFO] Mapping connections across 42 geographies...`
        ]);
        setCompletedSteps([{ step: "1. Initialize knowledge graph", status: "completed", time: "0.1s" }]);
      } else if (currentProgress === 40) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Intercepting telemetry signals on target: ${activeScenario.target}`,
          `[WARNING] High traffic load verified. 120,000 worker identities cataloged.`
        ]);
        setCompletedSteps(prev => [...prev, { step: "2. Verify target integrations", status: "completed", time: "0.2s" }]);
      } else if (currentProgress === 60) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Executing Decision Engineering Engine evaluation...`,
          `[INFO] Risk rating assessment computed: CONFIDENCE = 99.4%`
        ]);
        setCompletedSteps(prev => [...prev, { step: "3. Run risk evaluation", status: "completed", time: "0.3s" }]);
      } else if (currentProgress === 80) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Triggering workflow self-healing playbook...`,
          `[INFO] Syncing compliance ledger with audit trail.`
        ]);
        setCompletedSteps(prev => [...prev, { step: "4. Trigger self-healing playbook", status: "completed", time: "0.4s" }]);
      } else if (currentProgress >= 100) {
        clearInterval(interval);
        // Call backend api
        runSimulationMutation.mutate(scenarioId);
      }
    }, 600);
  };

  useEffect(() => {
    if (runSimulationMutation.isSuccess && simResults) {
      setConsoleLogs(prev => [
        ...prev,
        ...simResults.logs,
        `[INFO] Audit trail captured. Audit Event ID: ${simResults.audit_event_id}`,
        `[SUCCESS] Scenario validation completed successfully. RESILIENCY Posture Nominal.`
      ]);
      setCompletedSteps(simResults.steps);
      setSimulating(false);
    }
  }, [simResults, runSimulationMutation.isSuccess]);

  const activeScenario = ALL_SCENARIOS.find(s => s.id === selectedScenarioId);

  // Business Unit Health chart data
  const buChartData = metrics?.business_unit_health?.map((bu: any) => ({
    name: bu.name,
    score: bu.score,
  })) || [
    { name: "Automotive", score: 98 },
    { name: "Healthcare", score: 95 },
    { name: "Banking", score: 89 },
    { name: "Government", score: 97 },
    { name: "Energy", score: 92 },
    { name: "Retail", score: 96 }
  ];

  const getNodeIcon = (iconName: string) => {
    switch (iconName) {
      case "Users": return <Users className="w-5 h-5 text-indigo-400" />;
      case "UserCheck": return <UserCheck className="w-5 h-5 text-emerald-400" />;
      case "Server": return <Server className="w-5 h-5 text-cyan-400" />;
      case "Layers": return <Layers className="w-5 h-5 text-sky-400" />;
      case "Zap": return <Zap className="w-5 h-5 text-amber-400 animate-pulse" />;
      case "Cpu": return <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />;
      case "Database": return <Database className="w-5 h-5 text-blue-400" />;
      case "Network": return <Network className="w-5 h-5 text-teal-400" />;
      case "ShieldAlert": return <ShieldAlert className="w-5 h-5 text-rose-450 animate-bounce" />;
      case "ShieldCheck": return <ShieldCheck className="w-5 h-5 text-emerald-450" />;
      case "Activity": return <Activity className="w-5 h-5 text-cyan-400" />;
      case "Flame": return <Flame className="w-5 h-5 text-orange-405 animate-pulse" />;
      case "HeartPulse": return <HeartPulse className="w-5 h-5 text-pink-400 animate-pulse" />;
      case "BarChart3": return <BarChart3 className="w-5 h-5 text-green-400" />;
      case "Cloud": return <Cloud className="w-5 h-5 text-sky-400" />;
      case "Compass": return <Compass className="w-5 h-5 text-amber-400" />;
      case "Laptop": return <Laptop className="w-5 h-5 text-slate-400" />;
      case "Search": return <Search className="w-5 h-5 text-cyan-400" />;
      case "Key": return <Key className="w-5 h-5 text-amber-400" />;
      case "Lock": return <Lock className="w-5 h-5 text-rose-400 animate-pulse" />;
      case "Shield": return <Shield className="w-5 h-5 text-emerald-400" />;
      case "BookOpen": return <BookOpen className="w-5 h-5 text-indigo-400" />;
      default: return <Zap className="w-5 h-5 text-primary" />;
    }
  };

  const Gauge = ({ value, max, label, colorClass, statusText }: { value: number; max: number; label: string; colorClass: string; statusText: string }) => {
    const percentage = (value / max) * 100;
    
    return (
      <div className="flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 w-full h-[155px] relative overflow-hidden">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="relative w-20 h-20 mt-1.5 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
            <circle cx="40" cy="40" r="32" 
              stroke="currentColor" 
              strokeWidth="6" 
              fill="transparent" 
              className={`transition-all duration-500 ease-out ${colorClass}`}
              strokeDasharray="201"
              strokeDashoffset={201 - (201 * percentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-base font-black text-slate-100">{value}</div>
        </div>
        <div className="text-[10px] font-extrabold mt-1 text-slate-300">{statusText}</div>
      </div>
    );
  };

  const expectedRiskValue = (() => {
    const id = selectedScenarioId;
    if (id === 1) return 10;
    if (id === 2) return 35;
    if (id === 3) return 48;
    if (id === 4) return 15;
    if (id === 5) return 98;
    if (id === 6) return 85;
    if (id === 7) return 75;
    if (id === 8) return 92;
    if (id === 9) return 60;
    if (id === 10) return 90;
    if (id === 11) return 20;
    if (id === 12) return 78;
    if (id === 13) return 12;
    if (id === 14) return 10;
    if (id === 15) return 30;
    if (id === 16) return 45;
    if (id === 17) return 15;
    if (id === 18) return 25;
    if (id === 19) return 50;
    if (id === 20) return 8;
    if (id === 21) return 18;
    if (id === 22) return 95;
    if (id === 23) return 70;
    return 10;
  })();

  const currentRisk = (() => {
    if (!simulating) {
      return simResults ? simResults.risk_score : 10;
    }
    if (simProgress <= 20) return 10;
    if (simProgress <= 80) {
      const fraction = (simProgress - 20) / 60;
      return Math.round(10 + fraction * (expectedRiskValue - 10));
    }
    return expectedRiskValue;
  })();

  const systemHealth = (() => {
    if (!simulating) {
      return simResults ? 98 : 98;
    }
    if (simProgress <= 20) return 98;
    if (simProgress <= 70) {
      const fraction = (simProgress - 20) / 50;
      const dropAmount = Math.max(10, expectedRiskValue);
      return Math.round(98 - fraction * dropAmount);
    }
    if (simProgress <= 100) {
      const fraction = (simProgress - 70) / 30;
      const currentLow = 98 - Math.max(10, expectedRiskValue);
      return Math.round(currentLow + fraction * (98 - currentLow));
    }
    return 98;
  })();

  const scenariosToShow = selectedCategory === 'resiliency' ? SCENARIOS : ENDPOINT_SCENARIOS;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes dash-stream {
          0% { left: 0%; opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Enterprise Validation Scenario
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Validate platform resilience under the complexity of <strong>ED Corporation Global</strong> (120,000 employees, 42 countries, 25M graph nodes).
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-muted/30 border border-border p-1 rounded-lg shrink-0">
          {[
            { id: 'scenarios', label: 'Test Scenarios', icon: Zap },
            { id: 'scale', label: 'Scale Metrics', icon: Server },
            { id: 'matrix', label: 'Validation Matrix', icon: FileSpreadsheet }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/55'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Scenarios */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl shadow-sm flex flex-col h-[700px] overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Scenario Directory</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Select a validation test pattern</p>
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                ED Corporation Global
              </span>
            </div>

            {/* Category Toggle */}
            <div className="p-3 border-b border-border bg-muted/10 flex gap-2">
              <button
                onClick={() => {
                  setSelectedCategory('resiliency');
                  setSelectedScenarioId(1);
                  setConsoleLogs([]);
                  setCompletedSteps([]);
                  setSimResults(null);
                }}
                className={`flex-1 text-center py-1.5 px-2 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                  selectedCategory === 'resiliency'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm font-extrabold'
                    : 'text-muted-foreground bg-transparent border-border hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                Platform Resiliency
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('endpoints');
                  setSelectedScenarioId(14);
                  setConsoleLogs([]);
                  setCompletedSteps([]);
                  setSimResults(null);
                }}
                className={`flex-1 text-center py-1.5 px-2 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                  selectedCategory === 'endpoints'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm font-extrabold'
                    : 'text-muted-foreground bg-transparent border-border hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                Endpoint Engineering
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {scenariosToShow.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setConsoleLogs([]);
                    setCompletedSteps([]);
                    setSimResults(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedScenarioId === sc.id
                      ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/15'
                      : 'bg-background border-border hover:border-primary/20 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">#{sc.id}</span>
                        {sc.name}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">
                        {sc.desc}
                      </p>
                      <div className="text-[9px] font-semibold text-primary/70 font-mono mt-2">
                        {sc.target}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Scenario Simulator Panel */}
          <div className="lg:col-span-7 space-y-6">
            {activeScenario && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5 flex flex-col min-h-[420px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Activity className="w-32 h-32 text-primary" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Validation Test Scenario #{activeScenario.id}
                    </span>
                    <h2 className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100">{activeScenario.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-normal max-w-lg">
                      {activeScenario.desc}
                    </p>
                  </div>

                  <button
                    disabled={simulating}
                    onClick={() => handleStartSimulation(activeScenario.id)}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    {simulating ? 'Simulating...' : 'Run Simulation'}
                  </button>
                </div>

                {/* Progress bar */}
                {simulating && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden animate-pulse">
                    <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${simProgress}%` }} />
                  </div>
                )}


                {/* Visual Topology Flow Visualizer */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] w-full">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />
                  <div className="absolute top-2 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Operational Topology Flow Visualizer
                  </div>
                  
                  <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 w-full max-w-4xl py-3 mt-2">
                    {(SCENARIO_NODES[selectedScenarioId] || []).map((node, index, arr) => {
                      const isActive = simulating && simProgress >= node.phase;
                      const isPending = simulating && simProgress < node.phase && (index === 0 || simProgress >= (arr[index-1]?.phase ?? 0));
                      const isCompleted = !simulating ? simResults !== null : simProgress >= node.phase;
                      
                      let borderGlow = "border-slate-800 bg-slate-900/40 text-slate-400";
                      if (isActive || isCompleted) {
                        borderGlow = "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-primary/20";
                      } else if (isPending) {
                        borderGlow = "border-amber-500/40 bg-amber-500/5 text-amber-400 animate-pulse";
                      }
                      
                      return (
                        <div key={node.id} className="flex items-center gap-2 sm:gap-4 relative shrink-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${borderGlow}`}>
                              {getNodeIcon(node.icon)}
                            </div>
                            <div className="text-[10px] font-bold text-center mt-1.5 max-w-[85px] break-words text-slate-200 font-sans">
                              {node.label}
                            </div>
                            <div className="text-[8px] text-slate-450 text-center max-w-[85px] mt-0.5 leading-tight font-sans">
                              {node.desc}
                            </div>
                          </div>
                          
                          {index < arr.length - 1 && (
                            <div className="hidden sm:flex items-center w-6 sm:w-10 h-0.5 bg-slate-800 relative -top-3">
                              <div 
                                className={`absolute left-0 top-0 h-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)] transition-all duration-300 ${
                                  isCompleted ? 'w-full' : 'w-0'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Split layout: Dials & Console logs */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Telemetry Dials */}
                  <div className="md:col-span-4 flex flex-row md:flex-col gap-3">
                    <Gauge 
                      value={currentRisk} 
                      max={100} 
                      label="ML Risk level" 
                      colorClass={currentRisk > 60 ? "text-rose-500" : currentRisk > 30 ? "text-amber-450" : "text-emerald-400"}
                      statusText={currentRisk > 60 ? "CRITICAL RISK" : currentRisk > 30 ? "WARNING" : "LOW RISK"}
                    />
                    <Gauge 
                      value={systemHealth} 
                      max={100} 
                      label="Security Health" 
                      colorClass={systemHealth < 50 ? "text-rose-500 animate-pulse" : systemHealth < 90 ? "text-amber-450" : "text-emerald-400"}
                      statusText={systemHealth < 50 ? "COMPROMISED" : systemHealth < 90 ? "ATTENUATING" : "NOMINAL"}
                    />
                  </div>

                  {/* Terminal Console Output */}
                  <div className="md:col-span-8 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col h-[322px]">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold border-b border-white/5 pb-2 shrink-0">
                      <TermIcon className="w-3.5 h-3.5" />
                      Live SRE Analytics Log Stream
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400/90 mt-3 space-y-1.5 pr-1 leading-normal">
                      {consoleLogs.length === 0 ? (
                        <div className="text-slate-600 italic">SYSTEM IDLE: Waiting for run instruction.</div>
                      ) : (
                        consoleLogs.map((log, idx) => {
                          const isWarn = log.includes('[WARNING]');
                          const isAlert = log.includes('[ALERT]') || log.includes('[CRITICAL]');
                          const isSuccess = log.includes('[SUCCESS]');
                          let colorClass = "text-emerald-400/90";
                          if (isWarn) colorClass = "text-amber-400";
                          if (isAlert) colorClass = "text-rose-450 font-bold";
                          if (isSuccess) colorClass = "text-cyan-400 font-bold";

                          return (
                            <div key={idx} className={`${colorClass} whitespace-pre-wrap`}>
                              {log}
                            </div>
                          );
                        })
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </div>

                {/* Audit details when complete */}
                {simResults && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">SOX & ISO-27001 Validation Audit Logged</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          UUID: {simResults.audit_event_id}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <span className="text-[10px] font-bold text-emerald-400">Risk Score Impact: {simResults.risk_score}/100</span>
                      <span className="text-[9px] text-muted-foreground">Compliance Verification Approved</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CEO Executive Dashboard View */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-border/50 pb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  CEO Executive Live Scorecard &mdash; ED Corporation Global
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aggregate operational analytics feed demonstrating real-time organizational KPIs.
                </p>
              </div>

              {/* CEO Dashboard Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Org Health Score", value: metrics?.health_score ? `${metrics.health_score}/100` : "94/100", color: "text-emerald-400" },
                  { label: "Revenue at Risk", value: metrics?.revenue_at_risk_usd ? `$${metrics.revenue_at_risk_usd.toLocaleString()}/hr` : "$15,000/hr", color: "text-rose-400" },
                  { label: "Mean Time To Detect (MTTD)", value: metrics?.mean_time_to_detect_sec ? `${metrics.mean_time_to_detect_sec} sec` : "42 sec", color: "text-primary" },
                  { label: "Mean Time To Recover (MTTR)", value: metrics?.mean_time_to_recover_min ? `${metrics.mean_time_to_recover_min} min` : "14 min", color: "text-primary" },
                  { label: "Compliance Score", value: metrics?.compliance_score ? `${metrics.compliance_score}%` : "100%", color: "text-emerald-400" },
                  { label: "AI Resolution Success", value: metrics?.ai_automation_success_rate ? `${metrics.ai_automation_success_rate}%` : "91.5%", color: "text-cyan-400" },
                  { label: "Security Posture", value: metrics?.security_posture || "A+", color: "text-emerald-400" },
                  { label: "Monthly Cloud Spend", value: metrics?.cloud_spend_monthly_usd ? `$${metrics.cloud_spend_monthly_usd.toLocaleString()}` : "$240,500", color: "text-slate-200" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-muted/10 border border-border/40 p-4 rounded-xl relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
                    <div className={`text-lg font-extrabold mt-2 ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Live BU health chart */}
              <div className="bg-muted/5 border border-border/40 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200">Business Unit Resiliency Score</h4>
                  <span className="text-[9px] bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded-full font-bold uppercase">
                    All nominal
                  </span>
                </div>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 10 }} />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {buChartData.map((entry: any, idx: number) => (
                          <Cell 
                            key={`cell-${idx}`} 
                            fill={entry.score < 90 ? '#f43f5e' : entry.score < 95 ? 'hsl(var(--primary))' : '#10b981'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scale Metrics Tab */}
      {activeTab === 'scale' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold">ED Corporation Global &mdash; Scale & Dimensions</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Validation parameters configured for load validation. Scale models reflect realistic global multinational structures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SCALE_STATS.map((stat, idx) => (
              <div key={idx} className="p-5 border border-border bg-muted/10 rounded-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
                  <div className="text-2xl font-black mt-2 text-foreground">{stat.value}</div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-3 border-t border-border/30 pt-2">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Infrastructure Systems list */}
          <div className="bg-muted/10 border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Systems Connected</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "Azure AD", "Google Workspace", "Microsoft 365", "SAP", "Oracle ERP", "Workday", 
                "Jira", "ServiceNow", "GitHub", "GitLab", "AWS", "Azure", "GCP", "VMWare", 
                "Cisco", "Fortinet", "Palo Alto", "CrowdStrike", "SentinelOne", "Slack", 
                "Teams", "Zoom", "Snowflake", "PowerBI", "Salesforce", "Okta", "Auth0", 
                "Datadog", "Splunk", "Elastic", "Zabbix", "Prometheus", "Grafana", 
                "Kubernetes", "Docker", "Linux VMs", "Windows Servers", "MacOS Laptops"
              ].map((sys, idx) => (
                <span key={idx} className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono text-[10px]">
                  {sys}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-xl font-bold">End-to-End Enterprise Validation Matrix</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Standard compliance checklists required to verify architectural readiness.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3.5 font-bold uppercase text-muted-foreground tracking-wider w-1/4">Test Domain</th>
                  <th className="text-left px-6 py-3.5 font-bold uppercase text-muted-foreground tracking-wider w-1/3">Validation Scope</th>
                  <th className="text-left px-6 py-3.5 font-bold uppercase text-muted-foreground tracking-wider w-1/3">Expected Outcome</th>
                  <th className="text-center px-6 py-3.5 font-bold uppercase text-muted-foreground tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {MATRIX_DOMAINS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{row.domain}</td>
                    <td className="px-6 py-4 text-muted-foreground leading-normal">{row.test}</td>
                    <td className="px-6 py-4 text-muted-foreground leading-normal">{row.outcome}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
