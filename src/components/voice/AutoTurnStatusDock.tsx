import React from 'react';
import { Mic, Volume2, Loader2, Pause, Play, Send, AlertCircle, Sparkles } from 'lucide-react';
import { VoiceState } from '../../services/voice/types';

export interface AutoTurnStatusDockProps {
  voiceState: VoiceState;
  isUserSpeaking: boolean;
  isManualPaused: boolean;
  onTogglePause?: () => void;
  onManualSubmit?: () => void;
  onManualStartSpeaking?: () => void;
  onRequestPermission?: () => void;
  vadError?: string | null;
  volumeLevel?: number;
  interimTranscript?: string;
  agentName?: string;
  className?: string;
}

export const AutoTurnStatusDock: React.FC<AutoTurnStatusDockProps> = ({
  voiceState,
  isUserSpeaking,
  isManualPaused,
  onTogglePause,
  onManualSubmit,
  onManualStartSpeaking,
  onRequestPermission,
  vadError,
  volumeLevel = 0,
  interimTranscript = '',
  agentName = 'Coach',
  className = '',
}) => {
  const isAgentSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';

  // Scaled bar heights for dynamic audio wave feedback
  const dynamicHeight = Math.max(6, Math.min(26, Math.round((volumeLevel / 100) * 26)));

  return (
    <div
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      className={`sticky z-30 max-w-xl mx-auto w-full px-2 transition-all duration-200 ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 w-full">
          {/* =========================================================================
              STATE 1: AGENT SPEAKING (TTS Playing - VAD is OFF)
          ========================================================================= */}
          {isAgentSpeaking && (
            <div className="flex items-center justify-between w-full animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3.5 bg-[#255CC1] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-5 bg-[#255CC1] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-7 bg-[#255CC1] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-4 bg-[#255CC1] rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#00215C] leading-none">
                    {agentName} is speaking
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-none">
                    Listening resumes automatically
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4 animate-pulse" />
              </div>
            </div>
          )}

          {/* =========================================================================
              STATE 2: PROCESSING (STT / LLM Running)
          ========================================================================= */}
          {isProcessing && (
            <div className="flex items-center justify-between w-full animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-950 leading-none">
                    Processing response...
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-none">
                    Transcribing & analyzing German speech
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STATE 3: LISTENING / SPEAKING / PAUSED
          ========================================================================= */}
          {!isAgentSpeaking && !isProcessing && (
            <>
              {isManualPaused ? (
                // Sub-state: Manually Paused
                <div className="flex items-center justify-between w-full animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Pause className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 leading-none">
                        Listening paused
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-none">
                        Tap resume when ready
                      </p>
                    </div>
                  </div>
                  {onTogglePause && (
                    <button
                      onClick={onTogglePause}
                      className="px-4 py-1.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Resume</span>
                    </button>
                  )}
                </div>
              ) : isUserSpeaking ? (
                // Sub-state: User Speech Detected (Live Volume Wave & Action)
                <div className="flex items-center justify-between w-full animate-fadeIn">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Live Audio Meter Bars */}
                    <div className="flex items-end gap-1 h-7 shrink-0">
                      <span
                        className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(6, dynamicHeight * 0.7)}px` }}
                      />
                      <span
                        className="w-1.5 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                      <span
                        className="w-1.5 bg-emerald-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(8, dynamicHeight * 1.1)}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(6, dynamicHeight * 0.8)}px` }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-emerald-800 leading-none flex items-center gap-1.5">
                        <span>Recording speech...</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-none truncate">
                        {interimTranscript ? 'Transcribing live...' : 'Speak in German, pause when finished'}
                      </p>
                    </div>
                  </div>

                  {onManualSubmit && (
                    <button
                      onClick={onManualSubmit}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Turn</span>
                    </button>
                  )}
                </div>
              ) : vadError ? (
                // Sub-state: Mic Permission / Fallback Notice
                <div className="flex items-center justify-between w-full animate-fadeIn gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-800 font-medium truncate">
                      {vadError.length > 50 ? 'Microphone setup required' : vadError}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (onManualStartSpeaking) onManualStartSpeaking();
                      else if (onRequestPermission) onRequestPermission();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <Mic className="w-3.5 h-3.5 text-blue-200" />
                    <span>Tap to Speak</span>
                  </button>
                </div>
              ) : (
                // Sub-state: Active Listening
                <div className="flex items-center justify-between w-full animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-8 h-8 rounded-full bg-blue-100 animate-ping opacity-60" />
                      <div className="w-8 h-8 rounded-full bg-[#EBF2FF] border border-blue-200 flex items-center justify-center text-[#255CC1] relative z-10">
                        <Mic className="w-4 h-4 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#00215C] leading-none">
                        Listening...
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-none">
                        Speak naturally in German
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onManualStartSpeaking && (
                      <button
                        onClick={onManualStartSpeaking}
                        className="px-3 py-1 rounded-full bg-[#EBF2FF] hover:bg-blue-100 text-[#255CC1] text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Tap to speak manually"
                      >
                        <Mic className="w-3 h-3" />
                        <span>Tap to Speak</span>
                      </button>
                    )}
                    {onTogglePause && (
                      <button
                        onClick={onTogglePause}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Pause listening"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Live Interim Transcript Bubble (Visible when user speaks) */}
        {isUserSpeaking && interimTranscript && (
          <div className="w-full pt-1 pb-0.5 border-t border-slate-100 flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-3 h-3 text-[#255CC1] shrink-0" />
            <p className="text-xs text-slate-700 italic truncate font-medium">
              &ldquo;{interimTranscript}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
