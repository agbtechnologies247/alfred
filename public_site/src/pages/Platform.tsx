import { Eye, Activity, Box, Zap, GraduationCap, ArrowRight } from 'lucide-react';

export default function Platform() {
  return (
    <div style={{ paddingTop: '100px' }}>
      
      {/* Hero Section */}
      <section className="section container animate-fade-in-up" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', maxWidth: '900px', margin: '0 auto 30px' }}>
          The <span className="text-gradient">Business Lifecycle</span> of Decision Engineering
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 40px', color: 'var(--text-muted)' }}>
          We don't just monitor. We don't just execute. We complete the full autonomous lifecycle of enterprise operations.
        </p>
      </section>

      <section className="section container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div className="glass-panel" style={{ padding: '50px', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', padding: '30px', borderRadius: '50%' }}>
              <Eye size={64} className="text-gradient" />
            </div>
            <div>
              <h2 className="text-gradient">1. Observe</h2>
              <p>Collect everything. Logs, Metrics, Traces, Events, Assets, Users, Cloud, Network, Applications, ERP.</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '50px', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(79, 172, 254, 0.1)', padding: '30px', borderRadius: '50%' }}>
              <Activity size={64} className="text-gradient" />
            </div>
            <div>
              <h2 className="text-gradient">2. Understand</h2>
              <p>AI correlates everything. Root Cause Analysis, Business Dependencies, Knowledge Graph, Impact Analysis, Topology, Anomaly Detection.</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '50px', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(150, 100, 255, 0.1)', padding: '30px', borderRadius: '50%' }}>
              <Box size={64} className="text-gradient" />
            </div>
            <div>
              <h2 className="text-gradient">3. Decide</h2>
              <p>The Decision Engine evaluates Risk, Business Impact, Compliance, Cost, Priority, Policies, Previous Incidents, and the Knowledge Base before making a move.</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '50px', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255, 50, 100, 0.1)', padding: '30px', borderRadius: '50%' }}>
              <Zap size={64} className="text-gradient" />
            </div>
            <div>
              <h2 className="text-gradient">4. Act</h2>
              <p>Automation via Scripts, SSH, APIs, Cloud functions, Containers, Network switches, ERP hooks, Notifications, and auto-Tickets.</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '50px', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(50, 255, 150, 0.1)', padding: '30px', borderRadius: '50%' }}>
              <GraduationCap size={64} className="text-gradient" />
            </div>
            <div>
              <h2 className="text-gradient">5. Learn</h2>
              <p>Every incident becomes knowledge. A.L.F.R.E.D. automatically creates Runbooks, SOPs, Knowledge Articles, and feeds them into AI Training.</p>
            </div>
          </div>

        </div>
      </section>

      <section className="section container" style={{ textAlign: 'center' }}>
        <h2>Ready to transform your operations?</h2>
        <button className="btn btn-primary" style={{ marginTop: '30px', fontSize: '1.25rem', padding: '20px 40px' }}>
          Explore Our Products <ArrowRight size={24} style={{ marginLeft: '10px' }} />
        </button>
      </section>

    </div>
  );
}
