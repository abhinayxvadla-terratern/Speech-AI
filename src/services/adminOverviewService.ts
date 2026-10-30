import { supabase } from '../lib/supabase';

export interface AdminOverviewStats {
  new_signups_today: number;
  new_signups_this_week: number;
  active_sessions_today: number;
  total_sessions_completed: number;
}

export interface AdminFunnelData {
  signed_up: number;
  completed_onboarding: number;
  had_first_session: number;
  reached_session_5: number;
}

export interface AdminMistakeCategory {
  category: string;
  count: number;
}

export interface AdminSourceCount {
  source: string;
  count: number;
}

export interface AdminOverviewData {
  stats: AdminOverviewStats;
  funnel: AdminFunnelData;
  top_mistakes: AdminMistakeCategory[];
  signups_by_source_30d: AdminSourceCount[];
  signups_by_source_all: AdminSourceCount[];
}

/**
 * Fetches admin overview metrics using the server-side RPC get_admin_overview_stats()
 * with automatic client-side fallback if the RPC is unavailable.
 */
export async function fetchAdminOverviewData(): Promise<AdminOverviewData> {
  // Strategy 1: Fast server-side RPC
  try {
    const { data, error } = await supabase.rpc('get_admin_overview_stats');

    if (!error && data && typeof data === 'object') {
      const payload = data as any;
      if (payload.stats && payload.funnel && Array.isArray(payload.top_mistakes)) {
        return {
          stats: {
            new_signups_today: Number(payload.stats.new_signups_today ?? 0),
            new_signups_this_week: Number(payload.stats.new_signups_this_week ?? 0),
            active_sessions_today: Number(payload.stats.active_sessions_today ?? 0),
            total_sessions_completed: Number(payload.stats.total_sessions_completed ?? 0),
          },
          funnel: {
            signed_up: Number(payload.funnel.signed_up ?? 0),
            completed_onboarding: Number(payload.funnel.completed_onboarding ?? 0),
            had_first_session: Number(payload.funnel.had_first_session ?? 0),
            reached_session_5: Number(payload.funnel.reached_session_5 ?? 0),
          },
          top_mistakes: payload.top_mistakes.map((m: any) => ({
            category: String(m.category ?? 'Uncategorized'),
            count: Number(m.count ?? 0),
          })),
          signups_by_source_30d: Array.isArray(payload.signups_by_source_30d)
            ? payload.signups_by_source_30d.map((s: any) => ({
                source: String(s.source ?? 'direct'),
                count: Number(s.count ?? 0),
              }))
            : [],
          signups_by_source_all: Array.isArray(payload.signups_by_source_all)
            ? payload.signups_by_source_all.map((s: any) => ({
                source: String(s.source ?? 'direct'),
                count: Number(s.count ?? 0),
              }))
            : [],
        };
      }
    }
  } catch (rpcErr) {
    console.warn('RPC get_admin_overview_stats error, falling back to direct queries:', rpcErr);
  }

  // Strategy 2: Direct queries fallback
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, created_at, onboarding_completed, source');

  if (pErr) throw pErr;

  const allProfiles = profiles || [];
  const signed_up = allProfiles.length;
  const completed_onboarding = allProfiles.filter((p) => p.onboarding_completed).length;
  const new_signups_today = allProfiles.filter((p) => p.created_at >= todayStart).length;
  const new_signups_this_week = allProfiles.filter((p) => p.created_at >= sevenDaysAgo).length;

  // Source aggregations for 30d and all-time
  const sourceMap30d: Record<string, number> = {};
  const sourceMapAll: Record<string, number> = {};

  for (const p of allProfiles) {
    const src = (p.source as string) || 'direct';
    sourceMapAll[src] = (sourceMapAll[src] || 0) + 1;
    if (p.created_at >= thirtyDaysAgo) {
      sourceMap30d[src] = (sourceMap30d[src] || 0) + 1;
    }
  }

  const signups_by_source_30d: AdminSourceCount[] = Object.entries(sourceMap30d)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const signups_by_source_all: AdminSourceCount[] = Object.entries(sourceMapAll)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Sessions
  const { data: sessions, error: sErr } = await supabase
    .from('sessions')
    .select('id, user_id, started_at, status');

  if (sErr) throw sErr;

  const allSessions = sessions || [];
  const active_sessions_today = allSessions.filter((s) => s.started_at >= todayStart).length;
  const total_sessions_completed = allSessions.filter((s) => s.status === 'completed').length;

  // Count sessions per user for funnel
  const userSessionCounts: Record<string, number> = {};
  for (const s of allSessions) {
    if (s.user_id) {
      userSessionCounts[s.user_id] = (userSessionCounts[s.user_id] || 0) + 1;
    }
  }

  const had_first_session = Object.values(userSessionCounts).filter((cnt) => cnt >= 1).length;
  const reached_session_5 = Object.values(userSessionCounts).filter((cnt) => cnt >= 5).length;

  // 3. Mistakes aggregation
  const { data: recaps, error: rErr } = await supabase
    .from('diagnostic_recaps')
    .select('mistakes');

  if (rErr) throw rErr;

  const categoryCounts: Record<string, number> = {};
  for (const r of recaps || []) {
    if (Array.isArray(r.mistakes)) {
      for (const m of r.mistakes) {
        if (m && typeof m === 'object' && m.category) {
          const cat = String(m.category).trim();
          if (cat) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        }
      }
    }
  }

  const top_mistakes: AdminMistakeCategory[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    stats: {
      new_signups_today,
      new_signups_this_week,
      active_sessions_today,
      total_sessions_completed,
    },
    funnel: {
      signed_up,
      completed_onboarding,
      had_first_session,
      reached_session_5,
    },
    top_mistakes,
    signups_by_source_30d,
    signups_by_source_all,
  };
}
