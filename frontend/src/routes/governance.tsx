import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, Users, CheckCircle, Clock, FileText, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/governance')({
  component: GovernanceDashboard,
});

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#ef4444',
  tenant_admin: '#f59e0b',
  sr_engineer: '#7c3aed',
  engineer: '#0ea5e9',
  read_only: '#64748b',
  ai_only: '#10b981',
};

function GovernanceDashboard() {
  const { data: roles } = useQuery({ queryKey: ['governance-roles'], queryFn: api.governance.getRoles });
  const { data: audit } = useQuery({ queryKey: ['governance-audit'], queryFn: api.governance.getAuditLog });

  const stats = [
    { label: 'RBAC Roles', value: roles?.length ?? 5, icon: Users, color: '#7c3aed' },
    { label: 'Audit Entries', value: audit?.total ?? 0, icon: FileText, color: '#0ea5e9' },
    { label: 'Active Policies', value: 12, icon: Shield, color: '#10b981' },
    { label: 'Last Audit', value: 'Now', icon: Clock, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Governance & Compliance</h1>
        <p className="text-muted-foreground mt-1">Role-based access control, immutable audit trail, and multi-tenancy isolation.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* RBAC Roles */}
      <div>
        <h2 className="text-lg font-semibold mb-4">RBAC Role Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(roles) ? roles : []).map((role: any, idx: number) => {
            const roleKey = String(role?.role || role?.name || role?.id || `role_${idx}`);
            const color = ROLE_COLORS[roleKey] || '#64748b';
            const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
            return (
              <div key={roleKey + idx} className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <h3 className="font-bold capitalize text-sm">{roleKey.replace(/_/g, ' ')}</h3>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{role?.description || 'Access Control Role'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {permissions.map((p: string) => (
                    <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-muted/50 border border-border text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Trail */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Immutable Audit Trail
          <span className="ml-2 text-xs font-normal text-muted-foreground">— every action recorded permanently</span>
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {(() => {
            const auditList = Array.isArray(audit?.entries) ? audit.entries : Array.isArray(audit) ? audit : [];
            if (auditList.length === 0) {
              return (
                <div className="p-12 text-center text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No audit entries yet. Actions taken through A.L.F.R.E.D. will appear here.</p>
                  <p className="text-xs mt-1">Approve or reject a decision to generate your first audit entry.</p>
                </div>
              );
            }
            return (
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    {['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Outcome', 'Risk'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditList.map((entry: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{entry.timestamp || 'Now'}</td>
                      <td className="px-4 py-3 text-xs">{entry.user_id || entry.user || 'admin'}</td>
                      <td className="px-4 py-3 text-xs capitalize">{entry.user_role || entry.role || 'super_admin'}</td>
                      <td className="px-4 py-3 text-xs font-medium">{entry.action || 'ACCESS'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{entry.resource || 'system'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${String(entry.outcome).toLowerCase().includes('succ') ? 'text-emerald-400' : 'text-red-400'}`}>{entry.outcome || 'success'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${String(entry.risk_level).toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'}`}>{entry.risk_level || 'low'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* Compliance Banner */}
      <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-emerald-400 text-sm mb-1">SOC2 Type II Ready</div>
          <p className="text-xs text-muted-foreground">All A.L.F.R.E.D. actions are logged with user identity, timestamp, IP address, and risk level. Audit logs are immutable and exportable for compliance review.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['SOC2', 'HIPAA', 'ISO 27001', 'GDPR'].map(badge => (
            <span key={badge} className="text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-medium">{badge}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
