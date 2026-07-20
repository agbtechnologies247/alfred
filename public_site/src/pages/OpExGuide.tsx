import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';
const fmt = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));
const fmtUSD = (n: number) => '$' + new Intl.NumberFormat('en-US').format(Math.round(n));

function useRoi() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/opex/roi`, {
      headers: {
        'Authorization': 'Bearer sk_test_xxxxx'
      }
    })
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export default function OpExGuide() {
  const { data: roi, loading, error } = useRoi();
  const [sreCost, setSreCost] = useState(150);
  const [tplPct, setTplPct] = useState(100);
  const [approvalRate, setApprovalRate] = useState(80);

  const baseHrs = roi?.summary?.monthly_hours_saved ?? 0;
  const baseOcc = roi?.summary?.total_monthly_occurrences ?? 0;
  const adjHrs = baseHrs * (tplPct / 100) * (approvalRate / 100);
  const adjOcc = Math.round(baseOcc * (tplPct / 100) * (approvalRate / 100));
  const monthSavings = adjHrs * sreCost;
  const annualSavings = monthSavings * 12;

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="section" style={{ textAlign: 'center', paddingBottom: '60px' }}>
        <div className="container">
          <span className="badge" style={{ marginBottom: '24px', display: 'inline-block' }}>Live Data · Numbers fetched from /api/opex/roi</span>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 900, marginBottom: '16px', lineHeight: 1.1 }}>
            How A.L.F.R.E.D. reduces<br />
            <span className="text-gradient">your OpEx — in numbers</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 48px' }}>
            Every number on this page is computed at page load from the live template catalog. No marketing assumptions.
          </p>

          {loading && <div style={{ color: 'var(--text-muted)' }}>Loading live data from API…</div>}
          {error && <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>API not reachable ({error}). Run <code>.\start.ps1</code> to start the platform.</div>}

          {roi && (
            <div className="grid-4" style={{ gap: '16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                { val: roi.summary.template_count, lbl: 'Templates', sub: 'automation playbooks', color: 'var(--accent-cyan)' },
                { val: fmt(roi.summary.total_monthly_occurrences), lbl: 'Events / Month', sub: 'Σ monthly_occurrences', color: '#a78bfa' },
                { val: `${roi.summary.monthly_hours_saved} hrs`, lbl: 'SRE Hours Saved', sub: 'occ × mins / 60', color: '#f59e0b' },
                { val: fmtUSD(roi.summary.annual_sre_savings_usd), lbl: 'Annual Savings', sub: 'SRE time only', color: '#10b981' },
              ].map(k => (
                <div key={k.lbl} className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
                  <div style={{ fontWeight: 600, marginTop: '8px' }}>{k.lbl}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{k.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.02)', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Your ROI Calculator</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '36px' }}>Adjust for your team. All base numbers from live API.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontSize: '0.95rem' }}>Team Parameters</h3>
              {[
                { id: 'sre', label: 'Fully-loaded SRE cost / hr', val: `$${sreCost}`, min: 80, max: 350, step: 5, value: sreCost, setter: setSreCost },
                { id: 'tpl', label: 'Templates you plan to adopt', val: `${tplPct}%`, min: 10, max: 100, step: 5, value: tplPct, setter: setTplPct },
                { id: 'apr', label: 'AI auto-approval rate', val: `${approvalRate}%`, min: 30, max: 100, step: 5, value: approvalRate, setter: setApprovalRate },
              ].map(s => (
                <div key={s.id} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{s.val}</strong>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={e => s.setter(+e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.05),rgba(124,58,237,0.05))', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '0.95rem' }}>Projected Annual Impact</h3>
              {[
                { lbl: 'Monthly automation events', val: fmt(adjOcc), color: 'inherit' },
                { lbl: 'Monthly SRE hours saved', val: `${Math.round(adjHrs * 10) / 10} hrs`, color: 'inherit' },
                { lbl: 'Monthly cost avoidance', val: fmtUSD(monthSavings), color: '#10b981' },
              ].map(r => (
                <div key={r.lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{r.lbl}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: r.color }}>{r.val}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Annual SRE savings</span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{fmtUSD(annualSavings)}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SRE time only · Downtime avoidance not included</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category breakdown */}
      {roi?.by_category && (
        <section className="section" style={{ padding: '80px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Savings by Category</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Computed from <code style={{ color: 'var(--accent-cyan)' }}>GET /api/opex/roi</code> · sorted by savings</p>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Category', 'Templates', 'Events/mo', 'Hrs Saved', 'Savings/mo', 'AI Confidence'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...roi.by_category].sort((a: any, b: any) => b.monthly_sre_savings_usd - a.monthly_sre_savings_usd).map((c: any) => (
                    <tr key={c.category} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.category}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.template_count}</td>
                      <td style={{ padding: '12px 16px' }}>{c.monthly_occurrences}</td>
                      <td style={{ padding: '12px 16px' }}>{c.monthly_hours_saved} hrs</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>{fmtUSD(c.monthly_sre_savings_usd)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${c.avg_ai_confidence_pct}%`, background: 'linear-gradient(90deg,var(--accent-cyan),#7c3aed)', borderRadius: '99px' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{c.avg_ai_confidence_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Methodology: SRE cost = $150/hr (Gartner 2024). Scope: SRE time only. Downtime avoidance and compliance penalties not included.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
