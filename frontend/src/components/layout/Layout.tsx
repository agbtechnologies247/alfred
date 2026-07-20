import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useState, useEffect } from 'react';
import { Lock, Shield, User, AlertCircle, RefreshCw } from 'lucide-react';

export function Layout() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('alfred_token'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:3000'
        : window.location.origin;
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('alfred_token', data.token);
        localStorage.setItem('alfred_username', data.user.username);
        localStorage.setItem('alfred_role', data.user.role);
        setToken(data.token);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection to A.L.F.R.E.D. failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0B0D19]">
        {/* Futuristic glowing backdrop */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#f43f5e]/5 blur-[120px] pointer-events-none" />

        {/* Diagonal moving accent line */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="z-10 w-full max-w-md p-8 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
          
          {/* Brand/Logo Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 ring-1 ring-white/10">
              A
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                A.L.F.R.E.D.
              </h1>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold text-primary/80">
                Decision Engineering Platform
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input field username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Input field password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" /> Authenticate Session
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Banner */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <p className="font-bold text-primary mb-1.5 flex items-center gap-1.5">
              <span>🎯</span> Try A.L.F.R.E.D. — Demo Access
            </p>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Username</span>
                <button
                  type="button"
                  onClick={() => { setUsername('demo'); setPassword('alfredpassword'); }}
                  className="font-mono text-primary hover:underline cursor-pointer"
                >demo</button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Password</span>
                <span className="font-mono text-slate-300">alfredpassword</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setUsername('demo'); setPassword('alfredpassword'); }}
              className="mt-2 w-full text-center text-[10px] text-primary/70 hover:text-primary transition-colors"
            >
              Click to auto-fill →
            </button>
          </div>

          {/* Footer Info */}
          <div className="text-center text-[10px] text-muted-foreground border-t border-white/5 pt-4">
            Secured via SOC2 Compliance Matrix. Multi-tenant instance.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
