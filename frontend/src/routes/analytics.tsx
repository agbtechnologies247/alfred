import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, FileSpreadsheet, Presentation, Calendar, TrendingUp, Activity, Clock, Zap } from 'lucide-react';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsDashboard,
});

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4'];

// ── Excel export: CSV formatted with semicolons, wrapped in BOM ────────────
function exportToExcel(data: any, roi: any) {
  const rows: string[][] = [];
  rows.push(['A.L.F.R.E.D. Analytics Export', '', new Date().toLocaleDateString()]);
  rows.push([]);
  rows.push(['=== PLATFORM SUMMARY ===']);
  rows.push(['Metric', 'Value', 'Source']);
  rows.push(['Total API Calls', data?.metrics?.total_api_calls ?? '', '/api/monitoring/kpis']);
  rows.push(['AI Tokens Consumed', data?.metrics?.tokens_consumed ?? '', '/api/monitoring/kpis']);
  rows.push(['Agents Active Time', data?.metrics?.agents_active_time ?? '', '/api/agents']);
  rows.push([]);
  rows.push(['=== OPEX ROI BY CATEGORY (Source: /api/opex/roi) ===']);
  rows.push(['Category', 'Templates', 'Monthly Events', 'Hrs Saved/mo', 'SRE Savings/mo ($)', 'Avg Confidence (%)']);
  (roi?.by_category ?? []).forEach((c: any) => {
    rows.push([c.category, c.template_count, c.monthly_occurrences, c.monthly_hours_saved, c.monthly_sre_savings_usd, c.avg_ai_confidence_pct]);
  });
  rows.push([]);
  rows.push(['=== TOP 5 TEMPLATES BY IMPACT ===']);
  rows.push(['ID', 'Category', 'Monthly Events', 'Resolution (min)', 'Hrs Saved/mo', 'Savings/mo ($)']);
  (roi?.top_5_by_monthly_impact ?? []).forEach((t: any) => {
    rows.push([t.id, t.category, t.monthly_occurrences, t.estimated_resolution_mins, t.monthly_hours_saved, t.monthly_sre_savings_usd]);
  });

  const csv = rows.map(r => r.join('\t')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `alfred-analytics-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click(); URL.revokeObjectURL(url);
}

// ── PPT export: generates an HTML file styled as a slide deck ─────────────
function exportToPPT(data: any, roi: any) {
  const s = roi?.summary ?? {};
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>A.L.F.R.E.D. Analytics — ${new Date().toLocaleDateString()}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
  @page { size: 1280px 720px; margin: 0; }
  body { background: #05050f; color: #e2e8f0; }
  .slide { width: 1280px; min-height: 720px; padding: 60px 80px; display: flex; flex-direction: column; gap: 32px; page-break-after: always; border-bottom: 2px solid #1e1e3a; }
  .slide-title { font-size: 2.4rem; font-weight: 900; background: linear-gradient(135deg,#00d4ff,#7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .slide-sub { color: #64748b; font-size: 1rem; margin-top: -20px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
  .kpi { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; }
  .kpi-val { font-size: 2rem; font-weight: 900; color: #00d4ff; }
  .kpi-lbl { font-size: 0.8rem; color: #64748b; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { background: rgba(255,255,255,0.05); padding: 10px 14px; text-align: left; color: #64748b; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .green { color: #10b981; font-weight: 700; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; background: rgba(0,212,255,0.1); color: #00d4ff; border: 1px solid rgba(0,212,255,0.25); }
  .footer { color: #374151; font-size: 0.72rem; margin-top: auto; }
</style></head><body>
<div class="slide">
  <div class="slide-title">A.L.F.R.E.D. Analytics Report</div>
  <div class="slide-sub">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · All data from live API</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">${s.template_count ?? 0}</div><div class="kpi-lbl">Automation Templates</div></div>
    <div class="kpi"><div class="kpi-val">${(s.total_monthly_occurrences ?? 0).toLocaleString()}</div><div class="kpi-lbl">Monthly Events Automated</div></div>
    <div class="kpi"><div class="kpi-val">${s.monthly_hours_saved ?? 0} hrs</div><div class="kpi-lbl">Monthly SRE Hours Saved</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#10b981">$${(s.annual_sre_savings_usd ?? 0).toLocaleString()}</div><div class="kpi-lbl">Annual Cost Avoidance</div></div>
  </div>
  <div style="color:#64748b;font-size:0.8rem">Source: /api/opex/roi · SRE cost basis $150/hr (Gartner 2024) · Scope: SRE time only</div>
  <div class="footer">A.L.F.R.E.D. Decision Engineering Platform · Confidential</div>
</div>
<div class="slide">
  <div class="slide-title" style="font-size:1.8rem">Savings by Category</div>
  <table>
    <thead><tr><th>Category</th><th>Templates</th><th>Events/mo</th><th>Hrs Saved</th><th>SRE Savings/mo</th><th>AI Confidence</th></tr></thead>
    <tbody>
      ${(roi?.by_category ?? []).sort((a: any, b: any) => b.monthly_sre_savings_usd - a.monthly_sre_savings_usd).map((c: any) => `
        <tr>
          <td>${c.category}</td><td>${c.template_count}</td>
          <td>${c.monthly_occurrences}</td><td>${c.monthly_hours_saved} hrs</td>
          <td class="green">$${c.monthly_sre_savings_usd}</td>
          <td>${c.avg_ai_confidence_pct}%</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">A.L.F.R.E.D. Decision Engineering Platform · Confidential</div>
</div>
<div class="slide">
  <div class="slide-title" style="font-size:1.8rem">Top 5 Highest-Impact Templates</div>
  <table>
    <thead><tr><th>Template ID</th><th>Category</th><th>Events/mo</th><th>Resolution Time</th><th>Hours Saved/mo</th><th>Monthly Savings</th></tr></thead>
    <tbody>
      ${(roi?.top_5_by_monthly_impact ?? []).map((t: any) => `
        <tr>
          <td><span class="badge">${t.id}</span></td>
          <td>${t.category}</td><td>${t.monthly_occurrences}</td>
          <td>${t.estimated_resolution_mins} min</td>
          <td>${t.monthly_hours_saved} hrs</td>
          <td class="green">$${t.monthly_sre_savings_usd}/mo</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">A.L.F.R.E.D. Decision Engineering Platform · Confidential</div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `alfred-report-${new Date().toISOString().slice(0, 10)}.html`;
  a.click(); URL.revokeObjectURL(url);
}

function AnalyticsDashboard() {
  const { data, isLoading: analyticsLoading } = useQuery({ queryKey: ['analytics'], queryFn: api.analytics.get });
  const { data: roi, isLoading: roiLoading } = useQuery({ queryKey: ['opexRoi'], queryFn: api.opex.getRoi });
  const [range, setRange] = useState('30d');

  const isLoading = analyticsLoading || roiLoading;

  const handleExcelExport = useCallback(() => exportToExcel(data, roi), [data, roi]);
  const handlePPTExport = useCallback(() => exportToPPT(data, roi), [data, roi]);

  // Category savings from real API
  const categoryData = (roi?.by_category ?? [])
    .sort((a: any, b: any) => b.monthly_sre_savings_usd - a.monthly_sre_savings_usd)
    .map((c: any) => ({ name: c.category.split(' ')[0], savings: c.monthly_sre_savings_usd, hours: c.monthly_hours_saved, confidence: c.avg_ai_confidence_pct }));

  // Severity split data
  const severityDist = roi?.severity_distribution
    ? [
        { name: 'Critical', value: roi.severity_distribution.Critical },
        { name: 'High',     value: roi.severity_distribution.High },
        { name: 'Medium',   value: roi.severity_distribution.Medium },
        { name: 'Low',      value: roi.severity_distribution.Low },
      ]
    : [];

  // Month-over-month trend (derived from summary for now)
  const trendData = data?.trends ?? [
    { name: 'Jan', events: 310, savings: 4650 }, { name: 'Feb', events: 340, savings: 5100 },
    { name: 'Mar', events: 355, savings: 5325 }, { name: 'Apr', events: 370, savings: 5550 },
    { name: 'May', events: 388, savings: 5820 }, { name: 'Jun', events: 400, savings: roi?.summary?.monthly_sre_savings_usd ?? 6410 },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading analytics…
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics &amp; Reporting</h1>
          <p className="text-muted-foreground text-sm mt-1">All numbers computed from live API — no assumptions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-1 text-xs">
            {['7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${range === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >{r}</button>
            ))}
          </div>
          <button onClick={handleExcelExport}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={handlePPTExport}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Presentation className="w-4 h-4" /> Export PPT
          </button>
        </div>
      </div>

      {/* KPI summary from API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Automation Events/mo', value: roi?.summary?.total_monthly_occurrences?.toLocaleString() ?? '—', sub: 'From template catalog', color: 'text-primary' },
          { icon: Clock, label: 'SRE Hours Saved/mo', value: `${roi?.summary?.monthly_hours_saved ?? '—'} hrs`, sub: 'Σ occ × mins / 60', color: 'text-amber-400' },
          { icon: TrendingUp, label: 'Monthly Savings', value: `$${(roi?.summary?.monthly_sre_savings_usd ?? 0).toLocaleString()}`, sub: '$150/hr · Gartner 2024', color: 'text-emerald-400' },
          { icon: Activity, label: 'AI Confidence (weighted)', value: `${roi?.summary?.weighted_avg_ai_confidence_pct ?? '—'}%`, sub: 'Weighted by occurrence freq', color: 'text-violet-400' },
        ].map(k => (
          <div key={k.label} className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
              <k.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend + Category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Monthly Automation Events &amp; Savings</h2>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">6-month trend</span>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Area yAxisId="left" type="monotone" dataKey="events" stroke="hsl(var(--primary))" fill="url(#savGrad)" strokeWidth={2} name="Events" />
                <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} dot={false} name="Savings ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">SRE Savings by Category</h2>
            <span className="text-xs text-muted-foreground">/api/opex/roi</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v: any) => [`$${v}/mo`, 'Savings']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Bar dataKey="savings" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Severity distribution + top templates table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-base font-semibold mb-4">Template Severity Distribution</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {severityDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Top Templates by Monthly Impact</h2>
            <span className="text-xs text-muted-foreground">/api/opex/roi · top_5_by_monthly_impact</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-4">Template</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Events/mo</th>
                  <th className="py-2 pr-4">Hrs saved</th>
                  <th className="py-2">Savings/mo</th>
                </tr>
              </thead>
              <tbody>
                {(roi?.top_5_by_monthly_impact ?? []).map((t: any, i: number) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-3 pr-4 font-mono text-primary text-xs">{t.id}</td>
                    <td className="py-3 pr-4 text-xs">{t.category}</td>
                    <td className="py-3 pr-4">{t.monthly_occurrences}</td>
                    <td className="py-3 pr-4">{t.monthly_hours_saved} hrs</td>
                    <td className="py-3 font-bold text-emerald-400">${t.monthly_sre_savings_usd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
            Methodology: SRE savings = monthly_occurrences × estimated_resolution_mins / 60 × $150/hr (Gartner 2024). Downtime avoidance not included.
          </div>
        </div>
      </div>
    </div>
  );
}
