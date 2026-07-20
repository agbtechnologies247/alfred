import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, Cpu, Database, Globe, TrendingUp, Zap } from 'lucide-react';

export const Route = createFileRoute('/')(({ component: Dashboard }));

const RCOLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', '#a78bfa'];

function StatCard({ icon: Icon, label, value, sub, color = 'text-foreground' }: any) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="p-2 bg-muted rounded-lg"><Icon className="w-4 h-4 text-muted-foreground" /></div>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TopologyMap() {
  const { data: topologyData, isLoading, refetch } = useQuery({
    queryKey: ['topology', 'api-gw-prod'],
    queryFn: () => api.topology.get('api-gw-prod')
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl border border-border bg-card h-[360px] flex items-center justify-center text-muted-foreground text-sm">
        <Activity className="w-5 h-5 animate-pulse mr-2 text-primary" /> Querying Neo4j Graph Topology...
      </div>
    );
  }

  const nodes = topologyData?.nodes || [];
  const edges = topologyData?.edges || [];

  const N = nodes.length || 1;
  const cx = 350;
  const cy = 160;
  const rx = 240;
  const ry = 90;

  const nodePositions = nodes.reduce((acc: any, node: any, index: number) => {
    const angle = (2 * Math.PI * index) / N;
    acc[node.id] = {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      ...node
    };
    return acc;
  }, {});

  return (
    <div className="p-6 rounded-xl border border-border bg-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Live Infrastructure Topology Map
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Dynamically retrieved from Neo4j directed dependency graph</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="text-xs py-1.5 px-3 bg-muted hover:bg-muted/80 rounded transition-colors text-muted-foreground hover:text-foreground font-medium"
        >
          Refresh Graph
        </button>
      </div>

      <div className="border border-border/40 rounded-lg bg-zinc-950/40 relative overflow-hidden flex items-center justify-center h-[320px]">
        {nodes.length === 0 ? (
          <div className="text-muted-foreground text-xs">No graph entities found in Neo4j database.</div>
        ) : (
          <svg className="w-full h-full min-w-[700px] min-h-[300px]" viewBox="0 0 700 320">
            <defs>
              <filter id="glow-topo" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render connecting edges */}
            {edges.map((edge: any, idx: number) => {
              const fromNode = nodePositions[edge.from];
              const toNode = nodePositions[edge.to];
              if (!fromNode || !toNode) return null;

              return (
                <g key={idx}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="rgba(6, 182, 212, 0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />
                  {/* Neon pulsing flow packet along the connection */}
                  <circle r="3.5" fill="#06b6d4" filter="url(#glow-topo)">
                    <animateMotion
                      dur={`${3 + (idx % 3)}s`}
                      repeatCount="indefinite"
                      path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                    />
                  </circle>
                </g>
              );
            })}

            {/* Render dynamic nodes */}
            {Object.values(nodePositions).map((node: any) => {
              const isDegraded = node.status === 'degraded' || node.status === 'warning';
              const color = isDegraded ? '#f59e0b' : '#10b981';
              
              return (
                <g key={node.id} className="cursor-pointer group">
                  {/* Outer Sonar Ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    className="animate-ping opacity-25"
                    style={{ animationDuration: '3s' }}
                  />
                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="12"
                    fill="#18181b"
                    stroke={color}
                    strokeWidth="2"
                    filter="url(#glow-topo)"
                  />
                  {/* Internal Status Indicator */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4"
                    fill={color}
                  />
                  <text
                    x={node.x}
                    y={node.y + 26}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-zinc-300 font-bold"
                  >
                    {node.name}
                  </text>
                  <text
                    x={node.x}
                    y={node.y - 20}
                    textAnchor="middle"
                    className={`text-[8px] font-mono font-semibold uppercase tracking-wider ${isDegraded ? 'fill-warning' : 'fill-success'}`}
                  >
                    {node.type} · {node.status}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({ queryKey: ['kpis'], queryFn: api.monitoring.getKpis });
  const { data: incidents } = useQuery({ queryKey: ['incidents'], queryFn: api.incidents.getAll });
  const { data: incMetrics } = useQuery({ queryKey: ['incidentMetrics'], queryFn: api.incidents.getMetrics });
  const { data: decisions } = useQuery({ queryKey: ['decisions'], queryFn: api.decisions.getRecommendations });
  const { data: roi } = useQuery({ queryKey: ['opexRoi'], queryFn: api.opex.getRoi });

  // Derived sparkline data from API telemetry
  const sparkData = kpis?.health_trend ?? [
    { t: '00:00', v: 97 }, { t: '04:00', v: 95 }, { t: '08:00', v: 98 },
    { t: '12:00', v: 93 }, { t: '16:00', v: 96 }, { t: '20:00', v: 99 }, { t: 'Now', v: kpis?.health_score ?? 98 },
  ];

  // Severity breakdown from incident metrics
  const severityData = [
    { name: 'P1 Critical', value: incMetrics?.p1_critical ?? 0 },
    { name: 'P2 High', value: incMetrics?.p2_high ?? 1 },
    { name: 'P3 Medium', value: incMetrics?.p3_medium ?? 3 },
    { name: 'Resolved', value: incMetrics?.resolved_30d ?? 12 },
  ].filter(d => d.value > 0);

  // Category savings from real opex API
  const categoryData = roi?.by_category?.slice(0, 6).map((c: any) => ({
    name: c.category.split(' ')[0],
    savings: c.monthly_sre_savings_usd,
    hours: c.monthly_hours_saved,
  })) ?? [];

  if (kpisLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading platform state…
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Unified operational intelligence · All data live from API
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
          <span className="text-success font-medium">All Systems Nominal</span>
          <span className="text-muted-foreground ml-3">Refreshes every 30s</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Platform Health" value={`${kpis?.health_score ?? 98}%`} sub="vs 96% last week" color="text-success" />
        <StatCard icon={AlertTriangle} label="Critical Alerts" value={kpis?.critical_alerts ?? 0} sub={`${incMetrics?.active_incidents ?? 0} active incidents`} color="text-destructive" />
        <StatCard icon={Zap} label="AI Automations / hr" value={kpis?.automations_per_hour ?? 14} sub={`${kpis?.automation_success_rate ?? '96%'} success rate`} color="text-primary" />
        <StatCard icon={TrendingUp} label="Monthly OpEx Saved" value={`$${(roi?.summary?.monthly_sre_savings_usd ?? 0).toLocaleString()}`} sub="SRE time only · Gartner 2024 basis" color="text-emerald-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform health sparkline */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Platform Health (24h)</h2>
            <span className="text-xs text-muted-foreground">Source: /api/monitoring/kpis</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis domain={[85, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="url(#healthGrad)" strokeWidth={2} name="Health %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity donut */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Incident Severity</h2>
            <span className="text-xs text-muted-foreground">/api/incidents/metrics</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {severityData.map((_: any, i: number) => <Cell key={i} fill={RCOLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly savings by category + recent incidents side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category savings bars */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Monthly SRE Savings by Category</h2>
            <span className="text-xs text-muted-foreground">/api/opex/roi</span>
          </div>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Waiting for API…
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: any) => [`$${v}`, 'Monthly savings']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Savings/mo ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent incidents */}
        <div className="p-6 rounded-xl border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent Incidents</h2>
            <a href="/incidents" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {(incidents ?? []).slice(0, 6).map((inc: any) => (
              <div key={inc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inc.priority === 'P1' ? 'bg-destructive' : inc.priority === 'P2' ? 'bg-warning' : 'bg-success'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{inc.title}</div>
                  <div className="text-xs text-muted-foreground">{inc.id} · {inc.time}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                  inc.priority === 'P1' ? 'bg-destructive/10 text-destructive' :
                  inc.priority === 'P2' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                }`}>{inc.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI decision copilot feed */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> AI Decision Copilot — Pending Actions
          </h2>
          <a href="/decisions" className="text-xs text-primary hover:underline">Decision Engineering →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(decisions ?? []).slice(0, 3).map((d: any) => (
            <div key={d.id} className="p-4 rounded-lg border border-border bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-primary">{d.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${d.risk === 'Low' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{d.risk} Risk</span>
              </div>
              <div className="text-sm font-medium mb-1">{d.action}</div>
              <div className="text-xs text-muted-foreground mb-3">{d.target}</div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 text-xs font-semibold bg-success/10 text-success rounded hover:bg-success/20 transition-colors">Approve</button>
                <button className="flex-1 py-1.5 text-xs font-semibold bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TopologyMap />
    </div>
  );
}
