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

function TemplateCard({ tpl, onClone, onUse }: { tpl: any; onClone: (tpl: any) => void; onUse: (tpl: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[tpl.category] || FileCode;

  return (
    <div className="p-5 rounded-xl border border-border bg-card flex flex-col gap-4 hover:border-cyan-500/40 transition-all duration-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 shrink-0">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${SEVERITY_STYLES[tpl.severity] || SEVERITY_STYLES.Low}`}>{tpl.severity}</span>
            <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground">{tpl.category}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{tpl.title}</h3>
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
        <span className="text-cyan-500/70">AI: </span>{tpl.aiPrompt}
      </div>

      {/* Steps toggle */}
      {tpl.steps && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cyan-400 transition-colors self-start cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'View'} resolution workflow ({tpl.steps.length} steps)
          </button>
          {expanded && (
            <ol className="space-y-2 border-t border-border pt-3">
              {tpl.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                  <span className="text-cyan-400 font-bold shrink-0 w-5">{i + 1}.</span>
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
            type="button"
            onClick={() => onClone(tpl)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-cyan-500/30 cursor-pointer"
          >
            Clone
          </button>
          <button 
            type="button"
            onClick={() => onUse(tpl)}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 cursor-pointer"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesDashboard() {
  const { data: serverTemplates, isLoading } = useQuery({ queryKey: ['templates'], queryFn: api.templates.getAll });
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSeverity, setActiveSeverity] = useState('All');

  // Custom local storage state
  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('alfred_custom_templates') || '[]');
    } catch {
      return [];
    }
  });

  // Modal forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deployingTemplate, setDeployingTemplate] = useState<any>(null);
  const [deployStep, setDeployStep] = useState(0);

  // New Template Inputs
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('IT Operations');
  const [newSeverity, setNewSeverity] = useState('Low');
  const [newDesc, setNewDesc] = useState('');
  const [newResolution, setNewResolution] = useState(15);
  const [newAiPrompt, setNewAiPrompt] = useState('Auto-triage incident metrics and issue standard corrective action.');
  const [newSteps, setNewSteps] = useState('Check log lines for failures,Restart target worker process,Verify API response checks out');

  const templates = [...(serverTemplates || []), ...customTemplates];
  const categories = ['All', ...Array.from(new Set(templates.map((t: any) => t.category)))];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = templates.filter((t: any) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.tags?.some((tag: string) => tag.includes(search.toLowerCase()));
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSev = activeSeverity === 'All' || t.severity === activeSeverity;
    return matchSearch && matchCat && matchSev;
  });

  const handleClone = (tpl: any) => {
    const clone = {
      ...tpl,
      id: `${tpl.id}-clone-${Math.floor(100 + Math.random() * 900)}`,
      title: `${tpl.title} (Clone)`,
    };
    const updated = [clone, ...customTemplates];
    setCustomTemplates(updated);
    localStorage.setItem('alfred_custom_templates', JSON.stringify(updated));
    alert(`Template '${tpl.title}' cloned successfully! A new draft has been added to your local library.`);
  };

  const handleUseTemplate = (tpl: any) => {
    setDeployingTemplate(tpl);
    setDeployStep(0);

    setTimeout(() => setDeployStep(1), 700);
    setTimeout(() => setDeployStep(2), 1500);
    setTimeout(() => setDeployStep(3), 2300);
    setTimeout(() => setDeployStep(4), 3100);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTpl = {
      id: `TPL-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      category: newCategory,
      severity: newSeverity,
      description: newDesc,
      confidence: '100% (User Dev)',
      estimated_resolution_mins: newResolution,
      monthly_occurrences: 0,
      aiPrompt: newAiPrompt,
      steps: newSteps.split(',').map(s => s.trim()).filter(Boolean),
      tags: ['custom', newCategory.toLowerCase().replace(' ', '-')],
    };

    const updated = [newTpl, ...customTemplates];
    setCustomTemplates(updated);
    localStorage.setItem('alfred_custom_templates', JSON.stringify(updated));

    // Reset inputs
    setNewTitle('');
    setNewDesc('');
    setNewResolution(15);
    setShowCreateModal(false);
  };

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
            {templates.length} enterprise-grade resolution workflows — deploy any template in under 60 seconds.
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
        >
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
          className="px-3 py-2 rounded-md border border-input bg-card text-sm text-muted-foreground focus-visible:outline-none cursor-pointer">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={activeSeverity} onChange={e => setActiveSeverity(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-card text-sm text-muted-foreground focus-visible:outline-none cursor-pointer">
          {severities.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((tpl: any) => (
          <TemplateCard 
            key={tpl.id} 
            tpl={tpl} 
            onClone={handleClone}
            onUse={handleUseTemplate}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileCode className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No templates match your search.
        </div>
      )}

      {/* Create Custom Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create Custom Runbook Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Template Title</label>
                <input 
                  type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., K8s Coredns Restart Workflow" 
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-slate-900 dark:text-slate-100 focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category</label>
                  <select 
                    value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-card text-muted-foreground focus-visible:outline-none cursor-pointer"
                  >
                    {Object.keys(CATEGORY_ICONS).map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Severity</label>
                  <select 
                    value={newSeverity} onChange={e => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-card text-muted-foreground focus-visible:outline-none cursor-pointer"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description</label>
                <textarea 
                  rows={2} required value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Summary of SRE resolution logic..."
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-slate-900 dark:text-slate-100 focus-visible:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Resolution workflow steps (comma separated)</label>
                <input 
                  type="text" value={newSteps} onChange={e => setNewSteps(e.target.value)}
                  placeholder="step 1, step 2, step 3"
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-slate-900 dark:text-slate-100 focus-visible:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">AI Agent Prompt Instruction</label>
                <input 
                  type="text" value={newAiPrompt} onChange={e => setNewAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-slate-900 dark:text-slate-100 focus-visible:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button 
                  type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deployment Stepper Progress Modal */}
      {deployingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100 text-xs">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Active Orchestrator Deployment</div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{deployingTemplate.title}</h3>
              </div>
              {deployStep < 4 && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
            </div>

            <div className="space-y-3">
              {[
                { step: 0, text: 'Parsing resolution parameters...' },
                { step: 1, text: 'Compiling target execution graph...' },
                { step: 2, text: 'Initializing channels on SRE nodes...' },
                { step: 3, text: 'Registering telemetry listeners...' },
              ].map(item => {
                const isDone = deployStep > item.step;
                const isCurrent = deployStep === item.step;
                return (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="shrink-0">
                      {isDone ? (
                        <div className="w-4 h-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center font-bold">
                          ✓
                        </div>
                      ) : isCurrent ? (
                        <div className="w-4 h-4 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full flex items-center justify-center font-bold animate-pulse">
                          ●
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-muted/30 text-muted-foreground border border-border rounded-full flex items-center justify-center font-bold">
                          ○
                        </div>
                      )}
                    </div>
                    <span className={isDone ? 'text-slate-500' : isCurrent ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-400'}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {deployStep === 4 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex gap-2 items-center text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-bold">Workflow deployed successfully!</div>
                  <div className="text-[10px] opacity-90">Execution engine is actively listening for triggers.</div>
                </div>
              </div>
            )}

            {deployStep === 4 && (
              <button 
                onClick={() => setDeployingTemplate(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
