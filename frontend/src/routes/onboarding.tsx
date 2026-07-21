import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Server, Shield, Database, Activity, CheckCircle2, AlertCircle, 
  Loader2, RefreshCw, Zap, Lock, DollarSign, Globe, Terminal, Play, Save, ChevronRight 
} from 'lucide-react';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingConsole,
});

type TabType = 'infra' | 'telemetry' | 'database' | 'business' | 'guardrails';

function OnboardingConsole() {
  const [activeTab, setActiveTab] = useState<TabType>('infra');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    app_name: 'BillSoft SaaS Local',
    app_version: '1.0.0',
    environment: 'production',
    container_engine: 'Docker Compose',
    backend_container: 'billsoft-backend',
    frontend_container: 'billsoft-frontend',
    backend_port: 5055,
    frontend_port: 3002,
    health_endpoint: 'http://localhost:5055/api/health',
    readiness_endpoint: 'http://localhost:5055/api/health/deep',
    log_stream_path: '/app/data/logs/app.log',
    db_engine: 'SQLite / Prisma ORM',
    db_connection_template: 'file:/app/data/billsoft.db',
    db_backup_path: './scripts/deploy.sh -> ./backups/',
    auth_provider: 'JWT (Bearer Token)',
    service_account_token: 'sk_alfred_billsoft_service_key_9941',
    queue_engine: 'BullMQ + Redis 7',
    fqdn_url: 'http://billsoft.agbtechnologies.com',
    api_base_url: 'http://localhost:5055/api',
    sre_hourly_cost_usd: 150,
    criticality_tier: 'Tier 1 (Core Billing)',
    outage_cost_per_hour_usd: 25000,
    target_mttr_mins: 15,
    auto_approve_container_restart: true,
    auto_approve_db_pool_flush: true,
    auto_approve_cache_clear: true,
    max_auto_impact_usd: 1000,
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.onboarding.getConfig();
        if (res && res.app_name) {
          setForm(prev => ({ ...prev, ...res }));
        }
      } catch (err) {
        console.warn('Using default BillSoft onboarding fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.app_name.trim()) errors.app_name = 'Application Name is required';
    if (!form.health_endpoint.trim()) errors.health_endpoint = 'Health Endpoint URL is required';
    if (form.sre_hourly_cost_usd <= 0) errors.sre_hourly_cost_usd = 'Must be greater than 0';
    if (form.target_mttr_mins <= 0) errors.target_mttr_mins = 'Target MTTR must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await api.onboarding.saveConfig(form);
      setSaveMessage(res.message || 'Application Integration Manifest saved & verified.');
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error('Save onboarding error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.onboarding.testConnection(form.health_endpoint);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 'error', message: 'Failed to connect to health check endpoint.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium">Loading Enterprise Onboarding Parameters…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Black-Box Integration Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Enterprise Application Onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure external application parameters into A.L.F.R.E.D. without requiring source code access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-card hover:bg-white/5 border border-border text-foreground rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <RefreshCw className="w-4 h-4 text-cyan-400" />}
            Test Health Connection
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save &amp; Verify Manifest
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{saveMessage}</span>
        </div>
      )}

      {/* Test Connection Banner */}
      {testResult && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          testResult.status === 'success' ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400' : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            {testResult.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div>
              <span className="font-bold">{testResult.message}</span>
              <span className="ml-3 text-xs opacity-80 font-mono">Tested: {testResult.endpoint_tested}</span>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-black/30 rounded border border-white/10">
            {testResult.latency_ms}ms · HTTP {testResult.http_code}
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: 'infra', label: '1. Infrastructure & Containers', icon: Server },
          { id: 'telemetry', label: '2. Telemetry & Health', icon: Activity },
          { id: 'database', label: '3. Database & Auth', icon: Database },
          { id: 'business', label: '4. Business ROI Parameters', icon: DollarSign },
          { id: 'guardrails', label: '5. Self-Healing Guardrails', icon: Zap },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Content Panel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        
        {/* TAB 1: INFRASTRUCTURE & CONTAINERS */}
        {activeTab === 'infra' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Application &amp; Container Specs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Specify baseline container runtime names and port mappings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Application Name *</label>
                <input
                  type="text"
                  value={form.app_name}
                  onChange={e => handleChange('app_name', e.target.value)}
                  className={`mt-1.5 w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none ${
                    formErrors.app_name ? 'border-red-500' : 'border-border focus:border-cyan-500'
                  }`}
                  placeholder="e.g. BillSoft SaaS"
                />
                {formErrors.app_name && <p className="text-xs text-red-400 mt-1">{formErrors.app_name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Environment</label>
                <select
                  value={form.environment}
                  onChange={e => handleChange('environment', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging / QA</option>
                  <option value="development">Development</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Container Engine</label>
                <input
                  type="text"
                  value={form.container_engine}
                  onChange={e => handleChange('container_engine', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Backend Container Name</label>
                <input
                  type="text"
                  value={form.backend_container}
                  onChange={e => handleChange('backend_container', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Backend Port Mapping</label>
                <input
                  type="number"
                  value={form.backend_port}
                  onChange={e => handleChange('backend_port', parseInt(e.target.value) || 0)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Frontend Port Mapping</label>
                <input
                  type="number"
                  value={form.frontend_port}
                  onChange={e => handleChange('frontend_port', parseInt(e.target.value) || 0)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TELEMETRY & HEALTH */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Telemetry &amp; Observability Parameters</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Configure live HTTP health check endpoints and log file paths.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Liveness Health Check Endpoint *</label>
                <input
                  type="text"
                  value={form.health_endpoint}
                  onChange={e => handleChange('health_endpoint', e.target.value)}
                  className={`mt-1.5 w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground font-mono focus:outline-none ${
                    formErrors.health_endpoint ? 'border-red-500' : 'border-border focus:border-cyan-500'
                  }`}
                  placeholder="http://localhost:5055/api/health"
                />
                {formErrors.health_endpoint && <p className="text-xs text-red-400 mt-1">{formErrors.health_endpoint}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Readiness / Deep Dependency Check Path</label>
                <input
                  type="text"
                  value={form.readiness_endpoint}
                  onChange={e => handleChange('readiness_endpoint', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Log File Path / Output Stream</label>
                <input
                  type="text"
                  value={form.log_stream_path}
                  onChange={e => handleChange('log_stream_path', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATABASE & SECURITY */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Database &amp; Authentication Credentials</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Specify ORM engine details and administrative agent API tokens.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Database Engine</label>
                <input
                  type="text"
                  value={form.db_engine}
                  onChange={e => handleChange('db_engine', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Connection URI Template</label>
                <input
                  type="text"
                  value={form.db_connection_template}
                  onChange={e => handleChange('db_connection_template', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Authentication Provider</label>
                <input
                  type="text"
                  value={form.auth_provider}
                  onChange={e => handleChange('auth_provider', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Service Account Agent Token</label>
                <input
                  type="password"
                  value={form.service_account_token}
                  onChange={e => handleChange('service_account_token', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BUSINESS ROI PARAMETERS */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Business &amp; Financial Impact Baseline</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Parameters feeding the Enterprise Economics Engine (E³) for ROI reporting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fully-Loaded SRE Rate ($/hr)</label>
                <input
                  type="number"
                  value={form.sre_hourly_cost_usd}
                  onChange={e => handleChange('sre_hourly_cost_usd', parseFloat(e.target.value) || 0)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Resolution Time (MTTR Mins)</label>
                <input
                  type="number"
                  value={form.target_mttr_mins}
                  onChange={e => handleChange('target_mttr_mins', parseInt(e.target.value) || 0)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Outage Financial Risk ($/hr)</label>
                <input
                  type="number"
                  value={form.outage_cost_per_hour_usd}
                  onChange={e => handleChange('outage_cost_per_hour_usd', parseFloat(e.target.value) || 0)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">System Criticality Tier</label>
                <select
                  value={form.criticality_tier}
                  onChange={e => handleChange('criticality_tier', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500"
                >
                  <option value="Tier 1 (Core Billing)">Tier 1 (Core Mission Critical)</option>
                  <option value="Tier 2 (High)">Tier 2 (High Priority)</option>
                  <option value="Tier 3 (Standard)">Tier 3 (Standard)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SELF-HEALING GUARDRAILS */}
        {activeTab === 'guardrails' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Autonomous Self-Healing Guardrails</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Define financial limits &amp; auto-approval parameters for A.L.F.R.E.D. triggers.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'auto_approve_container_restart', title: 'Auto-Approve Container Restarts', desc: 'Allow A.L.F.R.E.D. to restart crashed backend containers autonomously.' },
                { key: 'auto_approve_db_pool_flush', title: 'Auto-Approve DB Connection Pool Flushes', desc: 'Automatically terminate stale idle connections when pool exceeds 85% utilization.' },
                { key: 'auto_approve_cache_clear', title: 'Auto-Approve Redis Cache Purging', desc: 'Purge transient key locks when application latency spikes above 500ms.' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-white/5 cursor-pointer hover:border-cyan-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={(form as any)[item.key]}
                    onChange={e => handleChange(item.key, e.target.checked)}
                    className="mt-1 accent-cyan-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Auto-Approved Financial Risk Cap ($ USD)</label>
              <input
                type="number"
                value={form.max_auto_impact_usd}
                onChange={e => handleChange('max_auto_impact_usd', parseFloat(e.target.value) || 0)}
                className="mt-1.5 w-full md:w-1/2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Actions with projected financial impact above this threshold will require SRE sign-off.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
