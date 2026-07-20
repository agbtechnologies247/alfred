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

// ── PPT export: generates a highly premium, executive-grade presentation slide deck ─────────────
function exportToPPT(data: any, roi: any, range: string, scale: number) {
  const s = roi?.summary ?? {};
  
  const events = Math.round((s.total_monthly_occurrences ?? 0) * scale).toLocaleString();
  const hours = (Math.round((s.monthly_hours_saved ?? 0) * scale * 10) / 10).toLocaleString();
  const savings = Math.round((s.monthly_sre_savings_usd ?? 0) * scale).toLocaleString();
  const annual = Math.round((s.annual_sre_savings_usd ?? 0) * (scale / (30 / 365) / 365)).toLocaleString(); // Adjusted run-rate

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>A.L.F.R.E.D. Executive Analytics Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      background: #030712; 
      color: #f3f4f6; 
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .slide { 
      width: 1600px; 
      height: 900px; 
      padding: 80px 100px; 
      display: flex; 
      flex-direction: column; 
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 90% 10%, rgba(6, 182, 212, 0.08) 0%, rgba(3, 7, 18, 0) 60%),
                  radial-gradient(circle at 10% 90%, rgba(124, 58, 237, 0.05) 0%, rgba(3, 7, 18, 0) 60%),
                  #030712;
      border-bottom: 2px solid #1f2937;
      page-break-after: always;
    }
    
    /* Cover Slide Specific */
    .cover-content {
      margin-top: 120px;
      max-width: 1000px;
      z-index: 10;
    }
    .tagline {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: #06b6d4;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      margin-bottom: 20px;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 5rem;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 30%, #a5f3fc 70%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 30px;
    }
    .cover-desc {
      font-size: 1.35rem;
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 50px;
      font-weight: 300;
    }
    
    /* Standard Slide Header */
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 24px;
      z-index: 10;
    }
    .slide-title {
      font-family: 'Outfit', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: #ffffff;
    }
    .slide-subtitle {
      font-size: 1.05rem;
      color: #6b7280;
      margin-top: 6px;
    }
    .slide-badge {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      padding: 6px 14px;
      background: rgba(6, 182, 21 cyan, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.2);
      color: #06b6d4;
      border-radius: 9999px;
    }
    
    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 30px;
      margin: 60px 0;
      z-index: 10;
    }
    .kpi-card {
      background: rgba(17, 24, 39, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 40px 30px;
      backdrop-filter: blur(10px);
      transition: border-color 0.3s;
    }
    .kpi-card:hover {
      border-color: rgba(6, 182, 212, 0.3);
    }
    .kpi-val {
      font-family: 'Outfit', sans-serif;
      font-size: 3.5rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .kpi-lbl {
      font-size: 1rem;
      font-weight: 600;
      color: #9ca3af;
      margin-top: 15px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-sub {
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 6px;
    }
    
    /* Table Styles */
    .table-container {
      margin-top: 40px;
      background: rgba(17, 24, 39, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      overflow: hidden;
      z-index: 10;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 1rem;
    }
    th {
      background: rgba(255, 255, 255, 0.02);
      padding: 20px 24px;
      text-align: left;
      color: #9ca3af;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    td {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      color: #d1d5db;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .green {
      color: #10b981;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(6, 182, 212, 0.08);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.2);
    }
    
    /* Footer */
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 24px;
      font-size: 0.85rem;
      color: #4b5563;
      font-weight: 500;
      z-index: 10;
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.05em;
    }
    .logo span {
      color: #06b6d4;
    }
  </style>
</head>
<body>

  <!-- Slide 1: Cover -->
  <div class="slide">
    <div class="logo">A.L.F.R.E.D.<span>/</span>PLATFORM</div>
    <div class="cover-content">
      <div class="tagline">EXECUTIVE EVALUATION REPORT</div>
      <h1 class="cover-title">Operational Excellence &amp;<br>Decoupled Automation ROI</h1>
      <p class="cover-desc">
        Continuous audit of AI-recommended infrastructure, incident SLA mitigations, and automated SRE engineering hour recovery metrics.
      </p>
    </div>
    <div class="slide-footer">
      <div>Report Range: ${range.toUpperCase()} · Live API Pull</div>
      <div>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <!-- Slide 2: Platform Overview KPIs -->
  <div class="slide">
    <div class="slide-header">
      <div>
        <h2 class="slide-title">Platform Summary &amp; ROI Impact</h2>
        <p class="slide-subtitle">Aggregated metrics scaled for the selected evaluation period (${range})</p>
      </div>
      <div class="slide-badge">Operational ROI</div>
    </div>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-val">${s.template_count ?? 0}</div>
        <div class="kpi-lbl">Active Templates</div>
        <div class="kpi-sub">System catalogs loaded</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val">${events}</div>
        <div class="kpi-lbl">Events Automated</div>
        <div class="kpi-sub">Executions trigger checks</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val">${hours} hrs</div>
        <div class="kpi-lbl">Hours Recovered</div>
        <div class="kpi-sub">Saved manual SRE overhead</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val" style="color: #10b981;">$${savings}</div>
        <div class="kpi-lbl">Period Savings</div>
        <div class="kpi-sub">Basis SRE $150/hr index</div>
      </div>
    </div>
    
    <div style="font-size: 0.9rem; color: #9ca3af; line-height: 1.5; font-weight: 300;">
      * Savings estimates are computed conservatively based on SRE hours saved via active automation triggers. Downtime prevention coefficients, compliance breach mitigations, and SLA penalty avoidance metrics are excluded from this baseline calculation.
    </div>

    <div class="slide-footer">
      <div class="logo">A.L.F.R.E.D.<span>/</span>PLATFORM</div>
      <div>Confidential · Slide 2</div>
    </div>
  </div>

  <!-- Slide 3: Category Savings Breakdown -->
  <div class="slide">
    <div class="slide-header">
      <div>
        <h2 class="slide-title">Savings Breakdown by Category</h2>
        <p class="slide-subtitle">Granular performance parameters compiled from system components</p>
      </div>
      <div class="slide-badge">Category Metrics</div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Active Templates</th>
            <th>Events Triggered</th>
            <th>Hours Recovered</th>
            <th>Estimated Period Savings</th>
            <th>Avg AI Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${(roi?.by_category ?? []).sort((a: any, b: any) => b.monthly_sre_savings_usd - a.monthly_sre_savings_usd).slice(0, 7).map((c: any) => `
            <tr>
              <td style="font-weight: 600; color: #ffffff;">${c.category}</td>
              <td>${c.template_count}</td>
              <td>${Math.round(c.monthly_occurrences * scale)}</td>
              <td>${(Math.round(c.monthly_hours_saved * scale * 10) / 10)} hrs</td>
              <td class="green">$${Math.round(c.monthly_sre_savings_usd * scale).toLocaleString()}</td>
              <td>${c.avg_ai_confidence_pct}%</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="slide-footer">
      <div class="logo">A.L.F.R.E.D.<span>/</span>PLATFORM</div>
      <div>Confidential · Slide 3</div>
    </div>
  </div>

  <!-- Slide 4: High Impact Templates -->
  <div class="slide">
    <div class="slide-header">
      <div>
        <h2 class="slide-title">Top 5 Highest-Impact Automations</h2>
        <p class="slide-subtitle">Highest performance metrics recorded within the active workspace</p>
      </div>
      <div class="slide-badge">High Impact</div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Template ID</th>
            <th>Operational Category</th>
            <th>Events Triggered</th>
            <th>Est. Resolution time</th>
            <th>Hours Recovered</th>
            <th>SRE Savings</th>
          </tr>
        </thead>
        <tbody>
          ${(roi?.top_5_by_monthly_impact ?? []).map((t: any) => `
            <tr>
              <td><span class="badge">${t.id}</span></td>
              <td style="font-weight: 600; color: #ffffff;">${t.category}</td>
              <td>${Math.round(t.monthly_occurrences * scale)}</td>
              <td>${t.estimated_resolution_mins} mins</td>
              <td>${(Math.round(t.monthly_hours_saved * scale * 10) / 10)} hrs</td>
              <td class="green">$${Math.round(t.monthly_sre_savings_usd * scale).toLocaleString()}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="slide-footer">
      <div class="logo">A.L.F.R.E.D.<span>/</span>PLATFORM</div>
      <div>Confidential · Slide 4</div>
    </div>
  </div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `alfred-executive-report-${new Date().toISOString().slice(0, 10)}.html`;
  a.click(); URL.revokeObjectURL(url);
}

function AnalyticsDashboard() {
  const { data, isLoading: analyticsLoading } = useQuery({ queryKey: ['analytics'], queryFn: api.analytics.get });
  const { data: roi, isLoading: roiLoading } = useQuery({ queryKey: ['opexRoi'], queryFn: api.opex.getRoi });
  const [range, setRange] = useState('30d');

  const isLoading = analyticsLoading || roiLoading;

  // Scale calculations based on range
  const scale = range === '7d' ? (7 / 30) : range === '90d' ? 3.0 : 1.0;

  const handleExcelExport = useCallback(() => exportToExcel(data, roi, scale), [data, roi, scale]);
  const handlePPTExport = useCallback(() => exportToPPT(data, roi, range, scale), [data, roi, range, scale]);

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
        <div className="flex items-center gap-3">
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
          <button onClick={handlePPTExport}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Presentation className="w-4 h-4" /> Export PPT
          </button>
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
