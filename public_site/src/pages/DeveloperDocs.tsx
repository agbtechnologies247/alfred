import { useState } from 'react';

const ENDPOINTS = [
  { method: 'GET',  path: '/health',                                desc: 'Health check',                        auth: false },
  { method: 'GET',  path: '/api/opex/roi',                         desc: 'Live ROI from template catalog',       auth: true  },
  { method: 'GET',  path: '/api/monitoring/kpis',                  desc: 'Platform KPIs',                        auth: true  },
  { method: 'GET',  path: '/api/incidents',                        desc: 'List incidents',                       auth: true  },
  { method: 'POST', path: '/api/incidents',                        desc: 'Create incident',                      auth: true  },
  { method: 'GET',  path: '/api/decisions/recommendations',        desc: 'AI recommendations',                   auth: true  },
  { method: 'POST', path: '/api/decisions/simulate',               desc: 'Simulate action (blast radius)',       auth: true  },
  { method: 'POST', path: '/api/feedback',                         desc: 'Submit RLHF decision feedback',        auth: true  },
  { method: 'GET',  path: '/api/templates',                        desc: 'Template catalog (21 templates)',      auth: true  },
  { method: 'POST', path: '/api/ml/predict/failure',               desc: 'ML failure prediction',               auth: true  },
  { method: 'POST', path: '/api/ml/predict/capacity',              desc: 'Capacity forecast',                   auth: true  },
  { method: 'GET',  path: '/api/marketplace/packages',             desc: 'All marketplace packages',             auth: true  },
  { method: 'GET',  path: '/api/governance/audit',                 desc: 'Audit trail',                          auth: true  },
];

const SDK_EXAMPLES: Record<string, string> = {
  'Node.js': `import { Alfred } from '@alfred/sdk';

const alfred = new Alfred({
  apiKey: process.env.ALFRED_API_KEY,
  baseUrl: 'http://localhost:3000',
});

// Real data: get ROI from live template catalog
const roi = await alfred.opex.getRoi();
console.log('Annual savings:', roi.summary.annual_sre_savings_usd);

// Simulate before acting
const sim = await alfred.decisions.simulate({
  action_type: 'restart_service',
  target_entity_id: 'orders-api',
});
console.log('Risk:', sim.risk_score.severity);
console.log('Affected:', sim.estimated_affected_customers, 'customers');`,

  Python: `from alfred import Alfred
import os

alfred = Alfred(
    api_key=os.environ['ALFRED_API_KEY'],
    base_url='http://localhost:3000',
)

# Pull live ROI from template catalog
roi = alfred.opex.get_roi()
annual = roi['summary']['annual_sre_savings_usd']
print(f'Annual savings: \${annual:,.0f}')

# Get AI recommendations
recs = alfred.decisions.get_recommendations()
for rec in recs:
    print(f"{rec['id']}: {rec['action']} ({rec['risk']} risk)")`,

  cURL: `# Health check
curl http://localhost:3000/health

# Live ROI computation from template catalog
curl -H "Authorization: Bearer alf_prod_xxxx" \\
     http://localhost:3000/api/opex/roi | jq .summary

# Simulate action (returns blast radius, risk score)
curl -X POST http://localhost:3000/api/decisions/simulate \\
  -H "Authorization: Bearer alf_prod_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"action_type":"restart_service","target_entity_id":"orders-api"}'

# Submit RLHF feedback
curl -X POST http://localhost:3000/api/feedback \\
  -H "Content-Type: application/json" \\
  -d '{"decision_id":"DEC-001","decision":"approved","ai_confidence":0.94}'`,
};

const WEBHOOK_EVENTS = [
  { event: 'incident.created', desc: 'New incident detected by AI' },
  { event: 'incident.resolved', desc: 'Incident auto-resolved by workflow' },
  { event: 'decision.approved', desc: 'AI action approved by human operator' },
  { event: 'decision.rejected', desc: 'AI action rejected' },
  { event: 'agent.action_taken', desc: 'Autonomous agent executed an action' },
  { event: 'template.triggered', desc: 'A runbook template was triggered' },
];

export default function DeveloperDocs() {
  const [tab, setTab] = useState<'quickstart' | 'reference' | 'webhooks' | 'sdks' | 'auth'>('quickstart');
  const [sdkLang, setSdkLang] = useState('Node.js');
  const [copied, setCopied] = useState('');

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(''), 2000);
  };

  const tabStyle = (t: string) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent',
    color: tab === t ? 'var(--accent-cyan)' : 'var(--text-muted)',
    transition: 'all 0.2s',
  });

  const methodColor = (m: string) =>
    m === 'GET' ? 'rgba(0,212,255,0.15)' : 'rgba(16,185,129,0.15)';
  const methodTextColor = (m: string) =>
    m === 'GET' ? 'var(--accent-cyan)' : '#10b981';

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh' }}>
      <section className="section" style={{ paddingBottom: '40px' }}>
        <div className="container">
          <span className="badge" style={{ marginBottom: '16px', display: 'inline-block' }}>REST API · v1.0</span>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900, marginBottom: '12px' }}>
            Developer <span className="text-gradient">Documentation</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px' }}>
            Integrate A.L.F.R.E.D. into your own systems using the REST API, webhooks, or official SDKs.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
            {(['quickstart', 'reference', 'webhooks', 'sdks', 'auth'] as const).map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: '80px' }}>

        {/* ── QUICK START ───────────────────────────────────── */}
        {tab === 'quickstart' && (
          <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>Base URL</h2>
              <code style={{ display: 'block', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                http://localhost:3000
              </code>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>All API responses are JSON. No versioning prefix needed for v1 endpoints.</p>
            </div>

            {[
              { n: '1', title: 'Install the SDK', code: 'npm install @alfred/sdk' },
              { n: '2', title: 'Set your API Key', code: 'export ALFRED_API_KEY=alf_prod_xxxxxxxxxxxxxxxx' },
              { n: '3', title: 'Make your first call', code: `const alfred = new Alfred({ apiKey: process.env.ALFRED_API_KEY });
const roi = await alfred.opex.getRoi();
// → { summary: { annual_sre_savings_usd: 76920, ... } }` },
            ].map(s => (
              <div key={s.n} className="card" style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-cyan),#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{s.n}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '10px' }}>{s.title}</h3>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '14px', fontSize: '0.8rem', color: '#86efac', overflowX: 'auto', margin: 0 }}>{s.code}</pre>
                    <button onClick={() => copy(s.code, s.n)} style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '0.72rem' }}>
                      {copied === s.n ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── API REFERENCE ─────────────────────────────────── */}
        {tab === 'reference' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                {ENDPOINTS.length} Endpoints
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Method', 'Path', 'Description', 'Auth'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map(ep => (
                    <tr key={ep.path} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: methodColor(ep.method), color: methodTextColor(ep.method) }}>{ep.method}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.82rem' }}>{ep.path}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ep.desc}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {ep.auth
                          ? <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>Required</span>
                          : <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)' }}>Open</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>Example: Live ROI Response</h3>
              <pre style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '16px', fontSize: '0.78rem', color: '#86efac', overflowX: 'auto' }}>{`GET /api/opex/roi

{
  "data_source": "Template catalog — GET /api/templates",
  "summary": {
    "template_count": 21,
    "total_monthly_occurrences": 400,
    "monthly_hours_saved": 42.7,
    "monthly_sre_savings_usd": 6410.0,
    "annual_sre_savings_usd": 76920.0,
    "weighted_avg_ai_confidence_pct": 96.9
  },
  "by_category": [ ... ],
  "top_5_by_monthly_impact": [ ... ]
}`}</pre>
            </div>
          </div>
        )}

        {/* ── WEBHOOKS ──────────────────────────────────────── */}
        {tab === 'webhooks' && (
          <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '12px' }}>Configure Webhooks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                A.L.F.R.E.D. sends signed JSON payloads to your endpoint on every platform event. Verify the signature using your webhook secret.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {WEBHOOK_EVENTS.map(e => (
                  <div key={e.event} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent-cyan)', marginBottom: '4px' }}>{e.event}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{e.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>Payload Schema</h3>
              <pre style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '16px', fontSize: '0.78rem', color: '#86efac' }}>{`{
  "event": "incident.created",
  "timestamp": "2026-07-20T08:30:00Z",
  "signature": "sha256=xxxx",
  "data": {
    "incident_id": "INC-001",
    "title": "Database connection pool exhausted",
    "priority": "P1",
    "ai_confidence": 0.97,
    "recommended_action": "restart_service",
    "blast_radius": {
      "affected_services": ["orders-api", "payments-api"],
      "estimated_affected_customers": 1200
    }
  }
}`}</pre>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '8px' }}>Signature Verification (Node.js)</h3>
              <pre style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '14px', fontSize: '0.78rem', color: '#86efac' }}>{`import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</pre>
            </div>
          </div>
        )}

        {/* ── SDKs ──────────────────────────────────────────── */}
        {tab === 'sdks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Node.js', 'Python', 'cURL'].map(lang => (
                <button key={lang} onClick={() => setSdkLang(lang)}
                  style={{ padding: '12px 24px', borderRadius: '10px', border: `1px solid ${sdkLang === lang ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`, background: sdkLang === lang ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)', color: sdkLang === lang ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                  {lang}
                </button>
              ))}
            </div>

            {sdkLang === 'Node.js' && (
              <div className="card">
                <h3 style={{ marginBottom: '8px' }}>Install</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <code style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>npm install @alfred/sdk</code>
                </div>
              </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sdkLang} — Quick Start</span>
                <button onClick={() => copy(SDK_EXAMPLES[sdkLang], 'sdk')}
                  style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.78rem' }}>
                  {copied === 'sdk' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{ padding: '20px', fontSize: '0.82rem', color: '#86efac', overflowX: 'auto', margin: 0, background: 'rgba(0,0,0,0.4)', lineHeight: 1.7 }}>{SDK_EXAMPLES[sdkLang]}</pre>
            </div>
          </div>
        )}

        {/* ── AUTH ──────────────────────────────────────────── */}
        {tab === 'auth' && (
          <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '12px' }}>Authentication</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                A.L.F.R.E.D. uses Bearer token authentication. Generate API keys in the App Dashboard under Developer → API Keys.
              </p>
              <pre style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '14px', fontSize: '0.82rem', color: '#86efac' }}>{`Authorization: Bearer alf_prod_xxxxxxxxxxxxxxxx`}</pre>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>OAuth 2.0 (Enterprise)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>For multi-tenant enterprise deployments, use OAuth 2.0 Client Credentials flow:</p>
              <pre style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '14px', fontSize: '0.78rem', color: '#86efac' }}>{`POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=your_client_id
&client_secret=your_client_secret
&scope=incidents:read decisions:write monitoring:read`}</pre>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>Available Scopes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { scope: 'monitoring:read', desc: 'Read KPIs and telemetry' },
                  { scope: 'incidents:read', desc: 'List and search incidents' },
                  { scope: 'incidents:write', desc: 'Create and update incidents' },
                  { scope: 'decisions:read', desc: 'View AI recommendations' },
                  { scope: 'decisions:write', desc: 'Approve and reject decisions' },
                  { scope: 'workflows:execute', desc: 'Run automation workflows' },
                  { scope: 'templates:read', desc: 'Read template catalog' },
                  { scope: 'opex:read', desc: 'Access ROI and savings data' },
                ].map(s => (
                  <div key={s.scope} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-cyan)', marginBottom: '2px' }}>{s.scope}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
