import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Key, Link, Code, Play, Copy, CheckCircle, Plus, Trash2,
  Book, Terminal, Shield, Webhook, Package,
  ChevronRight, AlertCircle
} from 'lucide-react';

export const Route = createFileRoute('/developer')({
  component: DeveloperPortal,
});

// ── In-memory demo data (wire to /api/developer/* for production) ─────────
const DEMO_KEYS = [
  { id: 'key-001', name: 'Production Monitoring', prefix: 'alf_prod_', created: '2026-07-01', lastUsed: '2 min ago',  scopes: ['monitoring:read', 'incidents:read'] },
  { id: 'key-002', name: 'CI/CD Pipeline',        prefix: 'alf_cicd_', created: '2026-06-15', lastUsed: '1 day ago', scopes: ['workflows:execute', 'incidents:write'] },
];

const DEMO_WEBHOOKS = [
  { id: 'wh-001', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['incident.created', 'incident.resolved'], status: 'active' },
  { id: 'wh-002', url: 'https://api.pagerduty.com/v2/enqueue',         events: ['incident.critical'],                    status: 'active' },
];

// NOTE: these are code samples shown in a <pre> block — NOT executed JS.
// The Python f-string dollar signs are intentionally escaped as \u0024 to
// prevent TypeScript from treating them as template-literal expressions.
const SDK_EXAMPLES: Record<string, string> = {
  'Node.js': [
    "import { Alfred } from '@alfred/sdk';",
    "",
    "const client = new Alfred({",
    "  apiKey: process.env.ALFRED_API_KEY,",
    "  baseUrl: 'http://localhost:3000',",
    "});",
    "",
    "// Get AI recommendations",
    "const recs = await client.decisions.getRecommendations();",
    "",
    "// Simulate an action before executing",
    "const sim = await client.decisions.simulate({",
    "  action_type: 'restart_service',",
    "  target_entity_id: 'orders-api',",
    "});",
    "",
    "console.log('Risk:', sim.risk_score.severity);",
    "console.log('Affected customers:', sim.estimated_affected_customers);",
  ].join('\n'),

  Python: [
    "from alfred import Alfred",
    "import os",
    "",
    "client = Alfred(",
    "    api_key=os.environ['ALFRED_API_KEY'],",
    "    base_url='http://localhost:3000',",
    ")",
    "",
    "# Get live OpEx ROI from your template catalog",
    "roi = client.opex.get_roi()",
    // eslint-disable-next-line no-template-curly-in-string
    "print(f\"Annual savings: ${roi['summary']['annual_sre_savings_usd']:,.0f}\")",
    "",
    "# Approve a pending decision",
    "client.decisions.approve(decision_id='DEC-001', reason='Verified blast radius')",
  ].join('\n'),

  cURL: [
    "# Health check",
    "curl http://localhost:3000/health",
    "",
    "# Get live ROI data (data-driven from template catalog)",
    "curl -H \"Authorization: Bearer alf_prod_xxxx\" \\",
    "     http://localhost:3000/api/opex/roi | jq .summary",
    "",
    "# Simulate an action",
    "curl -X POST http://localhost:3000/api/decisions/simulate \\",
    "  -H \"Authorization: Bearer alf_prod_xxxx\" \\",
    "  -H \"Content-Type: application/json\" \\",
    "  -d '{\"action_type\":\"restart_service\",\"target_entity_id\":\"orders-api\"}'",
  ].join('\n'),
};

const ENDPOINTS = [
  { method: 'GET',  path: '/api/opex/roi',                  desc: 'Compute live ROI from template catalog',      auth: true  },
  { method: 'GET',  path: '/api/monitoring/kpis',           desc: 'Platform health KPIs',                        auth: true  },
  { method: 'GET',  path: '/api/incidents',                 desc: 'List all incidents',                          auth: true  },
  { method: 'POST', path: '/api/incidents',                 desc: 'Create a new incident',                       auth: true  },
  { method: 'GET',  path: '/api/decisions/recommendations', desc: 'Get AI recommendations',                      auth: true  },
  { method: 'POST', path: '/api/decisions/simulate',        desc: 'Simulate action with blast-radius analysis',  auth: true  },
  { method: 'GET',  path: '/api/templates',                 desc: 'Get template catalog (21 templates)',         auth: true  },
  { method: 'GET',  path: '/api/ontology/templates',         desc: 'Get 28 ontology categories & templates',      auth: true  },
  { method: 'POST', path: '/api/ontology/simulate',         desc: 'Simulate specific operational ontology event',auth: true  },
  { method: 'GET',  path: '/api/marketplace/packages',      desc: 'Browse marketplace packages',                 auth: true  },
  { method: 'POST', path: '/api/feedback',                  desc: 'Submit RLHF feedback on a decision',         auth: true  },
  { method: 'POST', path: '/api/ml/predict/failure',        desc: 'Predict failure probability for an entity',  auth: true  },
  { method: 'GET',  path: '/health',                        desc: 'Health check (no auth)',                      auth: false },
];

// ── Small helper components ───────────────────────────────────────────────
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
      {children}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const c =
    method === 'GET'  ? 'bg-primary/10 text-primary' :
    method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-amber-500/10 text-amber-400';
  return <Badge color={c}>{method}</Badge>;
}

// ── Main component ────────────────────────────────────────────────────────
function DeveloperPortal() {
  const [tab, setTab]             = useState<'keys' | 'webhooks' | 'playground' | 'sdks' | 'reference'>('reference');
  const [sdkLang, setSdkLang]     = useState('Node.js');
  const [playUrl, setPlayUrl]     = useState('/api/opex/roi');
  const [playMethod, setPlayMethod] = useState('GET');
  const [playBody, setPlayBody]   = useState('');
  const [playResult, setPlayResult] = useState('');
  const [playLoading, setPlayLoading] = useState(false);
  const [keys, setKeys]           = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyToken, setNewKeyToken] = useState<string | null>(null);
  const [webhooks, setWebhooks]   = useState<any[]>([]);
  const [newUrl, setNewUrl]       = useState('');
  const [newScope, setNewScope]   = useState('All events');
  const [copied, setCopied]       = useState('');

  const loadWebhooks = async () => {
    try {
      const data = await api.webhooks.getAll();
      setWebhooks(data);
    } catch (e) {
      console.error("Failed to load webhooks", e);
    }
  };

  const loadKeys = async () => {
    try {
      const data = await api.keys.getAll();
      setKeys(data);
    } catch (e) {
      console.error("Failed to load API keys", e);
    }
  };

  useEffect(() => {
    loadWebhooks();
    loadKeys();
  }, []);

  const handleAddWebhook = async () => {
    if (!newUrl.trim()) {
      alert("Please enter a valid webhook target URL");
      return;
    }
    const events = newScope === "All events" 
      ? ["incident.created", "incident.resolved"] 
      : [newScope];
    try {
      await api.webhooks.create(newUrl.trim(), events);
      setNewUrl('');
      loadWebhooks();
    } catch (e) {
      alert("Failed to add webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (confirm("Are you sure you want to delete this webhook subscription?")) {
      try {
        await api.webhooks.delete(id);
        loadWebhooks();
      } catch (e) {
        alert("Failed to delete webhook");
      }
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert("Please enter a valid key description/name");
      return;
    }
    try {
      const res = await api.keys.create(newKeyName.trim(), ["incident.read"]);
      setNewKeyName('');
      if (res.token) {
        setNewKeyToken(res.token);
      }
      loadKeys();
    } catch (e) {
      alert("Failed to generate key. Only super_admin is authorized.");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm("Are you sure you want to revoke this API key? This cannot be undone.")) {
      try {
        await api.keys.delete(id);
        loadKeys();
      } catch (e) {
        alert("Failed to revoke key. Only super_admin is authorized.");
      }
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const runPlayground = async () => {
    setPlayLoading(true);
    setPlayResult('');
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin;
      const url = apiBase + (playUrl.startsWith('/') ? playUrl : '/' + playUrl);
      const opts: RequestInit = { 
        method: playMethod, 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk_test_xxxxx'
        } 
      };
      if (playMethod !== 'GET' && playBody) opts.body = playBody;
      const res  = await fetch(url, opts);
      const json = await res.json();
      setPlayResult(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setPlayResult('Error: ' + e.message);
    } finally {
      setPlayLoading(false);
    }
  };

  const addKey = () => {
    if (!newKeyName.trim()) return;
    setKeys(prev => [
      ...prev,
      {
        id: 'key-' + Date.now(),
        name: newKeyName,
        prefix: 'alf_new_',
        created: new Date().toISOString().slice(0, 10),
        lastUsed: 'Never',
        scopes: ['monitoring:read'],
      },
    ]);
    setNewKeyName('');
  };

  const TABS = [
    { id: 'reference',  label: 'API Reference', icon: Book },
    { id: 'keys',       label: 'API Keys',      icon: Key },
    { id: 'webhooks',   label: 'Webhooks',      icon: Webhook },
    { id: 'playground', label: 'Playground',    icon: Play },
    { id: 'sdks',       label: 'SDKs',          icon: Package },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            API keys, webhooks, playground, and SDK documentation
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-muted/50 border border-border">
          <span className="w-2 h-2 rounded-full bg-success" />
          API live at <span className="font-mono text-primary ml-1">localhost:3000</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all
              ${tab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── API REFERENCE ──────────────────────────────────────────────── */}
      {tab === 'reference' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-2">Base URL</h2>
            <div className="flex items-center gap-3 mt-2">
              <code className="flex-1 px-4 py-2 bg-muted rounded font-mono text-sm text-primary">
                http://localhost:3000
              </code>
              <button
                onClick={() => copyCode('http://localhost:3000', 'base')}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-xs flex items-center gap-1"
              >
                {copied === 'base'
                  ? <CheckCircle className="w-3 h-3 text-success" />
                  : <Copy className="w-3 h-3" />}
                Copy
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-3">Authentication</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Pass your API key in the Authorization header:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm text-emerald-400">
              Authorization: Bearer alf_prod_xxxxxxxxxxxxxxxx
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border">
              <h2 className="font-semibold">Endpoints ({ENDPOINTS.length} routes)</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr>
                  {['Method', 'Path', 'Description', 'Auth', 'Try'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-muted-foreground uppercase font-medium last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map(ep => (
                  <tr key={ep.path + ep.method} className="border-t border-border hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3"><MethodBadge method={ep.method} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-foreground">{ep.path}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{ep.desc}</td>
                    <td className="px-5 py-3">
                      {ep.auth
                        ? <Badge color="bg-amber-500/10 text-amber-400">
                            <Shield className="w-2.5 h-2.5 inline mr-1" />Required
                          </Badge>
                        : <Badge color="bg-muted text-muted-foreground">Open</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => { setPlayUrl(ep.path); setPlayMethod(ep.method); setTab('playground'); }}
                        className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
                      >
                        <Terminal className="w-3 h-3" /> Try
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'keys' && (
        <div className="space-y-4">
          {newKeyToken && (
            <div className="p-5 rounded-xl border border-success/30 bg-success/5 animate-pulse space-y-3">
              <h3 className="font-semibold text-success text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" /> New API Key Generated Successfully
              </h3>
              <p className="text-xs text-muted-foreground">Copy this key now. It will not be shown again.</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-2 bg-zinc-950 rounded font-mono text-xs text-emerald-400 select-all border border-border">
                  {newKeyToken}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newKeyToken); alert("API Key copied!"); }}
                  className="px-4 py-2 bg-success text-success-foreground hover:bg-success/90 rounded text-xs font-semibold"
                >
                  Copy Key
                </button>
                <button
                  onClick={() => setNewKeyToken(null)}
                  className="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production Monitoring)"
                className="flex-1 px-4 py-2 bg-muted rounded border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={handleCreateKey}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> Generate Key
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border">
              <h2 className="font-semibold">{keys.length} API Keys</h2>
            </div>
            <div className="divide-y divide-border">
              {keys.map((k: any) => (
                <div key={k.id} className="p-5 flex items-center gap-4 hover:bg-muted/10">
                  <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                    <Key className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{k.name}</div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <code className="text-xs text-muted-foreground font-mono">{k.prefix}••••••••••••</code>
                      <span className="text-xs text-muted-foreground">Created: {k.created}</span>
                      <span className="text-xs text-muted-foreground">Last used: {k.lastUsed}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {k.scopes.map((s: string) => <Badge key={s} color="bg-primary/10 text-primary">{s}</Badge>)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-400/80">
                API keys are shown only once at creation. Store them in a secrets manager
                (HashiCorp Vault, AWS Secrets Manager). Rotate keys every 90 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── WEBHOOKS ───────────────────────────────────────────────────── */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-3">Configure Webhook Endpoint</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="https://your-endpoint.example.com/alfred-events"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="px-4 py-2 bg-muted rounded border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <select 
                value={newScope}
                onChange={e => setNewScope(e.target.value)}
                className="px-4 py-2 bg-muted rounded border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option>All events</option>
                <option>incident.created</option>
                <option>incident.resolved</option>
                <option>decision.approved</option>
                <option>decision.rejected</option>
                <option>agent.action_taken</option>
              </select>
            </div>
            <button 
              onClick={handleAddWebhook}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> Add Webhook
            </button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border">
              <h2 className="font-semibold">{webhooks.length} Active Webhooks</h2>
            </div>
            <div className="divide-y divide-border">
              {webhooks.map((wh: any) => (
                <div key={wh.id} className="p-5 flex items-center gap-4 hover:bg-muted/10">
                  <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                    <Link className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate text-foreground">{wh.url}</div>
                    <div className="flex gap-1 mt-2">
                      {wh.events.map((e: string) => (
                        <Badge key={e} color="bg-violet-500/10 text-violet-400">{e}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge color="bg-success/10 text-success">{wh.status}</Badge>
                  <button className="text-xs text-primary hover:underline">Test</button>
                  <button 
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-3">Webhook Payload Schema</h3>
            <pre className="bg-muted rounded-lg p-4 text-xs text-emerald-400 overflow-x-auto">{`{
  "event": "incident.created",
  "timestamp": "2026-07-20T08:30:00Z",
  "tenant_id": "your-tenant",
  "data": {
    "incident_id": "INC-001",
    "title": "Database connection pool exhausted",
    "priority": "P1",
    "ai_confidence": 0.97,
    "recommended_action": "restart_service",
    "blast_radius": { "affected_customers": 1200 }
  }
}`}</pre>
          </div>
        </div>
      )}

      {/* ── PLAYGROUND ─────────────────────────────────────────────────── */}
      {tab === 'playground' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-4">API Playground — Live Requests to localhost:3000</h2>

            <div className="flex gap-3 mb-4">
              <select
                value={playMethod}
                onChange={e => setPlayMethod(e.target.value)}
                className="px-3 py-2 bg-muted rounded border border-input text-sm font-mono font-bold text-primary w-24"
              >
                <option>GET</option>
                <option>POST</option>
                <option>DELETE</option>
              </select>
              <input
                value={playUrl}
                onChange={e => setPlayUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-muted rounded border border-input font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={runPlayground}
                disabled={playLoading}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {playLoading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Play className="w-4 h-4" />}
                {playLoading ? 'Sending…' : 'Send'}
              </button>
            </div>

            {playMethod !== 'GET' && (
              <textarea
                value={playBody}
                onChange={e => setPlayBody(e.target.value)}
                rows={4}
                placeholder='{"action_type": "restart_service", "target_entity_id": "orders-api"}'
                className="w-full px-4 py-3 bg-muted rounded border border-input font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring mb-4"
              />
            )}

            {/* Quick-select shortcuts */}
            <div className="flex gap-2 flex-wrap mb-4">
              {ENDPOINTS.map(ep => (
                <button
                  key={ep.path + ep.method}
                  onClick={() => { setPlayUrl(ep.path); setPlayMethod(ep.method); }}
                  className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-mono transition-colors"
                >
                  {ep.method} {ep.path}
                </button>
              ))}
            </div>

            {playResult && (
              <div className="relative">
                <button
                  onClick={() => copyCode(playResult, 'result')}
                  className="absolute top-2 right-2 text-xs px-2 py-1 bg-muted rounded flex items-center gap-1"
                >
                  {copied === 'result'
                    ? <CheckCircle className="w-3 h-3 text-success" />
                    : <Copy className="w-3 h-3" />}
                  Copy
                </button>
                <pre className="bg-muted rounded-lg p-4 text-xs text-emerald-400 overflow-auto max-h-[400px]">
                  {playResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SDKs ───────────────────────────────────────────────────────── */}
      {tab === 'sdks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { lang: 'Node.js', pkg: 'npm install @alfred/sdk',  icon: '⬡', desc: 'TypeScript-first SDK with full type coverage' },
              { lang: 'Python',  pkg: 'pip install alfred-sdk',   icon: '🐍', desc: 'Async-native SDK for Python 3.9+' },
              { lang: 'cURL',    pkg: 'No install required',      icon: '⚡', desc: 'Direct HTTP examples for any language' },
            ].map(s => (
              <button
                key={s.lang}
                onClick={() => setSdkLang(s.lang)}
                className={`p-5 rounded-xl border text-left transition-all
                  ${sdkLang === s.lang
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'}`}
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-bold">{s.lang}</div>
                <div className="font-mono text-xs text-primary mt-1">{s.pkg}</div>
                <div className="text-xs text-muted-foreground mt-2">{s.desc}</div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{sdkLang} — Quick Start</span>
              </div>
              <button
                onClick={() => copyCode(SDK_EXAMPLES[sdkLang], 'sdk')}
                className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded flex items-center gap-1"
              >
                {copied === 'sdk'
                  ? <CheckCircle className="w-3 h-3 text-success" />
                  : <Copy className="w-3 h-3" />}
                Copy
              </button>
            </div>
            <pre className="p-6 text-xs text-emerald-400 bg-black/40 overflow-x-auto leading-relaxed">
              {SDK_EXAMPLES[sdkLang]}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> npm Package
              </h3>
              <code className="block px-3 py-2 bg-muted rounded text-sm font-mono text-primary mb-3">
                npm install @alfred/sdk
              </code>
              <div className="space-y-2 text-sm text-muted-foreground">
                {['Full TypeScript support', 'Automatic retry with exponential backoff', 'Built-in rate limit handling', 'Webhook signature verification'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" /> CLI Tool
              </h3>
              <code className="block px-3 py-2 bg-muted rounded text-sm font-mono text-primary mb-3">
                npm install -g @alfred/cli
              </code>
              <div className="space-y-2 text-sm text-muted-foreground">
                {[
                  'alfred login --api-key alf_xxx',
                  'alfred incidents list --priority P1',
                  'alfred decisions approve DEC-001',
                  'alfred roi --format table',
                ].map(cmd => (
                  <div key={cmd} className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <code className="text-xs">{cmd}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
