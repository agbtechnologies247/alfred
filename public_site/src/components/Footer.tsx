import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{
      background: 'rgba(5, 5, 10, 0.85)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--border-color)',
      padding: '80px 0 40px 0',
      marginTop: '80px',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '60px'
        }}>
          {/* Logo & Vision */}
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" style={{ display: 'inline-block', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '16px' }}>
              <span className="text-gradient">A.L.F.R.E.D.</span>
            </Link>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.6', marginBottom: '12px' }}>
              Automated Logical Facilitator for Resolving Enterprise Demands. The autonomous operations and decision engineering platform for modern enterprise infrastructure.
            </p>
          </div>

          {/* Links: Platform */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 700 }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <Link to="/platform" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>Core Lifecycle</Link>
              <Link to="/decision-engineering" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>Decision Engine</Link>
              <Link to="/templates" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>Runbook Templates</Link>
              <Link to="/opex" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>ROI Analysis</Link>
              <Link to="/pricing" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>Pricing Plans</Link>
            </div>
          </div>

          {/* Links: Developers */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 700 }}>Developers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <Link to="/developers" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>SDK & Quickstart</Link>
              <Link to="/api-docs" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>API Reference</Link>
              <a href="/app/" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>App Console</a>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <span>© 2026 Developed By Bhramit Pardhi. All rights reserved under AGB Technologies LLP.</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              Back to top <ArrowUp size={12} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
