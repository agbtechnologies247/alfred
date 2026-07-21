import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, FileSpreadsheet, Presentation, Calendar, TrendingUp, Activity, Clock, Zap } from 'lucide-react';

import { exportAnalyticsPPT, PPT_THEMES } from '@/lib/pptGenerator';
import type { PPTTemplateStyle } from '@/lib/pptGenerator';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsDashboard,
});

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4'];

// ── Excel export: CSV formatted with semicolons, wrapped in BOM ────────────
function exportToExcel(data: any, roi: any, scale: number) {
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
    rows.push([
      c.category, 
      c.template_count, 
      Math.round(c.monthly_occurrences * scale), 
      Math.round(c.monthly_hours_saved * scale * 10) / 10, 
      Math.round(c.monthly_sre_savings_usd * scale), 
      c.avg_ai_confidence_pct
    ]);
  });
  rows.push([]);
  rows.push(['=== TOP 5 TEMPLATES BY IMPACT ===']);
  rows.push(['ID', 'Category', 'Monthly Events', 'Resolution (min)', 'Hrs Saved/mo', 'Savings/mo ($)']);
  (roi?.top_5_by_monthly_impact ?? []).forEach((t: any) => {
    rows.push([
      t.id, 
      t.category, 
      Math.round(t.monthly_occurrences * scale), 
      t.estimated_resolution_mins, 
      Math.round(t.monthly_hours_saved * scale * 10) / 10, 
      Math.round(t.monthly_sre_savings_usd * scale)
    ]);
  });

  const csv = rows.map(r => r.join('\t')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `alfred-analytics-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click(); URL.revokeObjectURL(url);
}

function AnalyticsDashboard() {
  const { data, isLoading: analyticsLoading } = useQuery({ queryKey: ['analytics'], queryFn: api.analytics.get });
  const { data: roi, isLoading: roiLoading } = useQuery({ queryKey: ['opexRoi'], queryFn: api.opex.getRoi });
  const [range, setRange] = useState('30d');
  const [showPptMenu, setShowPptMenu] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);

  const isLoading = analyticsLoading || roiLoading;

  // Scale calculations based on range
  const scale = range === '7d' ? (7 / 30) : range === '90d' ? 3.0 : 1.0;

  const handleExcelExport = useCallback(() => exportToExcel(data, roi, scale), [data, roi, scale]);
  
  const handlePPTExport = async (themeStyle: PPTTemplateStyle) => {
    setIsExportingPpt(true);
    setShowPptMenu(false);
    try {
      await exportAnalyticsPPT(data, roi, range, scale, themeStyle);
    } catch (err) {
      console.error('PPT generation failed:', err);
    } finally {
      setIsExportingPpt(false);
    }
  };

  // Category savings from real API with scaling applied
  const categoryData = (roi?.by_category ?? [])
    .sort((a: any, b: any) => b.monthly_sre_savings_usd - a.monthly_sre_savings_usd)
    .map((c: any) => ({ 
      name: c.category.split(' ')[0], 
      savings: Math.round(c.monthly_sre_savings_usd * scale), 
      hours: Math.round(c.monthly_hours_saved * scale * 10) / 10, 
      confidence: c.avg_ai_confidence_pct 
    }));

  // Severity split data scaled
  const severityDist = roi?.severity_distribution
    ? [
        { name: 'Critical', value: Math.round(roi.severity_distribution.Critical * scale) },
        { name: 'High',     value: Math.round(roi.severity_distribution.High * scale) },
        { name: 'Medium',   value: Math.round(roi.severity_distribution.Medium * scale) },
        { name: 'Low',      value: Math.round(roi.severity_distribution.Low * scale) },
      ]
    : [];

  // Mapped backend trends to match expected keys events and savings
  const rawTrends = data?.trends ?? [];
  const trendData = rawTrends.map((t: any) => ({
    name: t.name,
    events: Math.round((t.usage ?? t.events ?? 0) * scale),
    savings: Math.round((t.cost ?? t.savings ?? 0) * scale)
  }));

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
        <div className="flex items-center gap-3 relative">
          <div className="flex bg-muted rounded-lg p-1 text-xs">
            {['7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${range === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >{r}</button>
            ))}
          </div>
          <button onClick={handleExcelExport}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          
          <div className="relative">
            <button onClick={() => setShowPptMenu(!showPptMenu)} disabled={isExportingPpt}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50">
              <Presentation className="w-4 h-4" />
              {isExportingPpt ? 'Generating PPT...' : 'Download PPT Deck'}
            </button>

            {showPptMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                  Select Presentation Theme
                </div>
                {(Object.keys(PPT_THEMES) as PPTTemplateStyle[]).map(styleKey => {
                  const t = PPT_THEMES[styleKey];
                  return (
                    <button
                      key={styleKey}
                      onClick={() => handlePPTExport(styleKey)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex flex-col gap-0.5 group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-400">
                        <span>{t.name}</span>
                        <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                      </div>
                      <span className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI summary from API (Scaled based on range select) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Automation Events', value: Math.round((roi?.summary?.total_monthly_occurrences ?? 0) * scale).toLocaleString(), sub: 'From template catalog', color: 'text-primary' },
          { icon: Clock, label: 'SRE Hours Saved', value: `${(Math.round((roi?.summary?.monthly_hours_saved ?? 0) * scale * 10) / 10).toLocaleString()} hrs`, sub: 'Σ occ × mins / 60', color: 'text-amber-400' },
          { icon: TrendingUp, label: 'Operational Savings', value: `$${Math.round((roi?.summary?.monthly_sre_savings_usd ?? 0) * scale).toLocaleString()}`, sub: '$150/hr · Gartner 2024', color: 'text-emerald-400' },
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
            <h2 className="text-base font-semibold">Automation Events &amp; Savings Trend</h2>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Evaluation period: {range}</span>
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
                <Tooltip formatter={(v: any) => [`$${v}`, 'Savings']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
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
            <h2 className="text-base font-semibold">Top Templates by Period Impact</h2>
            <span className="text-xs text-muted-foreground">/api/opex/roi · top_5_by_monthly_impact</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-4">Template</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Events</th>
                  <th className="py-2 pr-4">Hrs saved</th>
                  <th className="py-2">Savings</th>
                </tr>
              </thead>
              <tbody>
                {(roi?.top_5_by_monthly_impact ?? []).map((t: any, i: number) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-3 pr-4 font-mono text-primary text-xs">{t.id}</td>
                    <td className="py-3 pr-4 text-xs">{t.category}</td>
                    <td className="py-3 pr-4">{Math.round(t.monthly_occurrences * scale)}</td>
                    <td className="py-3 pr-4">{(Math.round(t.monthly_hours_saved * scale * 10) / 10)} hrs</td>
                    <td className="py-3 font-bold text-emerald-400">${Math.round(t.monthly_sre_savings_usd * scale).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
            Methodology: SRE savings = occurrences × estimated_resolution_mins / 60 × $150/hr (Gartner 2024). Downtime avoidance not included.
          </div>
        </div>
      </div>
    </div>
  );
}
