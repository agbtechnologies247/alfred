import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import {
  Package, Bot, Zap, Plug, Star, Download, CheckCircle,
  Search, ArrowDownToLine, Trash2, AlertCircle, X, Shield, Lock
} from 'lucide-react';

export const Route = createFileRoute('/marketplace')({
  component: MarketplaceDashboard,
});

const KIND_ICONS: Record<string, any> = {
  ai_agent: Bot, automation_pack: Zap, connector: Plug,
  widget: Package, knowledge_pack: Package,
};
const KIND_LABELS: Record<string, string> = {
  ai_agent: 'AI Agent', automation_pack: 'Automation', connector: 'Connector',
  widget: 'Widget', knowledge_pack: 'Knowledge',
};
const KIND_COLORS: Record<string, string> = {
  ai_agent: '#7c3aed', automation_pack: '#f59e0b', connector: '#0ea5e9',
  widget: '#10b981', knowledge_pack: '#ec4899',
};
const PRICING_BADGE: Record<string, string> = {
  included: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  professional: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function PackageCard({ pkg, onDetails }: { pkg: any; onDetails: (p: any) => void }) {
  const qc = useQueryClient();
  const isInstalled = pkg.install_state?.toLowerCase() === 'installed';

  const installMutation = useMutation({
    mutationFn: () => api.marketplace.install(pkg.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace-all'] }),
  });
  const uninstallMutation = useMutation({
    mutationFn: () => api.marketplace.uninstall(pkg.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace-all'] }),
  });

  const Icon = KIND_ICONS[pkg.kind] || Package;
  const kindColor = KIND_COLORS[pkg.kind] || '#64748b';

  return (
    <div className="p-5 rounded-xl border border-border bg-card flex flex-col gap-4 hover:border-primary/30 transition-all hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${kindColor}18`, border: `1px solid ${kindColor}40` }}>
          <Icon className="w-5 h-5" style={{ color: kindColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <span className="text-[11px] px-2 py-0.5 rounded-full border font-semibold" style={{ background: `${kindColor}15`, color: kindColor, borderColor: `${kindColor}40` }}>
              {KIND_LABELS[pkg.kind] || pkg.kind}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${PRICING_BADGE[pkg.pricing] || ''}`}>
              {pkg.pricing}
            </span>
          </div>
          <h3 className="font-bold text-sm">{pkg.name}</h3>
          <p className="text-xs text-muted-foreground">{pkg.publisher}</p>
        </div>
        {isInstalled && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{pkg.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {pkg.rating}</span>
        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {(pkg.downloads || 0).toLocaleString()}</span>
        <span className="ml-auto text-[11px]">v{pkg.version}</span>
      </div>

      {/* Required connectors */}
      {pkg.required_connectors?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {pkg.required_connectors.map((c: string) => (
            <span key={c} className="text-[10px] px-2 py-0.5 bg-muted/50 border border-border rounded-full">{c}</span>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="flex gap-2 mt-auto">
        {isInstalled ? (
          <button
            onClick={() => uninstallMutation.mutate()}
            disabled={uninstallMutation.isPending}
            className="flex-1 px-3 py-2 border border-border hover:border-destructive/40 hover:bg-destructive/5 text-destructive/70 hover:text-destructive rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {uninstallMutation.isPending ? 'Removing…' : 'Uninstall'}
          </button>
        ) : (
          <button
            onClick={() => installMutation.mutate()}
            disabled={installMutation.isPending}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            {installMutation.isPending ? 'Installing…' : 'Install'}
          </button>
        )}
        <button 
          onClick={() => onDetails(pkg)}
          className="px-3 py-2 border border-border hover:border-primary/30 rounded-lg text-xs transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
}

function MarketplaceDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'all' | 'agents' | 'automations' | 'connectors'>('all');
  const [search, setSearch] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  const { data: allPkgs, isLoading } = useQuery({
    queryKey: ['marketplace-all'], queryFn: api.marketplace.getAll,
  });

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'agents', label: 'AI Agents' },
    { id: 'automations', label: 'Automations' },
    { id: 'connectors', label: 'Connectors' },
  ] as const;

  const kindFilter: Record<string, string> = {
    agents: 'ai_agent', automations: 'automation_pack', connectors: 'connector',
  };

  const filtered = (allPkgs || []).filter((p: any) => {
    const matchTab = tab === 'all' || p.kind === kindFilter[tab];
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const installed = (allPkgs || []).filter((p: any) => p.install_state?.toLowerCase() === 'installed').length;

  // Sync state if selected package is reloaded
  const activeSelected = selectedPkg ? (allPkgs || []).find(p => p.id === selectedPkg.id) : null;

  const installSelectedMutation = useMutation({
    mutationFn: (id: string) => api.marketplace.install(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace-all'] }),
  });

  const uninstallSelectedMutation = useMutation({
    mutationFn: (id: string) => api.marketplace.uninstall(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace-all'] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Package className="w-4 h-4 mr-2 animate-pulse" /> Loading Marketplace…
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            {allPkgs?.length ?? 0} packages available · {installed} installed
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'AI Agents', count: (allPkgs || []).filter((p: any) => p.kind === 'ai_agent').length, icon: Bot, color: '#7c3aed' },
          { label: 'Automations', count: (allPkgs || []).filter((p: any) => p.kind === 'automation_pack').length, icon: Zap, color: '#f59e0b' },
          { label: 'Connectors', count: (allPkgs || []).filter((p: any) => p.kind === 'connector').length, icon: Plug, color: '#0ea5e9' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search packages..."
            className="pl-9 pr-4 py-2 rounded-md border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 border border-border rounded-lg p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} results</span>
      </div>

      {/* Alert if no packages installed */}
      {installed === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex gap-3 items-start text-sm">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-200/80">No packages installed. Click <strong>Install</strong> on any package to activate it.</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((pkg: any) => (
          <PackageCard key={pkg.id} pkg={pkg} onDetails={setSelectedPkg} />
        ))}
      </div>

      {/* Detailed View Modal */}
      {activeSelected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 relative flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setSelectedPkg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title Block */}
            <div className="flex gap-4 items-start border-b border-border pb-4">
              <div 
                className="p-3 rounded-xl border shrink-0"
                style={{
                  background: `${KIND_COLORS[activeSelected.kind]}15`,
                  borderColor: `${KIND_COLORS[activeSelected.kind]}30`
                }}
              >
                {(() => {
                  const KindIcon = KIND_ICONS[activeSelected.kind] || Package;
                  return <KindIcon className="w-8 h-8" style={{ color: KIND_COLORS[activeSelected.kind] }} />;
                })()}
              </div>
              <div>
                <span className="text-xs font-mono text-primary font-semibold">{activeSelected.id}</span>
                <h2 className="text-xl font-bold text-foreground leading-tight">{activeSelected.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Published by {activeSelected.publisher} · v{activeSelected.version}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Description</h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{activeSelected.description}</p>
              </div>

              {/* Security permissions & specifications */}
              <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Scope Permissions
                  </h4>
                  <div className="flex flex-col gap-1">
                    {activeSelected.required_permissions?.map((perm: string) => (
                      <span key={perm} className="text-xs text-foreground font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3 text-muted-foreground" /> {perm}
                      </span>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Package Details</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pricing:</span>
                      <span className="font-semibold capitalize text-foreground">{activeSelected.pricing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Downloads:</span>
                      <span className="font-semibold text-foreground">{(activeSelected.downloads || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating:</span>
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {activeSelected.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {activeSelected.required_connectors?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Required Connectors</h4>
                  <div className="flex gap-2 flex-wrap">
                    {activeSelected.required_connectors.map((c: string) => (
                      <span key={c} className="text-xs px-2.5 py-1 bg-muted/60 border border-border rounded-full text-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-2">
              {activeSelected.install_state?.toLowerCase() === 'installed' ? (
                <button
                  onClick={() => uninstallSelectedMutation.mutate(activeSelected.id)}
                  disabled={uninstallSelectedMutation.isPending}
                  className="flex-1 px-4 py-2.5 border border-border hover:border-destructive/40 hover:bg-destructive/5 text-destructive font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {uninstallSelectedMutation.isPending ? 'Removing…' : 'Uninstall Package'}
                </button>
              ) : (
                <button
                  onClick={() => installSelectedMutation.mutate(activeSelected.id)}
                  disabled={installSelectedMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {installSelectedMutation.isPending ? 'Installing…' : 'Install Package'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
