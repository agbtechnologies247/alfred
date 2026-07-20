import { useState } from 'react';
import { Shield, Database, Cloud, Server, Network, Users, Activity, ArrowRight, CheckCircle, Clock, TrendingUp, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Activity, color: '#00d4ff' },
  { id: 'IT Operations', label: 'IT Operations', icon: Server, color: '#7c3aed' },
  { id: 'Database', label: 'Database', icon: Database, color: '#0ea5e9' },
  { id: 'Cloud', label: 'Cloud', icon: Cloud, color: '#f59e0b' },
  { id: 'Security', label: 'Security', icon: Shield, color: '#ef4444' },
  { id: 'Identity', label: 'Identity & Access', icon: Users, color: '#10b981' },
  { id: 'Network', label: 'Network', icon: Network, color: '#8b5cf6' },
  { id: 'ITSM', label: 'ITSM', icon: Activity, color: '#ec4899' },
  { id: 'Compliance', label: 'Compliance', icon: CheckCircle, color: '#64748b' },
];

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  High: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  Medium: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  Low: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
};

const TEMPLATES = [
  {
    id: 'TPL-001', category: 'IT Operations', industry: ['All'],
    title: 'CoreDNS CrashLoopBackOff Recovery',
    severity: 'Critical', confidence: '98%',
    estimated_resolution_mins: 8, monthly_occurrences: 3,
    tags: ['kubernetes', 'dns', 'crash-loop'],
    description: 'Automatically detects and recovers CoreDNS pods stuck in CrashLoopBackOff inside Kubernetes clusters.',
    roi: 'Saves 45 min/incident × 3x/month = 2.25 hrs',
    steps: ['Detect CrashLoopBackOff via Kubernetes event watcher', 'Pull CoreDNS pod logs from last 5 minutes', 'AI analyzes logs for root cause pattern', 'If config corruption: restore from ConfigMap backup', 'If OOM: increase memory limit and restart', 'Rollout restart with zero downtime', 'Verify DNS resolution on 3 test endpoints', 'Create incident ticket with RCA and close'],
  },
  {
    id: 'TPL-002', category: 'IT Operations', industry: ['All'],
    title: 'High CPU Utilization — Runaway Process',
    severity: 'High', confidence: '92%',
    estimated_resolution_mins: 12, monthly_occurrences: 8,
    tags: ['cpu', 'performance', 'linux'],
    description: 'Identifies the top CPU-consuming process, determines if it is legitimate, and either kills or scales the affected service.',
    roi: '8 incidents/month × 12 min = 96 min saved',
    steps: ['Capture top 10 CPU processes via SSH', 'AI cross-references processes against known service catalog', 'If unknown process: flag for security review', 'If runaway: kill process and log PID', 'If traffic spike: trigger auto-scale policy', 'Monitor CPU for 5 min post-action', 'Send resolution summary to Slack'],
  },
  {
    id: 'TPL-010', category: 'Database', industry: ['All'],
    title: 'PostgreSQL Connection Pool Exhaustion',
    severity: 'Critical', confidence: '97%',
    estimated_resolution_mins: 5, monthly_occurrences: 4,
    tags: ['postgres', 'database', 'connection-pool'],
    description: 'Detects connection pool saturation and intelligently restarts the pool, kills idle connections, or scales read replicas.',
    roi: 'Prevents full DB outage. $50K+ downtime avoided.',
    steps: ['Query pg_stat_activity for idle connections > 10 min', 'AI evaluates which sessions are safe to terminate', 'Terminate idle connections in batches', 'Restart connection pool manager (PgBouncer)', 'Verify connection count returns below 80%', 'Update incident log with root cause'],
  },
  {
    id: 'TPL-011', category: 'Database', industry: ['Finance', 'Retail', 'Healthcare'],
    title: 'Slow Query Detection & Optimization',
    severity: 'Medium', confidence: '89%',
    estimated_resolution_mins: 20, monthly_occurrences: 12,
    tags: ['postgres', 'mysql', 'performance', 'query'],
    description: 'Captures slow queries, generates AI-recommended index suggestions, and optionally creates the index automatically.',
    roi: '12x/month × 20 min DBA work eliminated',
    steps: ['Capture slow query log entries', 'Run EXPLAIN ANALYZE on top 5 offending queries', 'AI generates index recommendations', 'Show DBA proposed CREATE INDEX statements', 'If auto-approve enabled: create index CONCURRENTLY', 'Monitor query response time for 10 min'],
  },
  {
    id: 'TPL-020', category: 'Cloud', industry: ['All'],
    title: 'AWS EC2 Restart with Health Checks',
    severity: 'High', confidence: '95%',
    estimated_resolution_mins: 10, monthly_occurrences: 6,
    tags: ['aws', 'ec2', 'restart'],
    description: 'Safely restarts an EC2 instance with pre-restart health checks, post-restart validation, and automatic rollback.',
    roi: 'Reduces MTTR from 45 min to 10 min. 6x/month.',
    steps: ['Check EC2 instance status checks via CloudWatch', 'Capture last 100 lines of system log', 'AI determines if restart or replace is safer', 'Detach instance from Load Balancer', 'Initiate instance stop/start', 'Wait for instance checks to pass (2/2)', 'Re-attach to Load Balancer', 'Run synthetic health check'],
  },
  {
    id: 'TPL-022', category: 'Cloud', industry: ['Finance', 'SaaS'],
    title: 'Idle Cloud Resource Cleanup (FinOps)',
    severity: 'Low', confidence: '91%',
    estimated_resolution_mins: 30, monthly_occurrences: 4,
    tags: ['finops', 'aws', 'azure', 'cost'],
    description: 'Identifies and terminates idle EC2 instances, unattached EBS volumes, and unused Elastic IPs to reduce cloud spend.',
    roi: 'Enterprise saves $8K–$40K/month in cloud waste.',
    steps: ['Query CloudWatch for instances with < 2% CPU over 14 days', 'List unattached EBS volumes and unused EIPs', 'Calculate total monthly cost', 'AI ranks list by savings potential', 'Send cost reduction report for approval', 'On approval: schedule deletion in 48h'],
  },
  {
    id: 'TPL-030', category: 'Security', industry: ['All'],
    title: 'Suspicious Login — Account Lockout Response',
    severity: 'Critical', confidence: '96%',
    estimated_resolution_mins: 3, monthly_occurrences: 20,
    tags: ['security', 'identity', 'okta'],
    description: 'Detects brute force or credential stuffing attacks and locks the account while notifying the user and security team.',
    roi: 'Prevents credential compromise. Saves 45 min SOC time/incident.',
    steps: ['Receive failed login alert from Okta/Azure AD', 'Check IP reputation via threat intelligence', 'Check user historical login geography', 'If malicious: immediately lock account', 'Send user secure reset link', 'Create security incident in ServiceNow', 'Alert SOC team via PagerDuty'],
  },
  {
    id: 'TPL-031', category: 'Security', industry: ['Finance', 'Healthcare', 'Government'],
    title: 'SSL Certificate Expiry — Auto Renewal',
    severity: 'Critical', confidence: '99%',
    estimated_resolution_mins: 8, monthly_occurrences: 5,
    tags: ['ssl', 'certificates', 'lets-encrypt'],
    description: 'Monitors certificate expiry dates and auto-renews via Let\'s Encrypt or enterprise CA 14 days before expiry.',
    roi: 'One incident avoided = $25K+ saved. Zero manual effort.',
    steps: ['Check certificate expiry via daily scan', 'Alert if expiry < 14 days', 'Determine renewal method', 'Run ACME challenge for Let\'s Encrypt', 'Receive and verify new certificate', 'Deploy to web servers/load balancers', 'Validate HTTPS handshake on all endpoints'],
  },
  {
    id: 'TPL-040', category: 'Identity', industry: ['All'],
    title: 'User Offboarding — Full Deprovisioning',
    severity: 'High', confidence: '98%',
    estimated_resolution_mins: 15, monthly_occurrences: 25,
    tags: ['identity', 'okta', 'azure-ad', 'hr'],
    description: 'Fully automated employee offboarding — disables accounts, revokes access, transfers data ownership, and archives the mailbox.',
    roi: '25x/month. Manual: 2 hrs → Automated: 15 min.',
    steps: ['Receive offboarding trigger from HR system', 'Inventory all systems user has access to', 'Disable Okta/Azure AD account immediately', 'Revoke all active SSO sessions and API keys', 'Transfer file ownership in Google Drive', 'Archive and forward mailbox to manager', 'Remove from all distribution lists', 'Create compliance confirmation ticket'],
  },
  {
    id: 'TPL-041', category: 'Identity', industry: ['All'],
    title: 'Password Reset Self-Service',
    severity: 'Low', confidence: '99%',
    estimated_resolution_mins: 2, monthly_occurrences: 200,
    tags: ['identity', 'password', 'self-service'],
    description: 'Allows users to reset their own password through a verified channel, eliminating helpdesk tickets entirely.',
    roi: '200x/month × 2 min = $4,000+/month helpdesk savings.',
    steps: ['User submits reset request', 'Send MFA verification to email/phone', 'Verify OTP within 10-minute window', 'Generate cryptographically secure temp password', 'Set password in Active Directory/Okta', 'Force change on next login', 'Log event to audit trail'],
  },
  {
    id: 'TPL-060', category: 'ITSM', industry: ['All'],
    title: 'SLA Breach Prevention — Escalation',
    severity: 'High', confidence: '95%',
    estimated_resolution_mins: 3, monthly_occurrences: 10,
    tags: ['sla', 'itsm', 'servicenow'],
    description: 'Monitors open tickets against SLA thresholds and automatically escalates before breach occurs.',
    roi: '10x/month. Prevents SLA breach penalties.',
    steps: ['Monitor all open incidents against SLA timers', 'Alert when 80% of SLA time consumed', 'AI reviews assignee workload and availability', 'Auto-reassign to available senior engineer', 'Notify manager via SMS and Slack', 'If breach: trigger P1 war room bridge'],
  },
  {
    id: 'TPL-090', category: 'Compliance', industry: ['Finance', 'Healthcare', 'Government'],
    title: 'SOC2 Evidence Collection — Automated',
    severity: 'Low', confidence: '99%',
    estimated_resolution_mins: 60, monthly_occurrences: 1,
    tags: ['soc2', 'compliance', 'audit'],
    description: 'Automatically collects, organizes, and packages SOC2 audit evidence from all connected systems.',
    roi: 'Reduces audit prep from 3 weeks to 1 day. $50K+ saved.',
    steps: ['Query Okta for access review records', 'Export change management records', 'Collect backup verification logs', 'Download incident reports with SLA data', 'Verify security training completion', 'Generate auditor-ready evidence package', 'Upload to secure audit portal'],
  },
];

const STATS = [
  { value: '40+', label: 'Pre-built templates', icon: Activity },
  { value: '8', label: 'Industry categories', icon: Filter },
  { value: '< 5 min', label: 'Avg resolution time', icon: Clock },
  { value: '97%', label: 'Average AI confidence', icon: TrendingUp },
];

function TemplateCard({ template }: { template: typeof TEMPLATES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_STYLES[template.severity] || SEVERITY_STYLES.Low;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s', cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ ...sev, padding: '2px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>{template.severity}</span>
            <span style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--accent-cyan)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.72rem', border: '1px solid rgba(0,212,255,0.2)' }}>{template.category}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.4 }}>{template.title}</h3>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>AI Confidence</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{template.confidence}</div>
        </div>
      </div>

      {/* Description */}
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{template.description}</p>

      {/* Metrics row */}
      <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{template.estimated_resolution_mins} min</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={13} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{template.monthly_occurrences}x/month</span>
        </div>
      </div>

      {/* ROI */}
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '10px 14px' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROI · </span>
        <span style={{ fontSize: '0.82rem', color: '#34d399' }}>{template.roi}</span>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {template.tags.map(tag => (
          <span key={tag} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', color: '#64748b' }}>#{tag}</span>
        ))}
      </div>

      {/* Steps toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', transition: 'border-color 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide' : 'View'} {template.steps.length} steps
      </button>

      {expanded && (
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {template.steps.map((step, i) => (
            <li key={i} style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Step {i + 1}:</span> {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>

      {/* Hero */}
      <section className="section container animate-fade-in-up" style={{ textAlign: 'center', paddingBottom: '60px' }}>
        <span style={{ display: 'inline-block', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '24px' }}>
          40+ Pre-built Templates
        </span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', maxWidth: '800px', margin: '0 auto 20px' }}>
          Day-one automation for<br /><span className="text-gradient">every enterprise problem</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 48px' }}>
          Battle-tested resolution workflows across IT Operations, Security, Cloud, Database, Identity, and Compliance. Deploy in minutes, not months.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {STATS.map(stat => (
            <div key={stat.label} className="glass-panel" style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter & Search */}
      <section className="container" style={{ marginBottom: '40px' }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '440px', marginBottom: '24px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates, tags..."
            style={{ width: '100%', padding: '10px 14px 10px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ padding: '8px 18px', borderRadius: '24px', border: `1px solid ${activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.1)'}`, background: activeCategory === cat.id ? `${cat.color}18` : 'transparent', color: activeCategory === cat.id ? cat.color : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeCategory === cat.id ? 600 : 400, transition: 'all 0.2s' }}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Template Grid */}
      <section className="container" style={{ marginBottom: '80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No templates match your search.</div>
        ) : (
          <>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>{filtered.length} template{filtered.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
              {filtered.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))', padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ marginBottom: '16px' }}>Need a custom template?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>Our enterprise team builds custom resolution workflows for your specific infrastructure. Average delivery: 5 business days.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/api-docs" style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--accent-cyan), #7c3aed)', borderRadius: '10px', color: '#fff', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              View API Docs <ArrowRight size={16} />
            </a>
            <a href="/#contact" style={{ padding: '14px 28px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
