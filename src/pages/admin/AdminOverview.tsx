import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, 
  Users, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  TrendingDown,
  Sparkles,
  BarChart3,
  Globe,
  MessageSquarePlus,
  Clock,
  Star
} from 'lucide-react';
import { 
  fetchAdminOverviewData, 
  fetchAdminFeedbackOverview, 
  AdminOverviewData, 
  AdminFeedbackOverviewData 
} from '../../services/adminOverviewService';

const SOURCE_META: Record<string, { label: string; badge: string; bar: string }> = {
  paid_social: { label: 'Paid Social', badge: 'bg-purple-100 text-purple-800 border-purple-200', bar: 'bg-purple-600' },
  paid_search: { label: 'Paid Search', badge: 'bg-blue-100 text-blue-800 border-blue-200', bar: 'bg-[#255CC1]' },
  organic: { label: 'Organic', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bar: 'bg-emerald-600' },
  partner: { label: 'Partner', badge: 'bg-amber-100 text-amber-800 border-amber-200', bar: 'bg-amber-500' },
  referral: { label: 'Referral', badge: 'bg-teal-100 text-teal-800 border-teal-200', bar: 'bg-teal-600' },
  direct: { label: 'Direct', badge: 'bg-slate-100 text-slate-700 border-slate-200', bar: 'bg-slate-500' },
  admin_created: { label: 'Admin Created', badge: 'bg-sky-100 text-sky-800 border-sky-200', bar: 'bg-sky-500' },
  other: { label: 'Other', badge: 'bg-zinc-100 text-zinc-700 border-zinc-200', bar: 'bg-zinc-400' },
};

function getSourceMeta(src: string) {
  return SOURCE_META[src] || {
    label: src.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    bar: 'bg-slate-500',
  };
}

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [feedbackData, setFeedbackData] = useState<AdminFeedbackOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sourcePeriod, setSourcePeriod] = useState<'30d' | 'all'>('30d');

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      setError(null);
      const [res, fb] = await Promise.all([
        fetchAdminOverviewData(),
        fetchAdminFeedbackOverview(),
      ]);
      setData(res);
      setFeedbackData(fb);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load admin overview metrics:', err);
      setError(err?.message || 'Failed to fetch platform metrics');
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);

    // Auto-polling: re-query live Supabase metrics every 20 seconds while page is active
    const timer = setInterval(() => {
      loadData(true);
    }, 20000);

    return () => clearInterval(timer);
  }, [loadData]);

  const stats = data?.stats;
  const funnel = data?.funnel;
  const mistakes = data?.top_mistakes || [];

  // Calculate funnel metrics
  const signedUp = funnel?.signed_up || 0;
  const onboarded = funnel?.completed_onboarding || 0;
  const hadFirst = funnel?.had_first_session || 0;
  const reachedFive = funnel?.reached_session_5 || 0;

  const pct = (val: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((val / total) * 100));
  };

  const totalMistakesCount = mistakes.reduce((acc, m) => acc + m.count, 0);

  // Source breakdown based on active period
  const activeSources = (sourcePeriod === '30d' ? data?.signups_by_source_30d : data?.signups_by_source_all) || [];
  const totalPeriodSignups = activeSources.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Action & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            Platform Overview
          </h2>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            Glance-and-done live vitals, user conversion funnel, and platform-wide mistake trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync (20s)
          </div>
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-medium">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => loadData(false)}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#00215C] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#255CC1] ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>Failed to load live metrics: {error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="font-bold underline hover:text-red-900 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Today's Live Stats: 4 Glance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Signups Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
              Signups Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#255CC1] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl text-[#00215C] tracking-tight">
              {loading && !stats ? '—' : (stats?.new_signups_today ?? 0)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">users</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span className="text-[#255CC1] font-bold">{stats?.new_signups_this_week ?? 0}</span> this week
          </p>
        </div>

        {/* Card 2: New Signups This Week */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
              Signups This Week
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl text-[#00215C] tracking-tight">
              {loading && !stats ? '—' : (stats?.new_signups_this_week ?? 0)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">total new</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">
            Trailing 7 calendar days
          </p>
        </div>

        {/* Card 3: Active Sessions Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
              Active Sessions Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl text-[#00215C] tracking-tight">
              {loading && !stats ? '—' : (stats?.active_sessions_today ?? 0)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">sessions</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live traffic started today
          </p>
        </div>

        {/* Card 4: Total Sessions Completed All-Time */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading">
              Completed Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl text-[#00215C] tracking-tight">
              {loading && !stats ? '—' : (stats?.total_sessions_completed ?? 0)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">all-time</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">
            Diagnostic recaps generated
          </p>
        </div>
      </div>

      {/* 2. Middle Row: Funnel (7 cols) & Most Common Mistakes (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Conversion Funnel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-heading font-bold text-base text-[#00215C]">
                  User Progression Funnel
                </h3>
                <p className="text-xs text-slate-500 font-body mt-0.5">
                  Drop-off tracking from initial signup to regular practice (session #5)
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EBF2FF] text-[#255CC1] text-[11px] font-bold">
                <BarChart3 className="w-3.5 h-3.5" />
                {signedUp > 0 ? `${pct(hadFirst, signedUp)}% Activation` : '0%'}
              </div>
            </div>

            {/* Funnel Stages */}
            <div className="space-y-4">
              {/* Stage 1: Signed Up */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#00215C] text-white flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span className="font-semibold text-[#00215C]">Signed Up</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00215C]">{signedUp}</span>
                    <span className="text-[11px] text-slate-400 font-medium">(100%)</span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#00215C] transition-all duration-500" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Stage 2: Completed Onboarding */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#1B4699] text-white flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span className="font-semibold text-[#00215C]">Completed Onboarding</span>
                    {signedUp > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        ({pct(onboarded, signedUp)}% of signups)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00215C]">{onboarded}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({pct(onboarded, signedUp)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#1B4699] transition-all duration-500" 
                    style={{ width: `${pct(onboarded, signedUp)}%` }}
                  />
                </div>
              </div>

              {/* Stage 3: Had First Session */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#255CC1] text-white flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <span className="font-semibold text-[#00215C]">Had First Session</span>
                    {onboarded > 0 && (
                      <span className="text-[10px] font-semibold text-[#255CC1]">
                        ({pct(hadFirst, onboarded)}% of onboarded)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00215C]">{hadFirst}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({pct(hadFirst, signedUp)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#255CC1] transition-all duration-500" 
                    style={{ width: `${pct(hadFirst, signedUp)}%` }}
                  />
                </div>
              </div>

              {/* Stage 4: Reached Session #5 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#678EE5] text-white flex items-center justify-center text-[10px] font-bold">
                      4
                    </span>
                    <span className="font-semibold text-[#00215C]">Reached Session #5</span>
                    {hadFirst > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600">
                        ({pct(reachedFive, hadFirst)}% retained)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00215C]">{reachedFive}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({pct(reachedFive, signedUp)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#678EE5] transition-all duration-500" 
                    style={{ width: `${pct(reachedFive, signedUp)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Funnel Summary Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
              Onboarding drop-off:{' '}
              <strong className="text-slate-700">
                {signedUp > 0 ? `${100 - pct(onboarded, signedUp)}%` : '0%'}
              </strong>
            </span>
            <span className="text-slate-500">
              5+ Session Retention:{' '}
              <strong className="text-[#00215C]">
                {hadFirst > 0 ? `${pct(reachedFive, hadFirst)}%` : '0%'}
              </strong>
            </span>
          </div>
        </div>

        {/* 3. Platform-Wide Most-Common Mistakes (Top 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-heading font-bold text-base text-[#00215C]">
                  Top Mistake Categories
                </h3>
                <p className="text-xs text-slate-500 font-body mt-0.5">
                  Platform-wide aggregate across diagnostic recaps
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#255CC1] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Top 5 Ranked List */}
            {mistakes.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-xs font-medium">No mistake recaps recorded yet.</p>
                <p className="text-[11px] mt-1">Mistakes will appear as learners complete speech sessions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mistakes.map((item, index) => {
                  const maxCount = mistakes[0]?.count || 1;
                  const relativePct = Math.round((item.count / maxCount) * 100);

                  return (
                    <div
                      key={item.category}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              index === 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : index === 1
                                ? 'bg-slate-200 text-slate-700'
                                : index === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-[#00215C] truncate max-w-[180px]">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-bold text-[#00215C] bg-white px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                          {item.count} {item.count === 1 ? 'error' : 'errors'}
                        </span>
                      </div>

                      {/* Visual Frequency Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#255CC1] transition-all duration-500"
                          style={{ width: `${relativePct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aggregated across all learners</span>
            <span className="font-semibold text-[#00215C]">
              {totalMistakesCount} total logged errors
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Signups by Source Attribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#255CC1] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#00215C]">
                Signups by Acquisition Source
              </h3>
              <p className="text-xs text-slate-500 font-body mt-0.5">
                Breakdown of user registrations tracked via campaign UTMs, search/social referrers, and direct visits.
              </p>
            </div>
          </div>

          {/* 30-Day vs All-Time Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => setSourcePeriod('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sourcePeriod === '30d'
                  ? 'bg-white text-[#00215C] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-[#00215C]'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setSourcePeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sourcePeriod === 'all'
                  ? 'bg-white text-[#00215C] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-[#00215C]'
              }`}
            >
              All time
            </button>
          </div>
        </div>

        {/* Source List / Bars */}
        {activeSources.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-600">No acquisition data for this timeframe</p>
            <p className="text-[11px] mt-1">Registrations will be categorized as users sign up via campaign or organic links.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSources.map((item) => {
                const meta = getSourceMeta(item.source);
                const percentage = totalPeriodSignups > 0 ? Math.round((item.count / totalPeriodSignups) * 100) : 0;

                return (
                  <div
                    key={item.source}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${meta.badge}`}>
                          {meta.label}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {item.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-extrabold text-[#00215C] text-sm">
                          {item.count}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Captured on page load across all routes and written to profile on signup
              </span>
              <span className="font-semibold text-[#00215C]">
                Total {sourcePeriod === '30d' ? '30-Day' : 'All-Time'} Registrations: <strong className="text-sm font-bold text-[#255CC1]">{totalPeriodSignups}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Row: Recent Learner Feedback & Category Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#255CC1] flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#00215C]">
                Recent Learner Feedback
              </h3>
              <p className="text-xs text-slate-500 font-body mt-0.5">
                Submissions from the in-app support channel & diagnostic recap error reports.
              </p>
            </div>
          </div>

          {/* Category Count Breakdown & Overall Rating Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {feedbackData?.average_rating !== null && feedbackData?.average_rating !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs mr-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-heading font-extrabold text-xs">{feedbackData.average_rating}</span>
                <span className="text-[10px] text-amber-700 font-semibold">/ 5.0</span>
                <span className="text-[10px] text-amber-600 font-medium ml-0.5">({feedbackData.ratings_count} ratings)</span>
              </div>
            )}

            <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Breakdown:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <span>Bugs:</span>
              <strong className="font-bold">{feedbackData?.category_counts['Bug'] || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <span>Features:</span>
              <strong className="font-bold">{feedbackData?.category_counts['Feature request'] || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span>Content:</span>
              <strong className="font-bold">{feedbackData?.category_counts['Content issue'] || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span>Other:</span>
              <strong className="font-bold">{feedbackData?.category_counts['Other'] || 0}</strong>
            </span>
          </div>
        </div>

        {/* Feedback List */}
        {!feedbackData || feedbackData.recent_feedback.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-600">No user feedback submitted yet</p>
            <p className="text-[11px] mt-1">Feedback logged via user profile or diagnostic recaps will appear here live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {feedbackData.recent_feedback.map((item) => {
              const catBadge =
                item.category === 'Bug'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : item.category === 'Feature request'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : item.category === 'Content issue'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200';

              const statusBadge =
                item.status === 'resolved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : item.status === 'reviewed'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${catBadge}`}>
                          {item.category}
                        </span>
                        {item.rating && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{item.rating}★</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${statusBadge}`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-normal line-clamp-3">
                      "{item.message}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-[#00215C]">
                      From: {item.user_name || 'Learner'}
                    </span>
                    {item.session_id ? (
                      <span className="font-mono text-[10px] bg-blue-50 text-[#255CC1] px-1.5 py-0.5 rounded border border-blue-100">
                        Session #{item.session_id.slice(0, 8)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">General App</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Platform-wide live user feedback stream</span>
          <span className="font-semibold text-[#00215C]">
            Total feedback logged: <strong className="text-xs font-bold text-[#255CC1]">{feedbackData?.total_count || 0}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
