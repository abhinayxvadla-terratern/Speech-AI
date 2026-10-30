import { supabase } from '../lib/supabase';
import { AdminTeamMember, AdminRole, AdminStatus } from '../lib/database.types';
import { logAdminAction } from './adminAuditService';

/**
 * Fetch all admin team members
 */
export async function fetchAdminTeamMembers(): Promise<AdminTeamMember[]> {
  try {
    const { data, error } = await supabase.rpc('get_admin_team_members');

    if (!error && Array.isArray(data)) {
      return data as AdminTeamMember[];
    }

    if (error) {
      console.warn('get_admin_team_members RPC failed, falling back to direct table query:', error);
    }
  } catch (rpcErr) {
    console.warn('RPC invocation error:', rpcErr);
  }

  // Fallback direct table query
  const { data: rows, error: selectErr } = await supabase
    .from('admin_users')
    .select(`
      id,
      user_id,
      email,
      role,
      status,
      invited_by,
      invited_at,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (selectErr) {
    throw selectErr;
  }

  // Map to AdminTeamMember format
  return (rows || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    email: row.email || 'Admin User',
    name: row.email ? row.email.split('@')[0] : 'Admin User',
    role: row.role as AdminRole,
    status: row.status as AdminStatus,
    invited_by: row.invited_by,
    invited_by_email: null,
    invited_by_name: null,
    invited_at: row.invited_at,
    created_at: row.created_at,
  }));
}

/**
 * Invite a new team member with specified role
 */
export async function inviteAdminMember(
  email: string,
  role: AdminRole,
  currentAdminId: string
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase.rpc('invite_admin_user', {
      p_email: normalizedEmail,
      p_role: role,
    });

    if (!error && data) {
      return data as string;
    }

    if (error) {
      console.warn('invite_admin_user RPC failed, trying fallback insert:', error);
      throw error;
    }
  } catch (rpcErr: any) {
    // If the error was explicitly from Postgres (e.g. invalid email or already exists), throw it
    if (rpcErr?.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('does not exist')) {
      throw rpcErr;
    }

    // Direct fallback insert
    const { data: inserted, error: insertErr } = await supabase
      .from('admin_users')
      .insert({
        email: normalizedEmail,
        role,
        status: 'pending',
        invited_by: currentAdminId,
        invited_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      throw insertErr;
    }

    // Write to audit log
    await logAdminAction(
      currentAdminId,
      'invite_team_member',
      'admin_user',
      inserted.id,
      { email: normalizedEmail, role }
    );

    return inserted.id;
  }

  throw new Error('Failed to create invitation');
}

/**
 * Update an existing member's role (admin only)
 */
export async function updateAdminMemberRole(
  targetAdminId: string,
  newRole: AdminRole,
  currentAdminId: string,
  targetEmail: string,
  oldRole: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_admin_user_role', {
      p_target_id: targetAdminId,
      p_new_role: newRole,
    });

    if (!error) return;

    if (error) {
      console.warn('update_admin_user_role RPC failed, trying fallback update:', error);
      throw error;
    }
  } catch (rpcErr: any) {
    if (rpcErr?.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('does not exist')) {
      throw rpcErr;
    }

    const { error: updateErr } = await supabase
      .from('admin_users')
      .update({ role: newRole })
      .eq('id', targetAdminId);

    if (updateErr) throw updateErr;

    await logAdminAction(
      currentAdminId,
      'change_team_role',
      'admin_user',
      targetAdminId,
      { target_email: targetEmail, old_role: oldRole, new_role: newRole }
    );
  }
}

/**
 * Update a member's status (e.g. revoke, activate)
 */
export async function updateAdminMemberStatus(
  targetAdminId: string,
  newStatus: AdminStatus,
  currentAdminId: string,
  targetEmail: string,
  oldStatus: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_admin_user_status', {
      p_target_id: targetAdminId,
      p_new_status: newStatus,
    });

    if (!error) return;

    if (error) {
      console.warn('update_admin_user_status RPC failed, trying fallback update:', error);
      throw error;
    }
  } catch (rpcErr: any) {
    if (rpcErr?.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('does not exist')) {
      throw rpcErr;
    }

    const { error: updateErr } = await supabase
      .from('admin_users')
      .update({ status: newStatus })
      .eq('id', targetAdminId);

    if (updateErr) throw updateErr;

    const actionName =
      newStatus === 'revoked'
        ? 'revoke_admin_access'
        : newStatus === 'active'
        ? 'activate_admin_access'
        : 'update_admin_status';

    await logAdminAction(
      currentAdminId,
      actionName,
      'admin_user',
      targetAdminId,
      { target_email: targetEmail, old_status: oldStatus, new_status: newStatus }
    );
  }
}

/**
 * Delete a pending invitation
 */
export async function deleteAdminInvite(
  targetAdminId: string,
  currentAdminId: string,
  targetEmail: string
): Promise<void> {
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', targetAdminId);

  if (error) throw error;

  await logAdminAction(
    currentAdminId,
    'delete_admin_invite',
    'admin_user',
    targetAdminId,
    { target_email: targetEmail }
  );
}
