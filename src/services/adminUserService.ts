import { supabase } from '../lib/supabase';
import { AdminDirectoryUser, CefrLevel, UserOverrides, Session, DiagnosticRecap } from '../lib/database.types';
import { logAdminAuditAction } from './adminAuditService';
import { resetOnboarding } from '../lib/onboarding';

/**
 * Fetches all users from directory view/RPC with client-side fallback.
 */
export async function fetchAdminUsersDirectory(sourceFilter?: string): Promise<AdminDirectoryUser[]> {
  try {
    const { data, error } = await supabase.rpc('get_admin_users_directory', {
      p_source: sourceFilter && sourceFilter !== 'all' ? sourceFilter : null,
    });
    if (!error && data && Array.isArray(data)) {
      return data as AdminDirectoryUser[];
    }
  } catch (rpcErr) {
    console.warn('get_admin_users_directory RPC error, falling back to direct queries:', rpcErr);
  }

  // Fallback: Direct table query
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (sourceFilter && sourceFilter !== 'all') {
    query = query.eq('source', sourceFilter);
  }

  const { data: profiles, error: pErr } = await query;

  if (pErr) throw pErr;

  const { data: streaks, error: sErr } = await supabase
    .from('streaks')
    .select('*');

  if (sErr) throw sErr;

  const streakMap = new Map((streaks || []).map((s) => [s.user_id, s]));

  return (profiles || []).map((p) => {
    const s = streakMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      email: p.name ? `${p.name.toLowerCase().replace(/\s+/g, '.')}@user` : 'user@speechai',
      photo_url: p.photo_url,
      cefr_level: p.cefr_level as CefrLevel | null,
      primary_domain: p.primary_domain,
      primary_subbranch: p.primary_subbranch,
      added_domains: p.added_domains || [],
      urgency_date: p.urgency_date,
      notifications_enabled: p.notifications_enabled ?? true,
      onboarding_completed: p.onboarding_completed ?? false,
      is_suspended: p.is_suspended ?? false,
      user_overrides: p.user_overrides || {},
      source: p.source,
      source_detail: p.source_detail,
      created_at: p.created_at,
      current_streak: s?.current_streak ?? 0,
      last_session_date: s?.last_session_date ?? null,
      total_sessions: s?.total_sessions ?? 0,
      total_modules_completed: s?.total_modules_completed ?? 0,
    };
  });
}

/**
 * Fetch all sessions for a specific user.
 */
export async function fetchUserSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Session[];
}

/**
 * Fetch all diagnostic recaps for a specific user.
 */
export async function fetchUserDiagnosticRecaps(userId: string): Promise<DiagnosticRecap[]> {
  const { data, error } = await supabase
    .from('diagnostic_recaps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as DiagnosticRecap[];
}

/**
 * Small action: Edit CEFR level override.
 */
export async function updateAdminUserCefrLevel(
  adminUserId: string,
  userId: string,
  newLevel: CefrLevel,
  previousLevel: CefrLevel | null
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ cefr_level: newLevel })
    .eq('id', userId);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'update_cefr_level',
    targetType: 'user',
    targetId: userId,
    details: { previousLevel, newLevel },
  });
}

/**
 * Small action: Edit added domains list.
 */
export async function updateAdminUserAddedDomains(
  adminUserId: string,
  userId: string,
  addedDomains: Array<{ domain: string; subbranch: string }>,
  previousDomains: Array<{ domain: string; subbranch: string }>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ added_domains: addedDomains })
    .eq('id', userId);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'update_added_domains',
    targetType: 'user',
    targetId: userId,
    details: { previousDomains, addedDomains },
  });
}

/**
 * Small action: Toggle notification preference.
 */
export async function toggleAdminUserNotifications(
  adminUserId: string,
  userId: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ notifications_enabled: enabled })
    .eq('id', userId);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'toggle_notifications',
    targetType: 'user',
    targetId: userId,
    details: { notifications_enabled: enabled },
  });
}

/**
 * Big action: Reset user onboarding.
 */
export async function triggerAdminResetOnboarding(
  adminUserId: string,
  userId: string
): Promise<void> {
  const res = await resetOnboarding(userId);
  if (!res.success) {
    throw res.error || new Error('Failed to reset onboarding');
  }

  await logAdminAuditAction({
    adminUserId,
    action: 'reset_onboarding',
    targetType: 'user',
    targetId: userId,
    details: { timestamp: new Date().toISOString() },
  });
}

/**
 * Big action: Suspend or unsuspend user account.
 */
export async function toggleAdminUserSuspension(
  adminUserId: string,
  userId: string,
  isSuspended: boolean,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: isSuspended })
    .eq('id', userId);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: isSuspended ? 'suspend_user' : 'unsuspend_user',
    targetType: 'user',
    targetId: userId,
    details: { is_suspended: isSuspended, reason: reason || 'Admin action' },
  });
}

/**
 * Big action: Update per-user overrides (grant/restrict tab, mode, domain).
 */
export async function updateAdminUserOverrides(
  adminUserId: string,
  userId: string,
  overrides: UserOverrides,
  notes?: string
): Promise<void> {
  const updatedOverrides = { ...overrides, notes: notes || overrides.notes };
  const { error } = await supabase
    .from('profiles')
    .update({ user_overrides: updatedOverrides })
    .eq('id', userId);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'update_user_overrides',
    targetType: 'user',
    targetId: userId,
    details: { user_overrides: updatedOverrides },
  });
}

/**
 * Big action: Hard delete user account.
 */
export async function deleteAdminUserAccount(
  adminUserId: string,
  userId: string,
  userEmail: string
): Promise<void> {
  // 1. Clean up associated tables
  await supabase.from('diagnostic_recaps').delete().eq('user_id', userId);
  await supabase.from('sessions').delete().eq('user_id', userId);
  await supabase.from('streaks').delete().eq('user_id', userId);
  await supabase.from('admin_users').delete().eq('user_id', userId);
  const { error: pErr } = await supabase.from('profiles').delete().eq('id', userId);
  if (pErr) throw pErr;

  // 2. Log audit event
  await logAdminAuditAction({
    adminUserId,
    action: 'delete_user',
    targetType: 'user',
    targetId: userId,
    details: { email: userEmail, hard_deleted: true },
  });
}
