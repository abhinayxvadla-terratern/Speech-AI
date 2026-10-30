-- Migration: 20261030113000_create_feedback_table_and_notification.sql
-- Create feedback table with rating, RLS policies, and admin notification trigger

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  category text NOT NULL CHECK (category IN ('Bug', 'Feature request', 'Content issue', 'Other')),
  message text NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON public.feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'users_insert_feedback'
  ) THEN
    CREATE POLICY "users_insert_feedback" ON public.feedback
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can view their own feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'users_select_own_feedback'
  ) THEN
    CREATE POLICY "users_select_own_feedback" ON public.feedback
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Admins can view all feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'admins_select_all_feedback'
  ) THEN
    CREATE POLICY "admins_select_all_feedback" ON public.feedback
    FOR SELECT TO authenticated
    USING (public.is_active_admin());
  END IF;
END $$;

-- Policy: Admins can update all feedback (e.g. status)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'admins_update_feedback'
  ) THEN
    CREATE POLICY "admins_update_feedback" ON public.feedback
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());
  END IF;
END $$;

-- Ensure admin_audit_log admin_user_id is nullable for system events
ALTER TABLE public.admin_audit_log ALTER COLUMN admin_user_id DROP NOT NULL;

-- 2. Trigger function to record admin audit / notification on new feedback
CREATE OR REPLACE FUNCTION public.notify_admin_on_feedback()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
  v_admin_id uuid;
BEGIN
  -- Retrieve user's email if available
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.user_id;

  -- Find active admin user id
  SELECT id INTO v_admin_id FROM public.admin_users WHERE status = 'active' ORDER BY created_at ASC LIMIT 1;
  
  -- Record to admin_audit_log for immediate visibility in Admin Panel Activity
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'USER_FEEDBACK_SUBMITTED',
    'feedback',
    NEW.id::text,
    jsonb_build_object(
      'rating', NEW.rating,
      'category', NEW.category,
      'message', NEW.message,
      'session_id', NEW.session_id,
      'user_id', NEW.user_id,
      'user_email', v_user_email,
      'status', NEW.status,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_admin_on_feedback'
  ) THEN
    CREATE TRIGGER trg_notify_admin_on_feedback
    AFTER INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_on_feedback();
  END IF;
END $$;
