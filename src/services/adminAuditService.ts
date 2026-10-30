import { supabase } from '../lib/supabase';
import { Json } from '../lib/database.types';

export interface LogAuditParams {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any> | Json;
}

/**
 * Inserts an append-only audit trail record in admin_audit_log.
 * Accepts either an object or positional arguments.
 */
export async function logAdminAuditAction(
  paramOrAdminId: LogAuditParams | string,
  action?: string,
  targetType?: string,
  targetId: string | null = null,
  details: Record<string, any> | Json = {}
): Promise<void> {
  try {
    let adminUserId = '';
    let act = '';
    let target = '';
    let tid: string | null = null;
    let det: any = {};

    if (typeof paramOrAdminId === 'object' && paramOrAdminId !== null) {
      adminUserId = paramOrAdminId.adminUserId;
      act = paramOrAdminId.action;
      target = paramOrAdminId.targetType;
      tid = paramOrAdminId.targetId || null;
      det = paramOrAdminId.details || {};
    } else {
      adminUserId = paramOrAdminId;
      act = action || '';
      target = targetType || '';
      tid = targetId;
      det = details;
    }

    if (!adminUserId) {
      console.warn('Cannot log admin audit action: adminUserId missing');
      return;
    }

    const { error } = await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action: act,
      target_type: target,
      target_id: tid,
      details: det,
    });

    if (error) {
      console.error('Failed to write admin audit log:', error);
    }
  } catch (err) {
    console.error('Unexpected error writing admin audit log:', err);
  }
}

export const logAdminAction = logAdminAuditAction;
