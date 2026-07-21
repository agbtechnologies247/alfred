import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/platform', label: 'Platform' },
  { to: '/decision-engineering', label: 'Decision Engine' },
  { to: '/sandbox', label: 'Interactive Sandbox' },
  { to: '/templates', label: 'Templates' },
  { to: '/opex', label: 'ROI Guide' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/developers', label: 'Developers' },
  { to: '/api-docs', label: 'API Docs' },
];

export default function Navbar() {
  const location = useLocation();
  const [logoHovered, setLogoHovered] = useState(false);

  const handleRedirect = () => {
    window.location.href = '/app/';
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, width: '100%',
      background: 'rgba(7, 7, 13, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      zIndex: 1000, padding: '16px 0'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo Container with Interactive Acronym Tooltip */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <Link to="/" style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '2px', textDecoration: 'none' }}>
            <span className="text-gradient">A.L.F.R.E.D.</span>
          </Link>
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '10px',
            padding: '10px 16px',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'var(--text-main)',
            opacity: logoHovered ? 1 : 0,
            visibility: logoHovered ? 'visible' : 'hidden',
            transform: logoHovered ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 1100,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            borderLeft: '3px solid var(--accent-red)'
          }}>
            <span style={{ color: 'var(--accent-red)' }}>A</span>utomated{' '}
            <span style={{ color: 'var(--accent-red)' }}>L</span>ogical{' '}
            <span style={{ color: 'var(--accent-red)' }}>F</span>acilitator for{' '}
            <span style={{ color: 'var(--accent-red)' }}>R</span>esolving{' '}
            <span style={{ color: 'var(--accent-red)' }}>E</span>nterprise{' '}
            <span style={{ color: 'var(--accent-red)' }}>D</span>emands
          </div>
        </div>

        {/* Links & CTA */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '0.88rem', fontWeight: 600 }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to} to={link.to}
              style={{
                color: location.pathname === link.to ? 'var(--accent-red)' : 'var(--text-muted)',
                textDecoration: 'none', transition: 'all 0.2s',
                borderBottom: location.pathname === link.to ? '2px solid var(--accent-red)' : '2px solid transparent',
                paddingBottom: '4px',
              }}
              onMouseEnter={e => {
                if (location.pathname !== link.to) e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={e => {
                if (location.pathname !== link.to) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {link.label}
            </Link>
          ))}
          <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={handleRedirect}>Sign In</button>
          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={handleRedirect}>Start Free Trial</button>
        </div>

      </div>
    </nav>
  );
}
