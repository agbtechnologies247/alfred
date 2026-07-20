import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { Users, HeartPulse, BrainCircuit, Search, ArrowRight, ShieldAlert, CheckCircle2, Frown, Smile, Clock } from 'lucide-react';

export const Route = createFileRoute('/people')({
  component: PeopleDashboard,
});

function PeopleDashboard() {
  const qc = useQueryClient();
  const { data: people, isLoading: peopleLoading } = useQuery({ queryKey: ['people'], queryFn: api.people.getAll });
  const { data: insights, isLoading: insightsLoading } = useQuery({ queryKey: ['peopleInsights'], queryFn: api.people.getInsights });
  
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [showCheckin, setShowCheckin] = useState(false);
  const [mood, setMood] = useState('Good');
  const [blockers, setBlockers] = useState('');

  const checkinMutation = useMutation({
    mutationFn: (payload: any) => api.people.checkin(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['peopleInsights'] });
      setShowCheckin(false);
      setBlockers('');
    }
  });

  const handleCheckin = () => {
    if (!selectedPerson) return;
    checkinMutation.mutate({
      person_id: selectedPerson.id,
      check_in_type: 'Daily Standup',
      mood,
      priority: 'High',
      needs_help: blockers.length > 0,
      blockers
    });
  };

  const filteredPeople = people?.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.role.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            People Engineering
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Operational emotion and behavioral intelligence.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Column: List */}
        <div className="w-full md:w-[45%] flex flex-col border-r border-border bg-background">
          {/* Metrics */}
          <div className="p-4 border-b border-border bg-card/30 flex gap-4">
            <div className="flex-1 bg-card p-3 rounded-lg border border-border shadow-sm flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Burnout Risk</div>
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${insights?.team_burnout_risk === 'High' ? 'text-destructive' : 'text-emerald-500'}`} />
                <span className="text-lg font-bold">{insightsLoading ? '...' : insights?.team_burnout_risk || 'Low'}</span>
              </div>
            </div>
            <div className="flex-1 bg-card p-3 rounded-lg border border-border shadow-sm flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">High Stress</div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-orange-500" />
                <span className="text-lg font-bold">{insightsLoading ? '...' : insights?.high_stress_employees || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {peopleLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading people...</div>
            ) : filteredPeople.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">No team members found.</div>
            ) : (
              filteredPeople.map((person: any) => (
                <button
                  key={person.id}
                  onClick={() => { setSelectedPerson(person); setShowCheckin(false); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedPerson?.id === person.id ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : 'bg-card border-border hover:border-primary/30 hover:bg-muted/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{person.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{person.role}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${person.stress_level === 'High' ? 'bg-destructive/10 text-destructive' : person.stress_level === 'Medium' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {person.stress_level} Stress
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Details & Check-in */}
        <div className="flex-1 bg-muted/20 overflow-y-auto">
          {selectedPerson ? (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
              
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <BrainCircuit className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {selectedPerson.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedPerson.name}</h2>
                      <div className="text-sm text-muted-foreground">{selectedPerson.role}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      <div className="font-medium flex items-center gap-2">
                        {selectedPerson.current_status === 'Active' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-orange-500" />}
                        {selectedPerson.current_status}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Stress Level</div>
                      <div className="font-medium text-foreground">{selectedPerson.stress_level}</div>
                    </div>
                  </div>
                </div>
              </div>

              {!showCheckin ? (
                <div className="flex justify-end">
                  <button onClick={() => setShowCheckin(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                    Initiate Check-in <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-foreground">Submit Daily Check-in</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">How are you feeling today?</label>
                      <div className="flex gap-2">
                        {['Great', 'Good', 'Stressed', 'Exhausted'].map(m => (
                          <button
                            key={m}
                            onClick={() => setMood(m)}
                            className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${mood === m ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-input text-muted-foreground hover:bg-muted'}`}
                          >
                            {m === 'Great' || m === 'Good' ? <Smile className="w-4 h-4 mx-auto mb-1" /> : <Frown className="w-4 h-4 mx-auto mb-1" />}
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Any blockers?</label>
                      <textarea
                        value={blockers}
                        onChange={e => setBlockers(e.target.value)}
                        placeholder="Describe anything blocking your work..."
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={() => setShowCheckin(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Cancel</button>
                      <button
                        onClick={handleCheckin}
                        disabled={checkinMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                      >
                        {checkinMutation.isPending ? 'Submitting...' : 'Submit Check-in'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p>Select a team member to view intelligence graph</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
