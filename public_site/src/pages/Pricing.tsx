import { useState } from 'react';
import { Check, Server, ShieldCheck, Zap, Sparkles, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: "How long does A.L.F.R.E.D. take to deploy?",
    a: "For cloud or hybrid configurations, A.L.F.R.E.D. can connect to your infrastructure in under 15 minutes. It immediately starts analyzing signals and constructs the dependency knowledge graph within an hour. Local air-gapped Government deployments typically take 2-5 business days."
  },
  {
    q: "Does A.L.F.R.E.D. need access to our private credentials?",
    a: "No. A.L.F.R.E.D. operates using secure agent endpoints or role-based access tokens (IAM role delegation). In Professional and Enterprise tiers, all data transmission is encrypted in transit and at rest, and credential rotation is handled natively. Under Government/on-prem tiers, credentials never leave your secure firewall."
  },
  {
    q: "What is Blast Radius Simulation in the Decision Engine?",
    a: "Before executing any autonomous action (e.g., restarting a service or scaling replicas), the Decision Engine runs a simulation of the action against the current topology mapping. It predicts downstream failures, customer impact, SLA violation risks, and policy conformance. If the risk exceeds safety thresholds, the action is blocked or routed for manual operator approval."
  },
  {
    q: "Can we migrate between plans easily?",
    a: "Yes. You can upgrade from Starter to Professional at any time through the billing dashboard. Your nodes and templates will scale automatically. For custom Enterprise and Government migrations, our systems integration team assists with onboarding to ensure zero disruption."
  }
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [priceAnimate, setPriceAnimate] = useState(false);

  const handleToggle = () => {
    setPriceAnimate(true);
    setIsAnnual(!isAnnual);
    setTimeout(() => setPriceAnimate(false), 200);
  };

  const starterPrice = isAnnual ? 79 : 99;
  const profPrice = isAnnual ? 399 : 499;

  const plans = [
    {
      name: "Starter",
      icon: Server,
      iconColor: "#94a3b8",
      price: `$${starterPrice}`,
      period: "/month",
      desc: "For small teams starting with automated infrastructure monitoring & incident alerts.",
      features: [
        "Up to 50 active nodes",
        "5 automated runbook templates",
        "Email & Slack notifications",
        "3-day telemetry retention", // Increased from 1 to 3 days
        "Standard community support",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      icon: Sparkles,
      iconColor: "var(--accent-red)",
      price: `$${profPrice}`,
      period: "/month",
      desc: "For growing organizations implementing autonomous operations and AI self-healing.",
      features: [
        "Up to 500 active nodes ($1/additional node/mo)", // Added pay-as-you-go subtext
        "Unlimited runbook templates",
        "AI Decision Engine (Risk Simulation)",
        "3 Autonomous AI Agents (Cloud, DB, ITOM)",
        "ServiceNow, Jira & Teams integrations",
        "30-day telemetry retention",
        "24/7 support (4-hour SLA)",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      icon: Zap,
      iconColor: "var(--accent-purple)",
      price: "Custom",
      period: "",
      desc: "For high-scale businesses requiring absolute data isolation, customization, and dedicated support.",
      features: [
        "Unlimited nodes & data ingestion",
        "Multi-tenant database isolation",
        "Custom AI Model fine-tuning (RAG)",
        "Unlimited Autonomous AI Agents",
        "Premium ITSM & bidirectional syncing",
        "1-year telemetry retention & Audit log",
        "Dedicated Solutions Architect & 30m SLA",
      ],
      cta: "Contact Sales",
      popular: false,
    },
    {
      name: "Government",
      icon: ShieldCheck,
      iconColor: "var(--accent-cyan)",
      price: "Custom",
      period: "",
      desc: "Secure, sovereign tier tailored specifically for local, state, and federal agencies.",
      features: [
        "FedRAMP High & SOC2 compliance",
        "Sovereign cloud or Air-gapped on-premise",
        "100% local, offline AI model processing",
        "Zero outbound telemetry or callbacks",
        "FIPS-compliant cryptography",
        "Dedicated U.S. citizens support team",
      ],
      cta: "Inquire Now",
      popular: false,
    }
  ];

  const compareMatrix = [
    {
      category: "Telemetry & Scale",
      rows: [
        { feature: "Active Nodes Limit", starter: "50", prof: "500", ent: "Unlimited", gov: "Unlimited" },
        { feature: "Data Retention", starter: "3 Days", prof: "30 Days", ent: "1 Year", gov: "1 Year / Custom" }, // Increased Starter to 3 Days
        { feature: "Multi-tenant Isolation", starter: "Shared", prof: "Shared DB", ent: "Dedicated DB", gov: "Sovereign/On-Prem" },
      ]
    },
    {
      category: "AI & Decision Engineering",
      rows: [
        { feature: "Autonomous Runbooks", starter: "5 Active", prof: "Unlimited", ent: "Unlimited", gov: "Unlimited" },
        { feature: "AI Decision Engine", starter: "No", prof: "Yes (Standard)", ent: "Yes (Custom Policies)", gov: "Yes (Offline Policies)" },
        { feature: "Blast Radius Simulation", starter: "No", prof: "Yes", ent: "Yes", gov: "Yes" },
        { feature: "Autonomous Agents", starter: "No", prof: "3 Agents", ent: "Unlimited", gov: "Unlimited" },
      ]
    },
    {
      category: "Integrations & Support",
      rows: [
        { feature: "ITSM Integrations (ServiceNow, Jira)", starter: "No", prof: "Yes", ent: "Yes + Custom Sync", gov: "On-Prem connectors" },
        { feature: "ChatOps (Slack, Teams)", starter: "Yes", prof: "Yes", ent: "Yes", gov: "Internal bridges only" },
        { feature: "Support SLA", starter: "Best Effort", prof: "4-Hour Response", ent: "30-Min Response", gov: "Sovereign 24/7 Support" },
      ]
    }
  ];

  const FEATURE_DESCRIPTIONS: Record<string, string> = {
    "Active Nodes Limit": "The maximum number of concurrently monitored infrastructure nodes, servers, or devices.",
    "Data Retention": "The duration telemetry and operational metrics are stored in our analytics database.",
    "Multi-tenant Isolation": "The degree of database isolation provided between different client organizations.",
    "Autonomous Runbooks": "Pre-approved workflow scripts triggered instantly when alerts are generated.",
    "AI Decision Engine": "Our reasoning core that evaluates context, risk, and policy compliance before executing actions.",
    "Blast Radius Simulation": "Simulates downstream failures and estimates SRE costs before executing a change.",
    "Autonomous Agents": "Dedicated AI operators (Cloud Agent, Database Agent, Security Agent) running workflows.",
    "ITSM Integrations (ServiceNow, Jira)": "Bidirectional tickets sync and automation verification templates.",
    "ChatOps (Slack, Teams)": "Direct Slack/MS Teams notifications allowing engineers to approve recommendations inline.",
    "Support SLA": "Guaranteed response time SLA for enterprise production incident escalations."
  };

  const renderCell = (val: string, isProf: boolean) => {
    const normVal = val.toLowerCase().trim();
    if (normVal === "yes" || normVal === "yes (standard)" || normVal === "yes (custom policies)" || normVal === "yes (offline policies)") {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: isProf ? 1 : 0.8 }}>
          <Check size={16} style={{ color: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' }} />
          {normVal !== "yes" && (
            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: isProf ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {val.replace(/Yes\s+\(|\)/gi, '')}
            </span>
          )}
        </div>
      );
    }
    if (normVal === "no") {
      return (
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '1rem', fontWeight: 500 }}>—</span>
      );
    }
    return <span style={{ color: isProf ? 'var(--text-main)' : 'var(--text-muted)', opacity: isProf ? 1 : 0.8, fontWeight: isProf ? 600 : 400 }}>{val}</span>;
  };

  const renderFeatureName = (name: string) => {
    const desc = FEATURE_DESCRIPTIONS[name];
    if (!desc) return name;
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>{name}</span>
        <span className="tooltip-container">
          <HelpCircle size={13} style={{ color: 'var(--text-muted)', marginLeft: '6px', opacity: 0.6 }} />
          <span className="tooltip-text">{desc}</span>
        </span>
      </div>
    );
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      
      <style>{`
        .pricing-table tr {
          transition: background-color 0.2s ease;
        }
        .pricing-table tr:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        .tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: help;
        }
        .tooltip-text {
          visibility: hidden;
          width: 200px;
          background-color: #0d0d14;
          color: #f1f5f9;
          text-align: left;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 8px 12px;
          position: absolute;
          z-index: 10;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          font-size: 0.75rem;
          line-height: 1.4;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          pointer-events: none;
          text-transform: none;
          letter-spacing: normal;
          font-weight: 400;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-4px);
        }
      `}</style>

      {/* Title */}
      <section className="section container animate-fade-in-up" style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <span style={{ display: 'inline-block', background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--accent-red)', marginBottom: '24px', fontWeight: 600 }}>
          PLANS & PACKAGES
        </span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', maxWidth: '900px', margin: '0 auto 20px' }}>
          Flexible scaling for <span className="text-gradient">autonomous enterprise operations</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto 40px' }}>
          Choose the baseline plan that fits your architecture. All plans incorporate our core observability framework.
        </p>

        {/* Annual Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '20px 0' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: !isAnnual ? 'var(--text-main)' : 'var(--text-muted)' }}>Monthly</span>
          <button 
            onClick={handleToggle}
            style={{
              width: '56px', height: '30px', borderRadius: '15px',
              background: isAnnual ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)',
              border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '4px', left: isAnnual ? '30px' : '4px',
              transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </button>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: isAnnual ? 'var(--text-main)' : 'var(--text-muted)' }}>
            Annually <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', marginLeft: '6px', fontWeight: 700 }}>Save 20%</span>
          </span>
        </div>
      </section>

      {/* Grid of Plans */}
      <section className="container" style={{ marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {plans.map(p => (
            <div 
              key={p.name} 
              className="glass-panel" 
              style={{
                padding: '40px 30px', display: 'flex', flexDirection: 'column',
                borderColor: p.popular ? 'var(--accent-red)' : 'var(--glass-border)',
                background: p.popular ? 'linear-gradient(180deg, rgba(225,29,72,0.06) 0%, rgba(13,13,20,0.85) 100%)' : 'var(--glass-bg)',
                position: 'relative',
                transform: p.popular ? 'scale(1.02)' : 'none',
                boxShadow: p.popular ? '0 10px 40px rgba(225,29,72,0.15)' : 'none',
                zIndex: p.popular ? 2 : 1
              }}
            >
              {p.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent-red)', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                  padding: '4px 14px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Highly Recommended
                </div>
              )}
              
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '12px' }}>
                  <p.icon size={22} style={{ color: p.iconColor }} />
                </div>
                <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{p.name}</h3>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                <span style={{ 
                  fontSize: '3rem', 
                  fontWeight: 900, 
                  fontFamily: 'Outfit',
                  transform: priceAnimate ? 'scale(0.95)' : 'scale(1)',
                  opacity: priceAnimate ? 0.7 : 1,
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>{p.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.period}</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minHeight: '60px', marginBottom: '24px', lineHeight: 1.5 }}>
                {p.desc}
              </p>

              {/* Action Button */}
              <button 
                className={`btn ${p.popular ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', padding: '12px', marginBottom: '32px' }}
                onClick={() => window.location.href = 'http://localhost:5174/'}
              >
                {p.cta}
              </button>

              {/* Features */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                  Included Features
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Check size={14} style={{ color: 'var(--accent-red)', marginTop: '2px', flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="container" style={{ marginBottom: '100px' }}>
        <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '50px' }}>Detailed Feature Matrix</h2>
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
          <table className="pricing-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: 700 }}>Features</th>
                <th style={{ padding: '16px', textAlign: 'center', width: '18%', opacity: 0.8 }}>Starter</th>
                <th style={{ padding: '16px', textAlign: 'center', width: '18%', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.03)', borderLeft: '1px solid rgba(6,182,212,0.1)', borderRight: '1px solid rgba(6,182,212,0.1)' }}>Professional</th>
                <th style={{ padding: '16px', textAlign: 'center', width: '18%', opacity: 0.8 }}>Enterprise</th>
                <th style={{ padding: '16px', textAlign: 'center', width: '18%', opacity: 0.8 }}>Government</th>
              </tr>
            </thead>
            <tbody>
              {compareMatrix.map(cat => (
                <div key={cat.category} style={{ display: 'contents' }}>
                  <tr style={{ background: 'transparent' }}>
                    <td colSpan={5} style={{ 
                      padding: '28px 16px 10px 16px', 
                      fontWeight: 700, 
                      color: 'rgba(255, 255, 255, 0.4)', 
                      fontSize: '0.7rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.12em',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {cat.category}
                    </td>
                  </tr>
                  {cat.rows.map(row => (
                    <tr key={row.feature} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{renderFeatureName(row.feature)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', opacity: 0.8 }}>{renderCell(row.starter, false)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-main)', background: 'rgba(6,182,212,0.03)', borderLeft: '1px solid rgba(6,182,212,0.1)', borderRight: '1px solid rgba(6,182,212,0.1)' }}>{renderCell(row.prof, true)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', opacity: 0.8 }}>{renderCell(row.ent, false)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', opacity: 0.8 }}>{renderCell(row.gov, false)}</td>
                    </tr>
                  ))}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container" style={{ marginBottom: '80px', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {FAQS.map((faq, i) => (
            <div key={i} className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 12px 0', color: 'var(--text-main)' }}>
                <HelpCircle size={16} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                {faq.q}
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
