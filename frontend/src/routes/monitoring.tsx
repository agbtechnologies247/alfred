import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Activity } from 'recharts';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/monitoring')({
  component: MonitoringDashboard,
});

function MonitoringDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({ queryKey: ['kpis'], queryFn: api.monitoring.getKpis });
  const { data: telemetry, isLoading: telemetryLoading } = useQuery({ queryKey: ['telemetry'], queryFn: api.monitoring.getTelemetry });
  const { data: errors, isLoading: errorsLoading } = useQuery({ queryKey: ['errors'], queryFn: api.monitoring.getErrors });

  // Pagination & Filter state
  const [selectedLayer, setSelectedLayer] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredErrors = useMemo(() => {
    let result = errors || [];
    if (selectedLayer !== 'All') {
      result = result.filter((err: any) => err.layer === selectedLayer);
    }
    if (selectedSeverity !== 'All') {
      result = result.filter((err: any) => err.severity === selectedSeverity);
    }
    return result;
  }, [errors, selectedLayer, selectedSeverity]);

  // Reset page when filter changes
  const paginatedErrors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredErrors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredErrors, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredErrors.length / itemsPerPage));

  if (kpisLoading || telemetryLoading || errorsLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading monitoring dashboard…
    </div>
  );

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
      
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Error Explorer (Recent Drops)</h2>
          
          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters:
            </div>
            
            <select
              value={selectedLayer}
              onChange={(e) => { setSelectedLayer(e.target.value); setCurrentPage(1); }}
              className="bg-muted text-foreground text-xs rounded-lg px-3 py-1.5 border border-border outline-none focus:border-primary cursor-pointer"
            >
              <option value="All">All Layers</option>
              <option value="Layer 3">Layer 3</option>
              <option value="Layer 4">Layer 4</option>
              <option value="Layer 5">Layer 5</option>
              <option value="Layer 7">Layer 7</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
              className="bg-muted text-foreground text-xs rounded-lg px-3 py-1.5 border border-border outline-none focus:border-primary cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

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
              {paginatedErrors.length > 0 ? (
                paginatedErrors.map((err: any, idx: number) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3">{err.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">{err.layer}</span>
                    </td>
                    <td className="px-4 py-3">{err.protocol}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                        err.severity === 'Critical' ? 'bg-red-500/10 text-red-400' :
                        err.severity === 'High' ? 'bg-orange-500/10 text-orange-400' :
                        err.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {err.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{err.error}</td>
                    <td className="px-4 py-3">{err.region}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted-foreground">
                    No matching drops found. Check your filter settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Interactive Pagination Controls */}
        {filteredErrors.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              Showing {Math.min(filteredErrors.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
              {Math.min(filteredErrors.length, currentPage * itemsPerPage)} of {filteredErrors.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
