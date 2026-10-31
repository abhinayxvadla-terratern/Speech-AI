import { supabase } from '../lib/supabase';
import { LlmProviderLog, PlatformConfig, Session, DiagnosticRecap } from '../lib/database.types';
import { logAdminAuditAction } from './adminAuditService';

// ==========================================
// 1. PIPELINE MONITORING & LLM LOGS
// ==========================================

export interface LlmUsageMetrics {
  groqTodayCalls: number;
  openrouterTodayCalls: number;
  groqEstimatedTokens: number;
  openrouterDailyLimit: number;
  openrouterTier: 'tier_50' | 'tier_1000';
  errorCount: number;
}

export async function fetchLlmProviderLogs(): Promise<LlmProviderLog[]> {
  const { data, error } = await supabase
    .from('llm_provider_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []) as LlmProviderLog[];
}

export async function fetchLlmUsageMetrics(openrouterTier: 'tier_50' | 'tier_1000' = 'tier_1000'): Promise<LlmUsageMetrics> {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

  const { data, error } = await supabase
    .from('llm_provider_log')
    .select('provider, success, created_at')
    .gte('created_at', todayStart);

  if (error) {
    console.warn('Error fetching LLM telemetry:', error);
  }

  const logs = data || [];
  const groqTodayCalls = logs.filter((l) => l.provider.toLowerCase() === 'groq').length;
  const openrouterTodayCalls = logs.filter((l) => l.provider.toLowerCase() === 'openrouter').length;
  const errorCount = logs.filter((l) => !l.success).length;

  // Approximate Groq tokens: ~600 tokens per speech turn call
  const groqEstimatedTokens = groqTodayCalls * 600;
  const openrouterDailyLimit = openrouterTier === 'tier_50' ? 50 : 1000;

  return {
    groqTodayCalls,
    openrouterTodayCalls,
    groqEstimatedTokens,
    openrouterDailyLimit,
    openrouterTier,
    errorCount,
  };
}

export async function acknowledgeLlmError(
  adminUserId: string,
  logId: string,
  errorMsg?: string
): Promise<void> {
  const { error } = await supabase
    .from('llm_provider_log')
    .update({ acknowledged: true })
    .eq('id', logId);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'acknowledge_llm_error',
    targetType: 'llm_error',
    targetId: logId,
    details: { error_message: errorMsg || '' },
  });
}

export async function clearAcknowledgedErrors(adminUserId: string): Promise<void> {
  const { error } = await supabase
    .from('llm_provider_log')
    .delete()
    .eq('acknowledged', true);

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'clear_acknowledged_errors',
    targetType: 'llm_error',
    details: { cleared_at: new Date().toISOString() },
  });
}

// ==========================================
// 2. ALL-SESSIONS BROWSER
// ==========================================

import { DateRangeValue } from '../components/admin/AdminDateRangeFilter';

export interface SessionFilterOptions {
  tab?: string;
  mode?: string;
  status?: string;
  dateRange?: 'today' | '7days' | '30days' | 'all' | DateRangeValue;
}

export async function fetchAllPlatformSessions(options: SessionFilterOptions = {}): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(300);

  if (options.tab && options.tab !== 'all') {
    query = query.eq('tab', options.tab);
  }

  if (options.mode && options.mode !== 'all') {
    query = query.eq('mode', options.mode);
  }

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.dateRange && options.dateRange !== 'all') {
    if (typeof options.dateRange === 'object') {
      const dr = options.dateRange;
      if (dr.startDate) {
        query = query.gte('started_at', dr.startDate.toISOString());
      }
      if (dr.endDate) {
        query = query.lte('started_at', dr.endDate.toISOString());
      }
    } else {
      const now = new Date();
      let cutoff: Date;

      if (options.dateRange === 'today') {
        cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      } else if (options.dateRange === '7days') {
        cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else {
        cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      query = query.gte('started_at', cutoff.toISOString());
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Session[];
}

export async function fetchDiagnosticRecapForSession(sessionId: string): Promise<DiagnosticRecap | null> {
  const { data, error } = await supabase
    .from('diagnostic_recaps')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticRecap | null;
}

// ==========================================
// 3. FEATURE FLAGS & KILL-SWITCHES
// ==========================================

export async function fetchPlatformConfigs(): Promise<Record<string, any>> {
  const { data, error } = await supabase.from('platform_config').select('*');
  if (error) throw error;

  const result: Record<string, any> = {};
  for (const item of (data || []) as PlatformConfig[]) {
    result[item.key] = item.value;
  }
  return result;
}

export async function updatePlatformConfig(
  adminUserId: string,
  key: string,
  value: any,
  previousValue?: any
): Promise<void> {
  const payload = {
    key,
    value,
    updated_by: adminUserId || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('platform_config')
    .upsert(payload, { onConflict: 'key' });

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'update_platform_config',
    targetType: 'flag',
    targetId: key,
    details: { key, previousValue, newValue: value },
  });
}
