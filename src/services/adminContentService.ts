import { supabase } from '../lib/supabase';
import { Module, Scenario, InterviewType, PressureModeRecord } from '../lib/database.types';
import { logAdminAuditAction } from './adminAuditService';

// ==========================================
// 1. MODULES CRUD
// ==========================================

export async function fetchAdminModules(): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('level', { ascending: true })
    .order('module_number', { ascending: true });

  if (error) throw error;
  return (data || []) as Module[];
}

export async function saveAdminModule(
  adminUserId: string,
  mod: Partial<Module> & { title: string; level: string; module_number: number }
): Promise<Module> {
  const isNew = !mod.id;
  const payload = {
    ...mod,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('modules')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: isNew ? 'create_module' : 'update_module',
    targetType: 'module',
    targetId: data.id,
    details: {
      title: data.title,
      level: data.level,
      module_number: data.module_number,
      micro_skill: data.micro_skill,
      domain_weight_pct: data.domain_weight_pct,
      is_checkpoint: data.is_checkpoint,
    },
  });

  return data as Module;
}

export async function deleteAdminModule(
  adminUserId: string,
  moduleId: string,
  title: string
): Promise<void> {
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'delete_module',
    targetType: 'module',
    targetId: moduleId,
    details: { title },
  });
}

// ==========================================
// 2. SCENARIOS CRUD
// ==========================================

export async function fetchAdminScenarios(): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('track', { ascending: true })
    .order('min_level', { ascending: true });

  if (error) throw error;
  return (data || []) as Scenario[];
}

export async function saveAdminScenario(
  adminUserId: string,
  scenario: Partial<Scenario> & { title: string; track: 'domain' | 'daily_life'; min_level: string }
): Promise<Scenario> {
  const isNew = !scenario.id;
  const payload = { ...scenario };

  const { data, error } = await supabase
    .from('scenarios')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: isNew ? 'create_scenario' : 'update_scenario',
    targetType: 'scenario',
    targetId: data.id,
    details: {
      title: data.title,
      track: data.track,
      parent_domain: data.parent_domain,
      sub_branch: data.sub_branch,
      min_level: data.min_level,
    },
  });

  return data as Scenario;
}

export async function deleteAdminScenario(
  adminUserId: string,
  scenarioId: string,
  title: string
): Promise<void> {
  const { error } = await supabase.from('scenarios').delete().eq('id', scenarioId);
  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'delete_scenario',
    targetType: 'scenario',
    targetId: scenarioId,
    details: { title },
  });
}

// ==========================================
// 3. INTERVIEW TYPES & PRESSURE MODES CRUD
// ==========================================

export async function fetchAdminInterviewTypes(): Promise<InterviewType[]> {
  const { data, error } = await supabase
    .from('interview_types')
    .select('*')
    .order('parent_domain', { ascending: true })
    .order('type_name', { ascending: true });

  if (error) throw error;
  return (data || []) as InterviewType[];
}

export async function saveAdminInterviewType(
  adminUserId: string,
  item: Partial<InterviewType> & { type_name: string; parent_domain: string; sub_branch: string }
): Promise<InterviewType> {
  const isNew = !item.id;
  const payload = { ...item };

  const { data, error } = await supabase
    .from('interview_types')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: isNew ? 'create_interview_type' : 'update_interview_type',
    targetType: 'interview_type',
    targetId: data.id,
    details: {
      type_name: data.type_name,
      parent_domain: data.parent_domain,
      sub_branch: data.sub_branch,
      min_level: data.min_level,
    },
  });

  return data as InterviewType;
}

export async function deleteAdminInterviewType(
  adminUserId: string,
  id: string,
  name: string
): Promise<void> {
  const { error } = await supabase.from('interview_types').delete().eq('id', id);
  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'delete_interview_type',
    targetType: 'interview_type',
    targetId: id,
    details: { type_name: name },
  });
}

export async function fetchAdminPressureModes(): Promise<PressureModeRecord[]> {
  const { data, error } = await supabase
    .from('pressure_modes')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as PressureModeRecord[];
}

export async function saveAdminPressureMode(
  adminUserId: string,
  mode: Partial<PressureModeRecord> & { id: string; name: string; description: string }
): Promise<PressureModeRecord> {
  const payload = { ...mode };

  const { data, error } = await supabase
    .from('pressure_modes')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'update_pressure_mode',
    targetType: 'pressure_mode',
    targetId: data.id,
    details: {
      name: data.name,
      description: data.description,
    },
  });

  return data as PressureModeRecord;
}

export async function deleteAdminPressureMode(
  adminUserId: string,
  id: string,
  name: string
): Promise<void> {
  const { error } = await supabase.from('pressure_modes').delete().eq('id', id);
  if (error) throw error;

  await logAdminAuditAction({
    adminUserId,
    action: 'delete_pressure_mode',
    targetType: 'pressure_mode',
    targetId: id,
    details: { name },
  });
}
