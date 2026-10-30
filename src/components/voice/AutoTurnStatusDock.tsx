import React from 'react';
import { Mic, Volume2, Loader2, Pause, Play, Send, AlertCircle } from 'lucide-react';
import { VoiceState } from '../../services/voice/types';

export interface AutoTurnStatusDockProps {
  voiceState: VoiceState;
  isUserSpeaking: boolean;
  isManualPaused: boolean;
  onTogglePause?: () => void;
  onManualSubmit?: () => void;
  onManualStartSpeaking?: () => void;
  vadError?: string | null;
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
  vadError,
  agentName = 'Coach',
  className = '',
}) => {
  const isAgentSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';

  return (
    <div
      className={`sticky bottom-3 sm:bottom-4 z-30 max-w-xl mx-auto w-full px-2 transition-all duration-200 ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-dock rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* =========================================================================
            STATE 1: AGENT SPEAKING (TTS Playing - VAD is OFF)
        ========================================================================= */}
        {isAgentSpeaking && (
          <div className="flex items-center justify-between w-full animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
                <img src="/terratern-emblem.png" alt="Mascot" className="w-full h-full object-contain" />
              </div>
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
                <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                  Listening resumes automatically
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#255CC1] flex items-center justify-center shrink-0">
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
                <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                  Transcribing & generating feedback
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
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
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
              // Sub-state: User Speech Detected
              <div className="flex items-center justify-between w-full animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-rose-600 leading-none">
                      Hearing you speak...
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                      Turns advance when you pause
                    </p>
                  </div>
                </div>

                {onManualSubmit && (
                  <button
                    onClick={onManualSubmit}
                    className="px-3.5 py-1.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Send className="w-3 h-3 text-blue-200" />
                    <span>Send Turn</span>
                  </button>
                )}
              </div>
            ) : vadError ? (
              // Sub-state: VAD Fallback Notice
              <div className="flex items-center justify-between w-full animate-fadeIn">
                <div className="flex items-center gap-2 max-w-xs truncate">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-800 truncate">{vadError}</span>
                </div>
                {onManualStartSpeaking && (
                  <button
                    onClick={onManualStartSpeaking}
                    className="px-4 py-1.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <Mic className="w-3.5 h-3.5 text-blue-200" />
                    <span>Tap to Speak</span>
                  </button>
                )}
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
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                      Speak naturally in German
                    </p>
                  </div>
                </div>

                {onTogglePause && (
                  <button
                    onClick={onTogglePause}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Pause listening"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
