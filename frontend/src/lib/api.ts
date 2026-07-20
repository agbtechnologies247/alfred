export interface Incident {
  id: string;
  title: string;
  priority: string;
  status: string;
  source: string;
  layer: string;
  time: string;
  aiConfidence: string;
  tags: string[];
}

export interface Sop {
  id: string;
  title: string;
  symptoms: string[];
  root_cause: string;
  detection: string;
  fix: string;
  confidence: string;
  status: string;
  type: string;
}

export interface Workflow {
  id: string;
  title: string;
  trigger: string;
  status: string;
  executions: number;
  last_run: string;
  icon: string;
}

export interface Package {
  id: string;
  name: string;
  version: string;
  publisher: string;
  kind: string;
  description: string;
  icon: string;
  required_permissions: string[];
  required_connectors: string[];
  pricing: string;
  tags: string[];
  install_state: string;
  rating: number;
  downloads: number;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  scopes: string[];
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: string;
}

export interface AuditEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  user_role: string;
  action: string;
  resource: string;
  outcome: string;
  ip_address: string;
  timestamp: string;
  risk_level: string;
}

export interface FeedbackRecord {
  id?: string;
  decision_id: string;
  user_id: string;
  user_role: string;
  action_type: string;
  recommendation: string;
  ai_confidence: number;
  decision: string;
  reason?: string;
  environment: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  sentiment_score: number;
  stress_index: number;
  burnout_risk: string;
}

export interface PeopleInsights {
  overall_burnout_risk: string;
  overall_stress_level: number;
  details: string;
}

const API_BASE = 'http://127.0.0.1:3000/api';


// Local storage helpers to provide robust in-memory mock CRUD behavior when DB is missing
const getStored = <T>(key: string, defaults: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return defaults;
  }
};

const setStored = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const DEFAULT_WEBHOOKS = [
  { id: '33333333-3333-3333-3333-333333333333', url: 'https://company.service-now.com/api/alfred/webhook', events: ['incident.created', 'incident.resolved'], status: 'active' },
  { id: '55555555-5555-5555-5555-555555555555', url: 'http://billsoft.agbtechnologies.com/api/webhook', events: ['incident.created', 'incident.resolved'], status: 'active' }
];

const DEFAULT_KEYS = [
  { id: 'key-001', name: 'Production Monitoring', prefix: 'sk_test_...xxxx', created: '2026-07-01', lastUsed: '2 min ago', scopes: ['monitoring:read', 'incidents:read'] }
];

// Seeding Default Datasets
const DEFAULT_INCIDENTS = [
  { 
    id: "INC-1042", 
    title: "CoreDNS CrashLoop BackOff", 
    priority: "P1", 
    status: "Active", 
    source: "Kubernetes Monitor", 
    layer: "Layer 5", 
    time: "10 mins ago", 
    aiConfidence: "98%", 
    tags: ["Kubernetes", "DNS", "Critical", "Auto Fix Available"] 
  },
  { 
    id: "INC-1043", 
    title: "PostgreSQL Max Connections Reached", 
    priority: "P2", 
    status: "Investigating", 
    source: "Zabbix Monitor", 
    layer: "Layer 4", 
    time: "45 mins ago", 
    aiConfidence: "92%", 
    tags: ["Database", "Postgres", "High"] 
  },
  { 
    id: "INC-1044", 
    title: "Nginx TLS Certificate Expiration Warn", 
    priority: "P3", 
    status: "Resolved", 
    source: "Grafana Alertmanager", 
    layer: "Layer 7", 
    time: "2 hours ago", 
    aiConfidence: "95%", 
    tags: ["Security", "Nginx", "Medium"] 
  }
];

const DEFAULT_SOPS = [
  {
    id: "SOP-104",
    title: "High Packet Loss on Gateway Interface",
    symptoms: ["High packet drop rate", "Gateway ping timeout", "Slow network routing"],
    root_cause: "Interface queue buffer overflow on core switch interface eth1 due to traffic surge.",
    detection: "ping -c 100 -i 0.2 gateway.corp.internal\nifconfig eth1 | grep -i tx",
    fix: "sudo tc qdisc replace dev eth1 root pfifo_limit 1000\nsudo ip link set dev eth1 txqueuelen 2000",
    confidence: "99%",
    status: "Approved",
    type: "Generated"
  },
  {
    id: "SOP-105",
    title: "PostgreSQL connection slots exhaustion mitigation",
    symptoms: ["HTTP 500 server errors", "FATAL: remaining connection slots are reserved for non-replication superuser connections"],
    root_cause: "Active connection sessions exceeding the max_connections setting in postgresql.conf.",
    detection: "psql -U admin -c \"SELECT count(*), state FROM pg_stat_activity GROUP BY state;\"",
    fix: "psql -U admin -c \"ALTER SYSTEM SET max_connections = 250; SELECT pg_reload_conf();\"",
    confidence: "95%",
    status: "Approved",
    type: "Generated"
  },
  {
    id: "SOP-106",
    title: "Nginx SSL/TLS Certificate Auto-Renewal",
    symptoms: ["SSL handshake failed alerts", "Certificate expires in less than 7 days"],
    root_cause: "Let's Encrypt automated cron renewal job blocked by firewall rule.",
    detection: "openssl s_client -connect localhost:443 -servername app.alfred.internal 2>/dev/null | openssl x509 -noout -dates",
    fix: "sudo certbot renew --nginx --agree-tos --email ops@agbtechnologies.com",
    confidence: "91%",
    status: "Pending",
    type: "Manual"
  }
];

const DEFAULT_WORKFLOWS = [
  { 
    id: "WF-1", 
    title: "Auto-Restart CoreDNS on CrashLoop", 
    trigger: "P1 DNS Failure inside Kubernetes", 
    status: "Active", 
    executions: 12, 
    last_run: "2 days ago", 
    icon: "webhook" 
  },
  { 
    id: "WF-2", 
    title: "Scale Database Storage (AWS RDS)", 
    trigger: "Storage Capacity > 85%", 
    status: "Active", 
    executions: 3, 
    last_run: "Requires Manual Approval", 
    icon: "server" 
  },
  { 
    id: "WF-3", 
    title: "Clear Temp Swap Disk on High Usage", 
    trigger: "Disk usage > 90%", 
    status: "Inactive", 
    executions: 0, 
    last_run: "Never", 
    icon: "server" 
  }
];

const DEFAULT_MARKETPLACE = [
  {
    id: "conn-servicenow", name: "ServiceNow Connector", version: "3.0.1",
    publisher: "A.L.F.R.E.D. Official", kind: "connector",
    description: "Bi-directional sync: incidents, change requests, CMDB topology, and task approval webhook loops.",
    icon: "database", required_permissions: ["servicenow.connect"],
    required_connectors: [], pricing: "included", tags: ["itsm", "servicenow"],
    install_state: "Installed", rating: 4.7, downloads: 31000
  },
  {
    id: "conn-datadog", name: "Datadog Connector", version: "2.2.0",
    publisher: "A.L.F.R.E.D. Official", kind: "connector",
    description: "Ingest Datadog monitors, metrics, log triggers, and traces directly into our Decision Engine.",
    icon: "activity", required_permissions: ["monitoring.read"],
    required_connectors: [], pricing: "included", tags: ["monitoring", "datadog"],
    install_state: "Available", rating: 4.8, downloads: 14200
  },
  {
    id: "pkg-identity", name: "Okta Identity Shield", version: "1.5.0",
    publisher: "A.L.F.R.E.D. Official", kind: "automation_pack",
    description: "Automated user suspension, MFA resets, and session termination upon compromise detection.",
    icon: "shield", required_permissions: ["identity.write"],
    required_connectors: ["okta"], pricing: "professional", tags: ["identity", "security"],
    install_state: "Installed", rating: 4.9, downloads: 18500
  },
  {
    id: "bot-sre", name: "SRE Copilot Agent", version: "4.1.2",
    publisher: "AGB Technologies", kind: "ai_agent",
    description: "AI-driven operational copilot that drafts SOPs, executes diagnostics, and recommends safe runbooks.",
    icon: "bot", required_permissions: ["ai.chat", "incident.write"],
    required_connectors: [], pricing: "enterprise", tags: ["ai", "copilot", "sre"],
    install_state: "Available", rating: 4.9, downloads: 22000
  }
];

export async function fetcher<T = any>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  const token = localStorage.getItem('alfred_token') || 'sk_test_xxxxx';
  const headers = {
    ...options?.headers,
    'Authorization': `Bearer ${token}`,
  } as Record<string, string>;

  console.log(`%c[A.L.F.R.E.D. API Request] %cGET ${endpoint}`, 'color: #06b6d4; font-weight: bold', 'color: #94a3b8');

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      console.warn(`%c[A.L.F.R.E.D. API Auth] %cUnauthorized for GET ${endpoint}`, 'color: #ef4444; font-weight: bold', 'color: #f59e0b');
    }

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    const json = await res.json();
    console.log(`%c[A.L.F.R.E.D. API Response] %cGET ${endpoint} - Success`, 'color: #10b981; font-weight: bold', 'color: #06b6d4', json);
    return json;
  } catch (err: any) {
    if (fallback !== undefined) {
      console.log(`%c[A.L.F.R.E.D. API Fallback] %cGET ${endpoint} failed (${err.message}). Using LocalStorage Mock.`, 'color: #f59e0b; font-weight: bold', 'color: #94a3b8', fallback);
      return fallback;
    }
    throw err;
  }
}

const post = async <T = any>(endpoint: string, body: unknown, fallback?: any): Promise<T> => {
  console.log(`%c[A.L.F.R.E.D. API Request] %cPOST ${endpoint}`, 'color: #06b6d4; font-weight: bold', 'color: #e11d48; font-weight: bold', body);
  try {
    const res = await fetcher<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res;
  } catch (err: any) {
    if (fallback !== undefined) {
      console.log(`%c[A.L.F.R.E.D. API Fallback] %cPOST ${endpoint} failed (${err.message}). Executing LocalStorage Mock.`, 'color: #f59e0b; font-weight: bold', 'color: #94a3b8');
      if (typeof fallback === 'function') {
        return fallback();
      }
      return fallback;
    }
    throw err;
  }
};

export const api = {
  // === Phase 1: Monitoring & Incidents ===
  monitoring: {
    getKpis: () => fetcher<any>('/monitoring/kpis'),
    getTelemetry: () => fetcher<any>('/monitoring/telemetry'),
    getErrors: () => fetcher<any[]>('/monitoring/errors'),
  },
  incidents: {
    getAll: async () => {
      const fallback = getStored<any[]>('alfred_incidents', DEFAULT_INCIDENTS);
      return fetcher<any[]>('/incidents', undefined, fallback);
    },
    getMetrics: async () => {
      const list = getStored<any[]>('alfred_incidents', DEFAULT_INCIDENTS);
      const fallback = {
        p1_critical: list.filter(i => i.priority === 'P1' && i.status !== 'Resolved').length,
        p2_high: list.filter(i => i.priority === 'P2' && i.status !== 'Resolved').length,
        p3_medium: list.filter(i => i.priority === 'P3' && i.status !== 'Resolved').length,
        active_incidents: list.filter(i => i.status !== 'Resolved').length,
        resolved_30d: list.filter(i => i.status === 'Resolved').length + 140,
        mttr_mins: 12
      };
      return fetcher<any>('/incidents/metrics', undefined, fallback);
    },
    create: async (title: string, priority: string, source: string, tags: string[] = [], layer: string = 'Layer 7') => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_incidents', DEFAULT_INCIDENTS);
        const newInc = {
          id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
          title,
          priority,
          status: 'Active',
          source,
          layer,
          time: 'Just now',
          aiConfidence: '95%',
          tags: tags.length > 0 ? tags : ["SRE", "Manual"]
        };
        const updated = [newInc, ...list];
        setStored('alfred_incidents', updated);
        return newInc;
      };
      return post<any>('/incidents', { title, priority, source, tags, layer }, fallback);
    },
    update: async (id: string, updatedFields: any) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_incidents', DEFAULT_INCIDENTS);
        const updated = list.map(i => i.id === id ? { ...i, ...updatedFields } : i);
        setStored('alfred_incidents', updated);
        return updated.find(i => i.id === id);
      };
      return post<any>(`/incidents/${id}`, updatedFields, fallback);
    },
    delete: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_incidents', DEFAULT_INCIDENTS);
        const filtered = list.filter(i => i.id !== id);
        setStored('alfred_incidents', filtered);
        return { success: true };
      };
      return post<any>(`/incidents/${id}/delete`, {}, fallback);
    }
  },
  decisions: {
    getRecommendations: () => fetcher<any[]>('/decisions/recommendations'),
    getCopilotActive: () => fetcher<any>('/decisions/copilot/active'),
    getPending: () => fetcher<any[]>('/decisions/pending'),
    simulate: (action_type: string, target_entity_id: string, payload?: unknown) =>
      post('/decisions/simulate', { action_type, target_entity_id, payload: payload ?? {} }),
  },
  sops: {
    getAll: async () => {
      const fallback = getStored<any[]>('alfred_sops', DEFAULT_SOPS);
      return fetcher<any[]>('/sops', undefined, fallback);
    },
    approve: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_sops', DEFAULT_SOPS);
        const updated = list.map(s => s.id === id ? { ...s, status: 'Approved' } : s);
        setStored('alfred_sops', updated);
        return { success: true, message: "SOP approved for automation (LocalStorage mock)" };
      };
      return post<any>(`/sops/${id}/approve`, {}, fallback);
    },
    create: async (sop: any) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_sops', DEFAULT_SOPS);
        const newSop = {
          ...sop,
          id: sop.id || `SOP-${Math.floor(100 + Math.random() * 900)}`,
          status: sop.status || 'Pending',
          type: sop.type || 'Manual'
        };
        setStored('alfred_sops', [newSop, ...list]);
        return newSop;
      };
      return post<any>('/sops', sop, fallback);
    },
    update: async (id: string, sop: any) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_sops', DEFAULT_SOPS);
        const updated = list.map(s => s.id === id ? { ...s, ...sop } : s);
        setStored('alfred_sops', updated);
        return updated.find(s => s.id === id);
      };
      return post<any>(`/sops/${id}`, sop, fallback);
    },
    delete: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_sops', DEFAULT_SOPS);
        const filtered = list.filter(s => s.id !== id);
        setStored('alfred_sops', filtered);
        return { success: true };
      };
      return post<any>(`/sops/${id}/delete`, {}, fallback);
    }
  },
  workflows: {
    getAll: async () => {
      const fallback = getStored<any[]>('alfred_workflows', DEFAULT_WORKFLOWS);
      return fetcher<any[]>('/workflows', undefined, fallback);
    },
    execute: (id: string, graph?: unknown) =>
      post(`/workflows/${id}/execute`, { id, graph }),
    create: async (wf: any) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_workflows', DEFAULT_WORKFLOWS);
        const newWf = {
          ...wf,
          id: wf.id || `WF-${Math.floor(100 + Math.random() * 900)}`,
          executions: 0,
          last_run: 'Never',
          icon: wf.icon || 'server'
        };
        setStored('alfred_workflows', [...list, newWf]);
        return newWf;
      };
      return post<any>('/workflows', wf, fallback);
    },
    update: async (id: string, wf: any) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_workflows', DEFAULT_WORKFLOWS);
        const updated = list.map(w => w.id === id ? { ...w, ...wf } : w);
        setStored('alfred_workflows', updated);
        return updated.find(w => w.id === id);
      };
      return post<any>(`/workflows/${id}`, wf, fallback);
    },
    delete: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_workflows', DEFAULT_WORKFLOWS);
        const filtered = list.filter(w => w.id !== id);
        setStored('alfred_workflows', filtered);
        return { success: true };
      };
      return post<any>(`/workflows/${id}/delete`, {}, fallback);
    }
  },
  agents: {
    getAll: () => fetcher<any[]>('/agents'),
    chat: (message: string) => post('/agents/chat', { message }),
  },
  analytics: {
    get: () => fetcher<any>('/analytics'),
  },
  templates: {
    getAll: () => fetcher<any[]>('/templates'),
  },
  aiProviders: {
    getAll: () => fetcher<any[]>('/ai-providers'),
  },
  topology: {
    get: (entityId: string) => fetcher<any>(`/topology/${entityId}`),
    getImpact: (entityId: string) => fetcher<any>(`/topology/${entityId}/impact`),
  },
  ml: {
    predictFailure: (entity_id: string) => post('/ml/predict/failure', { entity_id }),
    predictCapacity: (resource_id: string, current_usage_pct: number) =>
      post('/ml/predict/capacity', { resource_id, current_usage_pct }),
  },
  feedback: {
    submit: (record: any) => post('/feedback', record),
    getHistory: () => fetcher<any[]>('/feedback/history'),
  },
  marketplace: {
    getAll: async () => {
      const fallback = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE);
      return fetcher<any[]>('/marketplace/packages', undefined, fallback);
    },
    getPackages: async () => {
      const fallback = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE);
      return fetcher<any[]>('/marketplace/packages', undefined, fallback);
    },
    getAgents: async () => {
      const fallback = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE).filter(p => p.kind === 'ai_agent');
      return fetcher<any[]>('/marketplace/packages/agents', undefined, fallback);
    },
    getAutomations: async () => {
      const fallback = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE).filter(p => p.kind === 'automation_pack');
      return fetcher<any[]>('/marketplace/packages/automations', undefined, fallback);
    },
    getConnectors: async () => {
      const fallback = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE).filter(p => p.kind === 'connector');
      return fetcher<any[]>('/marketplace/packages/connectors', undefined, fallback);
    },
    install: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE);
        const updated = list.map(p => p.id === id ? { ...p, install_state: 'Installed' } : p);
        setStored('alfred_marketplace', updated);
        return { success: true };
      };
      return post<any>(`/marketplace/packages/${id}/install`, {}, fallback);
    },
    uninstall: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_marketplace', DEFAULT_MARKETPLACE);
        const updated = list.map(p => p.id === id ? { ...p, install_state: 'Available' } : p);
        setStored('alfred_marketplace', updated);
        return { success: true };
      };
      return post<any>(`/marketplace/packages/${id}/uninstall`, {}, fallback);
    },
    getPlugins: () => fetcher<any[]>('/marketplace/plugins'),
  },
  ai: {
    generateRca: (description: string) => post('/api/v1/ai/rca', { description }),
  },
  governance: {
    getAuditLog: () => fetcher<any>('/governance/audit'),
    getRoles: () => fetcher<any[]>('/governance/roles'),
  },
  opex: {
    getRoi: () => fetcher<any>('/opex/roi'),
  },
  plugins: {
    getAll: () => fetcher<any[]>('/marketplace/packages'),
  },
  keys: {
    getAll: async () => {
      const fallback = getStored<any[]>('alfred_api_keys', DEFAULT_KEYS);
      return fetcher<any[]>('/developer/keys', undefined, fallback);
    },
    create: async (name: string, scopes: string[]) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_api_keys', DEFAULT_KEYS);
        const newKey = {
          id: `key_${Math.random().toString(36).substring(7)}`,
          name: `Key - ${name}`,
          prefix: `sk_live_...${Math.random().toString(36).substring(5)}`,
          created: new Date().toISOString().split('T')[0],
          lastUsed: 'Just now',
          scopes
        };
        setStored('alfred_api_keys', [...list, newKey]);
        return newKey;
      };
      return post<any>('/developer/keys', { name, scopes }, fallback);
    },
    delete: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_api_keys', DEFAULT_KEYS);
        setStored('alfred_api_keys', list.filter(k => k.id !== id));
        return { success: true };
      };
      return post<any>(`/developer/keys/${id}/delete`, {}, fallback);
    }
  },
  webhooks: {
    getAll: async () => {
      const fallback = getStored<any[]>('alfred_webhooks', DEFAULT_WEBHOOKS);
      return fetcher<any[]>('/developer/webhooks', undefined, fallback);
    },
    create: async (url: string, events: string[]) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_webhooks', DEFAULT_WEBHOOKS);
        const newWh = {
          id: `wh_${Math.random().toString(36).substring(7)}`,
          url,
          events,
          status: 'active'
        };
        setStored('alfred_webhooks', [...list, newWh]);
        return newWh;
      };
      return post<any>('/developer/webhooks', { url, events }, fallback);
    },
    delete: async (id: string) => {
      const fallback = () => {
        const list = getStored<any[]>('alfred_webhooks', DEFAULT_WEBHOOKS);
        setStored('alfred_webhooks', list.filter(w => w.id !== id));
        return { success: true };
      };
      console.log(`%c[A.L.F.R.E.D. API Request] %cDELETE /developer/webhooks/${id}`, 'color: #06b6d4; font-weight: bold', 'color: #e11d48; font-weight: bold');
      try {
        const token = localStorage.getItem('alfred_token') || 'sk_test_xxxxx';
        const res = await fetch(`http://localhost:3000/api/developer/webhooks/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json();
        console.log(`%c[A.L.F.R.E.D. API Response] %cDELETE /developer/webhooks/${id} - Success`, 'color: #10b981; font-weight: bold', 'color: #06b6d4', json);
        return json;
      } catch (err: any) {
        console.log(`%c[A.L.F.R.E.D. API Fallback] %cDELETE /developer/webhooks/${id} failed (${err.message}). Executing LocalStorage Mock.`, 'color: #f59e0b; font-weight: bold', 'color: #94a3b8');
        return fallback();
      }
    }
  },
  people: {
    getAll: () => fetcher<any[]>('/people'),
    getInsights: () => fetcher<any>('/people/insights'),
    checkin: (payload: any) => post('/people/checkin', payload),
  }
};
