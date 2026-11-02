import React from 'react';
import { Mic, Volume2, Loader2, Pause, Play, Check, AlertCircle } from 'lucide-react';
import { VoiceState } from '../../services/voice/types';

export interface AutoTurnStatusDockProps {
  controlsSlot?: React.ReactNode;
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
  controlsSlot,
  voiceState,
  isUserSpeaking,
  isManualPaused,
  onTogglePause,
  onManualSubmit,
  onManualStartSpeaking,
  onRequestPermission,
  vadError,
  volumeLevel = 0,
  agentName = 'Your German trainer',
  className = '',
}) => {
  const isAgentSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';

  // Dynamic bar height proportional to user vocal volume
  const dynamicHeight = Math.max(6, Math.min(22, Math.round((volumeLevel / 100) * 22)));

  return (
    <div
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      className={`fixed left-1/2 -translate-x-1/2 z-30 max-w-lg w-[calc(100%-2rem)] px-2 transition-all duration-300 pointer-events-none flex flex-col items-center gap-2.5 ${className}`}
    >
      {/* Upper Controls Slot (Slower, Repeat, Hint + Helpful Hint pop-up) strictly stacked above dock */}
      {controlsSlot && (
        <div className="pointer-events-auto w-full flex justify-center">
          {controlsSlot}
        </div>
      )}

      {/* Main Dock Capsule */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_16px_40px_rgba(0,33,92,0.16),0_2px_10px_rgba(0,0,0,0.04)] rounded-full px-5 py-2.5 flex items-center justify-between gap-3 w-full">
        {/* =========================================================================
            STATE 1: AGENT SPEAKING (TTS Playing)
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
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 shadow-xs">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: PROCESSING (Responding / Thinking)
        ========================================================================= */}
        {isProcessing && (
          <div className="flex items-center justify-between w-full animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#255CC1]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-none">
                  Listening & reflecting...
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
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-none">
                      Workout paused
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-none font-medium">
                      Tap resume when ready to speak
                    </p>
                  </div>
                </div>
                {onTogglePause && (
                  <button
                    type="button"
                    onClick={onTogglePause}
                    className="px-4 py-1.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </button>
                )}
              </div>
            ) : isUserSpeaking ? (
              // Sub-state: User Speaking (Kinetic Audio Equalizer, No Raw Text Display)
              <div className="flex items-center justify-between w-full animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-end gap-1 h-6 shrink-0">
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
                    <p className="text-xs sm:text-sm font-bold text-emerald-900 leading-none flex items-center gap-1.5">
                      <span>Listening to you</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    </p>
                  </div>
                </div>

                {onManualSubmit && (
                  <button
                    type="button"
                    onClick={onManualSubmit}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Finish</span>
                  </button>
                )}
              </div>
            ) : vadError ? (
              // Sub-state: Mic Permission / Fallback Notice
              <div className="flex items-center justify-between w-full animate-fadeIn gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-900 font-semibold truncate">
                    {vadError.length > 50 ? 'Microphone setup required' : vadError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onManualStartSpeaking) onManualStartSpeaking();
                    else if (onRequestPermission) onRequestPermission();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-blue-200" />
                  <span>Tap to Speak</span>
                </button>
              </div>
            ) : (
              // Sub-state: Active Listening (Ready for learner)
              <div className="flex items-center justify-between w-full animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF2FF] border border-blue-200/80 flex items-center justify-center text-[#255CC1] shrink-0 shadow-xs">
                    <Mic className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#00215C] leading-none">
                      Listening...
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-none font-medium">
                      Speak the German phrase aloud
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onTogglePause && (
                    <button
                      type="button"
                      onClick={onTogglePause}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Pause workout"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
