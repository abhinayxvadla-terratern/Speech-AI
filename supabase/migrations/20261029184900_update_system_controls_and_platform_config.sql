-- Migration: 20261029184900_update_system_controls_and_platform_config.sql
-- Add acknowledged column to llm_provider_log, grant admin write policies, and seed default configs

-- 1. Add acknowledged to llm_provider_log
ALTER TABLE public.llm_provider_log ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN NOT NULL DEFAULT false;

-- 2. Grant ALL on llm_provider_log to admins
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'llm_provider_log' AND policyname = 'llm_provider_log_admin_all'
    ) THEN
        CREATE POLICY "llm_provider_log_admin_all" ON public.llm_provider_log 
        FOR ALL TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

-- 3. Seed default platform configurations
INSERT INTO public.platform_config (key, value) VALUES
('killswitch_tabs', '{"disabled": []}'::jsonb),
('killswitch_domains', '{"disabled": []}'::jsonb),
('killswitch_modes', '{"disabled": []}'::jsonb),
('openrouter_tier', '{"tier": "tier_1000", "daily_limit": 1000}'::jsonb),
('groq_token_ceiling', '{"daily_token_limit": 100000, "estimated_tokens_per_call": 600}'::jsonb)
ON CONFLICT (key) DO NOTHING;
