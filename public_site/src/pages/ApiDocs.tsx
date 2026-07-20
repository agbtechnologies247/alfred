import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, CheckCircle, Terminal, Package, Zap } from 'lucide-react';

const ENDPOINTS = [
  {
    tag: 'Platform', color: '#00d4ff',
    routes: [
      { method: 'GET', path: '/health', summary: 'Platform health check', description: 'Returns health status and list of all active engine phases.', response: '{"status":"healthy","version":"0.1.0","phases_active":["workflow-engine","ai-gateway","ontology-engine","ml-engine"]}' },
    ]
  },
  {
    tag: 'Monitoring', color: '#7c3aed',
    routes: [
      { method: 'GET', path: '/api/monitoring/kpis', summary: 'Platform KPIs', description: 'Health score, active alerts, open incidents, automation success rate.', response: '{"health_score":99.98,"critical_alerts":3,"open_incidents":18,"automation_success":97.0}' },
      { method: 'GET', path: '/api/monitoring/telemetry', summary: 'Network telemetry data', description: 'Packet, latency and error telemetry for charting.', response: '{"packet_data":[...],"latency_data":[...]}' },
    ]
  },
  {
    tag: 'Incidents', color: '#ef4444',
    routes: [
      { method: 'GET', path: '/api/incidents', summary: 'List all incidents', description: 'Returns live incidents from PostgreSQL or mock fallback.', response: '[{"id":"INC-1042","status":"Active","priority":"P1","title":"CoreDNS CrashLoop"}]' },
      { method: 'GET', path: '/api/incidents/metrics', summary: 'Incident metrics', description: 'P1 count, MTTR, and resolution stats.', response: '{"p1_critical":1,"mttr_mins":12,"resolved_30d":142}' },
      { method: 'POST', path: '/api/api/v1/incidents', summary: 'Create incident (Developer API)', description: 'Requires Bearer token with incident.write scope.', body: '{"title":"High CPU on prod-server-01","priority":"P2","source":"CloudWatch"}', response: '{"success":true,"id":"uuid-..."}' },
    ]
  },
  {
    tag: 'Knowledge Graph', color: '#10b981',
    routes: [
      { method: 'GET', path: '/api/topology/:id', summary: 'Entity topology', description: 'Nodes and edges of the knowledge graph around an entity.', response: '{"nodes":[...],"edges":[...]}' },
      { method: 'GET', path: '/api/topology/:id/impact', summary: 'Impact radius analysis', description: 'Returns all downstream entities affected if this entity fails, with risk score.', response: '{"affected_entities":[{"name":"Billing API","depth":1}],"risk_score":0.87}' },
    ]
  },
  {
    tag: 'ML Engine', color: '#f59e0b',
    routes: [
      { method: 'POST', path: '/api/ml/predict/failure', summary: 'Predict entity failure', description: 'Returns failure probability using XGBoost/LightGBM model.', body: '{"entity_id":"db-postgres-prod"}', response: '{"label":"stable","probability":0.18,"model_used":"xgboost-v2"}' },
      { method: 'POST', path: '/api/ml/predict/capacity', summary: 'Forecast capacity', description: 'Prophet-style time series forecast for storage/compute resources.', body: '{"resource_id":"orders-db","current_usage_pct":78.5}', response: '{"days_to_90pct_capacity":8,"recommendation":"IMMEDIATE_ACTION"}' },
    ]
  },
  {
    tag: 'Marketplace', color: '#8b5cf6',
    routes: [
      { method: 'GET', path: '/api/marketplace/packages/agents', summary: 'List AI Agent packages', description: 'Returns all available and installed AI agent manifests.', response: '[{"id":"agent-aws","name":"AWS Cloud Agent","pricing":"included","rating":4.8}]' },
      { method: 'POST', path: '/api/marketplace/packages/:id/install', summary: 'Install package', description: 'Install an agent, automation pack, or connector from the marketplace.', response: '{"success":true,"message":"Package agent-finops installed"}' },
    ]
  },
  {
    tag: 'Decision Engineering', color: '#ec4899',
    routes: [
      { method: 'POST', path: '/api/decisions/simulate', summary: 'Simulate action impact', description: 'Computes blast radius, SLA breach probability, cost impact, and alternative actions BEFORE executing.', body: '{"action_type":"restart_service","target_entity_id":"api-gw-prod"}', response: '{"risk_score":{"severity":"medium"},"estimated_affected_customers":142,"sla_breach_probability":0.42,"alternatives":[...]}' },
    ]
  },
  {
    tag: 'Governance', color: '#64748b',
    routes: [
      { method: 'GET', path: '/api/governance/roles', summary: 'List RBAC roles', description: 'Returns all roles and their permission scopes.', response: '[{"role":"sr_engineer","permissions":["incidents","workflows","decisions"]}]' },
      { method: 'GET', path: '/api/governance/audit', summary: 'Audit trail', description: 'Immutable audit log of all user and AI actions.', response: '{"total":0,"entries":[]}' },
    ]
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
};

function EndpointRow({ route }: { route: typeof ENDPOINTS[0]['routes'][0] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
          padding: '14px 20px', background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: METHOD_COLORS[route.method] || '#fff', minWidth: '40px' }}>{route.method}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#e2e8f0', flex: 1 }}>{route.path}</span>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem', flex: 2 }}>{route.summary}</span>
        {open ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px 80px', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#94a3b8', margin: '12px 0', fontSize: '0.9rem' }}>{route.description}</p>
          {'body' in route && route.body && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Request Body</div>
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#7dd3fc', position: 'relative' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{route.body}</pre>
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between' }}>
              <span>Response (200)</span>
              <button onClick={() => copy(route.response)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#86efac' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{route.response}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [installCopied, setInstallCopied] = useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install @bhramitpardhi/alfred-sdk');
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 2000);
  };

  const displayed = activeTag ? ENDPOINTS.filter(e => e.tag === activeTag) : ENDPOINTS;

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>

      {/* Hero */}
      <section className="section container animate-fade-in-up" style={{ textAlign: 'center' }}>
        <span style={{ display: 'inline-block', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '24px' }}>API Reference v0.1.0</span>
        <h1 style={{ fontSize: '3.5rem', maxWidth: '800px', margin: '0 auto 20px' }}>
          Build on <span className="text-gradient">A.L.F.R.E.D.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px' }}>
          A complete REST API and SDK for integrating AI decision engineering into your enterprise workflows.
        </p>

        {/* Install card */}
        <div className="glass-panel" style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '16px 24px', marginBottom: '20px' }}>
          <Terminal size={18} style={{ color: 'var(--accent-cyan)' }} />
          <code style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#e2e8f0' }}>npm install @bhramitpardhi/alfred-sdk</code>
          <button onClick={copyInstall} style={{ background: 'none', border: 'none', cursor: 'pointer', color: installCopied ? '#10b981' : '#64748b' }}>
            {installCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Quick SDK usage */}
        <div className="glass-panel" style={{ textAlign: 'left', maxWidth: '700px', margin: '0 auto', padding: '20px 28px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Start</div>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.7, overflowX: 'auto' }}>{`import { AlfredClient } from '@bhramitpardhi/alfred-sdk';

const alfred = new AlfredClient({
  baseUrl: 'https://your-alfred.company.com',
  apiKey: 'YOUR_API_KEY',
});

// Simulate before acting
const sim = await alfred.decisions.simulate({
  action_type: 'restart_service',
  target_entity_id: 'api-gw-prod',
});
console.log(\`Risk: \${sim.risk_score.severity}\`);
console.log(\`Affected customers: \${sim.estimated_affected_customers}\`);

// Submit human feedback for AI learning
await alfred.feedback.submit({
  decision_id: 'DEC-901',
  action_type: 'restart_service',
  decision: 'approved',
});`}</pre>
        </div>
      </section>

      {/* API Reference */}
      <section className="section container">
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>API Reference</h2>

        {/* Tag filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${!activeTag ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`, background: !activeTag ? 'rgba(0,212,255,0.1)' : 'transparent', color: !activeTag ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            All
          </button>
          {ENDPOINTS.map(e => (
            <button
              key={e.tag}
              onClick={() => setActiveTag(activeTag === e.tag ? null : e.tag)}
              style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${activeTag === e.tag ? e.color : 'rgba(255,255,255,0.1)'}`, background: activeTag === e.tag ? `${e.color}20` : 'transparent', color: activeTag === e.tag ? e.color : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {e.tag}
            </button>
          ))}
        </div>

        {/* Endpoint groups */}
        {displayed.map(group => (
          <div key={group.tag} className="glass-panel" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color }} />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{group.tag}</h3>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>{group.routes.length} endpoint{group.routes.length !== 1 ? 's' : ''}</span>
            </div>
            {group.routes.map(r => <EndpointRow key={r.path + r.method} route={r} />)}
          </div>
        ))}
      </section>

      {/* SDK Packages */}
      <section className="section" style={{ background: 'rgba(0,0,0,0.3)', padding: '80px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '48px' }}>SDK & Packages</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: Package, name: '@bhramitpardhi/alfred-sdk', desc: 'Official Scoped JavaScript/TypeScript SDK for Node.js and browsers.', install: 'npm install @bhramitpardhi/alfred-sdk', badge: 'v0.1.0' },
              { icon: Zap, name: 'alfred-python', desc: 'Official Python SDK. Supports async/await and sync clients.', install: 'pip install alfred-sdk', badge: 'v0.1.0' },
              { icon: Terminal, name: 'alfred-cli', desc: 'Command-line interface for managing incidents, workflows, and agents.', install: 'npm install -g alfred-cli', badge: 'v0.1.0' },
            ].map(pkg => (
              <div key={pkg.name} className="glass-panel" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <pkg.icon size={24} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', padding: '2px 10px', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{pkg.badge}</span>
                </div>
                <h3 style={{ fontFamily: 'monospace', margin: '0 0 8px', fontSize: '1rem' }}>{pkg.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{pkg.desc}</p>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#7dd3fc' }}>
                  $ {pkg.install}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
