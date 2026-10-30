-- Migration: 20261029184200_create_pressure_modes_and_content_admin_policies.sql
-- Create pressure_modes table, add icon column to scenarios, and grant admin write policies

-- 1. Create pressure_modes table if not exists
CREATE TABLE IF NOT EXISTS public.pressure_modes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add icon to scenarios if not exists
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS icon TEXT;

-- 3. Enable RLS on pressure_modes
ALTER TABLE public.pressure_modes ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies on pressure_modes
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pressure_modes' AND policyname = 'pressure_modes_read'
    ) THEN
        CREATE POLICY "pressure_modes_read" ON public.pressure_modes 
        FOR SELECT TO authenticated, anon USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pressure_modes' AND policyname = 'pressure_modes_admin_all'
    ) THEN
        CREATE POLICY "pressure_modes_admin_all" ON public.pressure_modes 
        FOR ALL TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

-- 5. RLS Admin write policies on modules, scenarios, interview_types
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modules' AND policyname = 'modules_admin_all'
    ) THEN
        CREATE POLICY "modules_admin_all" ON public.modules 
        FOR ALL TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'scenarios' AND policyname = 'scenarios_admin_all'
    ) THEN
        CREATE POLICY "scenarios_admin_all" ON public.scenarios 
        FOR ALL TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'interview_types' AND policyname = 'interview_types_admin_all'
    ) THEN
        CREATE POLICY "interview_types_admin_all" ON public.interview_types 
        FOR ALL TO authenticated 
        USING (public.is_active_admin()) 
        WITH CHECK (public.is_active_admin());
    END IF;
END $$;

-- 6. Seed the 3 pressure modes
INSERT INTO public.pressure_modes (id, name, description, badge_color) VALUES
('Relaxed', 'Relaxed', 'Take your time, no time pressure', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
('Standard', 'Standard', 'Realistic pacing and natural German interviewer cadence', 'bg-blue-50 text-[#255CC1] border-blue-200'),
('High-Pressure', 'High-Pressure', 'Fast follow-ups, interruptions simulated — for exam-day readiness', 'bg-rose-50 text-rose-700 border-rose-200')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, badge_color = EXCLUDED.badge_color;
