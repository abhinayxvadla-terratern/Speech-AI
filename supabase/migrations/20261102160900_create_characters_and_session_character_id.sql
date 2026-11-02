-- 1. Create characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  domain TEXT NOT NULL,
  sub_branch TEXT,
  intro_line TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add character_id to sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sessions' 
      AND column_name = 'character_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Enable RLS on characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'characters' 
      AND policyname = 'Allow read access to characters'
  ) THEN
    CREATE POLICY "Allow read access to characters" ON public.characters FOR SELECT USING (true);
  END IF;
END $$;

-- 4. Seed placeholder domain characters
INSERT INTO public.characters (name, role, domain, sub_branch, intro_line, is_active)
SELECT 'Schwester Sabine', 'Senior Ward Nurse', 'Healthcare', 'Nursing', 'Hallo! Ich bin Schwester Sabine. Auf Station 4 müssen wir heute die Patientenübergabe machen.', true
WHERE NOT EXISTS (SELECT 1 FROM public.characters WHERE name = 'Schwester Sabine');

INSERT INTO public.characters (name, role, domain, sub_branch, intro_line, is_active)
SELECT 'Meister Weber', 'Workshop Trainer', 'Ausbildung', 'Mechatronics', 'Guten Morgen! In der Werkstatt prüfen wir heute die Sicherheitsventile.', true
WHERE NOT EXISTS (SELECT 1 FROM public.characters WHERE name = 'Meister Weber');

INSERT INTO public.characters (name, role, domain, sub_branch, intro_line, is_active)
SELECT 'Frau Dr. Keller', 'University Admissions Officer', 'Study/University', 'General', 'Guten Tag! Willkommen im Immatrikulationsbüro der Universität.', true
WHERE NOT EXISTS (SELECT 1 FROM public.characters WHERE name = 'Frau Dr. Keller');

INSERT INTO public.characters (name, role, domain, sub_branch, intro_line, is_active)
SELECT 'Herr Becker', 'Project Lead', 'Workplace Integration', 'IT', 'Hallo! Willkommen im Team. Lassen Sie uns über das Projekt sprechen.', true
WHERE NOT EXISTS (SELECT 1 FROM public.characters WHERE name = 'Herr Becker');

INSERT INTO public.characters (name, role, domain, sub_branch, intro_line, is_active)
SELECT 'Frau Schneider', 'Integration Officer', 'Settlement', 'General', 'Guten Tag! Ich bin Frau Schneider vom Bürgeramt. Wie kann ich Ihnen helfen?', true
WHERE NOT EXISTS (SELECT 1 FROM public.characters WHERE name = 'Frau Schneider');
