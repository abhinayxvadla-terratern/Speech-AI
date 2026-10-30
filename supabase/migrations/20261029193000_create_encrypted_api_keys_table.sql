-- Migration: 20261029193000_create_encrypted_api_keys_table.sql
-- Dedicated encrypted table for LLM provider API keys (Groq, OpenRouter)

CREATE TABLE IF NOT EXISTS public.encrypted_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  encrypted_value TEXT NOT NULL,
  key_mask TEXT NOT NULL,
  updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encrypted_api_keys_provider ON public.encrypted_api_keys(provider);

ALTER TABLE public.encrypted_api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'encrypted_api_keys' AND policyname = 'encrypted_api_keys_admin_all'
  ) THEN
    CREATE POLICY "encrypted_api_keys_admin_all" ON public.encrypted_api_keys
      FOR ALL TO authenticated
      USING (public.is_active_superadmin())
      WITH CHECK (public.is_active_superadmin());
  END IF;
END $$;

-- RPC to list key metadata safely without exposing encrypted_value to client
CREATE OR REPLACE FUNCTION public.get_admin_api_key_metadata()
RETURNS TABLE (
  id UUID,
  provider TEXT,
  key_mask TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_active_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    k.id,
    k.provider,
    k.key_mask,
    k.updated_by,
    k.updated_at,
    k.created_at
  FROM public.encrypted_api_keys k
  ORDER BY k.provider ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get encrypted ciphertext for server-side decryption
CREATE OR REPLACE FUNCTION public.get_encrypted_provider_key(p_provider TEXT)
RETURNS TABLE (
  provider TEXT,
  encrypted_value TEXT,
  key_mask TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT k.provider, k.encrypted_value, k.key_mask
  FROM public.encrypted_api_keys k
  WHERE k.provider = p_provider
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for admin to safely store encrypted key and write audit log
CREATE OR REPLACE FUNCTION public.set_encrypted_provider_key(
  p_provider TEXT,
  p_encrypted_value TEXT,
  p_key_mask TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF NOT public.is_active_superadmin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required to update API keys';
  END IF;

  SELECT id INTO v_admin_id 
  FROM public.admin_users 
  WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
  LIMIT 1;

  INSERT INTO public.encrypted_api_keys (
    provider,
    encrypted_value,
    key_mask,
    updated_by,
    updated_at
  ) VALUES (
    p_provider,
    p_encrypted_value,
    p_key_mask,
    v_admin_id,
    now()
  )
  ON CONFLICT (provider) DO UPDATE SET
    encrypted_value = EXCLUDED.encrypted_value,
    key_mask = EXCLUDED.key_mask,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  -- Write to admin_audit_log WITHOUT logging the raw key value
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'update_api_key',
    'api_key',
    p_provider,
    jsonb_build_object(
      'provider', p_provider,
      'key_mask', p_key_mask,
      'updated_at', now()
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
