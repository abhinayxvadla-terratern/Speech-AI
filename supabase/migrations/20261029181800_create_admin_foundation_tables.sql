-- Migration: 20261029181800_create_admin_foundation_tables.sql
-- Foundation tables for SpeechAI Admin Panel

-- 1. Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE public.admin_role AS ENUM ('admin', 'support', 'content_editor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.admin_status AS ENUM ('active', 'pending', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.admin_role NOT NULL DEFAULT 'admin',
    invited_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ DEFAULT now(),
    status public.admin_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT admin_users_user_id_unique UNIQUE (user_id)
);

-- Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Helper function to check if current user is an active admin
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- 4. Create platform_config table
CREATE TABLE IF NOT EXISTS public.platform_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create llm_provider_log table
CREATE TABLE IF NOT EXISTS public.llm_provider_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_provider_log_session_id ON public.llm_provider_log(session_id);
CREATE INDEX IF NOT EXISTS idx_llm_provider_log_created_at ON public.llm_provider_log(created_at DESC);

-- 6. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_provider_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for admin_users
CREATE POLICY "admin_users_select_self_or_admin"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_active_admin());

CREATE POLICY "admin_users_write_admin"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

-- 8. RLS Policies for admin_audit_log
CREATE POLICY "admin_audit_log_admin_all"
    ON public.admin_audit_log
    FOR ALL
    TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

-- 9. RLS Policies for platform_config
CREATE POLICY "platform_config_read"
    ON public.platform_config
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "platform_config_write_admin"
    ON public.platform_config
    FOR ALL
    TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

-- 10. RLS Policies for llm_provider_log
CREATE POLICY "llm_provider_log_insert"
    ON public.llm_provider_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "llm_provider_log_select_admin"
    ON public.llm_provider_log
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());
