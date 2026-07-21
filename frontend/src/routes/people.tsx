import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import {
  Users, HeartPulse, BrainCircuit, Search, ArrowRight, ShieldAlert,
  CheckCircle2, Frown, Smile, Clock, Sparkles, TrendingUp, Calendar,
  BookOpen, AlertTriangle, User, UserCheck, Flame, Compass, MessageSquare, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute('/people')({
  component: PeopleDashboard,
});

function PeopleDashboard() {
  const qc = useQueryClient();
  const { data: people, isLoading: peopleLoading } = useQuery({ queryKey: ['people'], queryFn: api.people.getAll });
  const { data: insights, isLoading: insightsLoading } = useQuery({ queryKey: ['peopleInsights'], queryFn: api.people.getInsights });
  
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  
  const [showCheckin, setShowCheckin] = useState(false);
  const [mood, setMood] = useState('Good');
  const [blockers, setBlockers] = useState('');

  // Fetch timeline events for selected person
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['personTimeline', selectedPerson?.id],
    queryFn: () => api.people.getTimeline(selectedPerson.id),
    enabled: !!selectedPerson?.id,
  });

  // Fetch recommendations for selected person
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['personRecommendations', selectedPerson?.id],
    queryFn: () => api.people.getRecommendations(selectedPerson.id),
    enabled: !!selectedPerson?.id,
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: any) => api.people.checkin(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['peopleInsights'] });
      qc.invalidateQueries({ queryKey: ['personTimeline', selectedPerson?.id] });
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

  const departments = ['All', ...Array.from(new Set((people || []).map((p: any) => p.department).filter(Boolean)))];

  const filteredPeople = (people || []).filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDepartment === 'All' || p.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  // Mood colors map
  const moodColors: Record<string, string> = {
    Great: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Good: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    Neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    Stressed: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Frustrated: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Exhausted: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  // Mock sentiment trends for visualization
  const trendData = [
    { name: 'Mon', sentiment: 72, stress: 28 },
    { name: 'Tue', sentiment: 75, stress: 30 },
    { name: 'Wed', sentiment: 68, stress: 38 },
    { name: 'Thu', sentiment: 78, stress: 34 },
    { name: 'Fri', sentiment: 82, stress: 24 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            People Engineering
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Predictive burnout, emotional analysis, and team friction signals mapped to SRE workload indicators.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-success/20 bg-success/5 text-success">
            <UserCheck className="w-3.5 h-3.5" /> 
            {insightsLoading ? '...' : `${insights?.checkins_today || 0} Check-ins Today`}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary">
            <TrendingUp className="w-3.5 h-3.5" /> Sentiment: {insightsLoading ? '...' : insights?.sentiment_trend || 'Improving'}
          </span>
        </div>
      </div>

      {/* Top Organization Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Burnout Risk Index</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-foreground">{insightsLoading ? '...' : insights?.team_burnout_risk || 'Low'}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Calculated from SRE daily check-in reports</div>
          <Flame className={`absolute right-4 bottom-4 w-12 h-12 opacity-5 ${insights?.team_burnout_risk === 'High' ? 'text-destructive' : 'text-primary'}`} />
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Stressed Engineers</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-foreground">{insightsLoading ? '...' : insights?.high_stress_employees || 0}</span>
            <span className="text-xs text-muted-foreground">in last 48 hrs</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Requires delegation validation</div>
          <HeartPulse className="absolute right-4 bottom-4 w-12 h-12 text-primary opacity-5" />
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Active Core Blockers</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-foreground">{insightsLoading ? '...' : insights?.active_blockers || 0}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Correlated with open incident tasks</div>
          <AlertTriangle className="absolute right-4 bottom-4 w-12 h-12 text-warning opacity-5" />
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Overall Collaboration</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-foreground">{insightsLoading ? '...' : `${insights?.avg_collaboration_score || 84}%`}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Knowledge sharing & PR reviews metric</div>
          <Compass className="absolute right-4 bottom-4 w-12 h-12 text-cyan-500 opacity-5" />
        </div>
      </div>

      {/* Main Grid: Left List, Right Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Team Directory & Filter */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-border space-y-3 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder-slate-500"
              />
            </div>

            {/* Department selector */}
            <div className="flex flex-wrap gap-1.5">
              {departments.map((dept: string) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Directory list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {peopleLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="w-5 h-5 animate-spin mb-2" />
                <span className="text-xs">Accessing organization database...</span>
              </div>
            ) : filteredPeople.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No team members match search credentials.
              </div>
            ) : (
              filteredPeople.map((person: any) => (
                <button
                  key={person.id}
                  onClick={() => { setSelectedPerson(person); setShowCheckin(false); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedPerson?.id === person.id
                      ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/15'
                      : 'bg-background border-border hover:border-primary/20 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {person.name}
                        {person.current_status === 'Active' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{person.role} ({person.department})</div>
                    </div>
                    
                    {/* Status indicator badges */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        person.stress_level === 'High' 
                          ? 'bg-destructive/10 text-destructive border-destructive/20' 
                          : person.stress_level === 'Medium' 
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {person.stress_level || 'Low'} Stress
                      </span>
                      {person.team && (
                        <span className="text-[8px] bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded border border-border/40 font-semibold uppercase tracking-wider">
                          {person.team}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Team Member Profile Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPerson ? (
            <div className="space-y-6">
              
              {/* Employee Summary Card */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <BrainCircuit className="w-32 h-32" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg ring-1 ring-white/10">
                      {selectedPerson.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">{selectedPerson.name}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          selectedPerson.current_status === 'Active'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          {selectedPerson.current_status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedPerson.role} &bull; <span className="text-foreground">{selectedPerson.department} Department</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{selectedPerson.email}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCheckin(!showCheckin)}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <UserCheck className="w-4 h-4" /> 
                      {showCheckin ? 'View Insights' : 'Submit Check-in'}
                    </button>
                  </div>
                </div>

                {/* Score indicators grid */}
                {!showCheckin && profile && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-border/50 pt-5">
                    {[
                      { label: 'Focus Score', val: `${profile.focus_score}%`, color: 'text-primary' },
                      { label: 'Collaboration', val: `${profile.collaboration_score}%`, color: 'text-cyan-400' },
                      { label: 'Workload Rating', val: `${profile.workload_score}%`, color: 'text-amber-400' },
                      { label: 'Knowledge Sharing', val: `${profile.knowledge_sharing_score}%`, color: 'text-emerald-400' }
                    ].map(score => (
                      <div key={score.label} className="bg-muted/10 rounded-lg p-3 border border-border/40">
                        <div className="text-[10px] text-muted-foreground">{score.label}</div>
                        <div className={`text-lg font-extrabold mt-1 ${score.color}`}>{score.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle checkin form or coaching analysis */}
              {showCheckin ? (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Submit SRE Check-in</h3>
                    <span className="text-[10px] text-muted-foreground">Appended to developer telemetry logs</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">How is this developer feeling today?</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Great', 'Good', 'Stressed', 'Exhausted'].map(m => {
                          const isSel = mood === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMood(m)}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {m === 'Great' || m === 'Good' ? <Smile className="w-5 h-5 mb-1" /> : <Frown className="w-5 h-5 mb-1" />}
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Action Blockers or Feedback Message</label>
                      <textarea
                        value={blockers}
                        onChange={e => setBlockers(e.target.value)}
                        placeholder="Describe issues blocking team tasks or sprint delivery (e.g. Waiting for QA approval, DB access restrictions)..."
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary min-h-[90px] text-foreground placeholder-slate-600"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                      <button
                        onClick={() => setShowCheckin(false)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCheckin}
                        disabled={checkinMutation.isPending}
                        className="bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {checkinMutation.isPending && <Clock className="w-3.5 h-3.5 animate-spin" />}
                        Submit Standup Entry
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* AI Coaching & Recommendations Panel */}
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Behavior & Coaching Advice
                    </h3>

                    {profileLoading ? (
                      <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                        Analyzing behavioral timeline...
                      </div>
                    ) : profile ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/20 border border-border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Risk State</span>
                            <span className={`text-[10px] font-bold uppercase ${
                              profile.risk_pattern === 'overloaded' ? 'text-destructive' : 'text-success'
                            }`}>{profile.risk_pattern}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Working Style</span>
                            <span className="text-[10px] font-bold text-foreground capitalize">{profile.working_style}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[10px] text-muted-foreground font-semibold uppercase">Actionable Coaching Tips</div>
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {profile.recommendations?.map((rec: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-primary mt-0.5">&bull;</span>
                                <span className="leading-normal">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        Coaching insights unavailable for this record.
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline Panel */}
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-[400px]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      DevOps & Activity Timeline
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                      {timelineLoading ? (
                        <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                          Fetching user activity...
                        </div>
                      ) : timeline && timeline.length > 0 ? (
                        timeline.map((event: any, i: number) => {
                          const date = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={i} className="flex gap-3 text-xs">
                              <div className="flex flex-col items-center shrink-0">
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                                  event.event_type === 'incident'
                                    ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                    : event.event_type === 'deployment'
                                      ? 'bg-success'
                                      : 'bg-muted-foreground'
                                }`} />
                                {i < timeline.length - 1 && (
                                  <div className="w-[1px] bg-border flex-1 min-h-[30px]" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground leading-none">{event.description}</div>
                                <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1.5">
                                  <span>{date}</span>
                                  {event.linked_entity_id && (
                                    <span className="text-[8px] bg-muted px-1.5 rounded text-slate-400 border border-border/40 font-mono">
                                      {event.linked_entity_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-xs text-muted-foreground">
                          No recent actions logged.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Organization Sentiment Trend Chart */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Sentiment & Stress Analytics (7-day trend)
                </h3>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', fontSize: 11 }} />
                      <Area type="monotone" dataKey="sentiment" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Sentiment Score" />
                      <Area type="monotone" dataKey="stress" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.05} name="Stress Score" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[500px]">
              <Users className="w-16 h-16 mb-4 text-muted-foreground/30 animate-pulse" />
              <h3 className="font-bold text-foreground mb-1 text-sm">Organizational Intelligence Dashboard</h3>
              <p className="text-xs max-w-sm leading-relaxed mt-1">
                Select any team member from the directory panel to view their stress timelines, focus trends, and personalized coaching suggestions.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
