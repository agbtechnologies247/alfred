import { useState, useEffect } from 'react';
import { 
  ArrowRight, Server, Cloud, Shield, Settings, Brain, Zap, 
  Code, Cpu, Activity, Network, Terminal, MessageSquare, AlertTriangle
} from 'lucide-react';
import RoiCalculator from '../components/RoiCalculator';

// Interactive Simulated SRE Console mockup
function SreConsole() {
  const [activeTab, setActiveTab] = useState<'signals' | 'graph' | 'actions'>('signals');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const signalsLogs = [
      "[OK] Ingested cpu_usage_seconds_total from order-service (CPU: 94.2%)",
      "[WARN] Latency alert triggered for order-service (940ms > 500ms)",
      "[INFO] Dispatching alert event to A.L.F.R.E.D. EventBus...",
      "[OK] Signal received: auth-service API response code 502",
      "[INFO] Active monitoring polling rate: 10s intervals",
      "[OK] Syslog trace analyzed: disk space critical on gateway-vm-1"
    ];

    const graphLogs = [
      "[INFO] Resolving dependency graph for order-service...",
      "[INFO] Node: order-service -> depends on: checkout-db (active connection pool)",
      "[WARN] Downstream dependency checkout-db active pool: 98/100",
      "[INFO] Blast radius calculation: 1,200 active users at risk",
      "[INFO] Topology mapping: 4 nodes affected downstream",
      "[OK] Generated dependency graph in 1.4ms"
    ];

    const actionsLogs = [
      "[INFO] Evaluating mitigation models for checkout-db...",
      "[INFO] Runbook check: SLA template #1042 pre-approved by SRE Lead",
      "[OK] Policy check: Risk score 0.12 (Low risk, read-only buffer active)",
      "[ACTION] Executing remote pool flush on checkout-db...",
      "[OK] checkout-db active pool size reset to 10/100. Latency recovered to 42ms.",
      "[INFO] Auto-generated post-incident analysis runbook. Knowledge Base updated."
    ];

    let currentLogs = signalsLogs;
    if (activeTab === 'graph') currentLogs = graphLogs;
    if (activeTab === 'actions') currentLogs = actionsLogs;

    setLogs([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < currentLogs.length) {
        const logItem = currentLogs[i];
        setLogs(prev => [...prev, logItem]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto',
      background: '#0a0a12',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(225, 29, 72, 0.08)',
      overflow: 'hidden',
      textAlign: 'left',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.85rem'
    }}>
      {/* Console Header */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          A.L.F.R.E.D. SRE CONSOLE v2.2.0
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        {(['signals', 'graph', 'actions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '14px 10px',
              background: activeTab === tab ? '#0e0e1a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-red)' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {tab === 'signals' && <Activity size={14} style={{ color: activeTab === tab ? 'var(--accent-cyan)' : 'inherit' }} />}
            {tab === 'graph' && <Network size={14} style={{ color: activeTab === tab ? 'var(--accent-purple)' : 'inherit' }} />}
            {tab === 'actions' && <Cpu size={14} style={{ color: activeTab === tab ? 'var(--accent-red)' : 'inherit' }} />}
            {tab === 'signals' && "Telemetry Ingestion"}
            {tab === 'graph' && "Dependency blast_radius"}
            {tab === 'actions' && "Remediation output"}
          </button>
        ))}
      </div>

      {/* Console Output */}
      <div style={{
        padding: '24px',
        minHeight: '220px',
        background: '#05050b',
        color: '#a7f3d0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        lineHeight: 1.6
      }}>
        {logs.map((log, index) => {
          let color = '#a7f3d0';
          if (log && log.includes('[WARN]')) color = '#fde047';
          if (log && log.includes('[ACTION]')) color = '#f43f5e';
          if (log && log.includes('[OK]')) color = '#34d399';
          return (
            <div key={index} style={{ color, display: 'flex', gap: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>&gt;</span>
              <span>{log}</span>
            </div>
          );
        })}
        <div style={{ display: 'inline-block', width: '8px', height: '14px', background: 'var(--text-muted)', marginLeft: '4px', animation: 'pulse 1s infinite' }}></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hoveredIntegration, setHoveredIntegration] = useState<string | null>(null);

  const steps = [
    {
      id: 0,
      title: "1. Signal Ingestion",
      icon: Activity,
      color: "var(--accent-cyan)",
      desc: "A.L.F.R.E.D. continuously ingests telemetry, logs, metrics, alerts, and ERP events from your entire stack.",
      logs: [
        "[INFO] Initializing EventBus listener on port 3003...",
        "[OK] Connection established with Prometheus (metrics polled every 10s)",
        "[OK] AWS CloudWatch webhook registered",
        "[INFO] Waiting for telemetry events...",
        "[WARN] High latency detected on order-service (940ms > 500ms threshold)"
      ]
    },
    {
      id: 1,
      title: "2. Knowledge Graph Context",
      icon: Network,
      color: "var(--accent-purple)",
      desc: "Correlates signals with your systems topology to understand application and business dependencies.",
      logs: [
        "[INFO] Resolving dependency graph topology...",
        "[INFO] Querying Neo4j Graph DB: MATCH (s:Service {name: 'order-service'})-[:DEPENDS_ON]->(d)",
        "[OK] Mapped dependencies: order-service -> checkout-db -> payment-gateway",
        "[WARN] Dependency node checkout-db connection saturation alert: 98% utilization",
        "[INFO] Calculated blast radius: 1,200 active checkouts affected"
      ]
    },
    {
      id: 2,
      title: "3. Decision & Policy Check",
      icon: Brain,
      color: "var(--accent-red)",
      desc: "Evaluates risk, operational compliance, financial impact, and historical runbooks before taking action.",
      logs: [
        "[INFO] Triggering policy analysis framework...",
        "[INFO] Validating regulatory compliance constraints (SOC 2, NIST)",
        "[INFO] Comparing risk severity score against incident threshold (calculated: 0.12)",
        "[OK] Runbook check: Remediation template #1042 approved (Restart Connection Pools)",
        "[INFO] Human-in-the-loop bypass check: Automated execution authorized"
      ]
    },
    {
      id: 3,
      title: "4. Autonomous Resolution",
      icon: Zap,
      color: "#f59e0b",
      desc: "Dispatches automated playbooks via APIs, SSH, or Serverless functions to resolve incidents.",
      logs: [
        "[ACTION] Executing SSH command on postgres-checkout-primary...",
        "[INFO] Command: pg_terminate_backend(pid) for idle clients",
        "[OK] Successfully terminated 48 idle PostgreSQL connection buffers",
        "[INFO] Verifying node health: latency recovered to 42ms (threshold OK)",
        "[OK] SLA alert resolved cleanly"
      ]
    },
    {
      id: 4,
      title: "5. Continuous Learning",
      icon: Terminal,
      color: "#10b981",
      desc: "Every resolved case creates runbooks, SOPs, and knowledge documents while updating AI models.",
      logs: [
        "[INFO] Commencing post-incident learning loop...",
        "[INFO] Logging incident logs, execution metadata, and latency diff to storage",
        "[OK] Generated runbook document: SRE-AUTORECOVERY-1042.md",
        "[INFO] Updating policy neural weights based on feedback loops",
        "[INFO] Closed-loop SRE iteration finished successfully"
      ]
    }
  ];

  const integrationGroups = [
    {
      category: "IT Service Management (ITSM)",
      items: [
        { name: "ServiceNow", desc: "Bidirectional incident sync, automated ticket creation, approval workflow hooks.", icon: Settings },
        { name: "Jira Service Desk", desc: "Logs root-cause analysis (RCA) and creates post-incident reviews.", icon: Code }
      ]
    },
    {
      category: "Cloud & Virtualization",
      items: [
        { name: "AWS & Azure", desc: "Auto-scales compute, manages replicas, and flags idle resources.", icon: Cloud },
        { name: "Kubernetes", desc: "Monitors pod health, resolves CrashLoopBackOff, and adjusts resource limits.", icon: Server }
      ]
    },
    {
      category: "Monitoring & Observability",
      items: [
        { name: "Grafana & Prometheus", desc: "Ingests real-time metrics and routes active alerts to Decision Engine.", icon: Cpu },
        { name: "Zabbix", desc: "Fetches packet latency, disk space utilization, and server metrics.", icon: Activity }
      ]
    },
    {
      category: "Collaboration & ChatOps",
      items: [
        { name: "Slack & MS Teams", desc: "Notifies SRE teams and enables inline action approvals via buttons.", icon: MessageSquare }
      ]
    }
  ];

  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg-dark)' }}>
      
      {/* ══ HERO SECTION ══ */}
      <section 
        className="section container animate-fade-in-up" 
        style={{ 
          textAlign: 'center', 
          position: 'relative', 
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '40px'
        }}
      >
        <div style={{ maxWidth: '1000px', width: '100%', position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div style={{
            background: 'rgba(225,29,72,0.06)',
            border: '1px solid rgba(225,29,72,0.2)',
            padding: '6px 18px',
            borderRadius: '30px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--accent-red)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <Cpu size={14} />
            <span>AUTONOMOUS ENTERPRISE DECISION PLATFORM</span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)', margin: '0 auto 20px', lineHeight: 1.15 }}>
            Your enterprise generates signals. <br />
            <span className="text-gradient">A.L.F.R.E.D. executes decisions.</span>
          </h1>

          {/* Acronym breakdown */}
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            maxWidth: '850px',
            margin: '0 auto 24px',
            padding: '12px 20px',
            borderLeft: '4px solid var(--accent-red)',
            background: 'rgba(10, 10, 18, 0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: '0 8px 8px 0',
            textAlign: 'left'
          }}>
            <span style={{ color: 'var(--accent-red)' }}>A</span>utomated{' '}
            <span style={{ color: 'var(--accent-red)' }}>L</span>ogical{' '}
            <span style={{ color: 'var(--accent-red)' }}>F</span>acilitator for{' '}
            <span style={{ color: 'var(--accent-red)' }}>R</span>esolving{' '}
            <span style={{ color: 'var(--accent-red)' }}>E</span>nterprise{' '}
            <span style={{ color: 'var(--accent-red)' }}>D</span>emands
          </div>

          <p style={{ fontSize: '1.2rem', maxWidth: '750px', margin: '0 auto 36px', color: 'var(--text-muted)' }}>
            A.L.F.R.E.D. is an AI-driven Service & Operations Management orchestrator. It observes telemetry, builds a real-time system context, predicts SLA risks, simulates outcomes, and automates resolution across enterprise platforms.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }} onClick={() => window.location.href = '/app/'}>
              Launch Console <ArrowRight size={18} style={{ marginLeft: '10px' }}/>
            </button>
            <a href="/sandbox" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.05rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', boxShadow: '0 0 15px rgba(6,182,212,0.1)' }}>
              Try Live Sandbox <Zap size={14} style={{ marginLeft: '8px' }} />
            </a>
            <a href="/pricing" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              View Pricing
            </a>
          </div>
        </div>

        {/* Live console container mockup */}
        <div style={{ width: '100%', padding: '0 10px', zIndex: 2 }}>
          <SreConsole />
        </div>
      </section>

      {/* ══ OPERATIONAL STATS METRICS GRID ══ */}
      <section style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', textAlign: 'center' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-cyan)', marginBottom: '4px' }}>2.5M+</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Telemetry Signals/Day</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-purple)', marginBottom: '4px' }}>99.98%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Autonomous Auto-Heal Rate</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-red)', marginBottom: '4px' }}>&lt; 8 min</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Average Incident MTTR</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', marginBottom: '4px' }}>$157k+</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Annual SRE Cost Avoided</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ RE-IMAGINED AUTONOMIC FLOW SECTION ══ */}
      <section 
        style={{ 
          background: 'var(--bg-dark)',
          borderBottom: '1px solid var(--border-color)',
          padding: '100px 0'
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Operational Lifecycle
            </span>
            <h2 style={{ fontSize: '2.5rem', margin: '8px 0 20px 0' }}>Closed-Loop Autonomic Flow</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto' }}>
              A.L.F.R.E.D. operates dynamically across five key pillars to ingest telemetry signals, map dependency graphs, simulate policies, execute SSH/webhook fixes, and document the outcomes.
            </p>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '40px',
              alignItems: 'start'
            }}
            className="flow-grid"
          >
            {/* Desktop Side-by-Side (Implemented responsively using simple styling logic) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              width: '100%'
            }}>
              {/* Left side: Interactive Step Logger */}
              <div style={{
                background: '#06060c',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'sticky',
                top: '120px'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: steps[activeStep].color, fontWeight: 700 }}>
                    STEP_{activeStep + 1}_FLOW.LOG
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status: Active</span>
                </div>
                <div style={{
                  padding: '20px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.82rem',
                  minHeight: '200px',
                  lineHeight: 1.6,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {steps[activeStep].logs.map((log, index) => {
                    let logColor = '#fff';
                    if (log && log.includes('[WARN]')) logColor = '#fde047';
                    if (log && log.includes('[ACTION]')) logColor = '#f43f5e';
                    if (log && log.includes('[OK]')) logColor = '#34d399';
                    if (log && log.includes('[INFO]')) logColor = 'var(--text-muted)';
                    return (
                      <div key={index} style={{ color: logColor }}>
                        <span style={{ color: 'rgba(255,255,255,0.1)', marginRight: '8px' }}>$</span>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right side: Step Selection Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {steps.map((s, idx) => {
                  const isActive = activeStep === idx;
                  const Icon = s.icon;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setActiveStep(idx)}
                      onMouseEnter={() => setActiveStep(idx)}
                      className="glass-panel"
                      style={{
                        padding: '24px',
                        cursor: 'pointer',
                        borderColor: isActive ? s.color : 'var(--glass-border)',
                        background: isActive ? 'rgba(255, 255, 255, 0.02)' : 'var(--glass-bg)',
                        boxShadow: isActive ? `0 8px 30px ${s.color}10` : 'none',
                        transform: isActive ? 'translateX(8px)' : 'translateX(0)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                        <div style={{
                          background: `${s.color}15`,
                          color: s.color,
                          padding: '8px',
                          borderRadius: '8px',
                          border: `1px solid ${s.color}30`
                        }}>
                          <Icon size={18} />
                        </div>
                        <h3 style={{ fontSize: '1.15rem', margin: 0, color: isActive ? '#fff' : 'var(--text-muted)' }}>
                          {s.title}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIAM Multi-Vendor Governance Section */}
      <section className="section container" style={{ borderBottom: '1px solid var(--border-color)', paddingTop: '80px', paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '20px', fontWeight: 600 }}>
            SIAM GOVERNANCE MODEL
          </span>
          <h2>Autonomous Multi-Vendor Coordination</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', fontSize: '1.05rem' }}>
            Large enterprises operate under the Service Integration and Management (SIAM) model. A.L.F.R.E.D. acts as the central intelligence hub, orchestrating workflows across internal IT departments and external MSP vendor partners.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
          {/* Visual Topology Diagram */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(7, 7, 13, 0.5)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', margin: 0 }}>
              Multi-Provider Operating Model
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'monospace', fontSize: '0.78rem' }}>
              <div style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: '#fff', fontWeight: 800 }}>
                Enterprise Service Governance (Executive Board)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>↓</div>
              <div style={{ padding: '10px', border: '1px solid var(--accent-red)', borderRadius: '6px', background: 'rgba(225,29,72,0.06)', textAlign: 'center', color: 'var(--accent-red)', fontWeight: 800 }}>
                A.L.F.R.E.D. Autonomous Service Operating System
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>↓</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '8px', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '6px', background: 'rgba(6,182,212,0.02)', textAlign: 'center', color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                  Internal IT (L1-L3 Support)
                </div>
                <div style={{ padding: '8px', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '6px', background: 'rgba(139,92,246,0.02)', textAlign: 'center', color: 'var(--accent-purple)', fontSize: '0.7rem' }}>
                  MSP Partner A (Cloud Ops)
                </div>
                <div style={{ padding: '8px', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', background: 'rgba(245,158,11,0.02)', textAlign: 'center', color: '#f59e0b', fontSize: '0.7rem' }}>
                  MSP Partner B (Security SOC)
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Whether an outage is caused by an internal database deadlock or an external cloud partner network issue, A.L.F.R.E.D. correlates dependencies and routes alerts instantly.
            </p>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Activity size={16} style={{ color: 'var(--accent-cyan)' }} /> Cross-Service Coordination
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Coordinates multi-provider incidents automatically. Triggers joint triage sessions, synchronizes alerts across ServiceNow/Jira, and logs SLA breaches on behalf of the customer.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Shield size={16} style={{ color: 'var(--accent-purple)' }} /> Automated Compliance & Audits
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Ensures compliance standards (ISO 20000, ITIL 4, COBIT, NIST, SOC 2) are automatically validated. Generates ledger updates for every automated resolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service & Operations Management Integrations */}
      <section className="section container" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--accent-purple)', marginBottom: '20px', fontWeight: 600 }}>
            ENTERPRISE CONNECTIVITY
          </span>
          <h2>Bridges Your Existing Ecosystem</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto' }}>
            A.L.F.R.E.D. coordinates operations by interacting bidirectionally with ITSM queues, virtualization targets, and observability metrics.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          {integrationGroups.map(group => (
            <div key={group.category} className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                {group.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {group.items.map(item => {
                  const ItemIcon = item.icon;
                  const isHovered = hoveredIntegration === item.name;
                  return (
                    <div 
                      key={item.name}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: isHovered ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                        border: isHovered ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                        display: 'flex',
                        gap: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={() => setHoveredIntegration(item.name)}
                      onMouseLeave={() => setHoveredIntegration(null)}
                    >
                      <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        width: '36px', height: '36px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isHovered ? 'var(--accent-red)' : 'var(--text-muted)',
                        transition: 'color 0.2s',
                        flexShrink: 0
                      }}>
                        <ItemIcon size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0', color: isHovered ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {item.name}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Business Outcomes Section */}
      <section className="section container" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '60px' }}>Tangible Operations Outcomes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          
          <div className="glass-panel" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--accent-red)', opacity: 0.15 }}>
              <AlertTriangle size={80} />
            </div>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>MTTR In Seconds</h3>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
              A.L.F.R.E.D. responds within 500 milliseconds of alert ingestion, executing pre-approved healing templates. Average MTTR shrinks from hours to under 8 minutes.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--accent-purple)', opacity: 0.15 }}>
              <Terminal size={80} />
            </div>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Zero L1-L2 Fatigue</h3>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
              Repetitive diagnostics, server log dumps, disk clearing, and pool restarts are fully automated. Your engineers focus on shipping product.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--accent-cyan)', opacity: 0.15 }}>
              <Shield size={80} />
            </div>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Policy Compliance</h3>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
              Every action is simulated, run through risk constraints, and fully logged in the Knowledge Base. Meets SOC2 audits with automated runbook logs.
            </p>
          </div>

        </div>
      </section>

      {/* ROI Calculator */}
      <section className="section container" style={{ paddingBottom: '80px' }}>
        <RoiCalculator />
      </section>

    </div>
  );
}
