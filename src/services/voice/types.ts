export type SpeakerRole = 'user' | 'agent' | 'event';

export interface TranscriptTurn {
  speaker: SpeakerRole;
  text: string;
  timestamp: string;
  rawTranscript?: string;
  isCorrect?: boolean;
  correction?: string | null;
  category?: string | null;
  feedback_en?: string | null;
  what_was_good?: string | null;
  what_to_change?: string | null;
  score?: number | null;
  confidence_hedge?: boolean;
  sessionEnded?: boolean;
  isCheckIn?: boolean;
  llm_provider?: 'groq' | 'openrouter';
  control?: 'slower' | 'repeat' | 'hint';
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceSessionContext {
  sessionId?: string;
  tab: 'speak' | 'scenarios' | 'interview';
  mode: 'learn' | 'practice';
  moduleId?: string;
  scenarioType?: string;
  interviewType?: string;
  targetPhrase?: string;
  domain?: string;
  title?: string;
  micro_skill?: string;
  cefr_level?: string;
  sub_branch?: string;
  pressure_mode?: string;
  target_phrases?: any;
  domain_variants?: any;
  domain_variant_phrases?: string;
  durationMinutes?: number | 'open';
  isOpenInterview?: boolean;
  minutesLimit?: string;
  character?: {
    id: string;
    name: string;
    role: string;
    domain?: string;
    intro_line?: string;
  } | null;
  [key: string]: any;
}

export interface VoiceSessionHandle {
  id: string;
  context: VoiceSessionContext;
  createdAt: number;
}

export type TranscriptCallback = (turn: TranscriptTurn) => void;
export type VoiceStateCallback = (state: VoiceState) => void;
export type SessionEndedCallback = (reason: string) => void;

export interface SpeechSegment {
  text: string;
  lang: 'en' | 'de';
}

export interface VoiceAdapter {
  startSession(context: VoiceSessionContext): Promise<VoiceSessionHandle>;
  sendAudio(sessionHandle: VoiceSessionHandle, audioChunk?: any, clientTranscript?: string): Promise<void>;
  onTranscript(sessionHandle: VoiceSessionHandle, callback: TranscriptCallback): () => void;
  onStateChange?(sessionHandle: VoiceSessionHandle, callback: VoiceStateCallback): () => void;
  onSessionEnded?(sessionHandle: VoiceSessionHandle, callback: SessionEndedCallback): () => void;
  speak(sessionHandle: VoiceSessionHandle, text: string, options?: { rate?: string }): Promise<void>;
  repeatLastPrompt?(sessionHandle: VoiceSessionHandle, options?: { rate?: string }): Promise<void>;
  getLastSpokenText?(sessionHandle: VoiceSessionHandle): string | null;
  speakSegments?(sessionHandle: VoiceSessionHandle, segments: SpeechSegment[]): Promise<void>;
  speakPhrasePrompt?(
    sessionHandle: VoiceSessionHandle,
    phrase: { german: string; english: string },
    isFirst: boolean,
    userName: string,
    moduleTitle?: string
  ): Promise<void>;
  speakPhraseRetryPrompt?(
    sessionHandle: VoiceSessionHandle,
    phrase: { german: string; english: string },
    tip?: string
  ): Promise<void>;
  speakPracticeReview?(sessionHandle: VoiceSessionHandle): Promise<void>;
  stopSpeaking?(sessionHandle?: VoiceSessionHandle): void;
  triggerFinalClosingTurn?(sessionHandle: VoiceSessionHandle): Promise<TranscriptTurn | null>;
  endSession(sessionHandle: VoiceSessionHandle): Promise<TranscriptTurn[]>;
  getStrikes?(sessionHandle: VoiceSessionHandle): number;
  handleSilence?(sessionHandle: VoiceSessionHandle): Promise<void>;
  cancelSilenceTimer?(sessionHandle: VoiceSessionHandle): void;
  callLLM?(
    messages: Array<{ role: string; content: string }>,
    context?: VoiceSessionContext
  ): Promise<{ parsed: any; provider: 'groq' | 'openrouter' }>;
}
