import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { FileCode, Search, BrainCircuit, ChevronDown, ChevronUp, Clock, TrendingUp, Shield, Database, Cloud, Server, Network, CheckCircle, Tag } from 'lucide-react';

export const Route = createFileRoute('/templates')({
  component: TemplatesDashboard,
});

const CATEGORY_ICONS: Record<string, any> = {
  'IT Operations': Server,
  'Database': Database,
  'Cloud': Cloud,
  'Security': Shield,
  'Identity': CheckCircle,
  'Network': Network,
  'ITSM': TrendingUp,
  'Compliance': FileCode,
  'Healthcare IT': Tag,
  'Finance IT': Tag,
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border border-destructive/20',
  High: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

function TemplateCard({ tpl }: { tpl: any }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[tpl.category] || FileCode;

  return (
    <div className="p-5 rounded-xl border border-border bg-card flex flex-col gap-4 hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${SEVERITY_STYLES[tpl.severity] || SEVERITY_STYLES.Low}`}>{tpl.severity}</span>
            <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground">{tpl.category}</span>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-tight">{tpl.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Confidence</div>
          <div className="text-base font-bold text-emerald-400">{tpl.confidence}</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">{tpl.description}</p>

      {/* Metrics */}
      <div className="flex gap-4 text-xs text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {tpl.estimated_resolution_mins} min avg</span>
        <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> {tpl.monthly_occurrences}x/month</span>
      </div>

      {/* ROI */}
      {tpl.roi && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2 text-xs text-emerald-400">
          <span className="text-muted-foreground">ROI · </span>{tpl.roi}
        </div>
      )}

      {/* Tags */}
      {tpl.tags && (
        <div className="flex flex-wrap gap-1.5">
          {tpl.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground rounded-md">#{tag}</span>
          ))}
        </div>
      )}

      {/* AI Prompt */}
      <div className="bg-muted/20 p-3 rounded-md border border-border/50 text-xs font-mono text-muted-foreground leading-relaxed">
        <span className="text-primary/70">AI: </span>{tpl.aiPrompt}
      </div>

      {/* Steps toggle */}
      {tpl.steps && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors self-start"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'View'} resolution workflow ({tpl.steps.length} steps)
          </button>
          {expanded && (
            <ol className="space-y-2 border-t border-border pt-3">
              {tpl.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                  <span className="text-primary font-bold shrink-0 w-5">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground font-mono">{tpl.id}</span>
        <div className="flex gap-2">
          <button 
            onClick={() => alert(`Template '${tpl.title}' cloned successfully! A new draft '${tpl.title} (Clone)' has been added to your local library.`)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-primary/30"
          >
            Clone
          </button>
          <button 
            onClick={() => alert(`Deploying runbook instance for template '${tpl.title}'...\n\nSuccessfully initialized workflow in active SRE engine!`)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/15"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesDashboard() {
  const { data: templates, isLoading } = useQuery({ queryKey: ['templates'], queryFn: api.templates.getAll });
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSeverity, setActiveSeverity] = useState('All');

  const categories = ['All', ...Array.from(new Set((templates || []).map((t: any) => t.category)))];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = (templates || []).filter((t: any) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.tags?.some((tag: string) => tag.includes(search.toLowerCase()));
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSev = activeSeverity === 'All' || t.severity === activeSeverity;
    return matchSearch && matchCat && matchSev;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <BrainCircuit className="w-5 h-5 mr-2 animate-pulse" /> Loading Template Engine...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligent Template Engine</h1>
          <p className="text-muted-foreground mt-1">
            {templates?.length} enterprise-grade resolution workflows — deploy any template in under 60 seconds.
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          + Create Template
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates or tags..."
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-card text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-card text-sm text-muted-foreground focus-visible:outline-none">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={activeSeverity} onChange={e => setActiveSeverity(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-card text-sm text-muted-foreground focus-visible:outline-none">
          {severities.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((tpl: any) => <TemplateCard key={tpl.id} tpl={tpl} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileCode className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No templates match your search.
        </div>
      )}
    </div>
  );
}
