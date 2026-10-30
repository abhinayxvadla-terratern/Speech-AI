-- Migration: 20261029183200_add_user_management_columns_and_directory_rpc.sql
-- Add suspension & per-user override columns, directory view RPC, and admin modification policies

-- 1. Add columns to profiles if they do not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS user_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Add admin update/delete policies on profiles, streaks, sessions, recaps
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'admin_update_profiles'
    ) THEN
        CREATE POLICY "admin_update_profiles" ON public.profiles 
        FOR UPDATE TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'admin_delete_profiles'
    ) THEN
        CREATE POLICY "admin_delete_profiles" ON public.profiles 
        FOR DELETE TO authenticated 
        USING (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'streaks' AND policyname = 'admin_all_streaks'
    ) THEN
        CREATE POLICY "admin_all_streaks" ON public.streaks 
        FOR ALL TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sessions' AND policyname = 'admin_delete_sessions'
    ) THEN
        CREATE POLICY "admin_delete_sessions" ON public.sessions 
        FOR DELETE TO authenticated 
        USING (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_recaps' AND policyname = 'admin_delete_diagnostic_recaps'
    ) THEN
        CREATE POLICY "admin_delete_diagnostic_recaps" ON public.diagnostic_recaps 
        FOR DELETE TO authenticated 
        USING (public.is_active_admin());
    END IF;
END $$;

-- 3. RPC: Directory view joining profiles, auth.users and streaks
CREATE OR REPLACE FUNCTION public.get_admin_users_directory()
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
    p.created_at,
    COALESCE(s.current_streak, 0)::int,
    s.last_session_date,
    COALESCE(s.total_sessions, 0)::int,
    COALESCE(s.total_modules_completed, 0)::int
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.streaks s ON p.id = s.user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
