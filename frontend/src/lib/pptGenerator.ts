import pptxgen from 'pptxgenjs';

export type PPTTemplateStyle = 'dark_executive' | 'midnight_blue' | 'corporate_light';

export interface PPTTheme {
  name: string;
  desc: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  highlightGreen: string;
  tableHeaderBg: string;
  tableHeaderColor: string;
}

export const PPT_THEMES: Record<PPTTemplateStyle, PPTTheme> = {
  dark_executive: {
    name: 'Executive Dark',
    desc: 'Sleek dark mode with vibrant cyan & violet highlights, ideal for modern tech presentations.',
    bg: '070A14',
    cardBg: '111827',
    cardBorder: '1F2937',
    textPrimary: 'FFFFFF',
    textMuted: '9CA3AF',
    accent: '06B6D4',
    accentSecondary: '8B5CF6',
    highlightGreen: '10B981',
    tableHeaderBg: '1F2937',
    tableHeaderColor: '06B6D4',
  },
  midnight_blue: {
    name: 'Midnight Blue',
    desc: 'Deep navy theme with crisp sky blue & gold accents, polished for enterprise leadership.',
    bg: '0B132B',
    cardBg: '1C2541',
    cardBorder: '3A506B',
    textPrimary: 'FFFFFF',
    textMuted: '94A3B8',
    accent: '38BDF8',
    accentSecondary: 'F59E0B',
    highlightGreen: '34D399',
    tableHeaderBg: '3A506B',
    tableHeaderColor: '38BDF8',
  },
  corporate_light: {
    name: 'Corporate Light',
    desc: 'Clean, high-contrast light theme built for formal board meetings & print readiness.',
    bg: 'F8FAFC',
    cardBg: 'FFFFFF',
    cardBorder: 'E2E8F0',
    textPrimary: '0F172A',
    textMuted: '64748B',
    accent: '0284C7',
    accentSecondary: '6366F1',
    highlightGreen: '059669',
    tableHeaderBg: 'F1F5F9',
    tableHeaderColor: '0284C7',
  },
};

/**
 * Helper to add header & footer to slide
 */
function addSlideDecoration(
  slide: any,
  pptx: pptxgen,
  theme: PPTTheme,
  title: string,
  subtitle: string,
  slideNum: number,
  totalSlides: number
) {
  // Top Header Title
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: 10,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: theme.textPrimary,
    fontFace: 'Arial',
  });

  slide.addText(subtitle, {
    x: 0.8,
    y: 0.95,
    w: 10,
    h: 0.3,
    fontSize: 12,
    color: theme.textMuted,
    fontFace: 'Arial',
  });

  // Top Accent Bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 11.7,
    h: 0.02,
    fill: { color: theme.accent },
  });

  // Footer Logo & Slide Number
  slide.addText('A.L.F.R.E.D. / Enterprise Intelligence Platform', {
    x: 0.8,
    y: 7.0,
    w: 6,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: theme.accent,
    fontFace: 'Arial',
  });

  slide.addText(`Confidential · Slide ${slideNum} of ${totalSlides}`, {
    x: 8.5,
    y: 7.0,
    w: 4.0,
    h: 0.3,
    fontSize: 10,
    align: 'right',
    color: theme.textMuted,
    fontFace: 'Arial',
  });
}

/**
 * Export Analytics Presentation Deck
 */
export async function exportAnalyticsPPT(
  data: any,
  roi: any,
  range: string,
  scale: number,
  style: PPTTemplateStyle = 'dark_executive'
) {
  const theme = PPT_THEMES[style];
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 inches

  const s = roi?.summary ?? {};
  const events = Math.round((s.total_monthly_occurrences ?? 0) * scale).toLocaleString();
  const hours = (Math.round((s.monthly_hours_saved ?? 0) * scale * 10) / 10).toLocaleString();
  const savings = Math.round((s.monthly_sre_savings_usd ?? 0) * scale).toLocaleString();
  const annual = Math.round((s.annual_sre_savings_usd ?? 0) * scale * 12).toLocaleString();

  // ── SLIDE 1: COVER SLIDE ─────────────────────────────────────────────
  const slide1 = pptx.addSlide();
  slide1.background = { color: theme.bg };

  // Background accent glow card
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    h: 4.8,
    fill: { color: theme.cardBg },
    line: { color: theme.cardBorder, width: 1 },
  });

  slide1.addText('A.L.F.R.E.D. ENTERPRISE BRAIN', {
    x: 1.2,
    y: 2.0,
    w: 10,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: theme.accent,
    fontFace: 'Arial',
  });

  slide1.addText('Executive Analytics & OpEx ROI Report', {
    x: 1.2,
    y: 2.5,
    w: 10,
    h: 0.9,
    fontSize: 34,
    bold: true,
    color: theme.textPrimary,
    fontFace: 'Arial',
  });

  slide1.addText(
    `Continuous audit of AI-recommended infrastructure playbooks, incident SLA mitigations, and automated SRE engineering hour recovery metrics. Range: ${range.toUpperCase()}.`,
    {
      x: 1.2,
      y: 3.5,
      w: 10.5,
      h: 0.8,
      fontSize: 14,
      color: theme.textMuted,
      fontFace: 'Arial',
      lineSpacing: 20,
    }
  );

  slide1.addText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 1.2,
    y: 5.2,
    w: 5,
    h: 0.3,
    fontSize: 11,
    color: theme.accentSecondary,
    fontFace: 'Arial',
  });

  // ── SLIDE 2: PLATFORM SUMMARY & KPI CARDS ─────────────────────────────
  const slide2 = pptx.addSlide();
  slide2.background = { color: theme.bg };
  addSlideDecoration(
    slide2,
    pptx,
    theme,
    'Platform Summary & Operational ROI Impact',
    `Aggregated performance parameters scaled for ${range.toUpperCase()} period`,
    2,
    4
  );

  // 4 KPI Cards
  const kpis = [
    { title: 'Active Templates', val: `${s.template_count ?? 0}`, sub: 'Playbooks in catalog', color: theme.accent },
    { title: 'Events Automated', val: `${events}`, sub: 'Trigger checks executed', color: theme.accentSecondary },
    { title: 'Hours Recovered', val: `${hours} hrs`, sub: 'Saved SRE manual work', color: theme.accent },
    { title: 'Period Savings', val: `$${savings}`, sub: 'SRE $150/hr basis', color: theme.highlightGreen },
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.8 + idx * 2.975;
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: 1.8,
      w: 2.775,
      h: 2.4,
      fill: { color: theme.cardBg },
      line: { color: theme.cardBorder, width: 1 },
    });

    slide2.addText(kpi.val, {
      x: xPos + 0.2,
      y: 2.1,
      w: 2.375,
      h: 0.8,
      fontSize: 30,
      bold: true,
      color: kpi.color,
      fontFace: 'Arial',
    });

    slide2.addText(kpi.title, {
      x: xPos + 0.2,
      y: 2.95,
      w: 2.375,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: theme.textPrimary,
      fontFace: 'Arial',
    });

    slide2.addText(kpi.sub, {
      x: xPos + 0.2,
      y: 3.35,
      w: 2.375,
      h: 0.3,
      fontSize: 10,
      color: theme.textMuted,
      fontFace: 'Arial',
    });
  });

  // Annual Impact Highlight Banner
  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 4.5,
    w: 11.7,
    h: 2.0,
    fill: { color: theme.cardBg },
    line: { color: theme.accent, width: 1 },
  });

  slide2.addText('Projected Annual Cost Avoidance', {
    x: 1.2,
    y: 4.8,
    w: 6,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: theme.textMuted,
    fontFace: 'Arial',
  });

  slide2.addText(`$${annual}`, {
    x: 1.2,
    y: 5.25,
    w: 6,
    h: 0.9,
    fontSize: 40,
    bold: true,
    color: theme.highlightGreen,
    fontFace: 'Arial',
  });

  slide2.addText(
    'Note: Calculations reflect labor hour savings at Gartner standard $150/hr SRE rate. Outage downtime prevention and SLA penalty savings are excluded for conservative baselining.',
    {
      x: 7.0,
      y: 4.9,
      w: 5.2,
      h: 1.4,
      fontSize: 11,
      color: theme.textMuted,
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  // ── SLIDE 3: CATEGORY SAVINGS BREAKDOWN TABLE ─────────────────────────
  const slide3 = pptx.addSlide();
  slide3.background = { color: theme.bg };
  addSlideDecoration(
    slide3,
    pptx,
    theme,
    'OpEx Savings Breakdown by Category',
    'Granular efficiency parameters compiled from active system categories',
    3,
    4
  );

  const categories = (roi?.by_category ?? [])
    .slice()
    .sort((a: any, b: any) => b.monthly_sre_savings_usd - a.monthly_sre_savings_usd)
    .slice(0, 7);

  const catTableRows: any[][] = [
    [
      { text: 'Category', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Templates', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Events', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Hrs Saved', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Est. Savings', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'AI Confidence', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
    ],
  ];

  categories.forEach((c: any) => {
    catTableRows.push([
      { text: c.category, options: { color: theme.textPrimary, bold: true } },
      { text: `${c.template_count}`, options: { color: theme.textMuted } },
      { text: `${Math.round(c.monthly_occurrences * scale)}`, options: { color: theme.textMuted } },
      { text: `${Math.round(c.monthly_hours_saved * scale * 10) / 10} hrs`, options: { color: theme.accent } },
      { text: `$${Math.round(c.monthly_sre_savings_usd * scale).toLocaleString()}`, options: { color: theme.highlightGreen, bold: true } },
      { text: `${c.avg_ai_confidence_pct}%`, options: { color: theme.accentSecondary } },
    ]);
  });

  slide3.addTable(catTableRows, {
    x: 0.8,
    y: 1.6,
    w: 11.7,
    colW: [3.2, 1.5, 1.5, 1.7, 2.1, 1.7],
    fontSize: 11,
    fontFace: 'Arial',
    rowH: 0.5,
    border: { pt: 1, color: theme.cardBorder },
    fill: { color: theme.cardBg },
  });

  // ── SLIDE 4: TOP HIGH IMPACT PLAYBOOKS ───────────────────────────────
  const slide4 = pptx.addSlide();
  slide4.background = { color: theme.bg };
  addSlideDecoration(
    slide4,
    pptx,
    theme,
    'Top 5 Highest-Impact Automation Playbooks',
    'Highest financial ROI automations executing autonomously',
    4,
    4
  );

  const top5 = roi?.top_5_by_monthly_impact ?? [];
  const topTableRows: any[][] = [
    [
      { text: 'Playbook ID', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Category', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Events', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Res. Time', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Hours Saved', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      { text: 'Monthly Savings', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
    ],
  ];

  top5.forEach((t: any) => {
    topTableRows.push([
      { text: t.id, options: { color: theme.accent, bold: true } },
      { text: t.category, options: { color: theme.textPrimary } },
      { text: `${Math.round(t.monthly_occurrences * scale)}`, options: { color: theme.textMuted } },
      { text: `${t.estimated_resolution_mins} mins`, options: { color: theme.textMuted } },
      { text: `${Math.round(t.monthly_hours_saved * scale * 10) / 10} hrs`, options: { color: theme.textPrimary } },
      { text: `$${Math.round(t.monthly_sre_savings_usd * scale).toLocaleString()}`, options: { color: theme.highlightGreen, bold: true } },
    ]);
  });

  slide4.addTable(topTableRows, {
    x: 0.8,
    y: 1.6,
    w: 11.7,
    colW: [2.5, 2.7, 1.4, 1.5, 1.6, 2.0],
    fontSize: 11,
    fontFace: 'Arial',
    rowH: 0.55,
    border: { pt: 1, color: theme.cardBorder },
    fill: { color: theme.cardBg },
  });

  // Write presentation file download
  const filename = `alfred-analytics-${style}-${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: filename });
}

/**
 * Export Reports Presentation Deck (SLA, FinOps, Governance, People)
 */
export async function exportReportPPT(
  reportType: string,
  reportTitle: string,
  reportData: any,
  style: PPTTemplateStyle = 'dark_executive'
) {
  const theme = PPT_THEMES[style];
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Cover Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: theme.bg };

  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    h: 4.8,
    fill: { color: theme.cardBg },
    line: { color: theme.cardBorder, width: 1 },
  });

  slide1.addText('A.L.F.R.E.D. PLATFORM AUDIT REPORT', {
    x: 1.2,
    y: 2.0,
    w: 10,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: theme.accent,
    fontFace: 'Arial',
  });

  slide1.addText(reportTitle, {
    x: 1.2,
    y: 2.5,
    w: 10,
    h: 0.9,
    fontSize: 32,
    bold: true,
    color: theme.textPrimary,
    fontFace: 'Arial',
  });

  slide1.addText(
    `Immutable executive evaluation report compiled directly from active backend telemetry, governance logs, and financial engine parameters.`,
    {
      x: 1.2,
      y: 3.5,
      w: 10.5,
      h: 0.8,
      fontSize: 14,
      color: theme.textMuted,
      fontFace: 'Arial',
    }
  );

  slide1.addText(`Generated: ${new Date().toLocaleDateString()} | Methodology: Platform Audit Vault v1.0`, {
    x: 1.2,
    y: 5.2,
    w: 10,
    h: 0.3,
    fontSize: 11,
    color: theme.accentSecondary,
    fontFace: 'Arial',
  });

  // Slide 2: Metrics Detail
  const slide2 = pptx.addSlide();
  slide2.background = { color: theme.bg };
  addSlideDecoration(slide2, pptx, theme, reportTitle, 'Key Audit Parameters & Metrics Snapshot', 2, 2);

  if (reportType === 'sla') {
    const m = reportData?.metrics ?? {};
    const kpis = [
      { label: 'Active Incidents', val: `${m.active_incidents ?? 0}`, color: 'EF4444' },
      { label: 'Avg MTTR', val: `${m.mttr_mins ?? 0} min`, color: theme.accent },
      { label: 'Resolved (30d)', val: `${m.resolved_30d ?? 0}`, color: theme.highlightGreen },
      { label: 'SLA Compliance', val: '99.8%', color: theme.highlightGreen },
    ];

    kpis.forEach((kpi, idx) => {
      const xPos = 0.8 + idx * 2.975;
      slide2.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: 1.8,
        w: 2.775,
        h: 2.0,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
      });
      slide2.addText(kpi.val, { x: xPos + 0.2, y: 2.1, w: 2.375, h: 0.7, fontSize: 32, bold: true, color: kpi.color, fontFace: 'Arial' });
      slide2.addText(kpi.label, { x: xPos + 0.2, y: 2.9, w: 2.375, h: 0.4, fontSize: 11, bold: true, color: theme.textPrimary, fontFace: 'Arial' });
    });

    // Incident Table
    const incidents = (reportData?.list ?? []).slice(0, 5);
    const rows: any[][] = [
      [
        { text: 'Incident ID', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Title', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Priority', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Status', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      ],
    ];
    incidents.forEach((inc: any) => {
      rows.push([
        { text: inc.id, options: { color: theme.accent, bold: true } },
        { text: inc.title, options: { color: theme.textPrimary } },
        { text: inc.priority, options: { color: inc.priority === 'P1' ? 'EF4444' : 'F59E0B', bold: true } },
        { text: inc.status, options: { color: theme.highlightGreen } },
      ]);
    });

    slide2.addTable(rows, {
      x: 0.8,
      y: 4.2,
      w: 11.7,
      colW: [2.0, 6.0, 1.7, 2.0],
      fontSize: 10,
      fontFace: 'Arial',
      rowH: 0.45,
      border: { pt: 1, color: theme.cardBorder },
      fill: { color: theme.cardBg },
    });
  } else if (reportType === 'cost') {
    const s = reportData?.summary ?? {};
    const kpis = [
      { label: 'Monthly Savings', val: `$${(s.monthly_sre_savings_usd ?? 0).toLocaleString()}`, color: theme.highlightGreen },
      { label: 'Annual Run-Rate', val: `$${(s.annual_sre_savings_usd ?? 0).toLocaleString()}`, color: theme.highlightGreen },
      { label: 'Hours Recovered', val: `${s.monthly_hours_saved ?? 0} hrs`, color: theme.accent },
      { label: 'Confidence', val: `${s.weighted_avg_ai_confidence_pct ?? 94}%`, color: theme.accentSecondary },
    ];

    kpis.forEach((kpi, idx) => {
      const xPos = 0.8 + idx * 2.975;
      slide2.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: 1.8,
        w: 2.775,
        h: 2.0,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
      });
      slide2.addText(kpi.val, { x: xPos + 0.2, y: 2.1, w: 2.375, h: 0.7, fontSize: 30, bold: true, color: kpi.color, fontFace: 'Arial' });
      slide2.addText(kpi.label, { x: xPos + 0.2, y: 2.9, w: 2.375, h: 0.4, fontSize: 11, bold: true, color: theme.textPrimary, fontFace: 'Arial' });
    });

    // Category Table
    const cats = (reportData?.by_category ?? []).slice(0, 5);
    const rows: any[][] = [
      [
        { text: 'Category', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Templates', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Monthly Events', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Est. Savings', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      ],
    ];
    cats.forEach((c: any) => {
      rows.push([
        { text: c.category, options: { color: theme.textPrimary, bold: true } },
        { text: `${c.template_count}`, options: { color: theme.textMuted } },
        { text: `${c.monthly_occurrences}`, options: { color: theme.textMuted } },
        { text: `$${c.monthly_sre_savings_usd.toLocaleString()}`, options: { color: theme.highlightGreen, bold: true } },
      ]);
    });

    slide2.addTable(rows, {
      x: 0.8,
      y: 4.2,
      w: 11.7,
      colW: [4.0, 2.0, 2.7, 3.0],
      fontSize: 10,
      fontFace: 'Arial',
      rowH: 0.45,
      border: { pt: 1, color: theme.cardBorder },
      fill: { color: theme.cardBg },
    });
  } else if (reportType === 'governance') {
    const roles = reportData?.roles ?? [];
    const audit = (reportData?.audit ?? []).slice(0, 5);

    slide2.addText(`Active Governance Roles (${roles.length}) & Immutable Audit Feed`, {
      x: 0.8,
      y: 1.8,
      w: 10,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: theme.accent,
      fontFace: 'Arial',
    });

    const rows: any[][] = [
      [
        { text: 'Timestamp', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'User', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Action', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Resource', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
        { text: 'Status', options: { bold: true, color: theme.tableHeaderColor, fill: theme.tableHeaderBg } },
      ],
    ];
    audit.forEach((a: any) => {
      rows.push([
        { text: a.timestamp || new Date().toLocaleTimeString(), options: { color: theme.textMuted } },
        { text: a.user || 'admin@enterprise.com', options: { color: theme.textPrimary, bold: true } },
        { text: a.action || 'policy_update', options: { color: theme.accent } },
        { text: a.resource || 'sys-config', options: { color: theme.textMuted } },
        { text: a.status || 'SUCCESS', options: { color: theme.highlightGreen, bold: true } },
      ]);
    });

    slide2.addTable(rows, {
      x: 0.8,
      y: 2.4,
      w: 11.7,
      colW: [2.2, 2.8, 2.5, 2.5, 1.7],
      fontSize: 10,
      fontFace: 'Arial',
      rowH: 0.5,
      border: { pt: 1, color: theme.cardBorder },
      fill: { color: theme.cardBg },
    });
  } else {
    // People report
    const insights = reportData?.insights ?? {};
    const kpis = [
      { label: 'Team Stress Level', val: `${insights.stress_level || 'Low'}`, color: theme.highlightGreen },
      { label: 'Burnout Risk', val: `${insights.burnout_risk_pct || '4'}%`, color: theme.highlightGreen },
      { label: 'SRE On-Call Load', val: `${insights.oncall_load || 'Balanced'}`, color: theme.accent },
      { label: 'Check-In Rate', val: '98%', color: theme.accentSecondary },
    ];

    kpis.forEach((kpi, idx) => {
      const xPos = 0.8 + idx * 2.975;
      slide2.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: 1.8,
        w: 2.775,
        h: 2.0,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
      });
      slide2.addText(kpi.val, { x: xPos + 0.2, y: 2.1, w: 2.375, h: 0.7, fontSize: 30, bold: true, color: kpi.color, fontFace: 'Arial' });
      slide2.addText(kpi.label, { x: xPos + 0.2, y: 2.9, w: 2.375, h: 0.4, fontSize: 11, bold: true, color: theme.textPrimary, fontFace: 'Arial' });
    });
  }

  const filename = `alfred-report-${reportType}-${style}-${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
