-- Migration: 20261029182500_add_admin_read_policies_and_overview_rpc.sql
-- Grant SELECT permissions to active admins and provide fast overview aggregation RPC

-- 1. Grant SELECT on existing tables to active admins
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'admin_select_profiles'
    ) THEN
        CREATE POLICY "admin_select_profiles" ON public.profiles 
        FOR SELECT TO authenticated USING (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sessions' AND policyname = 'admin_select_sessions'
    ) THEN
        CREATE POLICY "admin_select_sessions" ON public.sessions 
        FOR SELECT TO authenticated USING (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_recaps' AND policyname = 'admin_select_diagnostic_recaps'
    ) THEN
        CREATE POLICY "admin_select_diagnostic_recaps" ON public.diagnostic_recaps 
        FOR SELECT TO authenticated USING (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'streaks' AND policyname = 'admin_select_streaks'
    ) THEN
        CREATE POLICY "admin_select_streaks" ON public.streaks 
        FOR SELECT TO authenticated USING (public.is_active_admin());
    END IF;
END $$;

-- 2. Create the get_admin_overview_stats RPC
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
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
    'top_mistakes', COALESCE((SELECT jsonb_agg(jsonb_build_object('category', category, 'count', count)) FROM ranked_mistakes), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
