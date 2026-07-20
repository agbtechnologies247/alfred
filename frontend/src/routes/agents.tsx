import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import {
  Bot, MessageSquare, Network, Shield, Zap, Cloud, Database,
  Activity, Package, CheckCircle, RefreshCw, Terminal, Plus
} from 'lucide-react';

export const Route = createFileRoute('/agents')({
  component: AgentsDashboard,
});

const ICON_MAP: Record<string, any> = {
  network: Network, zap: Zap, shield: Shield, cloud: Cloud,
  database: Database, activity: Activity,
};

function AgentsDashboard() {
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'], queryFn: api.agents.getAll,
  });
  const { data: installedAgents } = useQuery({
    queryKey: ['agent-packages'], queryFn: api.marketplace.getAgents,
  });

  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ text: string; sender: string; ts: string }>>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[07:00:01] Agent scheduler started',
    '[07:00:02] Network Agent: Connected to edge router monitoring',
    '[07:00:05] Incident Agent: Subscribed to PagerDuty webhook stream',
    '[07:00:08] Security Agent: IAM policy scan initiated (142 policies)',
  ]);

  // Default-select first agent
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  const handleSend = async (customMsg?: string) => {
    const msg = (customMsg || input).trim();
    if (!msg || chatLoading) return;
    setInput('');
    setMessages(prev => [...prev, { text: msg, sender: 'me', ts: new Date().toLocaleTimeString() }]);
    setChatLoading(true);
    try {
      const data = await api.agents.chat(msg, selectedAgent?.id);
      setMessages(prev => [...prev, {
        text: data.response ?? data.message ?? JSON.stringify(data),
        sender: 'agent',
        ts: new Date().toLocaleTimeString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Agent is offline or API key not configured. This works with a live OpenAI key.',
        sender: 'agent',
        ts: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (agentsLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Bot className="w-4 h-4 mr-2 animate-pulse" /> Loading Agent Framework...
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agent Framework</h1>
          <p className="text-muted-foreground mt-1">
            Autonomous agents deployed across your enterprise — monitoring, resolving, and learning 24/7.
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Deploy Agent
        </button>
      </div>

      <div className="flex gap-5 flex-1 overflow-hidden min-h-0">
        {/* Left: Agent Roster */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto shrink-0">
          {/* Live System Agents */}
          <div>
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2.5">System Agents</h2>
            <div className="flex flex-col gap-2">
              {agents?.map((agent: any) => {
                const Icon = ICON_MAP[agent.icon] || Bot;
                const isSelected = selectedAgent?.id === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-card hover:border-primary/30'}`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-foreground'}`} />
                      </div>
                      <div className="font-semibold text-sm">{agent.name}</div>
                      <div className={`ml-auto w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{agent.task}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Marketplace Agents */}
          {installedAgents && installedAgents.length > 0 && (
            <div>
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2.5">Marketplace Agents</h2>
              <div className="flex flex-col gap-2">
                {installedAgents.filter((a: any) => a.install_state === 'installed').map((agent: any) => (
                  <div key={agent.id} className="p-3 rounded-xl border border-border bg-card/50 flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{agent.description?.slice(0, 50)}…</div>
                    </div>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat + Logs */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
          {/* Chat Console */}
          <div className="flex-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden min-h-0">
            <div className="p-3.5 border-b border-border flex items-center gap-3 bg-muted/20 shrink-0">
              <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {selectedAgent ? selectedAgent.name : 'A.L.F.R.E.D. Agent Console'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedAgent ? selectedAgent.task : 'Intelligent automation assistant'}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center mt-8">
                  <Bot className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Ask {selectedAgent?.name || 'the agent'} anything — incidents, workflows, recommendations.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {(selectedAgent?.id === 'AG-2'
                      ? ['What P1 incidents are open?', 'Rollback CoreDNS with SOP-14', 'Show me SRE hours savings']
                      : selectedAgent?.id === 'AG-3'
                      ? ['Scan IAM security policies', 'SOC2 compliance role scan', 'Vulnerability check on CoreDNS']
                      : ['Check edge router latency', 'Status of packet transmission', 'Firewall policy MTU anomalies']
                    ).map(s => (
                      <button key={s} type="button" onClick={() => handleSend(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-primary/15 border border-primary/25'}`}>
                    {msg.sender === 'me' ? 'ME' : <Bot className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex flex-col gap-0.5 max-w-[75%]">
                    <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted border border-border rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] text-muted-foreground ${msg.sender === 'me' ? 'text-right' : ''}`}>{msg.ts}</span>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-muted border border-border flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
 
            {/* Input */}
            <div className="p-3.5 border-t border-border bg-background shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={chatLoading}
                  placeholder="Message the agent... (Enter to send)"
                  className="flex-1 py-2 bg-transparent text-sm text-foreground focus-visible:outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleSend}
                  disabled={chatLoading || !input.trim()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Live Agent Log */}
          <div className="h-36 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden shrink-0 shadow-inner">
            <div className="px-3.5 py-2 border-b border-zinc-800 flex items-center gap-2 shrink-0 bg-zinc-900/60">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-mono text-zinc-200 font-medium">agent.log</span>
              <button
                onClick={() => setLogs(l => [...l, `[${new Date().toLocaleTimeString()}] Refreshed agent status`])}
                className="ml-auto text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-emerald-400 space-y-0.5 bg-zinc-950/80">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
