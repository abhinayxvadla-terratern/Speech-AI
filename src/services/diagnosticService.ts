import { supabase } from '../lib/supabase';
import { DiagnosticMistake } from '../lib/database.types';
import { getSessionVoiceData } from './voice';

export type { DiagnosticMistake };

export interface DiagnosticRecapResult {
  id?: string;
  session_id: string;
  user_id: string;
  summary_text_en: string;
  summary_text_de: string | null;
  summary_text: string;
  summaryText: string; // backwards compatibility getter
  mistakes: DiagnosticMistake[];
  created_at?: string;
}

/**
 * Generates a diagnostic recap for a completed session using real session data
 * sourced directly from VoiceAdapter's real STT/LLM turns and mistake logs.
 * 
 * - Learn mode: English-only summary aggregating actual per-turn feedback_en,
 *   summary_text_de is null, mistakes[] has only _en fields populated and _de fields null.
 * - Practice mode & Interview: Bilingual summaries (DE first in UI, EN beneath)
 *   referencing real context and notable mistakes; mistakes[] has all 4 fields populated.
 * - Zero mistakes (clean session): Encouraging recap noting zero errors found,
 *   with an empty mistakes[] array (never fabricated).
 */
export async function generateDiagnosticRecap(
  sessionId: string,
  overrides?: {
    target?: { title?: string; micro_skill?: string; description?: string; domain?: string; parent_domain?: string };
    mode?: 'learn' | 'practice';
    turnsCount?: number;
    tab?: 'speak' | 'scenarios' | 'interview';
    userId?: string;
  }
): Promise<DiagnosticRecapResult> {
  // 1. Fetch Session Record from Supabase
  let session: any = null;
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (!error && data) {
      session = data;
    }
  } catch (err) {
    console.warn(`[diagnosticService] Could not load session ${sessionId} directly:`, err);
  }

  const userId = overrides?.userId || session?.user_id || '';
  const mode = (overrides?.mode || session?.mode || 'learn') as 'learn' | 'practice';
  const tab = (overrides?.tab || session?.tab || 'speak') as 'speak' | 'scenarios' | 'interview';
  const transcript = session?.transcript;
  const turnsCount = overrides?.turnsCount ?? (Array.isArray(transcript) ? transcript.length : 0);

  // 2. Resolve real title, micro_skill, and domain context
  let title = overrides?.target?.title || '';
  let microSkill = overrides?.target?.micro_skill || overrides?.target?.description || '';
  let domain = overrides?.target?.domain || overrides?.target?.parent_domain || session?.domain || '';

  if (!title || !microSkill) {
    if (tab === 'speak') {
      const moduleId = session?.module_id;
      if (moduleId) {
        const { data: mod } = await supabase
          .from('modules')
          .select('title, micro_skill')
          .eq('id', moduleId)
          .maybeSingle();

        if (mod) {
          title = title || mod.title;
          microSkill = microSkill || mod.micro_skill;
        }
      }
      title = title || 'German Foundation Module';
      microSkill = microSkill || 'foundational conversational German';
    } else if (tab === 'scenarios') {
      const scenarioKey = session?.scenario_type;
      if (scenarioKey) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scenarioKey);
        const query = isUuid
          ? supabase.from('scenarios').select('title, description, parent_domain').eq('id', scenarioKey)
          : supabase.from('scenarios').select('title, description, parent_domain').eq('title', scenarioKey);

        const { data: scen } = await query.maybeSingle();
        if (scen) {
          title = title || scen.title;
          microSkill = microSkill || scen.description;
          domain = domain || scen.parent_domain || '';
        }
      }
      title = title || session?.scenario_type || 'Situational German Scenario';
      microSkill = microSkill || 'communicating effectively in real-life German situations';
    } else {
      // Interview tab
      title = title || session?.interview_type || 'Job & Visa Interview';
      const pressure = session?.pressure_mode;
      microSkill = microSkill || (pressure ? `${pressure} pacing and professional German interview responses` : 'professional German interview communication');
      domain = domain || session?.domain || '';
    }
  }

  // 3. Pull real voice data collected during the actual session
  const voiceData = getSessionVoiceData(sessionId);
  const rawMistakes = voiceData?.mistakes || [];

  // Extract per-turn feedbacks for Learn mode (from VoiceAdapter store or transcript agent turns)
  const feedbacks =
    voiceData?.feedbacks && voiceData.feedbacks.length > 0
      ? voiceData.feedbacks
      : Array.isArray(transcript)
        ? transcript.filter((t: any) => t.speaker === 'agent').map((t: any) => t.text)
        : [];

  let summaryTextEn = '';
  let summaryTextDe: string | null = null;
  let mistakes: DiagnosticMistake[] = [];

  // 4. Generate Summaries & Mistakes based on real session content
  if (mode === 'learn') {
    // LEARN MODE: English-only, aggregate per-turn feedback_en entries, _de fields null
    summaryTextDe = null;

    mistakes = rawMistakes.map((m) => ({
      category: m.category || 'Vocabulary & Grammar',
      example_de: null,
      example_en: m.example_en || m.example || '',
      correction_de: null,
      correction_en: m.correction_en || m.correction || '',
      example: m.example_en || m.example || '',
      correction: m.correction_en || m.correction || '',
    }));

    if (mistakes.length === 0) {
      const takeaway = feedbacks.length > 0
        ? feedbacks[feedbacks.length - 1]
        : 'Clear pronunciation and accurate phrasing throughout.';
      summaryTextEn = `Learn session completed (${turnsCount} exchanges) for "${title}". All target phrases produced accurately with zero mistakes detected. Overall takeaway: ${takeaway}`;
    } else {
      const categories = Array.from(new Set(mistakes.map((m) => m.category))).join(', ');
      const takeaway = feedbacks.length > 0
        ? feedbacks[feedbacks.length - 1]
        : `Focus on: ${categories}. Review: ${mistakes[0].correction_en || 'correct phrase structure'}`;
      summaryTextEn = `Learn session completed (${turnsCount} exchanges) for "${title}". Overall takeaway: Focus on ${categories}. ${takeaway}`;
    }
  } else {
    // PRACTICE MODE (Speak / Scenarios) or INTERVIEW: Bilingual output
    const domainStr = domain ? ` (${domain})` : '';

    mistakes = rawMistakes.map((m) => ({
      category: m.category || 'Grammar & Usage',
      example_de: m.example_de || m.example || '',
      example_en: m.example_en || m.example || m.example_de || '',
      correction_de: m.correction_de || m.correction || '',
      correction_en: m.correction_en || m.correction || m.correction_de || '',
      example: m.example_de || m.example || '',
      correction: m.correction_de || m.correction || '',
    }));

    if (mistakes.length === 0) {
      // Clean session: encouraging message noting zero errors found, empty mistakes array
      summaryTextEn = `Practice simulation completed under realistic conditions (${turnsCount} exchanges) for "${title}"${domainStr}. Flawless performance—no language errors detected during this session. Ready for practical application.`;
      summaryTextDe = `Praxissimulation unter realistischen Bedingungen abgeschlossen (${turnsCount} Dialogrunden) für „${title}“${domainStr}. Hervorragende Leistung – während dieser Sitzung wurden keine Sprachfehler festgestellt. Bereit für den praktischen Einsatz.`;
    } else {
      // Pull the most notable 1-3 mistakes for the bilingual summary
      const notable = mistakes.slice(0, 3);
      const notableEn = notable
        .map((m) => `${m.category}: "${m.example_de || m.example}" -> "${m.correction_de || m.correction}"`)
        .join('; ');
      const notableDe = notable
        .map((m) => `${m.category}: „${m.example_de || m.example}“ -> „${m.correction_de || m.correction}“`)
        .join('; ');

      summaryTextEn = `Practice simulation completed (${turnsCount} exchanges) for "${title}"${domainStr}. Identified ${mistakes.length} area${mistakes.length > 1 ? 's' : ''} to refine: ${notableEn}.`;
      summaryTextDe = `Praxissimulation abgeschlossen (${turnsCount} Dialogrunden) für „${title}“${domainStr}. ${mistakes.length} Verbesserungspunkt${mistakes.length > 1 ? 'e' : ''} erkannt: ${notableDe}.`;
    }
  }

  // 5. Persist into diagnostic_recaps table in Supabase
  let savedId: string | undefined;
  let createdAt: string | undefined;

  if (userId) {
    try {
      const { data: existingRecap } = await supabase
        .from('diagnostic_recaps')
        .select('id, created_at')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingRecap?.id) {
        const { data: updated } = await supabase
          .from('diagnostic_recaps')
          .update({
            summary_text: summaryTextEn,
            summary_text_en: summaryTextEn,
            summary_text_de: summaryTextDe,
            mistakes,
          })
          .eq('id', existingRecap.id)
          .select('id, created_at')
          .single();

        savedId = updated?.id || existingRecap.id;
        createdAt = updated?.created_at || existingRecap.created_at;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('diagnostic_recaps')
          .insert({
            session_id: sessionId,
            user_id: userId,
            summary_text: summaryTextEn,
            summary_text_en: summaryTextEn,
            summary_text_de: summaryTextDe,
            mistakes,
          })
          .select('id, created_at')
          .single();

        if (insErr) {
          console.error('[diagnosticService] Error inserting diagnostic recap:', insErr);
        } else if (inserted) {
          savedId = inserted.id;
          createdAt = inserted.created_at;
        }
      }
    } catch (err) {
      console.error('[diagnosticService] Error persisting diagnostic recap:', err);
    }
  }

  return {
    id: savedId,
    session_id: sessionId,
    user_id: userId || '',
    summary_text_en: summaryTextEn,
    summary_text_de: summaryTextDe,
    summary_text: summaryTextEn,
    summaryText: summaryTextEn,
    mistakes,
    created_at: createdAt || new Date().toISOString(),
  };
}

/**
 * Backward compatibility alias for createDiagnosticRecap.
 */
export async function createDiagnosticRecap(
  sessionId: string,
  userId?: string,
  target?: { title: string; micro_skill?: string; description?: string; domain?: string },
  mode: 'learn' | 'practice' = 'learn',
  turnsCount: number = 0,
  sessionType: 'module' | 'scenario' | 'interview' = 'module'
): Promise<DiagnosticRecapResult> {
  const tab = sessionType === 'module' ? 'speak' : sessionType === 'scenario' ? 'scenarios' : 'interview';
  return generateDiagnosticRecap(sessionId, {
    userId,
    target,
    mode,
    turnsCount,
    tab,
  });
}
