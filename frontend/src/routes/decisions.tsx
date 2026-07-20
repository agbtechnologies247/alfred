import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import {
  Check, ShieldAlert, X, Zap, AlertTriangle, TrendingDown,
  ChevronDown, ChevronUp, Activity, Clock, Users, BarChart3
} from 'lucide-react';

export const Route = createFileRoute('/decisions')({
  component: DecisionsDashboard,
});

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    High: 'bg-red-500/10 text-red-400 border-red-500/20',
    Critical: 'bg-red-600/20 text-red-300 border-red-600/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[risk] ?? styles.Low}`}>
      {risk}
    </span>
  );
}

function SimulatePanel({ decision }: { decision: any }) {
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const runSim = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const result = await api.decisions.simulate(
        decision.recommendation?.toLowerCase().replace(/\s+/g, '_') || 'restart_service',
        decision.id,
      );
      setSimResult(result);
    } catch {
      setSimResult({ error: 'Simulation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-border/50 mt-4 pt-4">
      <button
        onClick={runSim}
        className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
      >
        <Activity className="w-3 h-3" />
        {loading ? 'Simulating...' : 'Run Impact Simulation'}
        {open && !loading ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && simResult && !simResult.error && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Risk', value: simResult.risk_score?.severity ?? '–', icon: ShieldAlert },
            { label: 'Affected customers', value: simResult.estimated_affected_customers ?? '–', icon: Users },
            { label: 'Downtime est.', value: simResult.estimated_downtime_minutes ? `${simResult.estimated_downtime_minutes} min` : '–', icon: Clock },
            { label: 'Cost impact', value: simResult.estimated_cost_impact_usd ? `$${Math.round(simResult.estimated_cost_impact_usd)}` : '–', icon: BarChart3 },
          ].map(stat => (
            <div key={stat.label} className="bg-muted/20 rounded-lg p-3 border border-border/50">
              <stat.icon className="w-3.5 h-3.5 text-muted-foreground mb-1" />
              <div className="text-sm font-bold">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
          {simResult.recommended_decision && (
            <div className="col-span-2 md:col-span-4 bg-primary/5 border border-primary/15 rounded-lg p-3 text-xs text-primary">
              <span className="font-semibold">AI Recommendation: </span>{simResult.recommended_decision}
            </div>
          )}
          {simResult.alternatives?.length > 0 && (
            <div className="col-span-2 md:col-span-4">
              <div className="text-xs text-muted-foreground font-semibold mb-2">Safer Alternatives</div>
              {simResult.alternatives.map((alt: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground bg-muted/10 border border-border/40 rounded p-2 mb-1.5">
                  <span className="font-medium text-foreground">{alt.action_type}: </span>{alt.description}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackPanel({ decision, onFeedback }: { decision: any; onFeedback: () => void }) {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const feedbackMutation = useMutation({
    mutationFn: (dec: 'approved' | 'rejected') =>
      api.feedback.submit({
        decision_id: decision.id,
        action_type: 'decision_approval',
        recommendation: decision.recommendation,
        decision: dec,
        reason: reason || undefined,
        user_role: 'engineer',
      }),
    onSuccess: onFeedback,
  });

  const handleReject = () => {
    if (!reason.trim()) {
      setErrorMsg('Rejection reason is mandatory.');
      return;
    }
    setErrorMsg('');
    feedbackMutation.mutate('rejected');
  };

  const handleAlternate = () => {
    alert(`AI Agent searching for alternative paths for ${decision.id}...\n\nFound Safer Alternative:\n1. Warm standby database failover (Low risk, 0s downtime, $0 cost)`);
  };

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      {feedbackMutation.isPending ? (
        <div className="text-xs text-muted-foreground text-center py-2">Submitting...</div>
      ) : feedbackMutation.isSuccess ? (
        <div className="text-xs text-emerald-400 text-center py-2 flex items-center gap-1 justify-center">
          <Check className="w-3.5 h-3.5" /> Feedback recorded
        </div>
      ) : (
        <>
          <button
            onClick={() => feedbackMutation.mutate('approved')}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Check className="w-4 h-4" /> Approve & Execute
          </button>
          <button
            onClick={handleReject}
            disabled={!reason.trim()}
            className="w-full px-4 py-2.5 bg-destructive/10 text-destructive disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
          >
            <X className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={handleAlternate}
            className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" /> Look for Alternate Solution
          </button>
          <input
            value={reason} onChange={e => { setReason(e.target.value); setErrorMsg(''); }}
            placeholder="Rejection reason (mandatory to reject)..."
            className="w-full px-3 py-1.5 text-xs rounded-md border border-input bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {errorMsg && <div className="text-[10px] text-destructive font-semibold">{errorMsg}</div>}
        </>
      )}
    </div>
  );
}

function DecisionsDashboard() {
  const queryClient = useQueryClient();
  const { data: pendingDecisions, isLoading } = useQuery({
    queryKey: ['pending-decisions'],
    queryFn: api.decisions.getPending,
  });
  const { data: copilot } = useQuery({
    queryKey: ['copilot-active'],
    queryFn: api.decisions.getCopilotActive,
  });
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: api.decisions.getRecommendations,
  });
  const { data: feedbackHistory } = useQuery({
    queryKey: ['feedback-history'],
    queryFn: api.feedback.getHistory,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Zap className="w-4 h-4 mr-2 animate-pulse" /> Loading Decision Engine...
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Decision Engineering Engine</h1>
        <p className="text-muted-foreground mt-1">AI simulates impact, you approve. Every decision is logged and fed back to improve the model.</p>
      </div>

      {/* Active Copilot Banner */}
      {copilot && (
        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row gap-4 items-start">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">Active Copilot Analysis</div>
            <h3 className="text-base font-bold mb-1">{copilot.incident_title}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Root Cause: <strong className="text-foreground">{copilot.root_cause}</strong></span>
              <span>Related: <strong className="text-foreground">{copilot.related_incidents} incidents</strong></span>
              <span>Affected: <strong className="text-foreground">{copilot.affected_systems?.join(', ')}</strong></span>
            </div>
            {copilot.recommended_command && (
              <pre className="mt-3 bg-black/40 border border-border/50 rounded-md px-4 py-2 text-xs font-mono text-emerald-400 overflow-x-auto">
                {`$ ${copilot.recommended_command}`}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">AI Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{rec.type}</span>
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-sm text-foreground mb-2 leading-relaxed">{rec.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">{rec.metric}</span>
                  <button className="text-xs text-primary hover:underline">{rec.actionText}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Pending Approvals
          <span className="ml-2 text-sm font-normal text-muted-foreground">({pendingDecisions?.length ?? 0})</span>
        </h2>
        <div className="grid gap-4">
          {pendingDecisions?.map((decision: any) => (
            <div key={decision.id} className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Decision Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      Pending Approval
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">{decision.id}</span>
                    <RiskBadge risk={decision.risk} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{decision.context}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Recommended: <strong className="text-foreground">{decision.recommendation}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: decision.confidence }} />
                    </div>
                    <span className="text-xs text-muted-foreground">AI Confidence: <strong className="text-foreground">{decision.confidence}</strong></span>
                  </div>
                </div>
                {/* Action buttons */}
                <FeedbackPanel
                  decision={decision}
                  onFeedback={() => queryClient.invalidateQueries({ queryKey: ['pending-decisions'] })}
                />
              </div>
              {/* Impact Simulation */}
              <SimulatePanel decision={decision} />
            </div>
          ))}

          {pendingDecisions?.length === 0 && (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/50 text-muted-foreground">
              <Check className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No pending decisions. All systems nominal.
            </div>
          )}
        </div>
      </div>

      {/* Feedback History */}
      {feedbackHistory && feedbackHistory.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Human Feedback <span className="text-xs font-normal text-muted-foreground">(feeds back into AI model)</span></h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {['Decision', 'Role', 'Action', 'Decision'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedbackHistory.slice(0, 5).map((fb: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fb.decision_id}</td>
                    <td className="px-4 py-3 text-xs">{fb.user_role}</td>
                    <td className="px-4 py-3 text-xs">{fb.action_type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${fb.decision === 'Approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fb.decision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
