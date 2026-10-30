import { VoiceAdapter } from './types';
import { realVoiceAdapter, getSessionVoiceData } from './voiceAdapter.real';
import { stubVoiceAdapter } from './voiceAdapter.stub';

// Default export uses the RealVoiceAdapter connected to Groq Whisper STT, Groq Llama LLM, and Edge TTS
export const voiceAdapter: VoiceAdapter = realVoiceAdapter;

export { realVoiceAdapter, stubVoiceAdapter, getSessionVoiceData };
export * from './types';
export type { VoiceMistake, StoredSessionVoiceData } from './voiceAdapter.real';
