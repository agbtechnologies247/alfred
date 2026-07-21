import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, ShieldCheck, Play, Activity,
  Database, Network, Users, UserCheck, Flame, Compass,
  Terminal as TermIcon, Server, Cpu, Layers, Zap, Search, Lock,
  Shield, BookOpen
} from 'lucide-react';

interface Scenario {
  id: number;
  name: string;
  target: string;
  desc: string;
  whyMatters: string;
  opexSaving: string;
  steps: string[];
  logs: string[];
  nodes: { id: string; label: string; desc: string; icon: string; phase: number }[];
  expectedRisk: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Identity Lifecycle",
    target: "Workday → Azure AD → ServiceNow",
    desc: "Employee joins: automatically provisions accounts, sets managers, assigns laptop, email, groups, and welcome notifications.",
    whyMatters: "Manual employee onboarding takes an average of 4.2 hours per employee across corporate directories. A.L.F.R.E.D. automates this end-to-end in seconds, maintaining consistent access logs.",
    opexSaving: "Saves $180 per hire in administrative overhead and eliminates ticket backlog.",
    expectedRisk: 10,
    steps: [
      "1. HR creates employee record (Workday)",
      "2. Generate enterprise identity (Azure AD)",
      "3. Assign manager & department (Workday)",
      "4. Provision laptop asset (ServiceNow)",
      "5. Configure email and default groups (Google Workspace)",
      "6. Grant basic applications access (Okta)",
      "7. Welcome workflow notification triggered (Slack)"
    ],
    logs: [
      "[INFO] Employee join event triggered from HR portal.",
      "[INFO] Provisioning account for new hire in Azure AD.",
      "[INFO] Ticket created: Assigning corporate laptop ID: LAP-78901.",
      "[INFO] Syncing group permissions for department: 'Corporate IT'.",
      "[INFO] Welcome notification sent to channel #it-announcements."
    ],
    nodes: [
      { id: "hr", label: "Workday HR", desc: "Create employee", icon: "Users", phase: 20 },
      { id: "id", label: "Azure AD", desc: "Generate identity", icon: "UserCheck", phase: 40 },
      { id: "asset", label: "ServiceNow", desc: "Provision laptop", icon: "Server", phase: 60 },
      { id: "app", label: "Okta / Google", desc: "Grant group access", icon: "Layers", phase: 80 },
      { id: "comm", label: "Slack welcome", desc: "Welcome workflow", icon: "Zap", phase: 100 }
    ]
  },
  {
    id: 2,
    name: "Employee Transfer",
    target: "Workday → Okta → SAP",
    desc: "Employee moves from Finance to Security: revokes old system permissions and grants new ones dynamically without privilege creep.",
    whyMatters: "Privilege creep is a major risk during internal transfers. A.L.F.R.E.D. ensures old departmental roles are automatically purged before new credentials are provisioned.",
    opexSaving: "Eliminates security compliance audit findings and cuts access review times by 90%.",
    expectedRisk: 35,
    steps: [
      "1. Detect transfer request (Workday)",
      "2. Calculate target permission set (A.L.F.R.E.D. Engine)",
      "3. Revoke old department permissions (Azure AD / Okta)",
      "4. Grant new department permissions (Azure AD / Okta)",
      "5. Update assets and cost allocation (SAP / ServiceNow)"
    ],
    logs: [
      "[INFO] Transfer initiated: Employee moving from Finance to Security Operations.",
      "[WARNING] Revoking access token for Finance SAP Ledger.",
      "[INFO] Provisioning developer role in GitHub and Security Console access.",
      "[INFO] Access rights transition verified. 0 redundant privileges found."
    ],
    nodes: [
      { id: "req", label: "Workday", desc: "Detect transfer", icon: "Users", phase: 20 },
      { id: "calc", label: "ALFRED Engine", desc: "Calculate access", icon: "Cpu", phase: 50 },
      { id: "auth", label: "Okta/Azure AD", desc: "Revoke/grant", icon: "Layers", phase: 80 },
      { id: "sap", label: "SAP / ServiceNow", desc: "Update cost assets", icon: "Database", phase: 100 }
    ]
  },
  {
    id: 5,
    name: "Insider Threat Mitigation",
    target: "CrowdStrike → Okta → Active Directory",
    desc: "Employee downloads 250 GB code at 2 AM from unknown laptop: auto-isolates host, revokes SSO tokens, and triggers AI audit.",
    whyMatters: "Insider exfiltrations require immediate containment. A.L.F.R.E.D. bypasses slow ticket queues by auto-quarantining the endpoint and terminating sessions within milliseconds.",
    opexSaving: "Protects proprietary IP codebases and prevents multi-million dollar data breaches.",
    expectedRisk: 98,
    steps: [
      "1. Detect high volume download (250 GB) (CrowdStrike / Zabbix)",
      "2. Verify anomaly context (unknown laptop, 2 AM) (A.L.F.R.E.D. ML Engine)",
      "3. Generate Security Risk Score: 98/100 (A.L.F.R.E.D. Engine)",
      "4. Auto-isolate device and revoke tokens (CrowdStrike / Okta)",
      "5. Trigger AI analysis & graph expansion (Ontology Engine)",
      "6. Notify Security Analysts & Incident Command (Teams / Slack)"
    ],
    logs: [
      "[ALERT] Exfiltration anomaly: Host LAP-44102 downloaded 250 GB from core IP repository.",
      "[ALERT] Context warning: Unknown MAC address, auth source: VPN node, time: 02:14 AM.",
      "[CRITICAL] Risk score calculated at 98. Containment protocols initiated.",
      "[INFO] Host isolated dynamically via CrowdStrike API. SSO session terminated.",
      "[INFO] Knowledge Graph search: Alert -> User -> Laptop -> VPN -> IP -> Repo -> BU."
    ],
    nodes: [
      { id: "cs", label: "CrowdStrike", desc: "Detect 250GB d/l", icon: "ShieldAlert", phase: 20 },
      { id: "ml", label: "ALFRED ML", desc: "Flag 98 Risk score", icon: "Cpu", phase: 50 },
      { id: "lock", label: "Okta / EDR", desc: "Isolate network", icon: "Layers", phase: 75 },
      { id: "graph", label: "Ontology Graph", desc: "Trace blast radius", icon: "Network", phase: 100 }
    ]
  },
  {
    id: 7,
    name: "Failed Change Rollback",
    target: "GitLab CI/CD → ServiceNow → Datadog",
    desc: "Deployment fails: automatically rolls back to stable version, notifies stakeholders, and drafts Root Cause Analysis (RCA).",
    whyMatters: "Bad deployments degrade system uptime. A.L.F.R.E.D. monitors live errors post-deploy, triggers automated rollbacks, and writes an AI Root Cause Analysis (RCA) draft.",
    opexSaving: "Reduces deployment-related downtime by 98% and automates incident logs.",
    expectedRisk: 75,
    steps: [
      "1. Verify CAB change ticket status (ServiceNow)",
      "2. Deploy software update (GitLab CI/CD)",
      "3. Detect deployment errors / HTTP 500 spike (Datadog / Prometheus)",
      "4. Trigger automated rollback script (A.L.F.R.E.D. Workflow)",
      "5. Generate Root Cause Analysis (RCA) draft (AI Agent)",
      "6. Notify team & update change status (ServiceNow / Slack)"
    ],
    logs: [
      "[INFO] Software deployment CHG-00892 active: Updating billing-service v4.0.0.",
      "[ALERT] HTTP 500 error rate spiked to 14.2% within 90s.",
      "[WARNING] Rollback sequence triggered: Restoring deployment config to v3.9.5.",
      "[INFO] System recovered. Error rate returned to 0.01%.",
      "[INFO] AI RCA: Database schema incompatibility on field 'invoice_id'."
    ],
    nodes: [
      { id: "git", label: "GitLab CI", desc: "Deploy updates", icon: "Layers", phase: 25 },
      { id: "dd", label: "Datadog / Prom", desc: "Detect 500 error", icon: "Activity", phase: 50 },
      { id: "wf", label: "ALFRED Workflow", desc: "Rollback config", icon: "Zap", phase: 75 },
      { id: "rca", label: "AI Copilot", desc: "Generate RCA", icon: "Flame", phase: 100 }
    ]
  },
  {
    id: 11,
    name: "AI Disk Auto-Expansion",
    target: "Prometheus → AWS EBS → Linux Agent",
    desc: "Self-healing: disk storage reaches 95%. AI expands cloud volume, resizes file system, updates CMDB, and closes incident.",
    whyMatters: "Disk exhaustion is one of the most common causes of system downtime. A.L.F.R.E.D. detects high usage and automatically calls cloud APIs to expand storage on-the-fly without service interruption.",
    opexSaving: "Eliminates low-level midnight pages for SRE teams and prevents disk-full crashes.",
    expectedRisk: 20,
    steps: [
      "1. Detect disk usage at 95% (Prometheus / Zabbix)",
      "2. Verify disk expansion SOP safety rules (A.L.F.R.E.D. Engine)",
      "3. Trigger cloud VM volume expansion (+50 GB) (AWS EC2 / EBS)",
      "4. Resize partition file system (Linux SSH Agent)",
      "5. Update CMDB and change record (ServiceNow)",
      "6. Verify disk capacity & close incident (Prometheus)"
    ],
    logs: [
      "[ALERT] Host SRV-1029 disk storage capacity at 95.2%.",
      "[INFO] Matching self-healing SOP code: SOP-DISK-EXPAND.",
      "[INFO] Executing AWS EBS API command to increase volume size from 200 GB to 250 GB.",
      "[INFO] File system resized successfully. Available space now at 28%.",
      "[INFO] Incident ticket auto-resolved. CMDB entry synchronized."
    ],
    nodes: [
      { id: "mon", label: "Prometheus", desc: "Disk capacity 95%", icon: "Activity", phase: 20 },
      { id: "sop", label: "ALFRED SOP", desc: "Validate expansion rules", icon: "Cpu", phase: 50 },
      { id: "aws", label: "AWS EBS", desc: "Resize volume size", icon: "Cloud", phase: 75 },
      { id: "verify", label: "Linux Agent", desc: "Expand file system", icon: "Server", phase: 100 }
    ]
  },
  {
    id: 15,
    name: "Configuration Drift Remediation",
    target: "Local Agent → Desired State Baseline",
    desc: "Scan and detect configuration drift (e.g. firewall deactivated) and push silent auto-healing remediation.",
    whyMatters: "Endpoints often drift from their secure baseline state. A.L.F.R.E.D. monitors endpoints continuously, recognizes unauthorized alterations, and runs automated configurations to keep them locked.",
    opexSaving: "Saves manual troubleshooting time and maintains 100% security baseline compliance.",
    expectedRisk: 30,
    steps: [
      "1. Collect configuration state telemetry (Local Agent)",
      "2. Correlate with desired policy baseline (A.L.F.R.E.D. Engine)",
      "3. Identify unauthorized change (Firewall Disabled) (Config Engine)",
      "4. Trigger auto-healing remediation playbook (Workflow Engine)",
      "5. Apply target configuration state via remote agent (Local Agent)",
      "6. Re-evaluate compliance status (Governance Engine)"
    ],
    logs: [
      "[INFO] Configuration audit triggered for 70,000 laptops.",
      "[WARNING] Configuration drift detected on LP-ENG-8821: Local Firewall set to DISABLED (desired: ENABLED).",
      "[ALERT] Compliance violation flagged: Host security posture degraded.",
      "[INFO] Triggering self-healing playbook: SOP-FIREWALL-REMEDIATE.",
      "[INFO] Remote command dispatched to agent on LP-ENG-8821: netsh advfirewall set allprofiles state on.",
      "[INFO] Verification check passed: Firewall is now ENABLED. Policy drift resolved."
    ],
    nodes: [
      { id: "agent", label: "Local Agent", desc: "Collect state configs", icon: "Activity", phase: 20 },
      { id: "scan", label: "Drift scan", desc: "Compare desired baseline", icon: "Search", phase: 50 },
      { id: "remedy", label: "Workflow Engine", desc: "Trigger self-healing SOP", icon: "Zap", phase: 80 },
      { id: "verify", label: "Governance", desc: "Verify compliance check", icon: "ShieldCheck", phase: 100 }
    ]
  },
  {
    id: 16,
    name: "Phased Patch Management",
    target: "WSUS / APT → Pilot Group → Rollback",
    desc: "Deploy critical security patches to 10% pilot devices, detect failure telemetry, and trigger automated rollbacks.",
    whyMatters: "Bad patches can break business operations. A.L.F.R.E.D. deploys updates incrementally, monitors for crashes, and immediately uninstalls the patch if errors exceed compliance metrics.",
    opexSaving: "Allows secure, fully automated Patch Tuesdays without risk of global company downtime.",
    expectedRisk: 45,
    steps: [
      "1. Parse Microsoft/Linux kernel security bulletin (A.L.F.R.E.D. Engine)",
      "2. Generate deployment plan (Pilot -> Production) (Registry Service)",
      "3. Deploy KB-88219 patch to Pilot Group (10% devices) (Local Agent)",
      "4. Detect installation failure / blue screen telemetry (Zabbix / Datadog)",
      "5. Trigger automated rollback playbook (Workflow Engine)",
      "6. Halt production rollout & notify patch team (Slack / Jira)"
    ],
    logs: [
      "[INFO] Security bulletin parsed: Critical OS vulnerability CVE-2026-9902.",
      "[INFO] Deploying Patch KB-88219 to Pilot Group (7,000 devices).",
      "[WARNING] 12 devices in pilot reported installation failure: Error 0x800f081f.",
      "[ALERT] Rollback sequence initiated for affected pilot devices.",
      "[INFO] Dispatched uninstall command: wusa /uninstall /kb:88219 /quiet /norestart.",
      "[INFO] Production deployment halted. Incident ticket INC-9902 created for Patch team review."
    ],
    nodes: [
      { id: "cve", label: "Security Bulletin", desc: "Identify vulnerability", icon: "Compass", phase: 20 },
      { id: "pilot", label: "Local Agent", desc: "Deploy pilot (10% nodes)", icon: "Layers", phase: 40 },
      { id: "crash", label: "Telemetry scan", desc: "Detect BSOD triggers", icon: "Flame", phase: 65 },
      { id: "rollback", label: "Workflow Engine", desc: "Roll back KB patch", icon: "Zap", phase: 85 },
      { id: "notify", label: "Jira / Slack", desc: "Halt run & alert team", icon: "ShieldAlert", phase: 100 }
    ]
  },
  {
    id: 22,
    name: "Active Incident Security Response",
    target: "Mimikatz Detection → CrowdStrike Isolate",
    desc: "Contain credential-harvesting threats by network isolation, remote memory forensics, and Okta session revokes.",
    whyMatters: "Adversarial attacks sweep credentials in minutes. A.L.F.R.E.D. correlates EDR detection, initiates zero-trust lockdowns, blocks VPN nodes, and captures forensic dumps for review.",
    opexSaving: "Locks down compromised active sessions in under 5 seconds, stopping lateral movement.",
    expectedRisk: 95,
    steps: [
      "1. Intercept EDR compromise alert (Mimikatz memory scan) (CrowdStrike)",
      "2. Generate security risk score (100/100) (Ml Engine)",
      "3. Send automated containment command (A.L.F.R.E.D. Engine)",
      "4. Capture remote memory dump & forensic snapshot (Local Agent)",
      "5. Open P1 security incident ticket (ServiceNow)",
      "6. Block user credentials & VPN access across active sessions (Okta / AD)"
    ],
    logs: [
      "[ALERT] Critical security threat on LP-DEV-9022: Mimikatz credential dumping tool detected.",
      "[CRITICAL] Security Risk Score calculated at 100. Threat type: Compromised Credentials.",
      "[INFO] Dynamic network isolation command sent to CrowdStrike EDR.",
      "[INFO] Initiating remote forensics: Collecting memory dump and security event logs.",
      "[INFO] Ticket INC-SEC-9904 created. Routing to Security Operations Center (SOC).",
      "[INFO] Terminating all active Okta sessions for dev-user@edcorp.com."
    ],
    nodes: [
      { id: "edr", label: "CrowdStrike EDR", desc: "Mimikatz dump alarm", icon: "ShieldAlert", phase: 20 },
      { id: "score", label: "ML Engine", desc: "Calculate risk 100/100", icon: "Cpu", phase: 45 },
      { id: "isolate", label: "CrowdStrike UEM", desc: "Isolate network line", icon: "Layers", phase: 70 },
      { id: "forensic", label: "Local Agent", desc: "Capture memory dump", icon: "Server", phase: 85 },
      { id: "revoke", label: "Okta ID", desc: "Terminate sessions", icon: "UserCheck", phase: 100 }
    ]
  }
];

export default function Sandbox() {
  const [selectedCategory, setSelectedCategory] = useState<'resiliency' | 'endpoints'>('resiliency');
  const [selectedScenarioId, setSelectedScenarioId] = useState<number>(1);
  const [simulating, setSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [simFinished, setSimFinished] = useState(false);
  const [auditEventId, setAuditEventId] = useState("");

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  const handleStartSimulation = () => {
    setSimulating(true);
    setSimFinished(false);
    setSimProgress(0);
    setAuditEventId("evt_" + Math.random().toString(36).substring(2, 15));
    setConsoleLogs([`[INFO] Initializing Public Sandbox Container for Scenario #${activeScenario.id}: '${activeScenario.name}'...`]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setSimProgress(progress);

      if (progress === 20) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Booting Sandbox validation cluster...`,
          `[INFO] Querying topology records for target path: ${activeScenario.target}`
        ]);
      } else if (progress === 45) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Verifying live node state constraints...`,
          `[WARNING] Telemetry signal analysis active.`
        ]);
      } else if (progress === 65) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Running A.L.F.R.E.D. Risk Engineering assessment...`,
          `[INFO] Computed decision profile compliance score.`
        ]);
      } else if (progress === 85) {
        setConsoleLogs(prev => [
          ...prev,
          `[INFO] Initiating automated self-healing playbooks...`,
          `[INFO] Dispatching REST commands to endpoints.`
        ]);
      } else if (progress >= 100) {
        clearInterval(interval);
        setConsoleLogs(prev => [
          ...prev,
          ...activeScenario.logs,
          `[SUCCESS] Playbook validation checks passed cleanly.`,
          `[INFO] Governance ledger updated. Audit ID: audit-${Math.random().toString(36).substring(2, 9)}`
        ]);
        setSimulating(false);
        setSimFinished(true);
      }
    }, 800);
  };

  const getNodeIcon = (iconName: string) => {
    switch (iconName) {
      case "Users": return <Users size={16} style={{ color: 'var(--accent-cyan)' }} />;
      case "UserCheck": return <UserCheck size={16} style={{ color: '#10b981' }} />;
      case "Server": return <Server size={16} style={{ color: 'var(--accent-cyan)' }} />;
      case "Layers": return <Layers size={16} style={{ color: 'var(--accent-purple)' }} />;
      case "Zap": return <Zap size={16} style={{ color: '#f59e0b' }} />;
      case "Cpu": return <Cpu size={16} style={{ color: '#8b5cf6' }} />;
      case "Database": return <Database size={16} style={{ color: '#06b6d4' }} />;
      case "Network": return <Network size={16} style={{ color: 'var(--accent-red)' }} />;
      case "ShieldAlert": return <ShieldAlert size={16} style={{ color: 'var(--accent-red)' }} />;
      case "ShieldCheck": return <ShieldCheck size={16} style={{ color: '#10b981' }} />;
      case "Activity": return <Activity size={16} style={{ color: 'var(--accent-cyan)' }} />;
      case "Flame": return <Flame size={16} style={{ color: '#f59e0b' }} />;
      case "Compass": return <Compass size={16} style={{ color: '#f59e0b' }} />;
      case "Search": return <Search size={16} style={{ color: '#06b6d4' }} />;
      case "Lock": return <Lock size={16} style={{ color: 'var(--accent-red)' }} />;
      case "BookOpen": return <BookOpen size={16} style={{ color: '#8b5cf6' }} />;
      default: return <Zap size={16} style={{ color: 'var(--accent-red)' }} />;
    }
  };

  const Gauge = ({ value, max, label, color, statusText }: { value: number; max: number; label: string; color: string; statusText: string }) => {
    const percentage = (value / max) * 100;

    return (
      <div className="glass-panel" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px', width: '100%', height: '148px', position: 'relative'
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ position: 'relative', width: '70px', height: '70px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
            <circle cx="35" cy="35" r="30" stroke="rgba(255,255,255,0.03)" strokeWidth="5" fill="transparent" />
            <circle cx="35" cy="35" r="30"
              stroke={color}
              strokeWidth="5"
              fill="transparent"
              style={{
                transition: 'all 0.5s ease-out',
                strokeDasharray: '188.4',
                strokeDashoffset: 188.4 - (188.4 * percentage) / 100,
                strokeLinecap: 'round'
              }}
            />
          </svg>
          <div style={{ position: 'absolute', fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{value}</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, marginTop: '6px', color: '#fff' }}>{statusText}</div>
      </div>
    );
  };

  const currentRisk = (() => {
    if (!simulating) return simFinished ? activeScenario.expectedRisk : 10;
    if (simProgress <= 20) return 10;
    if (simProgress <= 80) {
      const frac = (simProgress - 20) / 60;
      return Math.round(10 + frac * (activeScenario.expectedRisk - 10));
    }
    return activeScenario.expectedRisk;
  })();

  const systemHealth = (() => {
    if (!simulating) return simFinished ? 98 : 98;
    if (simProgress <= 20) return 98;
    if (simProgress <= 70) {
      const frac = (simProgress - 20) / 50;
      const drop = Math.max(10, activeScenario.expectedRisk);
      return Math.round(98 - frac * drop);
    }
    if (simProgress <= 100) {
      const frac = (simProgress - 70) / 30;
      const low = 98 - Math.max(10, activeScenario.expectedRisk);
      return Math.round(low + frac * (98 - low));
    }
    return 98;
  })();

  const filteredScenarios = SCENARIOS.filter(s =>
    selectedCategory === 'resiliency' ? s.id < 14 : s.id >= 14
  );

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Shield size={12} />
            <span>INTERACTIVE MARKETING SANDBOX</span>
          </div>
          <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: 1.2 }}>
            Interactive <span className="text-gradient">Sandbox Simulator</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '6px', maxWidth: '800px' }}>
            Run live simulated validations of the A.L.F.R.E.D. decision engine right here. Choose a scenario below, run the simulation, and witness closed-loop autonomic operations in action.
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="flow-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '30px',
          width: '100%'
        }}>
          
          {/* Main Console Split */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '24px',
            width: '100%'
          }} className="flow-grid">
            
            {/* Sidebar scenario directory */}
            <div className="glass-panel" style={{
              display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: 'var(--text-muted)' }}>
                  Scenarios Directory
                </h3>
              </div>

              {/* Sidebar Category Toggle */}
              <div style={{ padding: '12px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <button
                  onClick={() => {
                    setSelectedCategory('resiliency');
                    setSelectedScenarioId(1);
                    setConsoleLogs([]);
                    setSimFinished(false);
                  }}
                  style={{
                    flex: 1, padding: '8px', fontSize: '0.72rem', fontWeight: 800, borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer',
                    background: selectedCategory === 'resiliency' ? 'var(--accent-red)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', transition: 'all 0.2s'
                  }}
                >
                  Platform Resiliency
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('endpoints');
                    setSelectedScenarioId(15);
                    setConsoleLogs([]);
                    setSimFinished(false);
                  }}
                  style={{
                    flex: 1, padding: '8px', fontSize: '0.72rem', fontWeight: 800, borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer',
                    background: selectedCategory === 'endpoints' ? 'var(--accent-red)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', transition: 'all 0.2s'
                  }}
                >
                  Device Engineering
                </button>
              </div>

              {/* Scenarios lists scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredScenarios.map(sc => (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setConsoleLogs([]);
                      setSimFinished(false);
                    }}
                    style={{
                      padding: '14px', borderRadius: '10px', border: '1px solid', cursor: 'pointer', textAlign: 'left',
                      borderColor: selectedScenarioId === sc.id ? 'rgba(225,29,72,0.4)' : 'var(--glass-border)',
                      background: selectedScenarioId === sc.id ? 'rgba(225,29,72,0.06)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(225,29,72,0.15)', color: 'var(--accent-red)', borderRadius: '4px', fontFamily: 'monospace' }}>
                        #{sc.id}
                      </span>
                      <span style={{ color: selectedScenarioId === sc.id ? '#fff' : 'var(--text-main)' }}>
                        {sc.name}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {sc.desc}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'monospace', marginTop: '6px' }}>
                      {sc.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Simulator Viewport */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Playbook Console Area */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '440px', position: 'relative' }}>
                
                {/* Visual Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(225,29,72,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(225,29,72,0.2)', padding: '2px 8px', borderRadius: '30px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Sandbox Console • Scenario #{activeScenario.id}
                    </span>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '4px 0 0 0', color: '#fff' }}>{activeScenario.name}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {activeScenario.desc}
                    </p>
                  </div>

                  <button
                    disabled={simulating}
                    onClick={handleStartSimulation}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.78rem', gap: '6px', flexShrink: 0 }}
                  >
                    <Play size={12} />
                    {simulating ? 'Simulating...' : 'Run Simulation'}
                  </button>
                </div>

                {/* Progress bar */}
                {simulating && (
                  <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${simProgress}%`, height: '100%', background: 'var(--accent-cyan)', transition: 'all 0.3s' }} />
                  </div>
                )}

                {/* Node Flow topology */}
                <div style={{
                  background: 'rgba(7,7,13,0.9)', border: '1px solid var(--border-color)', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: '130px', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Interactive Closed-Loop Workflow Flow
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px', width: '100%', marginTop: '12px', position: 'relative', zIndex: 10 }}>
                    {activeScenario.nodes.map((node, index, arr) => {
                      const isActive = simulating && simProgress >= node.phase;
                      const isPending = simulating && simProgress < node.phase && (index === 0 || simProgress >= (arr[index-1]?.phase ?? 0));
                      const isCompleted = !simulating ? simFinished : simProgress >= node.phase;

                      let glow = 'rgba(255,255,255,0.04)';
                      let border = 'rgba(255,255,255,0.06)';
                      if (isActive || isCompleted) {
                        glow = 'rgba(6,182,212,0.1)';
                        border = 'var(--accent-cyan)';
                      } else if (isPending) {
                        glow = 'rgba(245,158,11,0.05)';
                        border = 'rgba(245,158,11,0.4)';
                      }

                      return (
                        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%', border: '1px solid',
                              borderColor: border, background: glow,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.3s'
                            }}>
                              {getNodeIcon(node.icon)}
                            </div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 850, color: '#fff', marginTop: '6px', textAlign: 'center' }}>
                              {node.label}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>
                              {node.desc}
                            </div>
                          </div>

                          {index < arr.length - 1 && (
                            <div style={{
                              width: '24px', height: '1px', background: isCompleted ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                              marginTop: '-16px', transition: 'all 0.3s'
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub Layout: Gauges & Terminals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }} className="flow-grid">
                  
                  {/* Gauge stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Gauge
                      value={currentRisk}
                      max={100}
                      label="Calculated ML Risk"
                      color={currentRisk > 60 ? "var(--accent-red)" : currentRisk > 30 ? "#f59e0b" : "#10b981"}
                      statusText={currentRisk > 60 ? "CRITICAL RISK" : currentRisk > 30 ? "WARNING" : "LOW RISK"}
                    />
                    <Gauge
                      value={systemHealth}
                      max={100}
                      label="Operations Health"
                      color={systemHealth < 50 ? "var(--accent-red)" : systemHealth < 90 ? "#f59e0b" : "#10b981"}
                      statusText={systemHealth < 50 ? "DEGRADED" : systemHealth < 90 ? "ATTENUATING" : "NOMINAL"}
                    />
                  </div>

                  {/* Terminal Log */}
                  <div style={{
                    background: '#040408', border: '1px solid var(--border-color)', borderRadius: '12px',
                    padding: '16px', display: 'flex', flexDirection: 'column', height: '308px', overflow: 'hidden'
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem',
                      fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08rem',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px'
                    }}>
                      <TermIcon size={12} />
                      <span>Live SRE Stream Output</span>
                    </div>

                    <div style={{
                      flex: 1, overflowY: 'auto', marginTop: '12px', fontFamily: 'monospace',
                      fontSize: '0.72rem', color: '#10b981', display: 'flex', flexDirection: 'column',
                      gap: '8px', textAlign: 'left', lineHeight: 1.45
                    }}>
                      {consoleLogs.length === 0 ? (
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Console idle. Click 'Run Simulation' above.</div>
                      ) : (
                        consoleLogs.map((log, idx) => {
                          const isWarn = log.includes('[WARNING]');
                          const isAlert = log.includes('[ALERT]') || log.includes('[CRITICAL]');
                          const isSuccess = log.includes('[SUCCESS]');
                          let color = '#10b981';
                          if (isWarn) color = '#f59e0b';
                          if (isAlert) color = '#ef4444';
                          if (isSuccess) color = '#06b6d4';

                          return (
                            <div key={idx} style={{ color, whiteSpace: 'pre-wrap' }}>
                              {log}
                            </div>
                          );
                        })
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </div>

                {/* Audit Trial details */}
                {simFinished && (
                  <div style={{
                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                    padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                      <ShieldCheck size={28} style={{ color: '#10b981' }} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff' }}>Compliance Ledger Document Logged</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                          ID: {auditEventId}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#10b981' }}>Compliance Verified</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ISO 27001 / SOC 2 Checklist Logged</div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* Explanation Value Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            width: '100%'
          }}>
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'left' }}>
              <span style={{ fontSize: '0.68rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                VALUE PROPOSITION
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>Why This Validation Matters</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '8px', marginBottom: 0 }}>
                {activeScenario.whyMatters}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '30px', textAlign: 'left' }}>
              <span style={{ fontSize: '0.68rem', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                FINANCIAL OUTCOME
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>Business & ROI Impact</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '8px', marginBottom: 0 }}>
                {activeScenario.opexSaving}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
