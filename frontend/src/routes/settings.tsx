import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building, Users, Code, BrainCircuit, Activity, 
  Book, Blocks, ShieldCheck, CreditCard, ScrollText, Settings2,
  Terminal, Globe, Lock, Play, Download, Save, ToggleLeft, ToggleRight, Sparkles, PhoneCall, CheckCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/settings')({
  component: SettingsDashboard,
});

function SettingsDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('ai');
  const [apiTab, setApiTab] = useState('keys');
  const [aiTab, setAiTab] = useState('models');

  const { data: providersData } = useQuery({ 
    queryKey: ['aiProviders'], 
    queryFn: api.aiProviders.getAll 
  });

  const { data: dbKeys } = useQuery({ 
    queryKey: ['dbKeys'], 
    queryFn: api.keys.getAll 
  });

  const { data: webhooks } = useQuery({ 
    queryKey: ['webhooks'], 
    queryFn: api.webhooks.getAll 
  });

  const [localProviders, setLocalProviders] = useState<any[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({
    'prov-1': 'sk_test_xxxxx',
    'prov-2': 'sk_proj_placeholder_key',
    'prov-3': 'http://127.0.0.1:11434'
  });

  // Dograh Voice Call Integration state
  const [dograhApiKey, setDograhApiKey] = useState('dg_live_9b4e1837cfa29a1b');
  const [dograhAgentUuid, setDograhAgentUuid] = useState('e58f4c38-bd00-11b5-8ea8-4abf414e6bdd');
  const [dograhPhone, setDograhPhone] = useState('+14155550100');
  const [dograhContext, setDograhContext] = useState(
    JSON.stringify({
      "debtor_name": "Rushil",
      "client_name": "Quick Credit",
      "debt_amount": "3500"
    }, null, 2)
  );
  const [isCalling, setIsCalling] = useState(false);

  // Prompt states
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Dograh, the core SRE Reasoning Engine of A.L.F.R.E.D. " +
    "Your objective is to analyze real-time telemetry, trace root causes in application graphs, " +
    "and recommend high-safety automation playbooks."
  );

  useEffect(() => {
    if (providersData) {
      const stored = localStorage.getItem('alfred_ai_providers');
      if (stored) {
        setLocalProviders(JSON.parse(stored));
      } else {
        setLocalProviders(providersData);
        localStorage.setItem('alfred_ai_providers', JSON.stringify(providersData));
      }
    }
  }, [providersData]);

  const toggleProvider = (id: string) => {
    const updated = localProviders.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return p;
    });
    setLocalProviders(updated);
    localStorage.setItem('alfred_ai_providers', JSON.stringify(updated));
  };

  const saveKey = (id: string, value: string) => {
    setKeys(prev => ({ ...prev, [id]: value }));
    alert('Model configuration updated successfully!');
  };

  const triggerDograhCall = async () => {
    setIsCalling(true);
    // Simulate API connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsCalling(false);
    alert(
      `Outbound Agent call successfully triggered!\n\n` +
      `Endpoint: https://api.dograh.com/api/v1/public/agent/test/${dograhAgentUuid}\n` +
      `Recipient: ${dograhPhone}\n` +
      `Context Variables Loaded: ${dograhContext}`
    );
  };

  const navItems = [
    { id: 'ai', icon: BrainCircuit, label: 'AI Models' },
    { id: 'developer', icon: Code, label: 'Developer API' },
    { id: 'org', icon: Building, label: 'Organization' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'auth', icon: Lock, label: 'Authentication' },
    { id: 'automation', icon: Activity, label: 'Automation' },
    { id: 'kb', icon: Book, label: 'Knowledge Base' },
    { id: 'integrations', icon: Blocks, label: 'Integrations' },
    { id: 'security', icon: ShieldCheck, label: 'Security' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'audit', icon: ScrollText, label: 'Audit Logs' },
    { id: 'advanced', icon: Settings2, label: 'Advanced' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage everything across the A.L.F.R.E.D. enterprise platform.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* Sidebar */}
        <div className="w-64 space-y-1 overflow-y-auto pr-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-[500px]">
          
          {/* AI Models View */}
          {activeTab === 'ai' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">AI Models & Reasoning (Dograh Engine)</h2>
                    <p className="text-sm text-muted-foreground">Configure the SRE decision gateway and reasoning models.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {['models', 'prompts', 'voice'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setAiTab(tab)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${aiTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted bg-background border border-border'}`}
                    >
                      {tab === 'models' && 'Text & Vision Models'}
                      {tab === 'prompts' && 'System Prompts'}
                      {tab === 'voice' && 'Dograh Calling API'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {aiTab === 'models' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold">Text & Vision Providers</h3>
                        <p className="text-xs text-muted-foreground">Connect A.L.F.R.E.D. directly to cloud APIs or local model endpoints.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {localProviders.map(prov => (
                        <div key={prov.id} className="p-5 rounded-xl border border-border bg-card flex flex-col gap-4 relative">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Sparkles className={`w-5 h-5 ${prov.status === 'Active' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <h4 className="font-bold text-sm">{prov.name}</h4>
                                <p className="text-xs text-muted-foreground">Model: {prov.model}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => toggleProvider(prov.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {prov.status === 'Active' ? (
                                <ToggleRight className="w-8 h-8 text-primary" />
                              ) : (
                                <ToggleLeft className="w-8 h-8" />
                              )}
                            </button>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-border">
                            <div>
                              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                {prov.id === 'prov-3' ? 'Local Host Endpoint URL' : 'API Secret Key'}
                              </label>
                              <input 
                                type={prov.id === 'prov-3' ? 'text' : 'password'}
                                value={keys[prov.id] || ''}
                                onChange={e => setKeys({ ...keys, [prov.id]: e.target.value })}
                                className="w-full px-3 py-1.5 rounded border border-input bg-background font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <button 
                              onClick={() => saveKey(prov.id, keys[prov.id] || '')}
                              className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded transition-colors w-full"
                            >
                              Update Configuration
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiTab === 'prompts' && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="font-bold">Global System Prompts</h3>
                      <p className="text-xs text-muted-foreground">Adjust the system constraints and operational directives for the reasoning copilot.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Prompt Directive</label>
                        <textarea 
                          value={systemPrompt}
                          onChange={e => setSystemPrompt(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">Reasoning Temperature</label>
                          <input type="range" min="0" max="100" defaultValue="15" className="w-full mt-1.5" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">Max Tokens Limit</label>
                          <input type="number" defaultValue="2048" className="w-full px-3 py-1.5 border border-border bg-background rounded-md text-xs" />
                        </div>
                      </div>

                      <button 
                        onClick={() => alert('Global prompt directives updated!')}
                        className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-xs font-bold flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Save System Prompts
                      </button>
                    </div>
                  </div>
                )}

                {aiTab === 'voice' && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="font-bold">Dograh Call Outbound Integration</h3>
                      <p className="text-xs text-muted-foreground">Trigger active agent voice calls programmatically when alerts or workflows dispatch.</p>
                    </div>

                    <div className="space-y-4 border border-border bg-card/30 p-5 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Dograh API Key</label>
                          <input 
                            type="password" 
                            value={dograhApiKey} 
                            onChange={e => setDograhApiKey(e.target.value)}
                            className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Agent Test/Prod UUID</label>
                          <input 
                            type="text" 
                            value={dograhAgentUuid} 
                            onChange={e => setDograhAgentUuid(e.target.value)}
                            className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Target Phone Number</label>
                        <input 
                          type="text" 
                          value={dograhPhone} 
                          onChange={e => setDograhPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Initial Context variables (JSON)</label>
                        <textarea 
                          value={dograhContext} 
                          onChange={e => setDograhContext(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm font-mono"
                        />
                      </div>

                      <button 
                        onClick={triggerDograhCall}
                        disabled={isCalling}
                        className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors w-full"
                      >
                        <PhoneCall className="w-4 h-4" />
                        {isCalling ? 'Calling Agent...' : 'Trigger Call Outbound'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Developer API View */}
          {activeTab === 'developer' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Integration Platform (Developer API)</h2>
                    <p className="text-sm text-muted-foreground">Manage API Keys, Webhooks, OAuth Apps, and test endpoints.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {['keys', 'oauth', 'webhooks'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setApiTab(tab)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${apiTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted bg-background border border-border'}`}
                    >
                      {tab === 'keys' && 'API Keys'}
                      {tab === 'oauth' && 'OAuth Apps'}
                      {tab === 'webhooks' && 'Webhooks'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {apiTab === 'keys' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold">Active API Keys</h3>
                      <a href="/developer" className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/95">Generate New Key</a>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="p-3">Key Name</th>
                            <th className="p-3">Secret Key</th>
                            <th className="p-3">Scope</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((dbKeys as any[]) || []).map((k: any) => (
                            <tr key={k.id} className="border-t border-border">
                              <td className="p-3 font-semibold">{k.name}</td>
                              <td className="p-3 font-mono text-primary">{k.prefix}••••••••••••</td>
                              <td className="p-3 font-mono">{k.scopes.join(', ')}</td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-success/15 text-success rounded-full">Active</span></td>
                            </tr>
                          ))}
                          {(!dbKeys || dbKeys.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                No active API keys found. Visit the <a href="/developer" className="text-primary hover:underline">Developer Portal</a> to create keys.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {apiTab === 'oauth' && (
                  <div className="space-y-6">
                    <h3 className="font-bold">Third Party OAuth Registrations</h3>
                    <div className="p-4 border border-border rounded-xl bg-card text-center text-muted-foreground text-sm">
                      No external OAuth tokens configured. Refer to our SDK manual to seed client flows.
                    </div>
                  </div>
                )}

                {apiTab === 'webhooks' && (
                  <div className="space-y-6">
                    <h3 className="font-bold">Subscribed Webhooks</h3>
                    <div className="border border-border rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="p-3">Target Endpoint URL</th>
                            <th className="p-3">Subscription Scope</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhooks?.map((wh: any) => (
                            <tr key={wh.id} className="border-t border-border">
                              <td className="p-3 font-mono">{wh.url}</td>
                              <td className="p-3">{wh.events.join(', ')}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full capitalize ${wh.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                                  {wh.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(!webhooks || webhooks.length === 0) && (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-muted-foreground">No webhooks registered.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== 'developer' && activeTab !== 'ai' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Settings2 className="w-12 h-12 opacity-20 mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">{navItems.find(i => i.id === activeTab)?.label} Configuration</h2>
              <p>This module is configurable via the A.L.F.R.E.D. database schema.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
