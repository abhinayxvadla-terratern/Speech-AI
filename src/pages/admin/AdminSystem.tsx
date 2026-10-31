import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Sliders, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  HelpCircle, 
  Check, 
  Trash2, 
  ExternalLink,
  ChevronRight, 
  ToggleLeft,
  ToggleRight,
  Layers,
  Radio,
  Users,
  Key
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  fetchLlmProviderLogs, 
  fetchLlmUsageMetrics, 
  acknowledgeLlmError, 
  clearAcknowledgedErrors,
  fetchAllPlatformSessions,
  fetchDiagnosticRecapForSession,
  fetchPlatformConfigs,
  updatePlatformConfig,
  LlmUsageMetrics,
  SessionFilterOptions
} from '../../services/adminSystemService';
import { LlmProviderLog, Session, DiagnosticRecap } from '../../lib/database.types';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminTranscriptModal } from '../../components/admin/AdminTranscriptModal';
import { AdminTeamRolesSection } from '../../components/admin/AdminTeamRolesSection';
import { AdminApiKeysSection } from '../../components/admin/AdminApiKeysSection';
import { 
  AdminDateRangeFilter, 
  DateRangeValue 
} from '../../components/admin/AdminDateRangeFilter';

const PLATFORM_TABS = [
  { id: 'speak', name: 'Speak Tab', desc: 'Audio turn learning & pronunciation drills' },
  { id: 'scenarios', name: 'Scenarios Tab', desc: 'Daily life & domain-specific roleplay simulations' },
  { id: 'interview', name: 'Interview Tab', desc: 'Job & technical interview mock simulations' },
];

const PLATFORM_DOMAINS = [
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];

const PLATFORM_MODES = [
  { id: 'learn', name: 'Learn Mode', desc: 'Step-by-step turn coaching with instant feedback' },
  { id: 'practice', name: 'Practice Mode', desc: 'Continuous realistic speaking with end-of-session recap' },
  { id: 'open_interview', name: 'Open-ended Interview', desc: 'Unstructured freeform interviewer flow' },
];

export const AdminSystem: React.FC = () => {
  const { adminUser } = useAdminAuth();

  // Active Sub-Section: 'monitoring' | 'sessions' | 'killswitches' | 'team' | 'apikeys'
  const [activeSection, setActiveSection] = useState<'monitoring' | 'sessions' | 'killswitches' | 'team' | 'apikeys'>('monitoring');

  // 1. Pipeline Telemetry State
  const [llmLogs, setLlmLogs] = useState<LlmProviderLog[]>([]);
  const [metrics, setMetrics] = useState<LlmUsageMetrics>({
    groqTodayCalls: 0,
    openrouterTodayCalls: 0,
    groqEstimatedTokens: 0,
    openrouterDailyLimit: 1000,
    openrouterTier: 'tier_1000',
    errorCount: 0,
  });
  const [openrouterTier, setOpenrouterTier] = useState<'tier_50' | 'tier_1000'>('tier_1000');

  // 2. All-Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionDateRange, setSessionDateRange] = useState<DateRangeValue>(() => ({
    preset: 'all',
    startDate: null,
    endDate: null,
    label: 'All Time',
  }));
  const [sessionFilter, setSessionFilter] = useState<SessionFilterOptions>({
    tab: 'all',
    mode: 'all',
    status: 'all',
    dateRange: 'all',
  });
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionRecap, setSelectedSessionRecap] = useState<DiagnosticRecap | null>(null);

  const handleSessionDateRangeChange = (newRange: DateRangeValue) => {
    setSessionDateRange(newRange);
    setSessionFilter((prev) => ({
      ...prev,
      dateRange: newRange,
    }));
  };

  // 3. Platform Configs (Kill-Switches) State
  const [disabledTabs, setDisabledTabs] = useState<string[]>([]);
  const [disabledDomains, setDisabledDomains] = useState<string[]>([]);
  const [disabledModes, setDisabledModes] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Load All System Data
  const loadSystemData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const [logs, configs, sessList] = await Promise.all([
        fetchLlmProviderLogs(),
        fetchPlatformConfigs(),
        fetchAllPlatformSessions(sessionFilter),
      ]);

      setLlmLogs(logs);
      setSessions(sessList);

      // Parse configs
      if (configs.killswitch_tabs?.disabled) setDisabledTabs(configs.killswitch_tabs.disabled);
      if (configs.killswitch_domains?.disabled) setDisabledDomains(configs.killswitch_domains.disabled);
      if (configs.killswitch_modes?.disabled) setDisabledModes(configs.killswitch_modes.disabled);

      const tier = configs.openrouter_tier?.tier === 'tier_50' ? 'tier_50' : 'tier_1000';
      setOpenrouterTier(tier);

      // Compute telemetry
      const m = await fetchLlmUsageMetrics(tier);
      setMetrics(m);
    } catch (err: any) {
      console.error('Failed to load system telemetry:', err);
      setError(err?.message || 'Failed to load system telemetry');
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  }, [sessionFilter]);

  useEffect(() => {
    loadSystemData(false);

    // Live auto-polling every 25 seconds for pipeline telemetry & session logs
    const timer = setInterval(() => {
      loadSystemData(true);
    }, 25000);

    return () => clearInterval(timer);
  }, [loadSystemData]);

  // Error Logs only
  const errorLogs = useMemo(() => {
    return llmLogs.filter((l) => !l.success);
  }, [llmLogs]);

  // Handle Error Acknowledge
  const handleAcknowledge = async (log: LlmProviderLog) => {
    try {
      await acknowledgeLlmError(adminUser?.id || '', log.id, log.error_message || '');
      setLlmLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, acknowledged: true } : l))
      );
      showToast('Error acknowledged');
    } catch (err: any) {
      alert(err?.message || 'Failed to acknowledge error');
    }
  };

  // Handle Clear Acknowledged Errors
  const handleClearAcknowledged = async () => {
    if (!window.confirm('Clear all acknowledged error logs from the database?')) return;
    try {
      await clearAcknowledgedErrors(adminUser?.id || '');
      setLlmLogs((prev) => prev.filter((l) => !l.acknowledged));
      showToast('Acknowledged errors cleared');
    } catch (err: any) {
      alert(err?.message || 'Failed to clear error logs');
    }
  };

  // Open transcript modal for a session
  const handleOpenSessionTranscript = async (s: Session) => {
    setSelectedSession(s);
    try {
      const recap = await fetchDiagnosticRecapForSession(s.id);
      setSelectedSessionRecap(recap);
    } catch {
      setSelectedSessionRecap(null);
    }
  };

  // Toggle Tab Kill-Switch
  const handleToggleTab = async (tabId: string) => {
    const isCurrentlyDisabled = disabledTabs.includes(tabId);
    const updated = isCurrentlyDisabled
      ? disabledTabs.filter((t) => t !== tabId)
      : [...disabledTabs, tabId];

    setDisabledTabs(updated);
    try {
      await updatePlatformConfig(
        adminUser?.id || '',
        'killswitch_tabs',
        { disabled: updated },
        { disabled: disabledTabs }
      );
      showToast(`Tab "${tabId}" ${isCurrentlyDisabled ? 'restored' : 'disabled'}`);
    } catch (err: any) {
      setDisabledTabs(disabledTabs); // revert
      alert(err?.message || 'Failed to update kill-switch');
    }
  };

  // Toggle Domain Kill-Switch
  const handleToggleDomain = async (domain: string) => {
    const isCurrentlyDisabled = disabledDomains.includes(domain);
    const updated = isCurrentlyDisabled
      ? disabledDomains.filter((d) => d !== domain)
      : [...disabledDomains, domain];

    setDisabledDomains(updated);
    try {
      await updatePlatformConfig(
        adminUser?.id || '',
        'killswitch_domains',
        { disabled: updated },
        { disabled: disabledDomains }
      );
      showToast(`Domain "${domain}" ${isCurrentlyDisabled ? 'restored' : 'disabled'}`);
    } catch (err: any) {
      setDisabledDomains(disabledDomains);
      alert(err?.message || 'Failed to update kill-switch');
    }
  };

  // Toggle Mode Kill-Switch
  const handleToggleMode = async (modeId: string) => {
    const isCurrentlyDisabled = disabledModes.includes(modeId);
    const updated = isCurrentlyDisabled
      ? disabledModes.filter((m) => m !== modeId)
      : [...disabledModes, modeId];

    setDisabledModes(updated);
    try {
      await updatePlatformConfig(
        adminUser?.id || '',
        'killswitch_modes',
        { disabled: updated },
        { disabled: disabledModes }
      );
      showToast(`Mode "${modeId}" ${isCurrentlyDisabled ? 'restored' : 'disabled'}`);
    } catch (err: any) {
      setDisabledModes(disabledModes);
      alert(err?.message || 'Failed to update kill-switch');
    }
  };

  // Switch OpenRouter Funding Tier
  const handleSwitchOpenRouterTier = async (newTier: 'tier_50' | 'tier_1000') => {
    setOpenrouterTier(newTier);
    try {
      await updatePlatformConfig(
        adminUser?.id || '',
        'openrouter_tier',
        { tier: newTier, daily_limit: newTier === 'tier_50' ? 50 : 1000 },
        { tier: openrouterTier }
      );
      const m = await fetchLlmUsageMetrics(newTier);
      setMetrics(m);
      showToast(`OpenRouter limit set to ${newTier === 'tier_50' ? '50/day' : '1,000/day'}`);
    } catch (err: any) {
      setOpenrouterTier(openrouterTier);
      alert(err?.message || 'Failed to switch tier');
    }
  };

  // Token percentage calculations
  const groqTokenCeiling = 100000;
  const groqPercent = Math.min(100, Math.round((metrics.groqEstimatedTokens / groqTokenCeiling) * 100));
  const openrouterPercent = Math.min(
    100,
    Math.round((metrics.openrouterTodayCalls / metrics.openrouterDailyLimit) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            System Controls & Telemetry
          </h2>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            Real-time LLM fallback pipeline monitoring, platform-wide session browser, and kill-switches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync (25s)
          </div>
          {actionFeedback && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-fadeIn">
              {actionFeedback}
            </span>
          )}
          <button
            onClick={() => loadSystemData(false)}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#00215C] hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#255CC1] ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadSystemData()} className="font-bold underline hover:text-red-900 ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('monitoring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'monitoring'
              ? 'bg-[#00215C] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Pipeline & Error Logs ({errorLogs.length})
        </button>

        <button
          onClick={() => setActiveSection('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'sessions'
              ? 'bg-[#00215C] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-4 h-4" />
          All-Sessions Browser ({sessions.length})
        </button>

        <button
          onClick={() => setActiveSection('killswitches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'killswitches'
              ? 'bg-[#00215C] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Kill-Switches & Flags ({disabledTabs.length + disabledDomains.length + disabledModes.length})
        </button>

        <button
          onClick={() => setActiveSection('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'team'
              ? 'bg-[#00215C] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Team & Roles (RBAC)
        </button>

        <button
          onClick={() => setActiveSection('apikeys')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'apikeys'
              ? 'bg-[#00215C] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4" />
          API Keys (Encrypted)
        </button>
      </div>

      {/* ==================================================== */}
      {/* SECTION 1: PIPELINE MONITORING & ERROR LOGS */}
      {/* ==================================================== */}
      {activeSection === 'monitoring' && (
        <div className="space-y-6">
          {/* Provider Call Counts & Ceiling Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Groq Primary Telemetry */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                    GQ
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-[#00215C]">
                      Groq Primary Pipeline
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Llama 3.3 70B • Fast voice inference
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Primary Route
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Today's Call Count
                  </span>
                  <span className="font-heading font-extrabold text-3xl text-[#00215C]">
                    {metrics.groqTodayCalls}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">calls</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block flex items-center gap-1 justify-end">
                    Estimated Tokens
                    <span title="Approx. 600 tokens per speech interaction turn (prompt + assistant generation)">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    </span>
                  </span>
                  <span className="font-heading font-bold text-base text-[#00215C]">
                    ~{metrics.groqEstimatedTokens.toLocaleString()} / 100k
                  </span>
                </div>
              </div>

              {/* Ceiling Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold">
                  <span className="text-slate-500">Usage Against Free Tier Ceiling</span>
                  <span className="text-[#00215C]">{groqPercent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      groqPercent > 80 ? 'bg-rose-500' : 'bg-[#255CC1]'
                    }`}
                    style={{ width: `${groqPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Note: Token count is estimated (~600 tokens/call). Actual API usage may vary slightly.
                </p>
              </div>
            </div>

            {/* OpenRouter Fallback Telemetry */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                    OR
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-[#00215C]">
                      OpenRouter Fallback Pipeline
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Automatic failover when Groq hits 429/5xx
                    </p>
                  </div>
                </div>

                {/* Tier Switcher directly in UI */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => handleSwitchOpenRouterTier('tier_50')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      openrouterTier === 'tier_50'
                        ? 'bg-white text-[#00215C] shadow-2xs'
                        : 'text-slate-500 hover:text-[#00215C]'
                    }`}
                  >
                    50 / day
                  </button>
                  <button
                    onClick={() => handleSwitchOpenRouterTier('tier_1000')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      openrouterTier === 'tier_1000'
                        ? 'bg-white text-[#00215C] shadow-2xs'
                        : 'text-slate-500 hover:text-[#00215C]'
                    }`}
                  >
                    1,000 / day
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Today's Fallback Calls
                  </span>
                  <span className="font-heading font-extrabold text-3xl text-[#00215C]">
                    {metrics.openrouterTodayCalls}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">requests</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    Daily Account Ceiling
                  </span>
                  <span className="font-heading font-bold text-base text-[#00215C]">
                    {metrics.openrouterTodayCalls} / {metrics.openrouterDailyLimit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Ceiling Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold">
                  <span className="text-slate-500">Tier Capacity Used</span>
                  <span className="text-[#00215C]">{openrouterPercent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      openrouterPercent > 80 ? 'bg-rose-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${openrouterPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Configured Tier: <strong className="text-slate-600">{metrics.openrouterDailyLimit} requests/day</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Error Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-[#00215C] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Provider Failure & Connection Logs ({errorLogs.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Logs where success=false from Groq STT/LLM or OpenRouter fallback.
                </p>
              </div>

              {errorLogs.some((l) => l.acknowledged) && (
                <button
                  onClick={handleClearAcknowledged}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Clear Acknowledged
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Session Ref</th>
                    <th className="py-3 px-4">Error Message / Reason</th>
                    <th className="py-3 px-4 text-right">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-body">
                  {errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <span className="font-semibold text-slate-700">No Provider Errors Logged</span>
                        <p className="text-[11px] mt-0.5 text-slate-400">
                          All speech synthesis, transcription, and LLM turns are running cleanly.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              log.provider.toLowerCase() === 'groq'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {log.provider}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {log.session_id ? (
                            <button
                              onClick={async () => {
                                const { data } = await supabase
                                  .from('sessions')
                                  .select('*')
                                  .eq('id', log.session_id)
                                  .maybeSingle();
                                if (data) handleOpenSessionTranscript(data as Session);
                              }}
                              className="text-[#255CC1] hover:underline flex items-center gap-1"
                            >
                              <span>{log.session_id.slice(0, 8)}...</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-rose-700 font-medium text-xs break-words max-w-md">
                          {log.error_message || 'Unknown provider exception'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {log.acknowledged ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Acknowledged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcknowledge(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold shadow-2xs"
                            >
                              Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 2: ALL-SESSIONS BROWSER */}
      {/* ==================================================== */}
      {activeSection === 'sessions' && (
        <div className="space-y-4">
          {/* Multi-Dimensional Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  DATE RANGE
                </label>
                <AdminDateRangeFilter
                  value={sessionDateRange}
                  onChange={handleSessionDateRangeChange}
                />
              </div>

              {/* Tab Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  TAB
                </label>
                <select
                  value={sessionFilter.tab}
                  onChange={(e) => setSessionFilter({ ...sessionFilter, tab: e.target.value })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C]"
                >
                  <option value="all">All Tabs</option>
                  <option value="speak">Speak</option>
                  <option value="scenarios">Scenarios</option>
                  <option value="interview">Interview</option>
                </select>
              </div>

              {/* Mode Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  MODE
                </label>
                <select
                  value={sessionFilter.mode}
                  onChange={(e) => setSessionFilter({ ...sessionFilter, mode: e.target.value })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C]"
                >
                  <option value="all">All Modes</option>
                  <option value="learn">Learn</option>
                  <option value="practice">Practice</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  STATUS
                </label>
                <select
                  value={sessionFilter.status}
                  onChange={(e) => setSessionFilter({ ...sessionFilter, status: e.target.value })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C]"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing {sessions.length} sessions platform-wide
            </span>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-4">Learner User ID</th>
                    <th className="py-3 px-4">Tab & Mode</th>
                    <th className="py-3 px-4">Started At</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Turns</th>
                    <th className="py-3 px-4 text-right">Transcript</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-body">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No sessions match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const turnCount = Array.isArray(s.transcript) ? s.transcript.length : 0;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleOpenSessionTranscript(s)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#00215C] font-semibold">
                            {s.id.slice(0, 8)}...
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {s.user_id ? `${s.user_id.slice(0, 8)}...` : 'Anonymous'}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-heading font-bold text-[#00215C] uppercase text-[11px]">
                              {s.tab} • {s.mode}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(s.started_at).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                s.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            {turnCount}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#255CC1] group-hover:translate-x-0.5 transition-transform">
                              <span>View</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 3: FEATURE FLAGS & KILL-SWITCHES */}
      {/* ==================================================== */}
      {activeSection === 'killswitches' && (
        <div className="space-y-6">
          {/* Group 1: Tab Kill-Switches */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading font-extrabold text-sm text-[#00215C] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#255CC1]" />
                1. Platform Tab Kill-Switches
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                When toggled off, learners who visit that tab are greeted with a "Temporarily Unavailable" maintenance screen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORM_TABS.map((tab) => {
                const isDisabled = disabledTabs.includes(tab.id);
                return (
                  <div
                    key={tab.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isDisabled
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-bold text-sm text-[#00215C]">
                          {tab.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isDisabled
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isDisabled ? 'DISABLED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-body">
                        {tab.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        {isDisabled ? 'Under maintenance' : 'Normal availability'}
                      </span>
                      <button
                        onClick={() => handleToggleTab(tab.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                          isDisabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        {isDisabled ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        {isDisabled ? 'Enable Tab' : 'Disable Tab'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Domain Kill-Switches */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading font-extrabold text-sm text-[#00215C] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#255CC1]" />
                2. Domain / Track Kill-Switches
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Disable an entire professional specialization track platform-wide (e.g. while revising clinical vocab).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PLATFORM_DOMAINS.map((domain) => {
                const isDisabled = disabledDomains.includes(domain);
                return (
                  <button
                    key={domain}
                    onClick={() => handleToggleDomain(domain)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                      isDisabled
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-[#00215C] hover:bg-slate-100'
                    }`}
                  >
                    <span>{domain}</span>
                    <span
                      className={`mt-3 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isDisabled ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isDisabled ? 'Disabled' : 'Enabled'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 3: Mode Kill-Switches */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading font-extrabold text-sm text-[#00215C] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#255CC1]" />
                3. Session Mode Kill-Switches
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Disable specific pedagogical modalities platform-wide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORM_MODES.map((mode) => {
                const isDisabled = disabledModes.includes(mode.id);
                return (
                  <div
                    key={mode.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isDisabled
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-bold text-sm text-[#00215C]">
                          {mode.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isDisabled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isDisabled ? 'DISABLED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-body">
                        {mode.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => handleToggleMode(mode.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-2xs ${
                          isDisabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        {isDisabled ? 'Re-enable Mode' : 'Disable Mode'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 4: TEAM & ROLES (RBAC) */}
      {/* ==================================================== */}
      {activeSection === 'team' && <AdminTeamRolesSection />}

      {/* ==================================================== */}
      {/* SECTION 5: ENCRYPTED API KEYS */}
      {/* ==================================================== */}
      {activeSection === 'apikeys' && <AdminApiKeysSection />}

      {/* TRANSCRIPT & DIAGNOSTICS VIEWER MODAL */}
      {selectedSession && (
        <AdminTranscriptModal
          session={selectedSession}
          recap={selectedSessionRecap}
          onClose={() => {
            setSelectedSession(null);
            setSelectedSessionRecap(null);
          }}
        />
      )}
    </div>
  );
};
