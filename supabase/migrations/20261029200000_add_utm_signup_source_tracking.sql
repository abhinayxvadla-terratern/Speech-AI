-- Migration: 20261029200000_add_utm_signup_source_tracking.sql
-- Add signup_source enum, source & source_detail columns to profiles, and update directory & overview RPCs

-- 1. Create signup_source enum
DO $$ BEGIN
  CREATE TYPE public.signup_source AS ENUM (
    'organic',
    'paid_search',
    'paid_social',
    'referral',
    'partner',
    'direct',
    'admin_created',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add source and source_detail columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS source public.signup_source DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS source_detail JSONB DEFAULT NULL;

-- 3. Create overloaded get_admin_users_directory(p_source) to include source and source_detail
CREATE OR REPLACE FUNCTION public.get_admin_users_directory(p_source TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  photo_url TEXT,
  cefr_level TEXT,
  primary_domain TEXT,
  primary_subbranch TEXT,
  added_domains JSONB,
  urgency_date DATE,
  notifications_enabled BOOLEAN,
  onboarding_completed BOOLEAN,
  is_suspended BOOLEAN,
  user_overrides JSONB,
  source public.signup_source,
  source_detail JSONB,
  created_at TIMESTAMPTZ,
  current_streak INT,
  last_session_date DATE,
  total_sessions INT,
  total_modules_completed INT
) AS $$
BEGIN
  IF NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    u.email::text,
    p.photo_url,
    p.cefr_level,
    p.primary_domain,
    p.primary_subbranch,
    p.added_domains,
    p.urgency_date,
    p.notifications_enabled,
    p.onboarding_completed,
    p.is_suspended,
    p.user_overrides,
    p.source,
    p.source_detail,
    p.created_at,
    COALESCE(s.current_streak, 0)::int,
    s.last_session_date,
    COALESCE(s.total_sessions, 0)::int,
    COALESCE(s.total_modules_completed, 0)::int
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.streaks s ON p.id = s.user_id
  WHERE (p_source IS NULL OR p_source = 'all' OR p.source::text = p_source)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_admin_overview_stats() to include signups_by_source (30d and all-time)
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  WITH user_session_counts AS (
    SELECT user_id, count(*) as session_count
    FROM public.sessions
    GROUP BY user_id
  ),
  ranked_mistakes AS (
    SELECT elem->>'category' AS category, count(*)::int AS count
    FROM public.diagnostic_recaps,
         jsonb_array_elements(mistakes) AS elem
    WHERE elem->>'category' IS NOT NULL AND elem->>'category' != ''
    GROUP BY elem->>'category'
    ORDER BY count DESC
    LIMIT 5
  ),
  source_counts_30d AS (
    SELECT COALESCE(source::text, 'direct') AS src, count(*)::int AS count
    FROM public.profiles
    WHERE created_at >= (now() - interval '30 days')
    GROUP BY COALESCE(source::text, 'direct')
    ORDER BY count DESC
  ),
  source_counts_all AS (
    SELECT COALESCE(source::text, 'direct') AS src, count(*)::int AS count
    FROM public.profiles
    GROUP BY COALESCE(source::text, 'direct')
    ORDER BY count DESC
  )
  SELECT jsonb_build_object(
    'stats', jsonb_build_object(
      'new_signups_today', (SELECT count(*)::int FROM public.profiles WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'UTC')),
      'new_signups_this_week', (SELECT count(*)::int FROM public.profiles WHERE created_at >= (CURRENT_DATE AT TIME ZONE 'UTC' - interval '7 days')),
      'active_sessions_today', (SELECT count(*)::int FROM public.sessions WHERE started_at >= (CURRENT_DATE AT TIME ZONE 'UTC')),
      'total_sessions_completed', (SELECT count(*)::int FROM public.sessions WHERE status = 'completed')
    ),
    'funnel', jsonb_build_object(
      'signed_up', (SELECT count(*)::int FROM public.profiles),
      'completed_onboarding', (SELECT count(*)::int FROM public.profiles WHERE onboarding_completed = true),
      'had_first_session', COALESCE((SELECT count(*)::int FROM user_session_counts WHERE session_count >= 1), 0),
      'reached_session_5', COALESCE((SELECT count(*)::int FROM user_session_counts WHERE session_count >= 5), 0)
    ),
    'top_mistakes', COALESCE((SELECT jsonb_agg(jsonb_build_object('category', category, 'count', count)) FROM ranked_mistakes), '[]'::jsonb),
    'signups_by_source_30d', COALESCE((SELECT jsonb_agg(jsonb_build_object('source', src, 'count', count)) FROM source_counts_30d), '[]'::jsonb),
    'signups_by_source_all', COALESCE((SELECT jsonb_agg(jsonb_build_object('source', src, 'count', count)) FROM source_counts_all), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
