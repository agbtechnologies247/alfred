import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, Search, ArrowRight, X, BrainCircuit, Plus, Edit, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/incidents')({
  component: IncidentsDashboard,
});

function IncidentsDashboard() {
  const qc = useQueryClient();
  const { data: incidents, isLoading: incidentsLoading } = useQuery({ queryKey: ['incidents'], queryFn: api.incidents.getAll });
  const { data: metrics, isLoading: metricsLoading } = useQuery({ queryKey: ['incidentMetrics'], queryFn: api.incidents.getMetrics });
  
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState('P2');
  const [formStatus, setFormStatus] = useState('Active');
  const [formSource, setFormSource] = useState('SRE Manual');
  const [formLayer, setFormLayer] = useState('Layer 7');
  const [formTags, setFormTags] = useState('');

  const createMutation = useMutation({
    mutationFn: ({ title, priority, source, tags, layer }: { title: string; priority: string; source: string; tags: string[]; layer: string }) =>
      api.incidents.create(title, priority, source, tags, layer),
    onSuccess: (newInc) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incidentMetrics'] });
      setSelectedIncident(newInc);
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) => api.incidents.update(id, fields),
    onSuccess: (updatedInc) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incidentMetrics'] });
      setSelectedIncident(updatedInc);
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.incidents.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incidentMetrics'] });
      setSelectedIncident(null);
      setIsEditing(false);
    }
  });

  const startCreate = () => {
    setFormTitle('');
    setFormPriority('P2');
    setFormStatus('Active');
    setFormSource('SRE Manual');
    setFormLayer('Layer 7');
    setFormTags('SRE, Manual');
    setIsEditing(false);
    setIsCreating(true);
  };

  const startEdit = () => {
    if (!selectedIncident) return;
    setFormTitle(selectedIncident.title || '');
    setFormPriority(selectedIncident.priority || 'P2');
    setFormStatus(selectedIncident.status || 'Active');
    setFormSource(selectedIncident.source || 'SRE Manual');
    setFormLayer(selectedIncident.layer || 'Layer 7');
    setFormTags(selectedIncident.tags ? selectedIncident.tags.join(', ') : '');
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      alert('Incident title is required.');
      return;
    }

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    if (isCreating) {
      createMutation.mutate({
        title: formTitle,
        priority: formPriority,
        source: formSource,
        tags: tagsArray,
        layer: formLayer
      });
    } else if (selectedIncident) {
      updateMutation.mutate({
        id: selectedIncident.id,
        fields: {
          title: formTitle,
          priority: formPriority,
          status: formStatus,
          source: formSource,
          layer: formLayer,
          tags: tagsArray
        }
      });
    }
  };

  const handleDelete = () => {
    if (!selectedIncident) return;
    if (confirm(`Are you sure you want to delete incident ${selectedIncident.id}?`)) {
      deleteMutation.mutate(selectedIncident.id);
    }
  };

  const handleSelectIncident = (inc: any) => {
    setSelectedIncident(inc);
    setIsEditing(false);
    setIsCreating(false);
  };

  const filteredIncidents = (incidents || []).filter((inc: any) => 
    inc.title.toLowerCase().includes(search.toLowerCase()) ||
    inc.id.toLowerCase().includes(search.toLowerCase()) ||
    inc.status.toLowerCase().includes(search.toLowerCase())
  );

  if (incidentsLoading || metricsLoading) return <div className="p-4">Loading incidents...</div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground mt-1">Real-time autonomic operations monitoring and alert triage.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={startCreate}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Incident
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-center">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <div className="text-2xl font-bold text-foreground">{metrics?.p1_critical}</div>
          <div className="text-sm font-medium text-muted-foreground">P1 Critical</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-center">
          <Clock className="w-8 h-8 text-warning mb-2" />
          <div className="text-2xl font-bold text-foreground">{metrics?.active_incidents}</div>
          <div className="text-sm font-medium text-muted-foreground">Active Incidents</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-center">
          <CheckCircle2 className="w-8 h-8 text-success mb-2" />
          <div className="text-2xl font-bold text-foreground">{metrics?.resolved_30d}</div>
          <div className="text-sm font-medium text-muted-foreground">Resolved (30d)</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center items-center">
          <div className="text-2xl font-bold text-success mb-2">{metrics?.mttr_mins}m</div>
          <div className="text-sm font-medium text-muted-foreground">MTTR (Mean Time to Resolve)</div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-[500px]">
        {/* Table List Column */}
        <div className={`rounded-xl border border-border bg-card flex flex-col overflow-hidden transition-all duration-300 ${(selectedIncident || isCreating) ? 'w-3/5' : 'w-full'}`}>
          <div className="p-4 border-b border-border flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search incidents..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4">Layer</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident: any) => (
                  <tr 
                    key={incident.id} 
                    onClick={() => handleSelectIncident(incident)}
                    className={`border-b border-border hover:bg-muted/10 group cursor-pointer transition-colors ${selectedIncident?.id === incident.id ? 'bg-muted/35' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono text-primary font-bold">{incident.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        incident.priority === 'P1' ? 'bg-destructive/10 text-destructive' :
                        incident.priority === 'P2' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{incident.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{incident.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {incident.tags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-semibold rounded-full border border-border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{incident.layer}</td>
                    <td className="px-6 py-4 text-muted-foreground">{incident.time}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSelectIncident(incident); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ArrowRight className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredIncidents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">No incidents found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Incident Detail Pane / Editor */}
        {(selectedIncident || isCreating) && (
          <div className="w-2/5 rounded-xl border border-border bg-card flex flex-col p-6 relative overflow-y-auto max-h-[600px]">
            <button 
              onClick={() => { setSelectedIncident(null); setIsCreating(false); setIsEditing(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {isEditing || isCreating ? (
              <div className="space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold">{isCreating ? 'Create Incident' : `Edit Incident: ${selectedIncident?.id}`}</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Title</label>
                  <input 
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="E.g., Transaction timeout on checkout-db"
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Priority</label>
                    <select 
                      value={formPriority}
                      onChange={e => setFormPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="P1">P1 - Critical</option>
                      <option value="P2">P2 - High</option>
                      <option value="P3">P3 - Medium</option>
                      <option value="P4">P4 - Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
                    <select 
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Active">Active</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Source</label>
                    <input 
                      type="text"
                      value={formSource}
                      onChange={e => setFormSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Layer</label>
                    <input 
                      type="text"
                      value={formLayer}
                      onChange={e => setFormLayer(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                  <input 
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder="E.g., Database, Checkout, Postgres"
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => { setIsEditing(false); setIsCreating(false); }}
                    className="flex-1 px-3 py-2 border border-border bg-background hover:bg-muted rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-xs text-primary font-semibold">{selectedIncident.id}</span>
                  <h2 className="text-xl font-bold mt-1 text-foreground leading-tight">{selectedIncident.title}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      selectedIncident.priority === 'P1' ? 'bg-destructive/10 text-destructive' :
                      selectedIncident.priority === 'P2' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {selectedIncident.priority}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">{selectedIncident.status}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Engine / Layer</h4>
                    <p className="text-sm mt-1 text-foreground">{selectedIncident.source} · {selectedIncident.layer}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger Time</h4>
                    <p className="text-sm mt-1 text-foreground">{selectedIncident.time}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Root Cause Analysis</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: selectedIncident.aiConfidence }}></div>
                      </div>
                      <span className="text-xs font-bold text-foreground">{selectedIncident.aiConfidence} Confidence</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Associated Tags</h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedIncident.tags?.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md border border-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mt-6">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2">
                      <BrainCircuit className="w-4 h-4" /> AI Suggested SOP
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AI recommendation suggests querying transaction locks and executing safe failover scripts to reduce impact radius.
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => alert(`Initiating automated remediation for ${selectedIncident.id}...`)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-lg transition-colors"
                      >
                        Execute Runbook
                      </button>
                      <button 
                        onClick={() => alert(`Ticket ${selectedIncident.id} escalated to SRE on-call support.`)}
                        className="px-3 py-1.5 border border-border bg-background hover:bg-muted text-xs font-medium rounded-lg transition-colors"
                      >
                        Escalate SOP
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <button 
                      onClick={startEdit}
                      className="flex-1 px-3 py-2 border border-border bg-background hover:bg-muted rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="flex-1 px-3 py-2 border border-destructive/20 text-destructive hover:bg-destructive/5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
