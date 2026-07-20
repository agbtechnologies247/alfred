import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Database, FileText, CheckCircle, ShieldAlert } from 'lucide-react';

export default function DecisionEngine() {
  const flowRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  // Track scroll progress of the pipeline section
  useEffect(() => {
    const handleScroll = () => {
      if (!flowRef.current) return;
      const rect = flowRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far the section has scrolled relative to the viewport
      const start = rect.top - windowHeight;
      const total = rect.height;
      const current = -start;
      
      const p = Math.max(0, Math.min(1, current / (total + windowHeight * 0.15)));
      setScrollProgress(p);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for staggered entrance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15 }
    );
    if (flowRef.current) {
      observer.observe(flowRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      title: "Data Ingestion",
      icon: Database,
      color: "var(--accent-purple)",
      alphaColor: "rgba(139,92,246,0.15)",
      desc: "Raw metrics, logs, signals, and trace events ingested dynamically from cloud servers, ITSM platforms, and databases."
    },
    {
      title: "Knowledge Context",
      icon: FileText,
      color: "var(--accent-purple)",
      alphaColor: "rgba(139,92,246,0.15)",
      desc: "Correlates the alert signals with the application topology to identify downstream impacts and downstream alerts."
    },
    {
      title: "Evaluating Context",
      icon: BrainCircuit,
      color: "var(--accent-purple)",
      alphaColor: "rgba(139,92,246,0.15)",
      desc: "Reasoning engine parses structural anomalies and predicts blast radius while assessing operational criticality."
    },
    {
      title: "Policy & Guardrails",
      icon: ShieldAlert,
      color: "var(--accent-cyan)",
      alphaColor: "rgba(6,182,212,0.15)",
      desc: "Validates security posture, budgets, active maintenance windows, and pre-approved template guardrails."
    },
    {
      title: "Intelligent Action",
      icon: CheckCircle,
      color: "var(--accent-red)",
      alphaColor: "rgba(225,29,72,0.15)",
      desc: "Dispatches automated playbooks, restarts services, scales compute, or routes complex tickets to human operators.",
      isFinal: true
    }
  ];

  const textLine1 = ["Traditional", "software", "executes", "rules."];
  const textLine2 = ["A.L.F.R.E.D.", "evaluates", "context."];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', overflowX: 'hidden' }}>
      
      <style>{`
        @keyframes revealWord {
          to {
            transform: translateY(0);
          }
        }
        .glow-alfred {
          animation: neonGlow 2.5s ease-in-out infinite alternate;
          animation-delay: 1.2s;
        }
        @keyframes neonGlow {
          from {
            text-shadow: 0 0 2px rgba(225,29,72,0.1);
            filter: drop-shadow(0 0 1px rgba(225,29,72,0.1));
          }
          to {
            text-shadow: 0 0 12px rgba(225,29,72,0.4);
            filter: drop-shadow(0 0 6px rgba(225,29,72,0.5));
          }
        }
        .flow-card {
          position: relative;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 24px 30px;
          width: 100%;
          max-width: 480px;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        .flow-card:hover {
          border-color: var(--hover-color);
          box-shadow: 0 12px 35px var(--glow-color);
          transform: translateY(-4px) scale(1.02);
        }
        .flow-card .grid-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.12;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }
        .flow-card:hover .grid-overlay {
          opacity: 0.4;
          background-image: linear-gradient(var(--hover-color-alpha) 1px, transparent 1px),
                            linear-gradient(90deg, var(--hover-color-alpha) 1px, transparent 1px);
          animation: scanGrid 4s linear infinite;
        }
        @keyframes scanGrid {
          0% { background-position: 0 0; }
          100% { background-position: 0 32px; }
        }
      `}</style>

      {/* Hero Section */}
      <section className="section container" style={{ textAlign: 'center', paddingBottom: '60px' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4.5rem)', maxWidth: '950px', margin: '0 auto 24px', lineHeight: 1.25, fontWeight: 800 }}>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            {textLine1.map((word, idx) => (
              <span 
                key={idx}
                style={{
                  display: 'inline-block',
                  transform: 'translateY(100%)',
                  animation: 'revealWord 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  animationDelay: `${idx * 0.08}s`,
                  marginRight: '12px'
                }}
              >
                {word}
              </span>
            ))}
          </span>
          <span style={{ display: 'block', overflow: 'hidden', marginTop: '6px' }}>
            {textLine2.map((word, idx) => {
              const isAlfred = word === "A.L.F.R.E.D.";
              return (
                <span 
                  key={idx}
                  className={isAlfred ? "text-gradient glow-alfred" : ""}
                  style={{
                    display: 'inline-block',
                    transform: 'translateY(100%)',
                    animation: 'revealWord 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    animationDelay: `${(idx + textLine1.length) * 0.08}s`,
                    marginRight: '12px'
                  }}
                >
                  {word}
                </span>
              );
            })}
          </span>
        </h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '720px', margin: '0 auto', color: 'var(--text-muted)', lineHeight: 1.6, animation: 'fadeInUp 0.8s 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0 }}>
          Decision Engineering is our flagship capability. We go far beyond basic "If-This-Then-That" playbooks by evaluating risk, cost, and historical outcomes before moving a muscle.
        </p>
      </section>

      {/* Decision Flow Pipeline Section */}
      <section className="section bg-gradient" style={{ padding: '2px 0' }}>
        <div style={{ background: 'var(--bg-dark)', padding: '100px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            
            <h2 style={{ fontSize: '2.5rem', marginBottom: '80px', fontWeight: 800 }}>The Closed-Loop Decision Pipeline</h2>
            
            <div 
              ref={flowRef}
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '650px', 
                margin: '0 auto',
                padding: '40px 0'
              }}
            >
              {/* Center Line Track (SVG with active dashStream) */}
              <svg style={{
                position: 'absolute',
                top: '50px',
                bottom: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: 'calc(100% - 100px)',
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                  className="topology-edge-line"
                  style={{
                    stroke: 'rgba(255, 255, 255, 0.08)',
                    strokeWidth: 2,
                    strokeDasharray: '8, 16',
                    animation: 'dashStream 30s linear infinite'
                  }}
                />
              </svg>

              {/* Glowing animated line based on scroll progress */}
              <svg style={{
                position: 'absolute',
                top: '50px',
                bottom: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '6px',
                height: 'calc(100% - 100px)',
                overflow: 'visible',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <line
                  x1="3"
                  y1="0"
                  x2="3"
                  y2={`${scrollProgress * 100}%`}
                  style={{
                    stroke: 'var(--accent-red)',
                    strokeWidth: 3,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    transition: 'y2 0.1s ease-out',
                    filter: 'drop-shadow(0 0 6px var(--accent-red))'
                  }}
                />
                
                {/* Glowing flow particle */}
                <circle
                  cx="3"
                  cy={`${scrollProgress * 100}%`}
                  r="6"
                  fill="var(--accent-cyan)"
                  style={{
                    filter: 'drop-shadow(0 0 8px var(--accent-cyan))',
                    transition: 'cy 0.1s ease-out'
                  }}
                />
              </svg>

              {/* Pipeline Cards */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '70px', 
                position: 'relative', 
                zIndex: 3 
              }}>
                {steps.map((s, idx) => {
                  const Icon = s.icon;
                  // Card lights up when scroll particle passes through it
                  const isIlluminated = scrollProgress >= (idx * 0.2) && scrollProgress <= ((idx + 1) * 0.2 + 0.1);
                  
                  return (
                    <div
                      key={s.title}
                      className="flow-card"
                      style={{
                        // Custom CSS variables mapped to hover colors
                        '--hover-color': s.color,
                        '--glow-color': `${s.color}15`,
                        '--hover-color-alpha': `${s.color}25`,
                        
                        // Entrance transition
                        opacity: isInView ? 1 : 0,
                        transform: isInView 
                          ? (isIlluminated ? 'scale(1.03)' : 'scale(1)') 
                          : 'translateY(40px)',
                        borderColor: isIlluminated ? s.color : 'var(--glass-border)',
                        boxShadow: isIlluminated ? `0 8px 30px ${s.color}20` : 'none',
                        transition: `transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.15}s, border-color 0.4s ease, box-shadow 0.4s ease`,
                      } as any}
                    >
                      <div className="grid-overlay" />
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{
                          background: `${s.color}15`,
                          color: s.color,
                          padding: '10px',
                          borderRadius: '10px',
                          border: `1px solid ${s.color}25`
                        }}>
                          <Icon size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>{s.title}</h3>
                      </div>
                      
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'left' }}>
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
