import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle, FileText, Search, Sparkles, Plus, Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/knowledge')({
  component: KnowledgeDashboard,
});

function KnowledgeDashboard() {
  const qc = useQueryClient();
  const { data: sopsData, isLoading } = useQuery({ queryKey: ['sops'], queryFn: api.sops.getAll });
  const [localSops, setLocalSops] = useState<any[]>([]);
  const [selectedSop, setSelectedSop] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editSymptoms, setEditSymptoms] = useState('');
  const [editRootCause, setEditRootCause] = useState('');
  const [editDetection, setEditDetection] = useState('');
  const [editFix, setEditFix] = useState('');
  const [editConfidence, setEditConfidence] = useState('95%');

  useEffect(() => {
    if (sopsData) {
      setLocalSops(sopsData);
      // Select the first item by default if nothing is selected or if selectedSop is not in the list
      if (sopsData.length > 0 && (!selectedSop || !sopsData.some(s => s.id === selectedSop.id))) {
        setSelectedSop(sopsData[0]);
      }
    }
  }, [sopsData]);

  const approveMutation = useMutation({
    mutationFn: api.sops.approve,
    onSuccess: () => {
      alert('SOP Approved successfully for Automation!');
      qc.invalidateQueries({ queryKey: ['sops'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: api.sops.create,
    onSuccess: (newSop) => {
      qc.invalidateQueries({ queryKey: ['sops'] });
      setSelectedSop(newSop);
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, sop }: { id: string; sop: any }) => api.sops.update(id, sop),
    onSuccess: (updatedSop) => {
      qc.invalidateQueries({ queryKey: ['sops'] });
      setSelectedSop(updatedSop);
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.sops.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sops'] });
      setSelectedSop(null);
      setIsEditing(false);
    }
  });

  const handleSelectSop = (sop: any) => {
    setSelectedSop(sop);
    setIsEditing(false);
    setIsCreating(false);
  };

  const startEdit = () => {
    if (!selectedSop) return;
    setEditTitle(selectedSop.title || '');
    setEditSymptoms(selectedSop.symptoms ? selectedSop.symptoms.join(', ') : '');
    setEditRootCause(selectedSop.root_cause || '');
    setEditDetection(selectedSop.detection || '');
    setEditFix(selectedSop.fix || '');
    setEditConfidence(selectedSop.confidence || '95%');
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditTitle('');
    setEditSymptoms('');
    setEditRootCause('');
    setEditDetection('');
    setEditFix('');
    setEditConfidence('95%');
    setIsEditing(false);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      alert('SOP Title is required.');
      return;
    }

    const payload = {
      title: editTitle,
      symptoms: editSymptoms.split(',').map(s => s.trim()).filter(Boolean),
      root_cause: editRootCause,
      detection: editDetection,
      fix: editFix,
      confidence: editConfidence,
    };

    if (isCreating) {
      createMutation.mutate(payload);
    } else if (selectedSop) {
      updateMutation.mutate({ id: selectedSop.id, sop: payload });
    }
  };

  const handleDelete = () => {
    if (!selectedSop) return;
    if (confirm(`Are you sure you want to delete SOP: ${selectedSop.title}?`)) {
      deleteMutation.mutate(selectedSop.id);
    }
  };

  const filteredSops = localSops.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.root_cause?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading SOPs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base & SOPs</h1>
          <p className="text-muted-foreground mt-1">AI continuously converts operational experience into reusable assets.</p>
        </div>
        <button 
          onClick={startCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Article
        </button>
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Left pane - SOP List */}
        <div className="w-1/3 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search SOPs..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {filteredSops.map((sop: any) => (
              <div 
                key={sop.id} 
                onClick={() => handleSelectSop(sop)}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${selectedSop?.id === sop.id ? 'bg-muted/50 border-l-4 border-l-primary' : 'hover:bg-muted/20 border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-semibold text-primary">{sop.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${sop.status === 'Approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {sop.status}
                  </span>
                </div>
                <h3 className="font-medium text-sm text-foreground mb-2 leading-tight">{sop.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {sop.type === 'Generated' && (
                    <span className="flex items-center gap-1 text-primary">
                      <Sparkles className="w-3 h-3" /> AI Generated
                    </span>
                  )}
                  <span>Confidence: {sop.confidence}</span>
                </div>
              </div>
            ))}
            {filteredSops.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No matching articles found</div>
            )}
          </div>
        </div>

        {/* Right pane - SOP Viewer / Editor */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-y-auto">
          {isEditing || isCreating ? (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-xl font-bold">{isCreating ? 'Create SOP Article' : `Edit SOP: ${selectedSop?.id}`}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setIsCreating(false); }}
                    className="px-3 py-1.5 border border-border bg-background hover:bg-muted rounded text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Title</label>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)} 
                    placeholder="E.g., Automated Postgres Database Index Optimization"
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Symptoms (comma separated)</label>
                  <input 
                    type="text" 
                    value={editSymptoms} 
                    onChange={e => setEditSymptoms(e.target.value)} 
                    placeholder="E.g., high memory usage, slow query logs, transaction pool exhaustion"
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Root Cause</label>
                  <textarea 
                    value={editRootCause} 
                    onChange={e => setEditRootCause(e.target.value)} 
                    placeholder="Explain what causes the system failure or degradation..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Detection Command</label>
                  <textarea 
                    value={editDetection} 
                    onChange={e => setEditDetection(e.target.value)} 
                    placeholder="E.g., SELECT pid, query, state FROM pg_stat_activity..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Fix / Remediation</label>
                  <textarea 
                    value={editFix} 
                    onChange={e => setEditFix(e.target.value)} 
                    placeholder="Provide remediation steps or executable script..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">AI Confidence</label>
                  <input 
                    type="text" 
                    value={editConfidence} 
                    onChange={e => setEditConfidence(e.target.value)} 
                    placeholder="E.g., 95%"
                    className="w-full max-w-[100px] px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          ) : selectedSop ? (
            <>
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">KB • {selectedSop.id}</div>
                    <h2 className="text-xl font-bold">{selectedSop.title}</h2>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={startEdit}
                    className="px-3 py-1.5 border border-border bg-background hover:bg-muted rounded text-sm font-medium flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="px-3 py-1.5 border border-destructive/20 bg-background text-destructive hover:bg-destructive/5 rounded text-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  {selectedSop.status !== 'Approved' && (
                    <button 
                      onClick={() => approveMutation.mutate(selectedSop.id)}
                      className="px-3 py-1.5 bg-success text-primary-foreground rounded text-sm font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve for Automation
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-8 max-w-3xl">
                <div className="prose prose-sm dark:prose-invert">
                  {selectedSop.symptoms && selectedSop.symptoms.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-0">Symptoms</h3>
                      <ul className="list-disc pl-5 space-y-1 mb-6 text-sm">
                        {selectedSop.symptoms.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </>
                  )}
                  {selectedSop.root_cause && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-6">Root Cause</h3>
                      <p className="text-sm mb-6 text-foreground">{selectedSop.root_cause}</p>
                    </>
                  )}
                  {selectedSop.detection && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-6">Detection Command</h3>
                      <pre className="p-4 bg-muted border border-border rounded-lg overflow-x-auto mb-6"><code className="font-mono text-xs text-foreground">{selectedSop.detection}</code></pre>
                    </>
                  )}
                  {selectedSop.fix && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-6">Fix / Remediation</h3>
                      <pre className="p-4 bg-muted border border-border rounded-lg overflow-x-auto mb-6"><code className="font-mono text-xs text-foreground">{selectedSop.fix}</code></pre>
                    </>
                  )}
                  {selectedSop.confidence && selectedSop.confidence !== '-' && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-6">AI Confidence</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: selectedSop.confidence.includes('%') ? selectedSop.confidence : `${selectedSop.confidence}%` }}></div>
                        </div>
                        <span className="font-bold text-sm text-foreground">{selectedSop.confidence}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">Select an SOP to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
