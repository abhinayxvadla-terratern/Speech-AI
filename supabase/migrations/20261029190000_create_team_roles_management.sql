-- Migration: 20261029190000_create_team_roles_management.sql
-- Team & Roles Management and RBAC RPCs for SpeechAI Admin Panel

-- 1. Alter admin_users table to allow user_id to be NULL for pending invites and add email column
ALTER TABLE public.admin_users ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create index on lower(email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower ON public.admin_users(lower(email)) WHERE email IS NOT NULL;

-- 3. Helper to check if caller is an active admin with admin role
CREATE OR REPLACE FUNCTION public.is_active_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. RPC to list all team members with names and inviter details
CREATE OR REPLACE FUNCTION public.get_admin_team_members()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  name TEXT,
  role public.admin_role,
  status public.admin_status,
  invited_by UUID,
  invited_by_email TEXT,
  invited_by_name TEXT,
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.user_id,
    COALESCE(au.email, u.email::text, '') AS email,
    COALESCE(p.name, u.raw_user_meta_data->>'full_name', split_part(COALESCE(au.email, u.email::text, 'Admin'), '@', 1)) AS name,
    au.role,
    au.status,
    au.invited_by,
    COALESCE(inv_u.email::text, inv_au.email, '') AS invited_by_email,
    COALESCE(inv_p.name, inv_u.raw_user_meta_data->>'full_name', split_part(COALESCE(inv_u.email::text, inv_au.email, 'System'), '@', 1)) AS invited_by_name,
    au.invited_at,
    au.created_at
  FROM public.admin_users au
  LEFT JOIN auth.users u ON au.user_id = u.id
  LEFT JOIN public.profiles p ON au.user_id = p.id
  LEFT JOIN public.admin_users inv_au ON au.invited_by = inv_au.id
  LEFT JOIN auth.users inv_u ON inv_au.user_id = inv_u.id
  LEFT JOIN public.profiles inv_p ON inv_au.user_id = inv_p.id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC to invite a new admin team member
CREATE OR REPLACE FUNCTION public.invite_admin_user(
  p_email TEXT,
  p_role public.admin_role
)
RETURNS UUID AS $$
DECLARE
  v_inviter_id UUID;
  v_target_user_id UUID;
  v_new_id UUID;
  v_normalized_email TEXT;
BEGIN
  -- Require caller to be an active 'admin' role
  SELECT id INTO v_inviter_id 
  FROM public.admin_users 
  WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
  LIMIT 1;

  IF v_inviter_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: Only users with the admin role can invite team members';
  END IF;

  v_normalized_email := lower(trim(p_email));
  IF v_normalized_email = '' OR v_normalized_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Please provide a valid email address';
  END IF;

  -- Check if already exists in admin_users
  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE lower(email) = v_normalized_email
  ) THEN
    RAISE EXCEPTION 'A team member or invitation already exists for this email';
  END IF;

  -- Check if user exists in auth.users
  SELECT id INTO v_target_user_id 
  FROM auth.users 
  WHERE lower(email) = v_normalized_email 
  LIMIT 1;

  -- Insert pending row
  INSERT INTO public.admin_users (
    user_id,
    email,
    role,
    status,
    invited_by,
    invited_at
  ) VALUES (
    v_target_user_id,
    v_normalized_email,
    p_role,
    'pending',
    v_inviter_id,
    now()
  ) RETURNING id INTO v_new_id;

  -- Write to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_inviter_id,
    'invite_team_member',
    'admin_user',
    v_new_id::text,
    jsonb_build_object(
      'email', v_normalized_email,
      'role', p_role,
      'has_existing_account', (v_target_user_id IS NOT NULL)
    )
  );

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC to update an admin member's role
CREATE OR REPLACE FUNCTION public.update_admin_user_role(
  p_target_id UUID,
  p_new_role public.admin_role
)
RETURNS BOOLEAN AS $$
DECLARE
  v_inviter_id UUID;
  v_old_role public.admin_role;
  v_target_email TEXT;
BEGIN
  SELECT id INTO v_inviter_id 
  FROM public.admin_users 
  WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
  LIMIT 1;

  IF v_inviter_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: Only users with the admin role can change roles';
  END IF;

  SELECT role, COALESCE(email, user_id::text) 
  INTO v_old_role, v_target_email
  FROM public.admin_users 
  WHERE id = p_target_id;

  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Team member not found';
  END IF;

  UPDATE public.admin_users
  SET role = p_new_role
  WHERE id = p_target_id;

  -- Log to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_inviter_id,
    'change_team_role',
    'admin_user',
    p_target_id::text,
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_new_role,
      'target_email', v_target_email
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC to update an admin member's status (e.g. revoke, activate)
CREATE OR REPLACE FUNCTION public.update_admin_user_status(
  p_target_id UUID,
  p_new_status public.admin_status
)
RETURNS BOOLEAN AS $$
DECLARE
  v_inviter_id UUID;
  v_old_status public.admin_status;
  v_target_email TEXT;
  v_active_admin_count INT;
BEGIN
  SELECT id INTO v_inviter_id 
  FROM public.admin_users 
  WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
  LIMIT 1;

  IF v_inviter_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: Only users with the admin role can update member status';
  END IF;

  SELECT status, COALESCE(email, user_id::text)
  INTO v_old_status, v_target_email
  FROM public.admin_users 
  WHERE id = p_target_id;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Team member not found';
  END IF;

  -- Safety check: Cannot revoke your own access if you are the sole active admin
  IF p_new_status = 'revoked' AND v_inviter_id = p_target_id THEN
    SELECT count(*) INTO v_active_admin_count
    FROM public.admin_users
    WHERE role = 'admin' AND status = 'active';

    IF v_active_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot revoke your own access when you are the sole active admin';
    END IF;
  END IF;

  UPDATE public.admin_users
  SET status = p_new_status
  WHERE id = p_target_id;

  -- Log to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_inviter_id,
    CASE 
      WHEN p_new_status = 'revoked' THEN 'revoke_admin_access'
      WHEN p_new_status = 'active' THEN 'activate_admin_access'
      ELSE 'update_admin_status'
    END,
    'admin_user',
    p_target_id::text,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_new_status,
      'target_email', v_target_email
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to sync admin user on sign-in
CREATE OR REPLACE FUNCTION public.sync_current_admin_user()
RETURNS jsonb AS $$
DECLARE
  v_record RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. If already linked by user_id
  SELECT * INTO v_record FROM public.admin_users WHERE user_id = auth.uid() LIMIT 1;
  IF v_record.id IS NOT NULL THEN
    RETURN row_to_json(v_record)::jsonb;
  END IF;

  -- 2. If invited by email, link user_id
  SELECT * INTO v_record FROM public.admin_users 
  WHERE lower(email) = lower(auth.email()) 
  LIMIT 1;

  IF v_record.id IS NOT NULL THEN
    UPDATE public.admin_users 
    SET user_id = auth.uid(), email = auth.email()
    WHERE id = v_record.id;

    SELECT * INTO v_record FROM public.admin_users WHERE id = v_record.id;
    RETURN row_to_json(v_record)::jsonb;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
