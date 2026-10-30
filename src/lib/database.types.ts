export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ParentDomain =
  | 'Healthcare'
  | 'Ausbildung'
  | 'Study/University'
  | 'Workplace Integration'
  | 'Settlement';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ModuleLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type SessionTab = 'speak' | 'scenarios' | 'interview';
export type SessionMode = 'learn' | 'practice';
export type SessionStatus = 'completed' | 'incomplete' | 'abandoned';
export type ScenarioTrack = 'domain' | 'daily_life';

export interface Scenario {
  id: string;
  track: ScenarioTrack;
  parent_domain: ParentDomain | null;
  sub_branch: string | null;
  title: string;
  description: string;
  min_level: CefrLevel;
  icon?: string | null;
  content?: {
    target_phrases?: Array<{ german: string; english: string }>;
    example_sentences?: string[];
  } | Json;
  is_baseline?: boolean;
  created_at: string;
}

export type PressureMode = 'Relaxed' | 'Standard' | 'High-Pressure';

export interface PressureModeRecord {
  id: string;
  name: string;
  description: string;
  badge_color?: string | null;
  created_at?: string;
}

export interface InterviewSampleQuestion {
  german: string;
  english: string;
  guidance: string;
}

export interface InterviewTypeContent {
  sample_questions: InterviewSampleQuestion[];
}

export interface InterviewType {
  id: string;
  parent_domain: string;
  sub_branch: string;
  type_name: string;
  min_level: 'B1' | 'B2' | 'C1' | 'C2';
  description: string;
  content?: InterviewTypeContent | Json;
  created_at: string;
}

export interface ExamSpeakingPromptText {
  german: string;
  english: string;
  examiner_prompt?: string;
  bullet_points?: string[];
}

export interface ExamSpeakingPrompt {
  id: string;
  level: 'B1' | 'B2';
  set_number: number;
  part: 1 | 2 | 3;
  topic_title: string;
  prompt_text: ExamSpeakingPromptText | Json;
  created_at: string;
}

export interface UserOverrides {
  restricted_tabs?: string[];
  granted_tabs?: string[];
  restricted_modes?: string[];
  granted_modes?: string[];
  restricted_domains?: string[];
  granted_domains?: string[];
  notes?: string;
}

export type SignupSource =
  | 'organic'
  | 'paid_search'
  | 'paid_social'
  | 'referral'
  | 'partner'
  | 'direct'
  | 'admin_created'
  | 'other';

export interface Profile {
  id: string;
  name: string | null;
  photo_url: string | null;
  cefr_level: CefrLevel | null;
  primary_domain: string | null;
  primary_subbranch: string | null;
  added_domains: Array<{ domain: string; subbranch: string }>;
  urgency_date: string | null;
  notifications_enabled?: boolean;
  onboarding_completed: boolean;
  is_suspended?: boolean;
  user_overrides?: UserOverrides;
  source?: SignupSource | null;
  source_detail?: Record<string, any> | Json | null;
  created_at: string;
}

export interface AdminDirectoryUser {
  id: string;
  name: string | null;
  email: string;
  photo_url: string | null;
  cefr_level: CefrLevel | null;
  primary_domain: string | null;
  primary_subbranch: string | null;
  added_domains: Array<{ domain: string; subbranch: string }>;
  urgency_date: string | null;
  notifications_enabled?: boolean;
  onboarding_completed: boolean;
  is_suspended: boolean;
  user_overrides: UserOverrides;
  source?: SignupSource | null;
  source_detail?: Record<string, any> | Json | null;
  created_at: string;
  current_streak: number;
  last_session_date: string | null;
  total_sessions: number;
  total_modules_completed: number;
}

export interface Domain {
  id: string;
  parent_domain: ParentDomain;
  sub_branch: string;
  is_active: boolean;
}

export interface ModuleTargetPhrase {
  german: string;
  english: string;
}

export interface ModuleVariantContent {
  target_phrases: ModuleTargetPhrase[];
  example_sentences: string[];
}

export interface ModuleContent {
  target_phrase?: string;
  english_meaning?: string;
  target_phrases?: ModuleTargetPhrase[];
  example_sentences?: string[];
  domain_variants?: {
    [domain: string]: ModuleVariantContent;
  };
}

export interface Module {
  id: string;
  level: ModuleLevel;
  module_number: number;
  title: string;
  micro_skill: string;
  domain_weight_pct: number;
  content: ModuleContent | Json;
  is_checkpoint: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  tab: SessionTab;
  mode: SessionMode;
  module_id: string | null;
  scenario_type: string | null;
  interview_type: string | null;
  pressure_mode: string | null;
  started_at: string;
  ended_at: string | null;
  status: SessionStatus;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
}

export interface DiagnosticMistake {
  category: string;
  example_de: string | null;
  example_en: string;
  correction_de: string | null;
  correction_en: string;
  example?: string;
  correction?: string;
}

export interface DiagnosticRecap {
  id: string;
  session_id: string;
  user_id: string;
  summary_text: string | null;
  summary_text_en: string;
  summary_text_de: string | null;
  mistakes: DiagnosticMistake[];
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  last_session_date: string | null;
  total_sessions: number;
  total_modules_completed: number;
}

export type AdminRole = 'admin' | 'support' | 'content_editor';
export type AdminStatus = 'active' | 'pending' | 'revoked';

export interface AdminUser {
  id: string;
  user_id: string | null;
  email?: string | null;
  role: AdminRole;
  invited_by: string | null;
  invited_at: string;
  status: AdminStatus;
  created_at: string;
}

export interface AdminTeamMember {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  invited_by: string | null;
  invited_by_email?: string | null;
  invited_by_name?: string | null;
  invited_at: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Json;
  created_at: string;
}

export interface PlatformConfig {
  id: string;
  key: string;
  value: Json;
  updated_by: string | null;
  updated_at: string;
}

export interface LlmProviderLog {
  id: string;
  session_id: string | null;
  provider: string;
  success: boolean;
  error_message: string | null;
  acknowledged?: boolean;
  created_at: string;
}

export type FeedbackCategory = 'Bug' | 'Feature request' | 'Content issue' | 'Other' | 'General' | string;
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved';

export interface UserFeedback {
  id: string;
  user_id: string;
  rating?: number | null;
  category: string;
  message?: string;
  session_id?: string | null;
  status: FeedbackStatus;
  created_at: string;
}

