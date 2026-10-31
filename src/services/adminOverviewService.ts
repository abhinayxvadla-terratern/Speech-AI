import { supabase } from '../lib/supabase';
import { FeedbackStatus, UserFeedback } from '../lib/database.types';
import { DateRangeValue, isDateInRange } from '../components/admin/AdminDateRangeFilter';

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

export interface AdminRangeMetrics {
  total_users_all_time: number;
  new_users_in_range: number;
  new_user_percentage: number;
  existing_users_prior: number;
  sessions_in_range: number;
  completed_sessions_in_range: number;
  signups_by_source_range: AdminSourceCount[];
}

export interface AdminFeedbackOverviewItem {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  rating?: number | null;
  category: string;
  message?: string;
  session_id?: string | null;
  status: FeedbackStatus;
  created_at: string;
}

export interface AdminFeedbackOverviewData {
  recent_feedback: AdminFeedbackOverviewItem[];
  category_counts: Record<string, number>;
  rating_distribution: Record<number, number>;
  average_rating: number | null;
  ratings_count: number;
  total_count: number;
}

export interface AdminOverviewData {
  stats: AdminOverviewStats;
  funnel: AdminFunnelData;
  top_mistakes: AdminMistakeCategory[];
  signups_by_source_30d: AdminSourceCount[];
  signups_by_source_all: AdminSourceCount[];
  range_metrics?: AdminRangeMetrics;
  feedback?: AdminFeedbackOverviewData;
}

/**
 * Helper to compute range metrics across profiles and sessions
 */
function computeRangeMetrics(
  allProfiles: Array<{ id: string; created_at: string; source?: string | null }>,
  allSessions: Array<{ id: string; started_at: string; status?: string }>,
  dateRange: DateRangeValue
): AdminRangeMetrics {
  const total_users_all_time = allProfiles.length;
  const new_users_in_range = allProfiles.filter((p) => isDateInRange(p.created_at, dateRange)).length;
  const new_user_percentage =
    total_users_all_time > 0 ? Math.round((new_users_in_range / total_users_all_time) * 100) : 0;
  const existing_users_prior = total_users_all_time - new_users_in_range;

  const sessions_in_range = allSessions.filter((s) => isDateInRange(s.started_at, dateRange)).length;
  const completed_sessions_in_range = allSessions.filter(
    (s) => s.status === 'completed' && isDateInRange(s.started_at, dateRange)
  ).length;

  const sourceMapRange: Record<string, number> = {};
  for (const p of allProfiles) {
    if (isDateInRange(p.created_at, dateRange)) {
      const src = (p.source as string) || 'direct';
      sourceMapRange[src] = (sourceMapRange[src] || 0) + 1;
    }
  }

  const signups_by_source_range: AdminSourceCount[] = Object.entries(sourceMapRange)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_users_all_time,
    new_users_in_range,
    new_user_percentage,
    existing_users_prior,
    sessions_in_range,
    completed_sessions_in_range,
    signups_by_source_range,
  };
}

/**
 * Fetches admin overview metrics with date range comparison metrics.
 */
export async function fetchAdminOverviewData(
  dateRange: DateRangeValue = { preset: 'all', startDate: null, endDate: null, label: 'All Time' }
): Promise<AdminOverviewData> {
  // Query profiles and sessions for range calculations
  const [profilesRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('id, created_at, source, onboarding_completed'),
    supabase.from('sessions').select('id, user_id, started_at, status'),
  ]);

  const allProfiles = (profilesRes.data || []) as Array<{
    id: string;
    created_at: string;
    source?: string | null;
    onboarding_completed?: boolean;
  }>;
  const allSessions = (sessionsRes.data || []) as Array<{
    id: string;
    user_id: string;
    started_at: string;
    status: string;
  }>;

  const range_metrics = computeRangeMetrics(allProfiles, allSessions, dateRange);

  // Strategy 1: Fast server-side RPC for funnel and mistakes
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
          range_metrics,
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

  const signed_up = allProfiles.length;
  const completed_onboarding = allProfiles.filter((p) => p.onboarding_completed).length;
  const new_signups_today = allProfiles.filter((p) => p.created_at >= todayStart).length;
  const new_signups_this_week = allProfiles.filter((p) => p.created_at >= sevenDaysAgo).length;

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

  const active_sessions_today = allSessions.filter((s) => s.started_at >= todayStart).length;
  const total_sessions_completed = allSessions.filter((s) => s.status === 'completed').length;

  const userSessionCounts: Record<string, number> = {};
  for (const s of allSessions) {
    if (s.user_id) {
      userSessionCounts[s.user_id] = (userSessionCounts[s.user_id] || 0) + 1;
    }
  }

  const had_first_session = Object.values(userSessionCounts).filter((cnt) => cnt >= 1).length;
  const reached_session_5 = Object.values(userSessionCounts).filter((cnt) => cnt >= 5).length;

  // Mistakes aggregation
  const { data: recaps, error: rErr } = await supabase.from('diagnostic_recaps').select('mistakes');
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
    range_metrics,
  };
}

/**
 * Fetches recent feedback submissions platform-wide with category counts and optional date filtering.
 */
export async function fetchAdminFeedbackOverview(
  dateRange?: DateRangeValue
): Promise<AdminFeedbackOverviewData> {
  const { data: feedbackRows, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin feedback overview:', error);
    return {
      recent_feedback: [],
      category_counts: {},
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      average_rating: null,
      ratings_count: 0,
      total_count: 0,
    };
  }

  let rows = (feedbackRows || []) as UserFeedback[];
  if (dateRange && dateRange.preset !== 'all') {
    rows = rows.filter((r) => isDateInRange(r.created_at, dateRange));
  }

  // Fetch profiles to get user names for display
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const profileMap = new Map<string, { name?: string }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    (profiles || []).forEach((p) => {
      profileMap.set(p.id, { name: p.name });
    });
  }

  const categoryCounts: Record<string, number> = {
    'Bug': 0,
    'Feature request': 0,
    'Content issue': 0,
    'Other': 0,
  };

  const ratingDistribution: Record<number, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let ratingSum = 0;
  let ratingsCount = 0;

  rows.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    if (r.rating && r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
      ratingSum += r.rating;
      ratingsCount += 1;
    }
  });

  const averageRating = ratingsCount > 0 ? Number((ratingSum / ratingsCount).toFixed(1)) : null;

  const recentFeedback: AdminFeedbackOverviewItem[] = rows.slice(0, 10).map((r) => {
    const prof = profileMap.get(r.user_id);
    return {
      ...r,
      message: r.message || '',
      user_name: prof?.name || 'User ' + r.user_id.slice(0, 8),
    };
  });

  return {
    recent_feedback: recentFeedback,
    category_counts: categoryCounts,
    rating_distribution: ratingDistribution,
    average_rating: averageRating,
    ratings_count: ratingsCount,
    total_count: rows.length,
  };
}

