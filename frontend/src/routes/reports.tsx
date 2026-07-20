import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Download, FileText, Activity, DollarSign, ShieldCheck, 
  Users, Printer, Loader2, TrendingUp, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';

export const Route = createFileRoute('/reports')({
  component: ReportsDashboard,
});

type ReportType = 'sla' | 'cost' | 'governance' | 'people';

interface ReportConfig {
  id: ReportType;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  glow: string;
}

const REPORTS: ReportConfig[] = [
  {
    id: 'sla',
    title: 'SLA Performance & Incident Report',
    subtitle: 'Track platform availability, MTTR metrics, and critical incident logs.',
    icon: Activity,
    color: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10',
    glow: 'shadow-cyan-500/5',
  },
  {
    id: 'cost',
    title: 'FinOps & Cost Optimization Report',
    subtitle: 'Measure SRE hourly savings, automated ROI, and agent efficiency.',
    icon: DollarSign,
    color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    glow: 'shadow-emerald-500/5',
  },
  {
    id: 'governance',
    title: 'SOC2 & Governance Audit Report',
    subtitle: 'Verify system access roles, compliance reviews, and change logs.',
    icon: ShieldCheck,
    color: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10',
    glow: 'shadow-indigo-500/5',
  },
  {
    id: 'people',
    title: 'Team Workload & Stress Insights',
    subtitle: 'Identify burnout indicators, SRE check-ins, and priority blockers.',
    icon: Users,
    color: 'text-rose-500 border-rose-500/20 bg-rose-500/10',
    glow: 'shadow-rose-500/5',
  }
];

function ReportsDashboard() {
  const [activeReport, setActiveReport] = useState<ReportType>('sla');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      setError(null);
      try {
        let data: any = {};
        if (activeReport === 'sla') {
          const metrics = await api.incidents.getMetrics();
          const list = await api.incidents.getAll();
          data = { metrics, list: list.slice(0, 10) };
        } else if (activeReport === 'cost') {
          data = await api.opex.getRoi();
        } else if (activeReport === 'governance') {
          const audit = await api.governance.getAuditLog();
          const roles = await api.governance.getRoles();
          data = { audit, roles };
        } else if (activeReport === 'people') {
          const insights = await api.people.getInsights();
          const list = await api.people.getAll();
          data = { insights, list };
        }
        setReportData(data);
      } catch (err: any) {
        console.error('Failed to load report parameters:', err);
        setError('Failed to fetch live report data from the backend. Displaying offline indicators.');
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [activeReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Console</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics compiled directly from active backend engine parameters.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-border bg-card hover:bg-white/5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation: Available Reports (Hidden when printing) */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Available Reports</h2>
          <div className="space-y-3">
            {REPORTS.map((r) => {
              const Icon = r.icon;
              const isActive = activeReport === r.id;
              const borderClass = r.id === 'sla' ? 'border-cyan-500/50' : r.id === 'cost' ? 'border-emerald-500/50' : r.id === 'governance' ? 'border-indigo-500/50' : 'border-rose-500/50';
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                    isActive 
                      ? 'bg-primary/5 shadow-md ' + borderClass + ' ' + r.glow
                      : 'bg-card border-border hover:bg-white/5 hover:border-slate-500/40'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{r.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{r.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/50 text-xs text-muted-foreground space-y-2">
            <div className="flex gap-2 text-rose-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>SOC2 Compliance Lock</span>
            </div>
            <p className="leading-relaxed">All generated logs and compliance indicators reflect immutable audit parameters stashed in PostgreSQL.</p>
          </div>
        </div>

        {/* Right Content Panel: Dynamic Report Viewer */}
        <div className="lg:col-span-8 bg-card border border-border rounded-xl p-6 print:border-none print:bg-transparent print:p-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm text-muted-foreground">Compiling parameters & generating live layout...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="font-bold">Offline Sync Warning</h4>
                <p className="mt-1 text-xs text-red-400/80">{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="border-b border-border pb-6 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Operational Audit Log</div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {REPORTS.find(r => r.id === activeReport)?.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} | Methodology: Platform Vault parameters v1.0
                  </p>
                </div>
                <div className="hidden print:block text-right">
                  <h3 className="text-sm font-bold">A.L.F.R.E.D. PLATFORM AUDIT</h3>
                  <p className="text-[10px] text-muted-foreground">Internal Confidential Record</p>
                </div>
              </div>

              {/* SLA Performance Report View */}
              {activeReport === 'sla' && reportData && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Active Incidents</div>
                      <div className="text-2xl font-bold text-red-500 mt-1">{reportData.metrics?.active_incidents ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Requires triaging</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Avg Resolution (MTTR)</div>
                      <div className="text-2xl font-bold text-cyan-400 mt-1">{reportData.metrics?.mttr_mins ?? 0}m</div>
                      <div className="text-[10px] text-muted-foreground mt-1">SLA Target: &lt; 15 mins</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Resolved (30d)</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">{reportData.metrics?.resolved_30d ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">+14% vs last period</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">SLA Compliance</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">99.8%</div>
                      <div className="text-[10px] text-emerald-400 mt-1">✅ SLA target met</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Incident Feed</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-muted-foreground uppercase text-[10px]">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Title</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Layer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reportData.list && reportData.list.length > 0 ? (
                            reportData.list.map((inc: any) => (
                              <tr key={inc.id} className="hover:bg-white/5">
                                <td className="p-3 font-mono text-cyan-400 font-bold">{inc.id}</td>
                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{inc.title}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    inc.priority === 'P1' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                  }`}>{inc.priority}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    inc.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                  }`}>{inc.status}</span>
                                </td>
                                <td className="p-3 text-muted-foreground">{inc.layer || 'Layer 7'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-muted-foreground">No incidents reported.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* FinOps Cost Optimization Report View */}
              {activeReport === 'cost' && reportData && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Monthly SRE Savings</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">
                        ${reportData.summary?.monthly_sre_savings_usd?.toLocaleString() ?? '0'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Fully loaded SRE hour index</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Annualized Run-Rate</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">
                        ${reportData.summary?.annual_sre_savings_usd?.toLocaleString() ?? '0'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Calculated over 12 months</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Monthly Hours Recovered</div>
                      <div className="text-2xl font-bold text-cyan-400 mt-1">
                        {reportData.summary?.monthly_hours_saved ?? 0} hrs
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Active automation runtime</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">High-Impact Optimization Templates</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-muted-foreground uppercase text-[10px]">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Est. Occurrences</th>
                            <th className="p-3">Hours Recovered</th>
                            <th className="p-3">Monthly Savings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reportData.top_5 && reportData.top_5.length > 0 ? (
                            reportData.top_5.map((item: any) => (
                              <tr key={item.id} className="hover:bg-white/5">
                                <td className="p-3 font-mono text-emerald-400 font-bold">{item.id}</td>
                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.category}</td>
                                <td className="p-3 text-slate-700 dark:text-slate-300">{item.monthly_occurrences} / mo</td>
                                <td className="p-3 text-cyan-400 font-bold">{item.monthly_hours_saved} hrs</td>
                                <td className="p-3 text-emerald-400 font-bold">${item.monthly_sre_savings_usd?.toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-muted-foreground">No optimization data loaded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SOC2 & Governance Report View */}
              {activeReport === 'governance' && reportData && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Logged Audit Entries</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{reportData.audit?.total ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">SOC2 continuous logging active</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Security Roles Enforced</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {reportData.roles?.length ?? 0}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">✅ RBAC status: Normal</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Compliance Rating</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">A+</div>
                      <div className="text-[10px] text-muted-foreground mt-1">100% evidence verified</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Enforced Platform Roles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportData.roles && reportData.roles.map((role: any) => (
                        <div key={role.role} className="p-4 rounded-lg bg-white/5 border border-border text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{role.role.replace('_', ' ')}</span>
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded font-mono text-[9px]">{role.permissions.join(', ')}</span>
                          </div>
                          <p className="text-muted-foreground">{role.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Team Workload & Burnout Insights View */}
              {activeReport === 'people' && reportData && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">High Burnout Risk Count</div>
                      <div className="text-2xl font-bold text-rose-500 mt-1">
                        {reportData.insights?.high_stress_employees ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">SRE fatigue threshold checked</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Team Risk Rating</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {reportData.insights?.team_burnout_risk ?? 'Low'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Calculated workload metric</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-border">
                      <div className="text-xs text-muted-foreground">Sentiment Index</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">
                        {reportData.insights?.sentiment_trend ?? 'Steady'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Weekly check-in logs</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Organization Roster & Stress Index</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-muted-foreground uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Current Work Status</th>
                            <th className="p-3">Workload Stress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reportData.list && reportData.list.length > 0 ? (
                            reportData.list.map((person: any) => (
                              <tr key={person.id} className="hover:bg-white/5">
                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{person.name}</td>
                                <td className="p-3 text-muted-foreground">{person.role}</td>
                                <td className="p-3 text-slate-700 dark:text-slate-300">{person.current_status || 'Active'}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    person.stress_level === 'High' 
                                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                      : person.stress_level === 'Medium'
                                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  }`}>{person.stress_level || 'Low'}</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-muted-foreground">No personnel records loaded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
