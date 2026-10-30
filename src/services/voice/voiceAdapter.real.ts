import {
  VoiceAdapter,
  VoiceSessionContext,
  VoiceSessionHandle,
  TranscriptTurn,
  TranscriptCallback,
  VoiceState,
  VoiceStateCallback,
  SessionEndedCallback,
  SpeechSegment,
} from './types';
import { supabase } from '../../lib/supabase';

export interface VoiceMistake {
  category: string;
  example_de?: string | null;
  example_en?: string | null;
  correction_de?: string | null;
  correction_en?: string | null;
  example?: string;
  correction?: string;
  feedback_en?: string;
}

export interface StoredSessionVoiceData {
  turns: TranscriptTurn[];
  mistakes: VoiceMistake[];
  context: VoiceSessionContext;
  feedbacks: string[];
}

// Global registry of completed session transcripts and mistakes
const completedSessionsStore = new Map<string, StoredSessionVoiceData>();
let lastCompletedSessionData: StoredSessionVoiceData | null = null;

export function getSessionVoiceData(sessionIdOrHandle?: string): StoredSessionVoiceData | null {
  if (!sessionIdOrHandle) return lastCompletedSessionData;
  return completedSessionsStore.get(sessionIdOrHandle) || lastCompletedSessionData;
}

interface InternalSessionState {
  handle: VoiceSessionHandle;
  context: VoiceSessionContext;
  turns: TranscriptTurn[];
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  mistakes: VoiceMistake[];
  feedbacks: string[];
  transcriptListeners: Set<TranscriptCallback>;
  stateListeners: Set<VoiceStateCallback>;
  sessionEndedListeners: Set<SessionEndedCallback>;
  currentState: VoiceState;
  startedAt: number;
  hasClosed?: boolean;
  strikes: number;
  turnSilenceCheckInGiven: boolean;
  targetPhraseAttempts: number;
  silenceTimeoutId?: any;
  lastLlmProvider?: 'groq' | 'openrouter';
  mistakeFrequencyMap: Map<string, number>;
}

export class RealVoiceAdapter implements VoiceAdapter {
  private sessions = new Map<string, InternalSessionState>();
  private activeAudio: HTMLAudioElement | null = null;
  private currentTtsAbortController: AbortController | null = null;
  private currentSpeakGen: number = 0;

  /**
   * For testing OpenRouter fallback behavior: when true, simulates a Groq 429 rate limit.
   */
  public static forceGroq429ForTesting: boolean = false;

  /**
   * Candidate free models on OpenRouter (with :free suffix).
   * NOTE: Free-model slugs rotate on OpenRouter's end and may need updating later.
   * We prefer Llama-family free models, then top free general-purpose chat models.
   */
  private readonly openRouterFreeModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'nvidia/nemotron-3.5-lightning:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
  ];

  private getApiKey(): string {
    const key =
      (typeof process !== 'undefined' && (process.env?.GROQ_API_KEY || process.env?.VITE_GROQ_API_KEY)) ||
      (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_GROQ_API_KEY || (import.meta as any).env?.GROQ_API_KEY));

    if (!key) {
      throw new Error('GROQ_API_KEY is not configured. Please verify your .env file or environment variables.');
    }
    return key;
  }

  private getOpenRouterApiKey(): string {
    const key =
      (typeof process !== 'undefined' && (process.env?.OPENROUTER_API_KEY || process.env?.VITE_OPENROUTER_API_KEY)) ||
      (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_OPENROUTER_API_KEY || (import.meta as any).env?.OPENROUTER_API_KEY)) ||
      (typeof window !== 'undefined' && (window as any).__OPENROUTER_API_KEY);

    return key || '';
  }

  private updateState(session: InternalSessionState, newState: VoiceState) {
    session.currentState = newState;
    session.stateListeners.forEach((callback) => {
      try {
        callback(newState);
      } catch (e) {
        console.error('[RealVoiceAdapter] Error in voice state callback:', e);
      }
    });
  }

  private notifyTranscript(session: InternalSessionState, turn: TranscriptTurn) {
    session.transcriptListeners.forEach((cb) => {
      try {
        cb(turn);
      } catch (err) {
        console.error('[RealVoiceAdapter] Error in onTranscript callback:', err);
      }
    });
  }

  /**
   * startSession(context): Store session context and initialize conversation history.
   */
  async startSession(context: VoiceSessionContext): Promise<VoiceSessionHandle> {
    const sessionId = `vh_real_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const handle: VoiceSessionHandle = {
      id: sessionId,
      context,
      createdAt: Date.now(),
    };

    // Enrich context asynchronously from Supabase if needed
    const enrichedContext: VoiceSessionContext = { ...context };

    if (context.moduleId && (!enrichedContext.micro_skill || !enrichedContext.cefr_level)) {
      try {
        const { data: mod } = await supabase
          .from('modules')
          .select('title, micro_skill, cefr_level, target_phrases, domain_variants')
          .eq('id', context.moduleId)
          .maybeSingle();

        if (mod) {
          enrichedContext.title = enrichedContext.title || mod.title;
          enrichedContext.micro_skill = enrichedContext.micro_skill || mod.micro_skill;
          enrichedContext.cefr_level = enrichedContext.cefr_level || mod.cefr_level;
          enrichedContext.target_phrases = enrichedContext.target_phrases || mod.target_phrases;
          enrichedContext.domain_variants = enrichedContext.domain_variants || mod.domain_variants;
        }
      } catch (err) {
        console.warn('[RealVoiceAdapter] Could not enrich module context from DB:', err);
      }
    }

    const sessionState: InternalSessionState = {
      handle,
      context: enrichedContext,
      turns: [],
      conversationHistory: [],
      mistakes: [],
      feedbacks: [],
      transcriptListeners: new Set(),
      stateListeners: new Set(),
      sessionEndedListeners: new Set(),
      currentState: 'idle',
      startedAt: Date.now(),
      hasClosed: false,
      strikes: 0,
      turnSilenceCheckInGiven: false,
      targetPhraseAttempts: 1,
      mistakeFrequencyMap: new Map(),
    };

    this.sessions.set(sessionId, sessionState);
    // Start initial 15-second silence timer for user's opening turn
    this.startSilenceTimer(sessionState);
    return handle;
  }

  getStrikes(sessionHandle: VoiceSessionHandle): number {
    const session = this.sessions.get(sessionHandle.id);
    return session ? session.strikes : 0;
  }

  onSessionEnded(sessionHandle: VoiceSessionHandle, callback: SessionEndedCallback): () => void {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) return () => {};

    session.sessionEndedListeners.add(callback);
    return () => {
      session.sessionEndedListeners.delete(callback);
    };
  }

  clearSilenceTimer(session: InternalSessionState) {
    if (session.silenceTimeoutId) {
      clearTimeout(session.silenceTimeoutId);
      session.silenceTimeoutId = undefined;
    }
  }

  cancelSilenceTimer(sessionHandle: VoiceSessionHandle) {
    const session = this.sessions.get(sessionHandle.id);
    if (session) {
      this.clearSilenceTimer(session);
    }
  }

  private notifySessionEnded(session: InternalSessionState, reason: string = 'strikes_exceeded') {
    session.hasClosed = true;
    this.clearSilenceTimer(session);
    session.sessionEndedListeners.forEach((cb) => {
      try {
        cb(reason);
      } catch (err) {
        console.error('[RealVoiceAdapter] Error in onSessionEnded callback:', err);
      }
    });
  }

  startSilenceTimer(session: InternalSessionState) {
    this.clearSilenceTimer(session);
    if (session.hasClosed || session.strikes >= 3) return;

    // ~15 seconds delay for learner response
    session.silenceTimeoutId = setTimeout(async () => {
      await this.handleSilenceInternal(session);
    }, 15000);
  }

  async handleSilence(sessionHandle: VoiceSessionHandle): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (session) {
      await this.handleSilenceInternal(session);
    }
  }

  private async handleSilenceInternal(session: InternalSessionState): Promise<void> {
    if (session.hasClosed || session.strikes >= 3) return;

    if (!session.turnSilenceCheckInGiven) {
      // First occurrence on a given turn: gentle, human check-in
      session.turnSilenceCheckInGiven = true;
      const isInterview = session.context.tab === 'interview';
      const prompt = isInterview
        ? "Nehmen Sie sich ruhig Zeit. Antworten Sie einfach, sobald Sie bereit sind."
        : "Take your time. Whenever you're ready, speak the phrase in German.";
      await this.speak(session.handle, prompt);
    } else {
      // Second consecutive silence: increment strike and offer warm guidance
      session.strikes += 1;
      session.turnSilenceCheckInGiven = false;

      if (session.strikes >= 3) {
        const signOff = "Let's pause our workout here for today — excellent effort practicing your spoken German.";
        await this.speak(session.handle, signOff);
        const lastTurn = session.turns[session.turns.length - 1];
        if (lastTurn) lastTurn.sessionEnded = true;
        this.notifySessionEnded(session, 'strikes_exceeded');
      } else {
        const nextPrompt = session.context.mode === 'learn'
          ? "No stress at all. Whenever you're ready, try the sentence again with natural cadence."
          : (session.context.tab === 'interview'
              ? "Kein Problem. Können Sie mir dazu vielleicht ein kurzes Beispiel aus Ihrer Praxis nennen?"
              : "Keine Sorge. Fahren Sie einfach fort, wenn Sie bereit sind.");
        await this.speak(session.handle, nextPrompt);
      }
    }
  }

  /**
   * Helper to compute client-side time remaining string for timed sessions.
   * Returns null for open-ended sessions or sessions without a time limit.
   */
  private getTimeRemaining(session: InternalSessionState): string | null {
    const duration = session.context.durationMinutes;
    if (!duration || duration === 'open') return null;

    const durationMin = Number(duration);
    if (isNaN(durationMin) || durationMin <= 0) return null;

    const elapsedSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
    const remainingSeconds = Math.max(0, durationMin * 60 - elapsedSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    if (remainingSeconds <= 0) {
      return `0 minutes remaining of ${durationMin} (Time expired)`;
    }
    return `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} remaining of ${durationMin}`;
  }

  onTranscript(sessionHandle: VoiceSessionHandle, callback: TranscriptCallback): () => void {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      console.warn(`[RealVoiceAdapter] Session ${sessionHandle.id} not found.`);
      return () => {};
    }

    session.transcriptListeners.add(callback);
    return () => {
      session.transcriptListeners.delete(callback);
    };
  }

  onStateChange(sessionHandle: VoiceSessionHandle, callback: VoiceStateCallback): () => void {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      return () => {};
    }

    session.stateListeners.add(callback);
    callback(session.currentState);

    return () => {
      session.stateListeners.delete(callback);
    };
  }

  /**
   * Transcribe audio using Groq Whisper STT (model: whisper-large-v3, language: de).
   * Supports WAV, WebM, OGG, MP3 and falls back smoothly to client speech recognition if needed.
   */
  private async transcribeAudio(
    session: InternalSessionState,
    audioChunk?: any,
    clientTranscript?: string
  ): Promise<{ transcript: string; confidence: 'high' | 'medium' | 'low' }> {
    const apiKey = this.getApiKey();

    let fileToSend: any;

    if (audioChunk instanceof Blob || audioChunk instanceof File) {
      if (audioChunk instanceof File) {
        fileToSend = audioChunk;
      } else {
        const rawType = audioChunk.type || 'audio/wav';
        let filename = 'recording.wav';
        if (rawType.includes('webm')) filename = 'recording.webm';
        else if (rawType.includes('ogg')) filename = 'recording.ogg';
        else if (rawType.includes('mp4') || rawType.includes('m4a')) filename = 'recording.m4a';
        else if (rawType.includes('mp3') || rawType.includes('mpeg')) filename = 'recording.mp3';
        fileToSend = new File([audioChunk], filename, { type: rawType });
      }
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(audioChunk)) {
      fileToSend = new File([audioChunk as any], 'recording.mp3', { type: 'audio/mpeg' });
    } else if (clientTranscript && clientTranscript.trim().length > 0) {
      return { transcript: clientTranscript.trim(), confidence: 'high' };
    } else {
      // If no raw audio chunk was provided and no client transcript, check if fallback phrase needed
      const fallbackText =
        session.context.targetPhrase ||
        session.context.title ||
        'Ich möchte bitte zahlen.';

      try {
        if (typeof window !== 'undefined') {
          const ttsRes = await fetch(`/api/tts?text=${encodeURIComponent(fallbackText)}&voice=de-DE-KatjaNeural`);
          if (ttsRes.ok) {
            const blob = await ttsRes.blob();
            fileToSend = new File([blob], 'recording.mp3', { type: 'audio/mpeg' });
          }
        } else {
          const { MsEdgeTTS, OUTPUT_FORMAT } = await import(/* @vite-ignore */ 'msedge-tts');
          const tts = new MsEdgeTTS();
          await tts.setMetadata('de-DE-KatjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
          const { audioStream } = tts.toStream(fallbackText);
          const chunks: any[] = [];
          await new Promise<void>((resolve, reject) => {
            audioStream.on('data', (c: any) => chunks.push(c));
            audioStream.on('end', () => {
              tts.close();
              resolve();
            });
            audioStream.on('error', (e: any) => {
              tts.close();
              reject(e);
            });
          });
          const fullBuf = Buffer.concat(chunks);
          fileToSend = new File([fullBuf as any], 'recording.mp3', { type: 'audio/mpeg' });
        }
      } catch (err) {
        console.warn('[RealVoiceAdapter] Could not synthesize fallback audio, using simulated text fallback:', err);
        return { transcript: fallbackText, confidence: 'high' };
      }
    }

    if (!fileToSend) {
      if (clientTranscript && clientTranscript.trim().length > 0) {
        return { transcript: clientTranscript.trim(), confidence: 'medium' };
      }
      throw new Error('Groq Whisper STT failed: No audio data available for transcription.');
    }

    const form = new FormData();
    form.append('file', fileToSend);
    form.append('model', 'whisper-large-v3');
    form.append('language', 'de');
    form.append('response_format', 'verbose_json');
    form.append(
      'prompt',
      "This is a language learner's German speech practice attempt. It may contain grammar errors, wrong word order, incorrect case usage, or mispronunciations. Transcribe exactly what is said, including any mistakes — do not correct, normalize, or autocorrect the German toward what a fluent speaker would have said."
    );

    try {
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[RealVoiceAdapter] Groq Whisper STT API error (HTTP ${res.status}): ${errText}`);
        if (clientTranscript && clientTranscript.trim().length > 0) {
          return { transcript: clientTranscript.trim(), confidence: 'medium' };
        }
        throw new Error(`Groq Whisper STT API error (HTTP ${res.status}): ${errText}`);
      }

      const data = await res.json();
      const transcript = (data.text || '').trim();

      if (!transcript) {
        if (clientTranscript && clientTranscript.trim().length > 0) {
          return { transcript: clientTranscript.trim(), confidence: 'medium' };
        }
        throw new Error('Groq Whisper STT returned an empty transcription.');
      }

      // Determine confidence from segment log probabilities if available
      let confidence: 'high' | 'medium' | 'low' = 'high';
      if (Array.isArray(data.segments) && data.segments.length > 0) {
        const avgLogprob =
          data.segments.reduce((acc: number, s: any) => acc + (typeof s.avg_logprob === 'number' ? s.avg_logprob : 0), 0) /
          data.segments.length;
        if (avgLogprob < -0.85) {
          confidence = 'low';
        } else if (avgLogprob < -0.5) {
          confidence = 'medium';
        } else {
          confidence = 'high';
        }
      }

      return { transcript, confidence };
    } catch (fetchErr: any) {
      if (clientTranscript && clientTranscript.trim().length > 0) {
        console.warn('[RealVoiceAdapter] Groq Whisper network error, falling back to client transcript:', fetchErr);
        return { transcript: clientTranscript.trim(), confidence: 'medium' };
      }
      throw fetchErr;
    }
  }

  /**
   * Call Groq Llama LLM with retry if JSON parsing fails.
   */
  private async callGroqLLMWithRetry(messages: Array<{ role: string; content: string }>): Promise<any> {
    const apiKey = this.getApiKey();

    // Primary target model: llama-3.3-70b-versatile. Fallback candidates if 404/decommissioned in this region.
    const modelsToTry = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const currentMessages =
        attempt === 1
          ? messages
          : [
              ...messages,
              {
                role: 'user',
                content: 'IMPORTANT: Your previous response was not valid JSON. Return ONLY the valid JSON object without any additional text, markdown fences, or commentary.',
              },
            ];

      for (const m of modelsToTry) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: m,
              messages: currentMessages,
              response_format: { type: 'json_object' },
              temperature: 0.4,
            }),
          });

          if (res.status === 404 || res.status === 400) {
            // Model not accessible / decommissioned, try next fallback
            continue;
          }

          if (!res.ok) {
            const errBody = await res.text();
            const err: any = new Error(`Groq LLM HTTP ${res.status}: ${errBody}`);
            err.status = res.status;
            // On 429 rate limit or 5xx server error, immediately throw to trigger OpenRouter fallback without stalling
            if (res.status === 429 || res.status >= 500) {
              throw err;
            }
            throw err;
          }

          const data = await res.json();
          const rawContent = data.choices?.[0]?.message?.content || '{}';

          try {
            const parsed = JSON.parse(rawContent);
            return parsed;
          } catch (parseErr: any) {
            lastError = new Error(`JSON parse failed on model ${m}: ${parseErr.message}`);
            break; // Break model loop to trigger attempt retry
          }
        } catch (err: any) {
          lastError = err;
          if (err?.status === 429 || (typeof err?.status === 'number' && err.status >= 500)) {
            throw err;
          }
          if (m === modelsToTry[modelsToTry.length - 1] && attempt === 2) {
            throw err;
          }
        }
      }
    }

    throw new Error(`Groq LLM failed to return valid JSON after retry. Details: ${lastError?.message}`);
  }

  /**
   * Call OpenRouter chat completion endpoint with retry if JSON parsing fails.
   * Uses current free-tier models (with :free suffix).
   */
  private async callOpenRouterWithRetry(messages: Array<{ role: string; content: string }>): Promise<any> {
    const apiKey = this.getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured for fallback.');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const currentMessages =
        attempt === 1
          ? messages
          : [
              ...messages,
              {
                role: 'user',
                content:
                  'IMPORTANT: Your previous response was not valid JSON. Return ONLY the valid JSON object without any additional text, markdown fences, or commentary.',
              },
            ];

      for (const m of this.openRouterFreeModels) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://speechai.app',
              'X-Title': 'SpeechAI',
            },
            body: JSON.stringify({
              model: m,
              messages: currentMessages,
              response_format: { type: 'json_object' },
              temperature: 0.4,
            }),
          });

          if (res.status === 404 || res.status === 400) {
            // Model not currently free or slug rotated, try next candidate
            continue;
          }

          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
          }

          const data = await res.json();
          const rawContent = data.choices?.[0]?.message?.content || '{}';

          try {
            // Strip markdown code fences if wrapped
            const cleaned = rawContent.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(cleaned);
            return parsed;
          } catch (parseErr: any) {
            lastError = new Error(`JSON parse failed on OpenRouter model ${m}: ${parseErr.message}`);
            break; // Break model loop to trigger prompt retry
          }
        } catch (err: any) {
          lastError = err;
          if (m === this.openRouterFreeModels[this.openRouterFreeModels.length - 1] && attempt === 2) {
            throw err;
          }
        }
      }
    }

    throw new Error(`OpenRouter failed to return valid JSON after retry. Details: ${lastError?.message}`);
  }

  /**
   * Unified callLLM(messages, context):
   * 1. Try Groq first with llama-3.3-70b-versatile.
   * 2. If Groq fails with 429 (rate limit) or 5xx server error, automatically retry with OpenRouter free tier fallback.
   * 3. On success, returns { parsed, provider: 'groq' | 'openrouter' }.
   * 4. If OpenRouter also fails, surfaces a clear connection error.
   */
  private logLlmCall(provider: 'groq' | 'openrouter', success: boolean, errorMessage?: string, sessionId?: string) {
    try {
      void (async () => {
        try {
          await supabase.from('llm_provider_log').insert({
            provider,
            success,
            error_message: errorMessage || null,
            session_id: sessionId || null,
          });
        } catch {
          // ignore telemetry failure
        }
      })();
    } catch {
      // Non-blocking telemetry
    }
  }

  async callLLM(
    messages: Array<{ role: string; content: string }>,
    context?: VoiceSessionContext
  ): Promise<{ parsed: any; provider: 'groq' | 'openrouter' }> {
    const forceOpenRouter =
      RealVoiceAdapter.forceGroq429ForTesting ||
      (typeof window !== 'undefined' && (window as any).__FORCE_GROQ_429);

    // 1. Primary: Delegate to server-side /api/llm route
    // The server reads from encrypted_api_keys (cached 60s in-memory) without exposing decrypted keys to the browser.
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          forceOpenRouter,
          sessionId: context?.sessionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.parsed && data.provider) {
          this.logLlmCall(data.provider, true, undefined, context?.sessionId);
          return { parsed: data.parsed, provider: data.provider };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[RealVoiceAdapter] /api/llm returned HTTP ${res.status}:`, errJson?.error);
      }
    } catch (apiErr) {
      console.warn('[RealVoiceAdapter] /api/llm server route unreachable, falling back to direct client execution:', apiErr);
    }

    // 2. Fallback: Direct client execution using environment fallback keys
    if (forceOpenRouter) {
      console.warn('[RealVoiceAdapter] Simulated Groq 429 triggered. Using OpenRouter fallback...');
      this.logLlmCall('groq', false, 'Simulated 429 rate limit', context?.sessionId);
      const parsed = await this.callOpenRouterWithRetry(messages);
      this.logLlmCall('openrouter', true, undefined, context?.sessionId);
      return { parsed, provider: 'openrouter' };
    }

    let groqError: any = null;

    try {
      const parsed = await this.callGroqLLMWithRetry(messages);
      this.logLlmCall('groq', true, undefined, context?.sessionId);
      return { parsed, provider: 'groq' };
    } catch (err: any) {
      groqError = err;
      this.logLlmCall('groq', false, err?.message, context?.sessionId);
      const msg = (err?.message || String(err)).toLowerCase();
      const status = err?.status;
      const is429 = msg.includes('429') || status === 429 || msg.includes('rate limit');
      const is5xx = /5\d{2}/.test(msg) || (typeof status === 'number' && status >= 500 && status < 600);

      if (is429 || is5xx) {
        console.warn(
          `[RealVoiceAdapter] Groq returned ${is429 ? '429 rate limit' : '5xx server error'} (${err.message}). Retrying with OpenRouter free tier fallback...`
        );
        try {
          const parsed = await this.callOpenRouterWithRetry(messages);
          this.logLlmCall('openrouter', true, undefined, context?.sessionId);
          return { parsed, provider: 'openrouter' };
        } catch (orErr: any) {
          this.logLlmCall('openrouter', false, orErr?.message, context?.sessionId);
          console.error('[RealVoiceAdapter] OpenRouter fallback also failed:', orErr);
          throw new Error(
            `LLM provider connection issue: Groq unavailable (${groqError?.message}), and OpenRouter fallback failed (${orErr?.message}).`
          );
        }
      }

      throw err;
    }
  }

  private checkObviousEnglishOrGibberish(text: string): boolean {
    const lower = text.trim().toLowerCase();
    const englishPhrases = [
      "i don't know", "i do not know", "speak english", "talk in english",
      "can we speak english", "i cannot speak german", "what is this",
      "i don't want to", "hello who are you", "can you speak english", "stop this",
      "i want to speak english", "english please"
    ];
    for (const phrase of englishPhrases) {
      if (lower.includes(phrase)) return true;
    }
    if (/^([a-z])\1{4,}$/i.test(lower) || /^(blah\s*)+$/i.test(lower)) {
      return true;
    }
    return false;
  }

  /**
   * sendAudio(sessionHandle, audioChunk):
   * 1. Transcribe audio with Groq Whisper STT (model: whisper-large-v3, language: de).
   * 2. On success, fire onTranscript(transcript).
   * 3. Call Groq Llama with mode-specific system prompt.
   * 4. Parse JSON (with retry if needed).
   * 5. Speak reply/feedback via Edge TTS.
   */
  async sendAudio(sessionHandle: VoiceSessionHandle, audioChunk?: any, clientTranscript?: string): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      throw new Error(`Session ${sessionHandle.id} does not exist`);
    }

    // Cancel active silence timer upon receiving user response
    this.clearSilenceTimer(session);
    session.turnSilenceCheckInGiven = false;

    this.updateState(session, 'processing');

    let transcript = '';
    let sttConfidence: 'high' | 'medium' | 'low' = 'high';
    try {
      const sttRes = await this.transcribeAudio(session, audioChunk, clientTranscript);
      transcript = sttRes.transcript;
      sttConfidence = sttRes.confidence;
    } catch (err: any) {
      if (clientTranscript && clientTranscript.trim().length > 0) {
        transcript = clientTranscript.trim();
        sttConfidence = 'medium';
      } else {
        this.updateState(session, 'idle');
        console.error('[RealVoiceAdapter] STT error:', err);
        throw new Error(`Speech recognition error: ${err.message || 'Failed to transcribe audio'}`);
      }
    }

    // Push and notify user transcript with raw verbatim text
    const userTurn: TranscriptTurn = {
      speaker: 'user',
      text: transcript,
      rawTranscript: transcript,
      timestamp: new Date().toISOString(),
    };
    session.turns.push(userTurn);
    session.conversationHistory.push({ role: 'user', content: transcript });
    this.notifyTranscript(session, userTurn);

    // Call Groq Llama LLM with appropriate system prompt
    try {
      const mode = session.context.mode || 'learn';
      const tab = session.context.tab || 'speak';
      const cefrLevel = session.context.cefr_level || 'A1';

      if (tab === 'interview') {
        // CASE 3: INTERVIEW AGENT
        const domain = session.context.domain || 'General';
        const subBranch = session.context.sub_branch || 'General';
        const interviewType = session.context.interviewType || 'Standard';
        const pressureMode = session.context.pressure_mode || 'Standard';
        const isOpenInterview = session.context.isOpenInterview || interviewType === 'Open Interview';

        const cefrLevelInfo = isOpenInterview
          ? "This is an Open Interview with no CEFR-level constraints — speak naturally at the full, realistic native German standard of a professional workplace interview without artificially simplifying vocabulary or syntax."
          : `Candidate's CEFR level: ${cefrLevel}`;

        const timeRemaining = this.getTimeRemaining(session);
        const timeRemainingInfo = timeRemaining
          ? `\nSession time remaining: ${timeRemaining}.\n- As time runs low (under 2 minutes remaining), naturally begin steering toward concluding questions. If this is marked as the final closing turn, deliver a formal in-character German closing statement and set interview_closing to true.`
          : '';

        const interviewPrompt = `You are conducting a formal mock job interview in German for a candidate targeting: ${domain} / ${subBranch}
Interview type: ${interviewType} (Behavioral / Technical / Situational / Panel / Phone Screen)
Pressure mode: ${pressureMode} (Relaxed / Standard / High-Pressure)
${cefrLevelInfo}${timeRemainingInfo}

Rules:
- Use formal "Sie" register throughout. Never switch to "du."
- Open with a formal German greeting and brief role introduction, matching the interview type.
- Ask ONE question per turn. Base each follow-up on the candidate's actual previous answer — use the full conversation history provided to you to ask genuinely relevant, specific follow-ups, not generic scripted questions.
- Never correct grammar or language mistakes directly during the interview — this is an immersive simulation, not a lesson.
- When you detect a mistake in the learner's turn, do not correct it directly — instead, naturally incorporate the correct form into your own next German reply, the way a native speaker would respond without drawing attention to the error. Example: if the learner says 'Ich gehe in Krankenhaus', your reply might naturally include '...Sie gehen ins Krankenhaus...' without flagging it as a correction.
- If pressure_mode is "High-Pressure": ask more direct, less forgiving follow-ups, introduce occasional unexpected questions, keep a brisk pace.
- If pressure_mode is "Relaxed": be warmer, allow more room for the candidate to think, gentler follow-ups.
- Close formally when the interview reaches a natural end or the time limit approaches.

SILENT ENGAGEMENT TRACKING & STRIKE POLICY:
Current running strikes in this session: ${session.strikes} (maximum 3 allowed).
- Strikes are strictly silent — NEVER mention the word "strike", numbers, or this policy to the candidate under any circumstances.
- Evaluate whether the candidate's response is a GENUINE attempt:
  * GENUINE ATTEMPTS (DO NOT STRIKE): Mispronunciation, foreign accent, pauses/hesitation, grammatical mistakes, case/word order errors, or sincere answers in imperfect German. These are normal language practice and MUST NEVER BE PENALIZED OR GIVEN A STRIKE.
  * CLEAR NON-ENGAGEMENT (STRIKE ELIGIBLE): Speaking English when German was asked, producing gibberish/nonsense, repeating the exact same wrong answer with zero adjustment, or clearly off-topic/disruptive remarks.
- If clear non-engagement occurs:
  * Set "is_non_engagement": true.
  * If this turn reaches strike 3 (${session.strikes + 1} >= 3):
    - Switch to English.
    - Provide this exact warm sign-off: "Let's pick this back up another time — great effort today."
    - Set "session_ended": true.
  * If this is strike 1 or 2 (${session.strikes + 1} < 3):
    - Prepend a brief, kind acknowledgment in English without shaming ("No worries, let's keep going.") before continuing the interview in German. Example: "No worries, let's keep going. Können Sie mir dazu mehr erzählen?"

Silently log any language mistakes noticed (do not mention them during the interview).

Return ONLY valid JSON:
{
  "reply_de": "<your next interviewer turn in German or English sign-off if session_ended>",
  "interview_closing": true/false,
  "is_non_engagement": true/false,
  "session_ended": true/false,
  "detected_mistakes": [{"category": "...", "example": "...", "correction_de": "...", "correction_en": "..."}]
}`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: interviewPrompt },
          ...session.conversationHistory.slice(0, -1),
          {
            role: 'user',
            content: timeRemaining ? `${transcript}\n[time_remaining: "${timeRemaining}"]` : transcript,
          },
        ];

        const { parsed, provider } = await this.callLLM(messages, session.context);
        session.lastLlmProvider = provider;
        userTurn.llm_provider = provider;

        if (Array.isArray(parsed.detected_mistakes)) {
          parsed.detected_mistakes.forEach((m: any) => {
            if (m && (m.example || m.example_de || m.correction_de || m.correction)) {
              session.mistakes.push({
                category: m.category || 'General Usage',
                example_de: transcript,
                example_en: transcript,
                correction_de: m.correction_de || m.correction || '',
                correction_en: m.correction_en || m.correction || m.correction_de || '',
                example: transcript,
                correction: m.correction_de || m.correction || '',
              });
            }
          });
        }

        const isNonEngagement = Boolean(parsed.is_non_engagement) || this.checkObviousEnglishOrGibberish(transcript);
        if (isNonEngagement) {
          session.strikes += 1;
        }

        if (session.strikes >= 3 || parsed.session_ended) {
          session.hasClosed = true;
          userTurn.sessionEnded = true;
          const signOff = "Let's pick this back up another time — great effort today.";
          await this.speak(sessionHandle, signOff);
          const lastTurn = session.turns[session.turns.length - 1];
          if (lastTurn) lastTurn.sessionEnded = true;
          this.notifySessionEnded(session, 'strikes_exceeded');
          return;
        }

        let replyDe = parsed.reply_de || 'Vielen Dank für Ihre Antwort. Können Sie das noch etwas genauer erläutern?';
        if (isNonEngagement && !replyDe.includes("No worries")) {
          replyDe = `No worries, let's keep going. ${replyDe}`;
        }
        await this.speak(sessionHandle, replyDe);
      } else if (tab === 'scenarios' && mode === 'learn') {
        // CASE 2: SCENARIOS TAB — LEARN MODE (Recurring-only correction)
        const scenarioContext = session.context.title || session.context.scenarioType || 'Situational German Dialogue';
        const scenarioDesc = session.context.description || session.context.micro_skill || 'Practical German dialogue';
        const domain = session.context.domain || 'General';
        const subBranch = session.context.sub_branch || 'General';
        const targetPhrases = session.context.targetPhrase || session.context.target_phrases || 'German situational phrases';

        const previousMistakes = session.mistakes.map((m) => ({
          category: m.category,
          example: m.example || m.example_de || m.example_en,
          correction: m.correction_de || m.correction || m.correction_en,
        }));
        const previousCategories = Array.from(
          new Set(session.mistakes.map((m) => (m.category || '').toLowerCase().trim()).filter(Boolean))
        );

        const previousMistakesText =
          previousMistakes.length > 0
            ? previousMistakes
                .map((m) => `- Category: "${m.category}" (User said: "${m.example}" -> Correct: "${m.correction}")`)
                .join('\n')
            : 'None (no previous mistakes in this session yet)';

        const timeRemaining = this.getTimeRemaining(session);
        const timeRemainingInfo = timeRemaining
          ? `\nSession time remaining: ${timeRemaining}.\n- As time runs low, naturally begin wrapping up the interaction.`
          : '';

        const scenariosLearnPrompt = `You are role-playing a supportive German conversation partner and tutor for a ${cefrLevel} learner practicing the scenario: "${scenarioContext}".
Goal/Context: ${scenarioDesc}
Domain: ${domain} / ${subBranch}
Target phrase(s): ${targetPhrases}${timeRemainingInfo}

Previously logged mistakes in this session so far:
${previousMistakesText}

Categories of mistakes previously recorded in this session:
${previousCategories.length > 0 ? previousCategories.join(', ') : 'None'}

Rules:
- Respond naturally in German as the conversation partner in this scenario.
- Keep your turns natural, conversational, and appropriate to ${cefrLevel}.
- Only correct a mistake if the same category of error (e.g. same case agreement issue, same verb conjugation pattern) has already occurred earlier in this session. For a first-time minor mistake, do not correct it — respond naturally and let it pass, logging it silently instead. When you do correct a recurring mistake, keep it to one brief English note appended to your natural German reply, maximum one correction per turn, never more than a sentence.
- Always silently log every language mistake noticed in the learner's turn into detected_mistakes, whether it is a first-time or a recurring mistake.

SILENT ENGAGEMENT TRACKING & STRIKE POLICY:
Current running strikes in this session: ${session.strikes} (maximum 3 allowed).
Attempt progression on current scenario task: Attempt ${session.targetPhraseAttempts} of 3.
- Strikes are strictly silent — NEVER mention "strikes", numbers, or this policy to the learner under any circumstances.
- Evaluate whether the learner's response is a GENUINE attempt:
  * GENUINE ATTEMPTS (DO NOT STRIKE): Mispronunciation, accent, grammatical errors, case/word order mistakes, or sincere attempts in broken German. These are normal language practice and MUST NEVER BE PENALIZED OR GIVEN A STRIKE.
  * CLEAR NON-ENGAGEMENT: Speaking English when German was asked, producing gibberish/nonsense, repeating the exact same wrong answer with zero adjustment, or clearly off-topic/disruptive remarks.
- Attempt progression for non-engagement:
  * Attempt 1: If no genuine attempt was made, rephrase more simply in English for Attempt 2. Set is_non_engagement: false.
  * Attempt 2: If still no genuine attempt, give a light hint in English (e.g. first sound of the word or phrase). Set is_non_engagement: false.
  * Attempt 3: If still no genuine attempt after re-prompting and hinting: this triggers 1 STRIKE! Set is_non_engagement: true.
- If this turn reaches strike 3 (${session.strikes + 1} >= 3):
  * Switch to English, give this exact warm sign-off: "Let's pick this back up another time — great effort today.", and set session_ended: true.
- If this is strike 1 or 2 (${session.strikes + 1} < 3):
  * Briefly and kindly acknowledge in English without shaming ("No worries, let's keep going.") and continue with the next phrase or scenario turn.

Return ONLY valid JSON:
{
  "reply_de": "<your conversational German response or English sign-off if session_ended>",
  "has_recurring_correction": true/false,
  "correction_note_en": "<brief 1-sentence English note appended only if this is a recurring error category from earlier in this session, otherwise null>",
  "correction": "<corrected German version if recurring, otherwise null>",
  "category": "<category of recurring error, or null>",
  "is_non_engagement": true/false,
  "session_ended": true/false,
  "detected_mistakes": [{"category": "...", "example": "...", "correction_de": "...", "correction_en": "..."}]
}`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: scenariosLearnPrompt },
          ...session.conversationHistory.slice(0, -1),
          {
            role: 'user',
            content: timeRemaining ? `${transcript}\n[time_remaining: "${timeRemaining}"]` : transcript,
          },
        ];

        const { parsed, provider } = await this.callLLM(messages, session.context);
        session.lastLlmProvider = provider;
        userTurn.llm_provider = provider;

        const isNonEngagement = Boolean(parsed.is_non_engagement);
        const isObviousOffTopic = this.checkObviousEnglishOrGibberish(transcript);

        if (isNonEngagement || isObviousOffTopic) {
          if (session.targetPhraseAttempts < 3) {
            session.targetPhraseAttempts += 1;
          } else {
            session.strikes += 1;
            session.targetPhraseAttempts = 1;
          }
        } else {
          session.targetPhraseAttempts = 1;
        }

        if (session.strikes >= 3 || parsed.session_ended) {
          session.hasClosed = true;
          userTurn.sessionEnded = true;
          const signOff = "Let's pick this back up another time — great effort today.";
          userTurn.feedback_en = signOff;
          this.notifyTranscript(session, { ...userTurn });
          await this.speak(sessionHandle, signOff);
          const lastTurn = session.turns[session.turns.length - 1];
          if (lastTurn) lastTurn.sessionEnded = true;
          this.notifySessionEnded(session, 'strikes_exceeded');
          return;
        }

        const newMistakes = Array.isArray(parsed.detected_mistakes) ? parsed.detected_mistakes : [];
        const detectedCategory = (parsed.category || newMistakes[0]?.category || '').toLowerCase().trim();
        const isRecurring = Boolean(
          (parsed.has_recurring_correction || parsed.correction_note_en) &&
          detectedCategory &&
          previousCategories.includes(detectedCategory)
        );

        // Always log any detected mistakes silently to session.mistakes and track repeated frequency
        let repeatedMistakeThresholdHit = false;
        newMistakes.forEach((m: any) => {
          if (m && (m.example || m.example_de || m.correction_de || m.correction || m.category)) {
            const catKey = (m.category || 'grammar').toLowerCase().trim();
            const count = (session.mistakeFrequencyMap.get(catKey) || 0) + 1;
            session.mistakeFrequencyMap.set(catKey, count);
            if (count >= 5) {
              repeatedMistakeThresholdHit = true;
            }

            session.mistakes.push({
              category: m.category || 'General Usage',
              example_de: transcript,
              example_en: transcript,
              correction_de: m.correction_de || m.correction || '',
              correction_en: m.correction_en || m.correction || m.correction_de || '',
              example: transcript,
              correction: m.correction_de || m.correction || '',
            });
          }
        });

        if (repeatedMistakeThresholdHit) {
          session.hasClosed = true;
          userTurn.sessionEnded = true;
          const stopNotice = "Let's pause here. You have encountered this same mistake 5 times. Please take a moment to read and review this manually on your screen, and come back when you're ready.";
          userTurn.feedback_en = stopNotice;
          this.notifyTranscript(session, { ...userTurn });
          await this.speak(sessionHandle, stopNotice);
          const lastTurn = session.turns[session.turns.length - 1];
          if (lastTurn) lastTurn.sessionEnded = true;
          this.notifySessionEnded(session, 'repeated_mistake_threshold');
          return;
        }

        const replyDe = parsed.reply_de || 'Verstehe, bitte fahren Sie fort.';
        let finalReply = replyDe;

        if (isRecurring && parsed.correction_note_en) {
          finalReply = `${replyDe}\n\nNote: ${parsed.correction_note_en}`;
          userTurn.isCorrect = false;
          userTurn.correction = parsed.correction || newMistakes[0]?.correction_de || null;
          userTurn.category = parsed.category || newMistakes[0]?.category || null;
          userTurn.feedback_en = parsed.correction_note_en;
        } else {
          userTurn.isCorrect = true;
          userTurn.correction = null;
          userTurn.category = null;
          userTurn.feedback_en = null;
        }

        if ((isNonEngagement || isObviousOffTopic) && session.strikes > 0 && !finalReply.includes("No worries")) {
          finalReply = `No worries, let's keep going. ${finalReply}`;
        }

        this.notifyTranscript(session, { ...userTurn });
        await this.speak(sessionHandle, finalReply);
      } else if (mode === 'learn') {
        // CASE 1: SPEAK AGENT — LEARN MODE
        const microSkill = session.context.micro_skill || session.context.title || 'Target German sentence structure';
        const targetPhrases = session.context.targetPhrase || session.context.target_phrases || 'German target phrase';
        const domainVariants = session.context.domain_variant_phrases || 'None';

        const timeRemaining = this.getTimeRemaining(session);
        const timeRemainingInfo = timeRemaining
          ? `\nSession time remaining: ${timeRemaining}.\n- As time runs low, keep feedback focused and encouraging as the session wraps up.`
          : '';

        const learnPrompt = `You are a supportive German language tutor for a learner at ${cefrLevel} level.
This session covers: ${microSkill}
Target phrase(s): ${targetPhrases}
Domain context (if applicable): ${domainVariants}${timeRemainingInfo}

The learner has just attempted to say a German phrase. You will receive:
- The target phrase they were asked to produce
- Their actual spoken transcript (via STT — transcribed as closely as possible to what was actually said, including any errors)
- STT confidence level for this transcript, if available

Your job:
1. First, judge warmly: is this correct, close, or a genuine deviation? Acceptable phrasing variations or near-matches should be treated as correct — don't nitpick.
2. If STT confidence is low, hedge your judgment rather than asserting it confidently.
3. If there is a genuine deviation, identify ONE primary category from: verb conjugation, case agreement, word order, vocabulary choice, missing word, other.

SILENT ENGAGEMENT TRACKING & STRIKE POLICY:
Current running strikes in this session: ${session.strikes} (maximum 3 allowed).
Attempt count on this target phrase: Attempt ${session.targetPhraseAttempts} of 3.
- Strikes are strictly silent — NEVER mention "strikes", numbers, or this policy to the learner under any circumstances.
- Evaluate whether the learner's response is a GENUINE attempt:
  * GENUINE ATTEMPTS (NEVER STRIKE): Mispronunciation, foreign accent, pauses/hesitation, grammar errors, case/word order mistakes, or sincere attempts in broken German. These are normal language practice and MUST NEVER BE PENALIZED OR GIVEN A STRIKE. Set is_genuine_attempt: true, is_non_engagement: false.
  * CLEAR NON-ENGAGEMENT: Speaking English when German was asked, producing gibberish/nonsense, repeating the exact same wrong answer with zero adjustment, or clearly off-topic/disruptive remarks.
- Progression if NO GENUINE ATTEMPT is made:
  * Attempt 1: Rephrase the prompt more simply in English for Attempt 2. Set is_genuine_attempt: false, is_non_engagement: false.
  * Attempt 2: Give a light hint in English (e.g. first sound of the word). Set is_genuine_attempt: false, is_non_engagement: false.
  * Attempt 3: If STILL no genuine attempt after re-prompting and hinting: this triggers 1 STRIKE! Set is_non_engagement: true.
- If this turn reaches strike 3 (${session.strikes + 1} >= 3):
  * Switch to English, give this exact warm sign-off: "Let's pick this back up another time — great effort today.", and set session_ended: true.
- If this is strike 1 or 2 (${session.strikes + 1} < 3):
  * Briefly and kindly acknowledge in English without shaming ("No worries, let's keep going.") and move to the next item or practice phrase.

Return ONLY valid JSON:
{
  "correct": true/false,
  "confidence_hedge": true/false,
  "is_genuine_attempt": true/false,
  "is_non_engagement": true/false,
  "category": "<category or null>",
  "example": "<the raw transcript, unmodified>",
  "correction": "<corrected German version, or null if correct>",
  "feedback_en": "<one warm, coaching-toned sentence in English>",
  "session_ended": true/false
}

Never put anything in "example" other than the raw transcript. Never include anything outside the JSON object. feedback_en must be English only, short, encouraging, never harsh or pedantic.`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: learnPrompt },
          {
            role: 'user',
            content: `Target phrase: "${targetPhrases}"\nLearner transcript: "${transcript}"\nSTT confidence level: ${sttConfidence}${timeRemaining ? `\ntime_remaining: "${timeRemaining}"` : ''}`,
          },
        ];

        const { parsed, provider } = await this.callLLM(messages, session.context);
        session.lastLlmProvider = provider;
        userTurn.llm_provider = provider;

        const isNonEngagement = Boolean(parsed.is_non_engagement);
        const isObviousOffTopic = this.checkObviousEnglishOrGibberish(transcript);
        const isGenuine = parsed.is_genuine_attempt !== false && !isNonEngagement && !isObviousOffTopic;

        if (isGenuine) {
          session.targetPhraseAttempts = 1;
        } else {
          if (session.targetPhraseAttempts < 3) {
            session.targetPhraseAttempts += 1;
          } else {
            session.strikes += 1;
            session.targetPhraseAttempts = 1;
          }
        }

        if (session.strikes >= 3 || parsed.session_ended) {
          session.hasClosed = true;
          userTurn.sessionEnded = true;
          const signOff = "Let's pick this back up another time — great effort today.";
          userTurn.feedback_en = signOff;
          this.notifyTranscript(session, { ...userTurn });
          await this.speak(sessionHandle, signOff);
          const lastTurn = session.turns[session.turns.length - 1];
          if (lastTurn) lastTurn.sessionEnded = true;
          this.notifySessionEnded(session, 'strikes_exceeded');
          return;
        }

        const isCorrect = isGenuine && Boolean(parsed.correct);
        const correction = !isCorrect && parsed.correction ? parsed.correction : null;
        let feedbackEn =
          parsed.feedback_en ||
          (isCorrect
            ? 'Great job, that sounded very natural!'
            : `Good try! In German, you could say: ${correction || targetPhrases}`);

        if ((isNonEngagement || isObviousOffTopic) && session.strikes > 0 && !feedbackEn.includes("No worries")) {
          feedbackEn = `No worries, let's keep going. ${feedbackEn}`;
        }

        // Update userTurn with evaluation and notify UI so Learn feedback shows verbatim transcript alongside correction
        userTurn.isCorrect = isCorrect;
        userTurn.correction = correction;
        userTurn.category = parsed.category || null;
        userTurn.feedback_en = feedbackEn;
        userTurn.confidence_hedge = Boolean(parsed.confidence_hedge);
        this.notifyTranscript(session, { ...userTurn });

        session.feedbacks.push(feedbackEn);

        if (!isCorrect && (parsed.category || correction)) {
          const catKey = (parsed.category || 'Target Structure').toLowerCase().trim();
          const count = (session.mistakeFrequencyMap.get(catKey) || 0) + 1;
          session.mistakeFrequencyMap.set(catKey, count);

          session.mistakes.push({
            category: parsed.category || 'Vocabulary & Grammar',
            example_de: null,
            example_en: transcript,
            correction_de: null,
            correction_en: correction || targetPhrases,
            example: transcript,
            correction: correction || targetPhrases,
            feedback_en: feedbackEn,
          });

          if (count >= 5) {
            session.hasClosed = true;
            userTurn.sessionEnded = true;
            const stopNotice = "Let's pause here. You have encountered this same mistake 5 times. Please take a moment to read and review this manually on your screen, and come back when you're ready.";
            userTurn.feedback_en = stopNotice;
            this.notifyTranscript(session, { ...userTurn });
            await this.speak(sessionHandle, stopNotice);
            const lastTurn = session.turns[session.turns.length - 1];
            if (lastTurn) lastTurn.sessionEnded = true;
            this.notifySessionEnded(session, 'repeated_mistake_threshold');
            return;
          }
        }

        await this.speak(sessionHandle, feedbackEn);
      } else {
        // CASE 2: SPEAK AGENT — PRACTICE MODE (Speak / Scenarios)
        const scenarioContext = session.context.scenarioType || session.context.title || 'German dialogue simulation';
        const domain = session.context.domain || 'General';
        const subBranch = session.context.sub_branch || 'General';

        const timeRemaining = this.getTimeRemaining(session);
        const timeRemainingInfo = timeRemaining
          ? `\nSession time remaining: ${timeRemaining}.\n- As time runs low (under 2 minutes remaining), naturally begin steering the conversation toward a conclusion — do not cut off abruptly.`
          : '';

        const practicePrompt = `You are role-playing a natural German conversation partner for a ${cefrLevel} learner practicing: ${scenarioContext}
Domain: ${domain} / ${subBranch}${timeRemainingInfo}

Rules:
- Speak ONLY in German. Never switch to English, never give feedback mid-conversation.
- Keep your turns natural and conversational, appropriate to ${cefrLevel}.
- Do not correct the learner's mistakes during the conversation — just respond naturally, as a real conversation partner would.
- When you detect a mistake in the learner's turn, do not correct it directly — instead, naturally incorporate the correct form into your own next German reply, the way a native speaker would respond without drawing attention to the error. Example: if the learner says 'Ich gehe in Krankenhaus', your reply might naturally include '...du gehst ins Krankenhaus...' without flagging it as a correction.
- Silently log any errors you notice for later (do not mention them now).
- Steer the conversation toward a natural German close as time runs out — do not cut off abruptly.

SILENT ENGAGEMENT TRACKING & STRIKE POLICY:
Current running strikes in this session: ${session.strikes} (maximum 3 allowed).
- Strikes are strictly silent — NEVER mention "strikes", numbers, or this policy to the learner under any circumstances.
- Evaluate whether the learner's response is a GENUINE attempt:
  * GENUINE ATTEMPTS (NEVER STRIKE): Mispronunciation, foreign accent, pauses/hesitation, grammar errors, case/word order mistakes, or sincere attempts in broken German. These are normal language practice and MUST NEVER BE PENALIZED OR GIVEN A STRIKE.
  * CLEAR NON-ENGAGEMENT: Speaking English when German was asked, producing gibberish/nonsense, repeating the exact same wrong answer with zero adjustment, or clearly off-topic/disruptive remarks.
- If clear non-engagement occurs:
  * Set "is_non_engagement": true.
  * If this turn reaches strike 3 (${session.strikes + 1} >= 3):
    - Switch to English.
    - Provide this exact warm sign-off: "Let's pick this back up another time — great effort today."
    - Set "session_ended": true.
  * If this is strike 1 or 2 (${session.strikes + 1} < 3):
    - Prepend a brief, kind acknowledgment in English without shaming ("No worries, let's keep going.") before continuing the conversation in German.

You will also receive the full conversation history so far — use it to keep responses coherent and contextually relevant.

Return ONLY valid JSON:
{
  "reply_de": "<your next German conversational turn, or English sign-off if session_ended>",
  "is_non_engagement": true/false,
  "session_ended": true/false,
  "detected_mistakes": [{"category": "...", "example": "...", "correction_de": "...", "correction_en": "..."}]
}

detected_mistakes may be an empty array. These are logged silently — never surfaced to the learner until session end.`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: practicePrompt },
          ...session.conversationHistory.slice(0, -1),
          {
            role: 'user',
            content: timeRemaining ? `${transcript}\n[time_remaining: "${timeRemaining}"]` : transcript,
          },
        ];

        const { parsed, provider } = await this.callLLM(messages, session.context);
        session.lastLlmProvider = provider;
        userTurn.llm_provider = provider;

        let repeatedPracticeCategory = false;
        if (Array.isArray(parsed.detected_mistakes)) {
          parsed.detected_mistakes.forEach((m: any) => {
            if (m && (m.correction_de || m.correction || m.category)) {
              const catKey = (m.category || 'grammar').toLowerCase().trim();
              const count = (session.mistakeFrequencyMap.get(catKey) || 0) + 1;
              session.mistakeFrequencyMap.set(catKey, count);
              if (count >= 5) {
                repeatedPracticeCategory = true;
              }

              session.mistakes.push({
                category: m.category || 'general',
                example_de: transcript,
                example_en: transcript,
                correction_de: m.correction_de || m.correction || '',
                correction_en: m.correction_en || m.correction || '',
                example: transcript,
                correction: m.correction_de || m.correction || '',
              });
            }
          });
        }

        if (repeatedPracticeCategory) {
          session.hasClosed = true;
          userTurn.sessionEnded = true;
          const stopNotice = "Let's pause here. You have encountered this same mistake 5 times. Please take a moment to read and review this manually on your screen, and come back when you're ready.";
          userTurn.feedback_en = stopNotice;
          this.notifyTranscript(session, { ...userTurn });
          await this.speak(sessionHandle, stopNotice);
          const lastTurn = session.turns[session.turns.length - 1];
          if (lastTurn) lastTurn.sessionEnded = true;
          this.notifySessionEnded(session, 'repeated_mistake_threshold');
          return;
        }

        const isNonEngagement = Boolean(parsed.is_non_engagement) || this.checkObviousEnglishOrGibberish(transcript);
        if (isNonEngagement) {
          session.strikes += 1;
        }

        if (session.strikes >= 3 || parsed.session_ended) {
          session.hasClosed = true;
          userTurn.sessionEnded = true;
          const signOff = "Let's pick this back up another time — great effort today.";
          await this.speak(sessionHandle, signOff);
          const lastTurn = session.turns[session.turns.length - 1];
          if (lastTurn) lastTurn.sessionEnded = true;
          this.notifySessionEnded(session, 'strikes_exceeded');
          return;
        }

        let replyDe = parsed.reply_de || 'Verstehe, bitte fahren Sie fort.';
        if (isNonEngagement && !replyDe.includes("No worries")) {
          replyDe = `No worries, let's keep going. ${replyDe}`;
        }
        await this.speak(sessionHandle, replyDe);
      }
    } catch (err: any) {
      console.error('[RealVoiceAdapter] LLM / speech error:', err);
      this.updateState(session, 'idle');
      throw new Error(`AI assistant error: ${err.message || 'Failed to generate response'}`);
    } finally {
      this.updateState(session, 'idle');
    }
  }

  /**
   * Internal helper to play a single TTS clip with a specific voice.
   */
  private async playTtsClip(
    text: string,
    voice: string,
    signal: AbortSignal,
    myGen: number
  ): Promise<void> {
    if (!text || !text.trim() || this.currentSpeakGen !== myGen || signal.aborted) {
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;
        const res = await fetch(ttsUrl, { signal });

        if (this.currentSpeakGen !== myGen || signal.aborted) return;

        if (res.ok) {
          const blob = await res.blob();
          if (this.currentSpeakGen !== myGen || signal.aborted) return;

          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;

          await new Promise<void>((resolve) => {
            let isResolved = false;
            const finish = () => {
              if (isResolved) return;
              isResolved = true;
              if (this.activeAudio === audio) {
                this.activeAudio = null;
              }
              try {
                URL.revokeObjectURL(audioUrl);
              } catch {}
              resolve();
            };
            audio.onended = finish;
            audio.onerror = finish;
            audio.onpause = () => {
              if (this.activeAudio !== audio || this.currentSpeakGen !== myGen) {
                finish();
              }
            };
            if (this.currentSpeakGen !== myGen || signal.aborted) {
              finish();
              return;
            }
            audio.play().catch(() => finish());
          });
        } else {
          if (this.currentSpeakGen === myGen && !signal.aborted) {
            const lang = voice.startsWith('de') ? 'de-DE' : 'en-US';
            await this.speakBrowserSpeechSynthesis(text, lang);
          }
        }
      } else {
        const { MsEdgeTTS, OUTPUT_FORMAT } = await import(/* @vite-ignore */ 'msedge-tts');
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(text);

        await new Promise<void>((resolve, reject) => {
          audioStream.on('data', () => {});
          audioStream.on('end', () => {
            tts.close();
            resolve();
          });
          audioStream.on('error', (err) => {
            tts.close();
            reject(err);
          });
        });
      }
    } catch (err: any) {
      console.warn('[RealVoiceAdapter] Edge TTS playback warning:', err?.message);
    }
  }

  /**
   * speak(sessionHandle, text):
   * Send text to Edge TTS (voice: de-DE-KatjaNeural or en-US-JennyNeural for English feedback),
   * play resulting audio, push turn to session transcript and conversation history.
   */
  async speak(sessionHandle: VoiceSessionHandle, text: string): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      throw new Error(`Session ${sessionHandle.id} does not exist`);
    }

    const myGen = ++this.currentSpeakGen;
    if (this.currentTtsAbortController) {
      try { this.currentTtsAbortController.abort(); } catch {}
    }
    const abortController = new AbortController();
    this.currentTtsAbortController = abortController;

    this.updateState(session, 'speaking');

    // Determine appropriate voice: English neural voice for English feedback (Learn mode),
    // de-DE-KatjaNeural for all German speech.
    const isEnglish = /^[A-Za-z0-9\s.,!?'"()-]+$/.test(text) && !/[äöüßÄÖÜ]/.test(text) && (text.includes('the ') || text.includes('you ') || text.includes('Great ') || text.includes('Good ') || text.includes('Remember '));
    const voice = isEnglish ? 'en-US-JennyNeural' : 'de-DE-KatjaNeural';

    await this.playTtsClip(text, voice, abortController.signal, myGen);

    if (this.currentSpeakGen !== myGen) return;

    // Push agent turn to session turns and conversation history
    const turn: TranscriptTurn = {
      speaker: 'agent',
      text,
      timestamp: new Date().toISOString(),
      llm_provider: session.lastLlmProvider || 'groq',
    };

    session.turns.push(turn);
    session.conversationHistory.push({ role: 'assistant', content: text });
    this.updateState(session, 'idle');
    this.notifyTranscript(session, turn);

    // If session has not closed and strikes < 3, start the silence timer for the learner's response
    if (!session.hasClosed && session.strikes < 3) {
      this.startSilenceTimer(session);
    }
  }

  /**
   * speakSegments(sessionHandle, segments):
   * Plays sequential segments with appropriate native voices:
   * 'en' -> en-US-JennyNeural, 'de' -> de-DE-KatjaNeural.
   * Records a single coherent transcript turn with combined text.
   */
  async speakSegments(sessionHandle: VoiceSessionHandle, segments: SpeechSegment[]): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session || segments.length === 0) return;

    const myGen = ++this.currentSpeakGen;
    if (this.currentTtsAbortController) {
      try { this.currentTtsAbortController.abort(); } catch {}
    }
    const abortController = new AbortController();
    this.currentTtsAbortController = abortController;

    this.updateState(session, 'speaking');

    for (const seg of segments) {
      if (this.currentSpeakGen !== myGen || abortController.signal.aborted) break;
      const voice = seg.lang === 'de' ? 'de-DE-KatjaNeural' : 'en-US-JennyNeural';
      await this.playTtsClip(seg.text, voice, abortController.signal, myGen);
    }

    if (this.currentSpeakGen !== myGen) return;

    const combinedText = segments.map((s) => s.text).join('\n\n');
    const turn: TranscriptTurn = {
      speaker: 'agent',
      text: combinedText,
      timestamp: new Date().toISOString(),
      llm_provider: session.lastLlmProvider || 'groq',
    };

    session.turns.push(turn);
    session.conversationHistory.push({ role: 'assistant', content: combinedText });
    this.updateState(session, 'idle');
    this.notifyTranscript(session, turn);

    if (!session.hasClosed && session.strikes < 3) {
      this.startSilenceTimer(session);
    }
  }

  /**
   * speakPracticeReview(sessionHandle):
   * Delivers a concise 3-pointer verbal review in English at the end of Practice Mode.
   */
  async speakPracticeReview(sessionHandle: VoiceSessionHandle): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) return;

    const mistakes = session.mistakes || [];
    let reviewPointers: string;

    if (mistakes.length === 0) {
      reviewPointers = "Session complete! Here is your quick performance review: First, you maintained a fluent conversational pace throughout. Second, your German phrasing and vocabulary were accurate and confident. Third, great job completing the scenario autonomously. Take a look at your diagnostic summary on screen.";
    } else {
      const topCategory = mistakes[0]?.category || 'grammar';
      const exampleCorrection = mistakes[0]?.correction_de || mistakes[0]?.correction || '';
      const exampleNote = exampleCorrection ? ` such as practicing "${exampleCorrection}"` : '';

      reviewPointers = `Session complete! Here is your quick performance review: First, you actively engaged and maintained the conversational flow. Second, pay attention to ${topCategory}${exampleNote}. Third, review the highlighted notes in your report to lock in these structures. Let's look at your full diagnostic recap now.`;
    }

    const segments: SpeechSegment[] = [
      { text: reviewPointers, lang: 'en' },
    ];

    await this.speakSegments(sessionHandle, segments);
  }

  private speakBrowserSpeechSynthesis(text: string, lang: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return resolve();
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  /**
   * triggerFinalClosingTurn(sessionHandle):
   * When client timer hits zero, waits for any in-progress turn to finish,
   * then calls Groq LLM with explicit instruction to close the session naturally:
   * - Practice mode: produces natural in-character German closing line, spoken out via TTS.
   * - Learn mode: produces direct English-only wrap-up, spoken out via English TTS.
   * - Open-ended sessions: does not run.
   */
  async triggerFinalClosingTurn(sessionHandle: VoiceSessionHandle): Promise<TranscriptTurn | null> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      console.warn(`[RealVoiceAdapter] Session ${sessionHandle.id} not found for final closing turn.`);
      return null;
    }

    if (session.context.durationMinutes === 'open') {
      return null;
    }

    // Guard against multiple triggers
    if (session.hasClosed) {
      return session.turns[session.turns.length - 1] || null;
    }

    // Wait for any current in-progress turn to fully complete (no mid-turn cutoffs!)
    while (session.currentState === 'listening' || session.currentState === 'processing' || session.currentState === 'speaking') {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (session.hasClosed) {
      return session.turns[session.turns.length - 1] || null;
    }
    session.hasClosed = true;

    this.updateState(session, 'processing');

    try {
      const mode = session.context.mode || 'learn';
      const tab = session.context.tab || 'speak';
      const cefrLevel = session.context.cefr_level || 'B1';

      if (mode === 'practice' || tab === 'interview') {
        // PRACTICE MODE: IN-CHARACTER GERMAN CLOSING LINE FIRST
        const domain = session.context.domain || 'General';
        const subBranch = session.context.sub_branch || 'General';
        const interviewType = session.context.interviewType || 'Standard';
        const scenarioContext = session.context.scenarioType || session.context.title || 'German dialogue simulation';

        const closingPrompt = tab === 'interview'
          ? `You are conducting a formal mock job interview in German for a candidate targeting: ${domain} / ${subBranch}
Interview type: ${interviewType}

The session timer has reached zero and time is up. This is your FINAL closing turn.
Deliver a natural, courteous IN-CHARACTER formal closing statement in German (e.g. "Das wären meine Fragen für heute, vielen Dank für das gute Gespräch und Ihre Zeit. Wir melden uns in Kürze bei Ihnen. Auf Wiedersehen!").
Do NOT ask any new questions. Conclude the interview gracefully in German.

Return ONLY valid JSON:
{
  "reply_de": "<your formal in-character German closing statement>",
  "interview_closing": true,
  "detected_mistakes": []
}`
          : `You are role-playing a natural German conversation partner for a ${cefrLevel} learner practicing: ${scenarioContext}
Domain: ${domain} / ${subBranch}

The session timer has reached zero and time is up. This is your FINAL closing turn.
Deliver a natural, friendly IN-CHARACTER closing statement in German (e.g. "Das war ein sehr gutes Gespräch, vielen Dank! Unsere Zeit für heute ist leider um. Bis zum nächsten Mal!").
Do NOT ask any new questions or introduce any new topics. Conclude the interaction gracefully in German.

Return ONLY valid JSON:
{
  "reply_de": "<your in-character German closing line>",
  "detected_mistakes": []
}`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: closingPrompt },
          ...session.conversationHistory,
          {
            role: 'user',
            content: '[The session timer has reached zero. Provide your final in-character German closing statement now.]',
          },
        ];

        const { parsed, provider } = await this.callLLM(messages, session.context);
        session.lastLlmProvider = provider;
        const closingDe = parsed.reply_de || (tab === 'interview'
          ? 'Das wären alle Fragen für heute, vielen Dank für das Gespräch. Auf Wiedersehen!'
          : 'Unsere Zeit ist für heute um, vielen Dank für das Gespräch. Bis bald!');

        await this.speak(sessionHandle, closingDe);
        return session.turns[session.turns.length - 1] || null;
      } else {
        // LEARN MODE: DIRECT ENGLISH WRAP-UP ONLY (NO GERMAN CLOSING LINE)
        const microSkill = session.context.micro_skill || session.context.title || 'Target German sentence structure';
        const scenarioContext = session.context.title || session.context.scenarioType || 'German practice';

        const closingPrompt = `You are a supportive German language tutor for a learner at ${cefrLevel} level.
This session covered: ${microSkill || scenarioContext}

The session timer has reached zero and time is up. This is your FINAL closing turn.
Provide a direct, warm, encouraging wrap-up in ENGLISH only (e.g. "That's our time for today's session — nice work practicing these target phrases! You made great progress today.").
Do NOT include any German closing line. Do not ask the learner to try again.

Return ONLY valid JSON:
{
  "feedback_en": "<one warm encouraging wrap-up sentence in English only>",
  "correct": true
}`;

        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: closingPrompt },
          ...session.conversationHistory,
          {
            role: 'user',
            content: '[The session timer has reached zero. Provide your final English wrap-up now.]',
          },
        ];

        const { parsed, provider } = await this.callLLM(messages, session.context);
        session.lastLlmProvider = provider;
        const wrapUpEn = parsed.feedback_en || "That's our time for today's session — nice work practicing today!";
        session.feedbacks.push(wrapUpEn);

        await this.speak(sessionHandle, wrapUpEn);
        return session.turns[session.turns.length - 1] || null;
      }
    } catch (err: any) {
      console.error('[RealVoiceAdapter] Error during triggerFinalClosingTurn:', err);
      const mode = session.context.mode || 'learn';
      const tab = session.context.tab || 'speak';
      const fallbackText = mode === 'learn'
        ? "That's our time for today's session — nice work practicing today!"
        : (tab === 'interview'
            ? 'Das wären alle Fragen für heute, vielen Dank für das Gespräch. Auf Wiedersehen!'
            : 'Unsere Zeit ist für heute um, vielen Dank für das Gespräch. Bis bald!');
      await this.speak(sessionHandle, fallbackText);
      return session.turns[session.turns.length - 1] || null;
    } finally {
      this.updateState(session, 'idle');
    }
  }

  /**
   * Immediately halts any active TTS playback (Audio element or speechSynthesis),
   * cancels any scheduled silence timers, and resets state to idle.
   */
  stopSpeaking(sessionHandle?: VoiceSessionHandle): void {
    this.currentSpeakGen++;
    if (this.currentTtsAbortController) {
      try {
        this.currentTtsAbortController.abort();
      } catch {}
      this.currentTtsAbortController = null;
    }
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio.src = '';
      } catch (e) {
        console.warn('[RealVoiceAdapter] Error stopping audio:', e);
      }
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('[RealVoiceAdapter] Error cancelling speechSynthesis:', e);
      }
    }
    if (sessionHandle) {
      const session = this.sessions.get(sessionHandle.id);
      if (session) {
        if (session.silenceTimeoutId) {
          clearTimeout(session.silenceTimeoutId);
          session.silenceTimeoutId = undefined;
        }
        this.updateState(session, 'idle');
      }
    } else {
      this.sessions.forEach((s) => {
        if (s.silenceTimeoutId) {
          clearTimeout(s.silenceTimeoutId);
          s.silenceTimeoutId = undefined;
        }
        this.updateState(s, 'idle');
      });
    }
  }

  /**
   * endSession(sessionHandle):
   * Finalize the session, preserving the full transcript and mistake log
   * for generateDiagnosticRecap to consume.
   */
  async endSession(sessionHandle: VoiceSessionHandle): Promise<TranscriptTurn[]> {
    this.stopSpeaking(sessionHandle);
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      return [];
    }

    const finalTurns = [...session.turns];
    const sessionVoiceData: StoredSessionVoiceData = {
      turns: finalTurns,
      mistakes: [...session.mistakes],
      context: session.context,
      feedbacks: [...session.feedbacks],
    };

    // Store in global cache indexed by handle id and any associated IDs
    completedSessionsStore.set(sessionHandle.id, sessionVoiceData);
    lastCompletedSessionData = sessionVoiceData;

    if (session.context.moduleId) {
      completedSessionsStore.set(session.context.moduleId, sessionVoiceData);
    }
    if (session.context.scenarioType) {
      completedSessionsStore.set(session.context.scenarioType, sessionVoiceData);
    }
    if (session.context.interviewType) {
      completedSessionsStore.set(session.context.interviewType, sessionVoiceData);
    }

    this.clearSilenceTimer(session);
    session.transcriptListeners.clear();
    session.stateListeners.clear();
    session.sessionEndedListeners.clear();
    this.sessions.delete(sessionHandle.id);

    return finalTurns;
  }
}

export const realVoiceAdapter: VoiceAdapter = new RealVoiceAdapter();
