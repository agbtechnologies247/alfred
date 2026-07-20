import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Play, Plus, Server, Webhook, ArrowDown, Activity, Settings2, Trash2, Edit, X, Save, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/automation')({
  component: AutomationDashboard,
});

type WorkflowNode = {
  id: string;
  type: 'TRIGGER' | 'CONDITION' | 'ACTION' | 'AI' | 'NOTIFICATION' | 'VOICE_CALL';
  label: string;
  detail: string;
  color: string;
  icon: any;
};

const NODE_ICONS = {
  TRIGGER: Activity,
  CONDITION: Settings2,
  AI: Settings2,
  ACTION: Server,
  NOTIFICATION: Webhook,
  VOICE_CALL: PhoneCall
};

function AutomationDashboard() {
  const qc = useQueryClient();
  const { data: workflows, isLoading } = useQuery({ queryKey: ['workflows'], queryFn: api.workflows.getAll });
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formTrigger, setFormTrigger] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formIcon, setFormIcon] = useState('server');

  const executeMutation = useMutation({
    mutationFn: api.workflows.execute,
    onSuccess: () => alert('Workflow execution dispatched to A.L.F.R.E.D. Automation Engine!'),
  });

  const createMutation = useMutation({
    mutationFn: api.workflows.create,
    onSuccess: (newWf) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(newWf);
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, wf }: { id: string; wf: any }) => api.workflows.update(id, wf),
    onSuccess: (updatedWf) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(updatedWf);
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.workflows.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(null);
      setNodes([]);
      setIsEditing(false);
    }
  });

  const handleSelectWorkflow = (wf: any) => {
    setSelectedWorkflow(wf);
    setIsEditing(false);
    setIsCreating(false);

    // Load nodes from saved workflow or construct defaults
    if (wf.nodes && wf.nodes.length > 0) {
      const mappedNodes = wf.nodes.map((n: any) => ({
        ...n,
        icon: NODE_ICONS[n.type as WorkflowNode['type']] || Server
      }));
      setNodes(mappedNodes);
    } else {
      setNodes([
        { id: '1', type: 'TRIGGER', label: wf.trigger || 'Event Received', detail: 'Listens to Event Bus', color: 'bg-background border-border', icon: Activity },
        { id: '2', type: 'CONDITION', label: 'If Priority == P1', detail: 'Filter critical incidents', color: 'bg-warning/25 text-warning border-warning/35', icon: Settings2 },
        { id: '3', type: 'AI', label: 'Run AI Root Cause', detail: 'Decision Engine Analysis', color: 'bg-primary/25 text-primary border-primary/35', icon: Settings2 },
        { id: '4', type: 'ACTION', label: 'Execute Auto Remediation', detail: 'Run pre-approved SSH/API script', color: 'bg-background border-border', icon: Server },
      ]);
    }
  };

  const startCreate = () => {
    setFormTitle('');
    setFormTrigger('');
    setFormStatus('Active');
    setFormIcon('server');
    setIsEditing(false);
    setIsCreating(true);
  };

  const startEdit = () => {
    if (!selectedWorkflow) return;
    setFormTitle(selectedWorkflow.title || '');
    setFormTrigger(selectedWorkflow.trigger || '');
    setFormStatus(selectedWorkflow.status || 'Active');
    setFormIcon(selectedWorkflow.icon || 'server');
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveConfig = () => {
    if (!formTitle.trim()) {
      alert('Workflow title is required.');
      return;
    }

    const payload = {
      title: formTitle,
      trigger: formTrigger,
      status: formStatus,
      icon: formIcon,
      nodes: nodes.map(({ id, type, label, detail, color }) => ({ id, type, label, detail, color }))
    };

    if (isCreating) {
      createMutation.mutate(payload);
    } else if (selectedWorkflow) {
      updateMutation.mutate({ id: selectedWorkflow.id, wf: payload });
    }
  };

  const handleSaveNodesOnly = () => {
    if (!selectedWorkflow) return;
    const payload = {
      ...selectedWorkflow,
      nodes: nodes.map(({ id, type, label, detail, color }) => ({ id, type, label, detail, color }))
    };
    updateMutation.mutate({ id: selectedWorkflow.id, wf: payload });
    alert('Workflow steps saved successfully!');
  };

  const handleDelete = () => {
    if (!selectedWorkflow) return;
    if (confirm(`Are you sure you want to delete workflow: ${selectedWorkflow.title}?`)) {
      deleteMutation.mutate(selectedWorkflow.id);
    }
  };

  const addNode = (type: WorkflowNode['type']) => {
    const newId = Math.random().toString(36).substring(7);
    let newNode: WorkflowNode;
    
    switch (type) {
      case 'CONDITION':
        newNode = { id: newId, type, label: 'New Condition', detail: 'If property equals value', color: 'bg-warning/25 text-warning border-warning/35', icon: Settings2 };
        break;
      case 'AI':
        newNode = { id: newId, type, label: 'AI Action', detail: 'Query LLM/RCA analysis', color: 'bg-primary/25 text-primary border-primary/35', icon: Settings2 };
        break;
      case 'NOTIFICATION':
        newNode = { id: newId, type, label: 'Notify Slack/MS Teams', detail: 'Send payload to webhook', color: 'bg-success/25 text-success border-success/35', icon: Webhook };
        break;
      case 'VOICE_CALL':
        newNode = { id: newId, type, label: 'Trigger Dograh Voice Agent', detail: 'Outbound call via docs.dograh.com API', color: 'bg-primary/25 text-primary border-primary/35', icon: PhoneCall };
        break;
      default:
        newNode = { id: newId, type: 'ACTION', label: 'Execute Script', detail: 'Run custom runtime logic', color: 'bg-background border-border', icon: Server };
    }
    
    setNodes([...nodes, newNode]);
    setShowNodePicker(false);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  if (isLoading) return <div className="p-4">Loading workflows...</div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation & Workflows</h1>
          <p className="text-muted-foreground mt-1">Visually build rules to automatically remediate incidents.</p>
        </div>
        <button 
          onClick={startCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-[600px]">
        {/* Left Pane - Workflow List */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4">Active Workflows</h2>
            <div className="space-y-3">
              {workflows?.map((wf: any) => (
                <div 
                  key={wf.id} 
                  onClick={() => handleSelectWorkflow(wf)}
                  className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${selectedWorkflow?.id === wf.id ? 'bg-muted/50 border-primary' : 'bg-card border-border hover:bg-muted/20'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded border border-border">
                      {wf.icon === 'webhook' ? <Webhook className="w-4 h-4 text-primary" /> : <Server className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{wf.title}</h3>
                      <p className="text-xs text-muted-foreground">Trigger: {wf.trigger || 'Manual'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${wf.status === 'Active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {wf.status || 'Active'}
                    </span>
                    <button 
                      onClick={() => executeMutation.mutate(wf.id)}
                      className="p-1.5 bg-success/10 text-success rounded-md hover:bg-success/20"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {workflows?.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-6">No workflows found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane - Interactive Workflow Builder / Editor */}
        <div className="flex-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden relative min-h-[500px]">
          {isCreating || isEditing ? (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-xl font-bold">{isCreating ? 'Create Workflow' : `Edit Workflow: ${selectedWorkflow?.title}`}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setIsCreating(false); }}
                    className="px-3 py-1.5 border border-border bg-background hover:bg-muted rounded text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Workflow Title</label>
                  <input 
                    type="text" 
                    value={formTitle} 
                    onChange={e => setFormTitle(e.target.value)} 
                    placeholder="E.g., Auto-Restart CoreDNS on CrashLoop"
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Trigger Condition</label>
                  <input 
                    type="text" 
                    value={formTrigger} 
                    onChange={e => setFormTrigger(e.target.value)} 
                    placeholder="E.g., P1 DNS Failure inside Kubernetes"
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
                    <select 
                      value={formStatus} 
                      onChange={e => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Icon Theme</label>
                    <select 
                      value={formIcon} 
                      onChange={e => setFormIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="server">Server Infrastructure</option>
                      <option value="webhook">Webhook Integration</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedWorkflow ? (
            <>
              <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-lg">
                    Workflow Builder: {selectedWorkflow.title}
                  </h2>
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
                  <button 
                    onClick={handleSaveNodesOnly}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium flex items-center gap-1 hover:bg-primary/90"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Steps
                  </button>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center pb-32">
                {nodes.map((node, index) => (
                  <div key={node.id} className="flex flex-col items-center w-full">
                    <div className="w-80 p-4 border border-border rounded-xl shadow-sm relative group bg-card hover:border-primary/50 transition-colors">
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 border text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${node.color} bg-background`}>
                        {node.type}
                      </div>
                      
                      {index !== 0 && (
                        <button 
                          onClick={() => removeNode(node.id)}
                          className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="flex items-center gap-3 mb-2 pt-2">
                        {(() => {
                          const NodeIcon = node.icon;
                          return <NodeIcon className="w-5 h-5 text-primary" />;
                        })()}
                        <input 
                          type="text" 
                          value={node.label}
                          onChange={(e) => {
                            const newNodes = [...nodes];
                            newNodes[index].label = e.target.value;
                            setNodes(newNodes);
                          }}
                          className="font-semibold bg-transparent border-none outline-none focus:border-b focus:border-primary w-full text-foreground text-sm"
                        />
                      </div>
                      
                      <input 
                        type="text" 
                        value={node.detail}
                        onChange={(e) => {
                          const newNodes = [...nodes];
                          newNodes[index].detail = e.target.value;
                          setNodes(newNodes);
                        }}
                        className="text-xs text-muted-foreground bg-transparent border-none outline-none focus:border-b focus:border-primary w-full"
                      />
                    </div>

                    {index < nodes.length - 1 && (
                      <ArrowDown className="w-5 h-5 text-muted-foreground my-2 animate-bounce-slow" />
                    )}
                  </div>
                ))}

                <div className="relative mt-8">
                  {showNodePicker && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border p-2 rounded-lg shadow-xl flex flex-col gap-1 w-48 z-20">
                      <button onClick={() => addNode('CONDITION')} className="px-3 py-2 text-xs hover:bg-muted text-left rounded font-medium text-foreground">Add Condition</button>
                      <button onClick={() => addNode('AI')} className="px-3 py-2 text-xs hover:bg-muted text-left rounded font-medium text-foreground">Add AI Node</button>
                      <button onClick={() => addNode('ACTION')} className="px-3 py-2 text-xs hover:bg-muted text-left rounded font-medium text-foreground">Add Action</button>
                      <button onClick={() => addNode('NOTIFICATION')} className="px-3 py-2 text-xs hover:bg-muted text-left rounded font-medium text-foreground">Add Notification</button>
                      <button onClick={() => addNode('VOICE_CALL')} className="px-3 py-2 text-xs hover:bg-muted text-left rounded font-medium text-foreground">Add Dograh Voice Call</button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setShowNodePicker(!showNodePicker)}
                    className="px-4 py-2 border border-dashed border-primary/50 text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add Next Step
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
              <Settings2 className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a workflow from the left to edit or run its automation graph.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
