import { useState } from 'react';

export default function RoiCalculator() {
  const [employees, setEmployees] = useState(500);
  const [incidents, setIncidents] = useState(200);
  const [mttr, setMttr] = useState(60); // minutes
  const [hourlyCost, setHourlyCost] = useState(150);

  // Math
  const totalDowntimeHours = (incidents * mttr) / 60;
  const currentCost = totalDowntimeHours * hourlyCost;
  
  // A.L.F.R.E.D. assumes an 80% reduction in MTTR due to auto-remediation
  const newMttr = mttr * 0.2;
  const newDowntimeHours = (incidents * newMttr) / 60;
  const newCost = newDowntimeHours * hourlyCost;
  
  const savings = currentCost - newCost;

  return (
    <div className="glass-panel" style={{ padding: '60px', borderRadius: '16px', display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 400px' }}>
        <h2>Interactive ROI Calculator</h2>
        <p>See how much capital you can reclaim by switching from manual triage to Decision Engineering.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '40px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>IT Employees</label>
              <span>{employees}</span>
            </div>
            <input type="range" min="10" max="5000" value={employees} onChange={e => setEmployees(parseInt(e.target.value))} style={{ width: '100%' }}/>
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Incidents / Month</label>
              <span>{incidents}</span>
            </div>
            <input type="range" min="10" max="2000" value={incidents} onChange={e => setIncidents(parseInt(e.target.value))} style={{ width: '100%' }}/>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Current MTTR (Minutes)</label>
              <span>{mttr}m</span>
            </div>
            <input type="range" min="5" max="300" value={mttr} onChange={e => setMttr(parseInt(e.target.value))} style={{ width: '100%' }}/>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Hourly Downtime Cost</label>
              <span>${hourlyCost}</span>
            </div>
            <input type="range" min="50" max="1000" value={hourlyCost} onChange={e => setHourlyCost(parseInt(e.target.value))} style={{ width: '100%' }}/>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 300px', background: 'rgba(0,0,0,0.4)', padding: '40px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Estimated Monthly Savings</h3>
        <div className="text-gradient" style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>
          ${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Current Cost:</span>
            <span style={{ color: '#dc3545' }}>${currentCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>A.L.F.R.E.D. Cost:</span>
            <span style={{ color: '#28a745' }}>${newCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        
        <button className="btn btn-primary" style={{ marginTop: '40px' }}>Download Business Case</button>
      </div>
    </div>
  );
}
