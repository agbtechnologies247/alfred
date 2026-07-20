import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Route = createFileRoute('/monitoring')({
  component: MonitoringDashboard,
});

function MonitoringDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({ queryKey: ['kpis'], queryFn: api.monitoring.getKpis });
  const { data: telemetry, isLoading: telemetryLoading } = useQuery({ queryKey: ['telemetry'], queryFn: api.monitoring.getTelemetry });
  const { data: errors, isLoading: errorsLoading } = useQuery({ queryKey: ['errors'], queryFn: api.monitoring.getErrors });

  if (kpisLoading || telemetryLoading || errorsLoading) return <div className="p-4">Loading monitoring data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Network Monitoring</h1>
        <div className="flex gap-2 text-sm">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Live</span>
          <span className="text-muted-foreground ml-4">Last updated: Just now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground mb-1">Transmission Score</div>
          <div className="text-2xl font-bold text-foreground">{kpis?.transmission_score}%</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground mb-1">Packet Score</div>
          <div className="text-2xl font-bold text-foreground">{kpis?.packet_score}%</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground mb-1">Connection Score</div>
          <div className="text-2xl font-bold text-foreground">{kpis?.connection_score}%</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-sm font-medium text-muted-foreground mb-1">DNS Score</div>
          <div className="text-2xl font-bold text-foreground">{kpis?.dns_score}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-lg font-semibold mb-4">Packet Transmission (Live)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetry?.packet_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Sent" />
                <Area type="monotone" dataKey="dropped" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} name="Dropped" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-lg font-semibold mb-4">Global API Latency (ms)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry?.latency_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="latency" stroke="hsl(var(--warning))" strokeWidth={2} name="Latency" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-semibold mb-4">Error Explorer (Recent Drops)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 rounded-l-md">Timestamp</th>
                <th className="px-4 py-3">Layer</th>
                <th className="px-4 py-3">Protocol</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3 rounded-r-md">Region</th>
              </tr>
            </thead>
            <tbody>
              {errors?.map((err: any, idx: number) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">{err.timestamp}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">{err.layer}</span></td>
                  <td className="px-4 py-3">{err.protocol}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${err.severity === 'Critical' ? 'text-destructive' : 'text-warning'}`}>
                      {err.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{err.error}</td>
                  <td className="px-4 py-3">{err.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
