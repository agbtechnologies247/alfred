import { Link } from '@tanstack/react-router';
import {
  LayoutDashboard, Activity, AlertTriangle, BrainCircuit, BookOpen,
  Zap, Bot, BarChart3, FileText, Settings, Package, Shield,
  GitBranch, Network, Code, HelpCircle, Users, ShieldAlert,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', to: '/', icon: LayoutDashboard },
      { name: 'Monitoring', to: '/monitoring', icon: Activity },
      { name: 'Incidents', to: '/incidents', icon: AlertTriangle },
      { name: 'People', to: '/people', icon: Users },
      { name: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Decision Engine', to: '/decisions', icon: BrainCircuit },
      { name: 'AI Agents', to: '/agents', icon: Bot },
      { name: 'Automation', to: '/automation', icon: Zap },
      { name: 'Templates', to: '/templates', icon: GitBranch },
      { name: 'Validation Scenario', to: '/validation', icon: ShieldAlert },
    ],
  },
  {
    label: 'Platform',
    items: [
      { name: 'Marketplace', to: '/marketplace', icon: Package },
      { name: 'Analytics', to: '/analytics', icon: BarChart3 },
      { name: 'Reports', to: '/reports', icon: FileText },
      { name: 'Governance', to: '/governance', icon: Shield },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Developer Portal', to: '/developer', icon: Code },
      { name: 'OpEx Guide', to: '/opex-guide.html', icon: HelpCircle, external: true },
      { name: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-border bg-background flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-2.5 shrink-0">
        <img
          src="/alfred-logo.png"
          alt="A.L.F.R.E.D. Logo"
          className="w-8 h-8 object-contain rounded-md"
        />
        <div>
          <span className="font-bold text-sm tracking-widest text-primary">A.L.F.R.E.D.</span>
          <div className="text-[10px] text-muted-foreground leading-none">Decision Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-5 py-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.to}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-medium"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">AD</div>
          <div>
            <div className="text-xs font-medium">Admin</div>
            <div className="text-[10px] text-muted-foreground">super_admin</div>
          </div>
          <Network className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
        </div>
      </div>
    </aside>
  );
}
