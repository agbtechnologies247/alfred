import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Server, Cloud, Shield, Settings, Brain, Zap, 
  Code, Cpu, Activity, Network, Terminal, MessageSquare, AlertTriangle
} from 'lucide-react';
import RoiCalculator from '../components/RoiCalculator';
import FlowCanvas from '../components/FlowCanvas';
import HeroCanvas from '../components/HeroCanvas';

export default function Home() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [indicatorTop, setIndicatorTop] = useState(0);
  const [hoveredIntegration, setHoveredIntegration] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const steps = [
    {
      id: 1,
      title: "1. Signal Ingestion",
      icon: Activity,
      color: "var(--accent-cyan)",
      desc: "A.L.F.R.E.D. continuously ingests telemetry, logs, metrics, alerts, and ERP events from your entire stack.",
      details: "Integrates with Prometheus, AWS CloudWatch, Zabbix, and local agents to ingest signals."
    },
    {
      id: 2,
      title: "2. Knowledge Graph Context",
      icon: Network,
      color: "var(--accent-purple)",
      desc: "Correlates signals with your systems topology to understand application and business dependencies.",
      details: "Blast radius analysis: Checks downstream dependencies of failing nodes in real-time."
    },
    {
      id: 3,
      title: "3. Decision & Policy Check",
      icon: Brain,
      color: "var(--accent-red)",
      desc: "Evaluates risk, operational compliance, financial impact, and historical runbooks before taking action.",
      details: "Decision Engine verifies constraints: Is the recovery script pre-approved? Is risk score low?"
    },
    {
      id: 4,
      title: "4. Autonomous Resolution",
      icon: Zap,
      color: "#f59e0b",
      desc: "Dispatches automated playbooks via APIs, SSH, or Serverless functions to resolve incidents.",
      details: "Heals system: Restarts databases, scales pods, purges logs, or dispatches webhooks."
    },
    {
      id: 5,
      title: "5. Continuous Learning",
      icon: Terminal,
      color: "#10b981",
      desc: "Every resolved case creates runbooks, SOPs, and knowledge documents while updating AI models.",
      details: "AI parses incident parameters to suggest new pre-approved templates for subsequent alerts."
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

  // Mobile layout detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 968);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track page scroll to map scroll progress to active 3D steps (Desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = rect.height;
      const sectionTop = -rect.top;
      const viewportHeight = window.innerHeight;

      if (rect.top <= viewportHeight && rect.bottom >= 0) {
        const scrollRange = sectionHeight - viewportHeight;
        if (scrollRange <= 0) return;
        
        // Calculate progress from 0 to 1
        const progress = Math.max(0, Math.min(0.99, sectionTop / scrollRange));
        
        // Map 0-1 progress to step indices 0-4
        const stepIndex = Math.floor(progress * 5);
        setActiveStep(stepIndex);
      } else if (rect.top > viewportHeight) {
        setActiveStep(null);
      } else if (rect.bottom < 0) {
        setActiveStep(4);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Update indicator circle position dynamically aligning with step cards
  useEffect(() => {
    if (isMobile) return;
    const updatePosition = () => {
      const stepIdx = activeStep ?? 0;
      const card = cardRefs.current[stepIdx];
      if (card) {
        const center = card.offsetTop + card.offsetHeight / 2;
        setIndicatorTop(center);
      }
    };
    
    const timer = setTimeout(updatePosition, 50);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [activeStep, isMobile]);

  return (
    <div style={{ paddingTop: '100px' }}>
      
      {/* Hero Section with Background R3F Constellation */}
      <section 
        className="section container animate-fade-in-up" 
        style={{ 
          textAlign: 'center', 
          position: 'relative', 
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <HeroCanvas />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px' }}>
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
            marginBottom: '30px'
          }}>
            <Cpu size={14} />
            <span>AUTONOMOUS ENTERPRISE DECISION PLATFORM</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', margin: '0 auto 24px', lineHeight: 1.15 }}>
            Your enterprise generates signals. <br />
            <span className="text-gradient">A.L.F.R.E.D. executes decisions.</span>
          </h1>

          <div style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            maxWidth: '850px',
            margin: '0 auto 30px',
            padding: '12px 20px',
            borderLeft: '4px solid var(--accent-red)',
            background: 'rgba(7, 7, 13, 0.7)',
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

          <p style={{ fontSize: '1.25rem', maxWidth: '750px', margin: '0 auto 40px', color: 'var(--text-muted)' }}>
            A.L.F.R.E.D. is an AI-driven Service & Operations Management orchestrator. It observes telemetry, builds a real-time system context, predicts SLA risks, simulates outcomes, and automates resolution across enterprise platforms.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }} onClick={() => window.location.href = '/app/'}>
              Launch Console <ArrowRight size={18} style={{ marginLeft: '10px' }}/>
            </button>
            <a href="/sandbox" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.05rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', boxShadow: '0 0 15px rgba(6,182,212,0.15)' }}>
              Try Live Sandbox <Zap size={14} style={{ marginLeft: '8px' }} />
            </a>
            <a href="/pricing" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* 3D R3F Scroll-Bound Modules Flow Section */}
      <section 
        ref={sectionRef} 
        style={{ 
          position: 'relative', 
          height: isMobile ? 'auto' : '350vh', // Normal height on mobile, long scroll on desktop
          background: 'var(--bg-dark)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          padding: isMobile ? '60px 0' : '0'
        }}
      >
        {/* Viewport wrapper (Sticky on desktop, static flow on mobile) */}
        <div 
          className="flow-grid"
          style={{
            position: isMobile ? 'relative' : 'sticky',
            top: isMobile ? 'auto' : '100px',
            height: isMobile ? 'auto' : 'calc(100vh - 120px)',
            padding: '0 24px',
            maxWidth: '1200px',
            margin: '0 auto',
            gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.0fr'
          }}
        >
          
          <div className="flow-canvas-box">
            <FlowCanvas activeStep={isMobile ? null : activeStep} />
          </div>

          {/* Right Column: Highlighted description cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operational Lifecycle
              </span>
              <h2 style={{ fontSize: '2rem', margin: '6px 0 0 0', color: 'var(--text-main)' }}>Closed-Loop Autonomic Flow</h2>
            </div>
            
            {/* Relative container holding both the SVG timeline on the left and the cards list on the right */}
            <div style={{ position: 'relative', display: 'flex', gap: isMobile ? '0' : '40px', width: '100%' }}>
              
              {/* SVG vertical connecting line & sliding indicator bubble (desktop only) */}
              {!isMobile && (
                <div style={{
                  position: 'relative',
                  width: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  {/* Background Track Line (SVG with active dashStream) */}
                  <svg style={{
                    position: 'absolute',
                    top: '40px',
                    bottom: '40px',
                    width: '2px',
                    height: 'calc(100% - 80px)',
                    overflow: 'visible',
                    pointerEvents: 'none'
                  }}>
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="100%"
                      className="topology-edge-line"
                      style={{
                        stroke: 'rgba(255, 255, 255, 0.08)',
                        strokeWidth: 2,
                        strokeDasharray: '8, 16',
                        animation: 'dashStream 30s linear infinite'
                      }}
                    />
                  </svg>

                  {/* Animated SVG Path for dynamic fill/glow */}
                  <svg style={{
                    position: 'absolute',
                    top: '0',
                    left: '1px',
                    width: '2px',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none'
                  }}>
                    <line
                      x1="0"
                      y1={cardRefs.current[0] ? cardRefs.current[0].offsetTop + cardRefs.current[0].offsetHeight / 2 : 40}
                      x2="0"
                      y2={indicatorTop}
                      style={{
                        stroke: activeStep !== null ? steps[activeStep].color : 'var(--accent-red)',
                        strokeWidth: 2,
                        transition: 'y2 0.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        filter: 'drop-shadow(0 0 6px var(--accent-red))'
                      }}
                    />
                  </svg>

                  {/* Sliding indicator circle/pill */}
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    transform: `translate3d(-50%, ${indicatorTop - 8}px, 0)`,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: activeStep !== null ? steps[activeStep].color : 'var(--accent-red)',
                    boxShadow: `0 0 20px ${activeStep !== null ? steps[activeStep].color : 'var(--accent-red)'}`,
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* Floating active step text label on the left */}
                    <div style={{
                      position: 'absolute',
                      right: '24px',
                      color: activeStep !== null ? steps[activeStep].color : 'var(--accent-red)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      background: 'rgba(7, 7, 13, 0.85)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${activeStep !== null ? steps[activeStep].color : 'var(--accent-red)'}30`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      opacity: activeStep !== null ? 1 : 0,
                      transform: activeStep !== null ? 'translateX(0)' : 'translateX(-10px)',
                      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      {activeStep === 0 && "METRICS & LOGS"}
                      {activeStep === 1 && "TOPOLOGY GRAPH"}
                      {activeStep === 2 && "ACTION POLICY"}
                      {activeStep === 3 && "EXECUTION LOGS"}
                      {activeStep === 4 && "AI SOP UPDATES"}
                    </div>
                  </div>
                </div>
              )}

              {/* Cards Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {steps.map((s, idx) => {
                  const isActive = isMobile ? true : (activeStep === idx); // All cards active/readable on mobile
                  const Icon = s.icon;
                  return (
                    <div 
                      key={s.id}
                      ref={el => { cardRefs.current[idx] = el; }}
                      className="glass-panel"
                      style={{
                        padding: '20px 24px',
                        opacity: isActive ? 1 : 0.5, // Keep inactive text at 0.5 opacity
                        transform: (!isMobile && isActive) ? 'scale(1.02)' : 'scale(1)', // Snappy scale
                        borderColor: isActive ? s.color : 'var(--glass-border)',
                        boxShadow: (!isMobile && isActive) ? `0 8px 30px ${s.color}15` : 'none',
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                          background: `${s.color}15`,
                          color: s.color,
                          padding: '6px',
                          borderRadius: '8px',
                          border: `1px solid ${s.color}30`
                        }}>
                          <Icon size={18} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {s.title}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {s.desc}
                      </p>
                      
                      {/* Optimizing layout shifting by keeping container static but transitioning contents */}
                      <div style={{
                        fontSize: '0.75rem',
                        color: s.color,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: '8px',
                        marginTop: '8px',
                        fontStyle: 'italic',
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'translateY(0)' : 'translateY(-6px)',
                        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: isActive ? 'auto' : 'none',
                        visibility: isActive ? 'visible' : 'hidden',
                        height: 'auto'
                      }}>
                        {s.details}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SIAM Multi-Vendor Governance Section */}
      <section className="section container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '80px', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '20px', fontWeight: 600 }}>
            SIAM GOVERNANCE MODEL
          </span>
          <h2>Autonomous Multi-Vendor Coordination</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', fontSize: '1.05rem' }}>
            Large enterprises operate under the Service Integration and Management (SIAM) model. A.L.F.R.E.D. acts as the central intelligence hub, orchestrating workflows across internal IT departments and external MSP vendor partners.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }} className="flow-grid">
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
      <section className="section container">
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
      <section className="section container">
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
      <section className="section container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '80px' }}>
        <RoiCalculator />
      </section>

    </div>
  );
}
