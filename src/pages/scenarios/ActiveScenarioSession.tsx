import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scenario } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveSession } from '../../contexts/ActiveSessionContext';
import { voiceAdapter, VoiceSessionHandle, TranscriptTurn, VoiceState } from '../../services/voice';
import { generateDiagnosticRecap, DiagnosticRecapResult } from '../../services/diagnosticService';
import { recordSessionCompletionInStreak } from '../../lib/streaks';
import { SessionDetailModal } from '../../components/SessionDetailModal';
import { useAutoTurnVAD } from '../../services/voice/useAutoTurnVAD';
import { AutoTurnStatusDock } from '../../components/voice/AutoTurnStatusDock';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Volume2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Square,
  X
} from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

interface ActiveScenarioSessionProps {
  scenario: Scenario;
  mode: 'learn' | 'practice';
  durationMinutes: number | 'open';
  initialSessionId?: string | null;
  initialTranscript?: TranscriptTurn[];
  onBack: () => void;
  onCompleted: () => void;
}

export const ActiveScenarioSession: React.FC<ActiveScenarioSessionProps> = ({
  scenario,
  mode,
  durationMinutes,
  initialSessionId,
  initialTranscript = [],
  onBack,
  onCompleted,
}) => {
  const { user } = useAuth();
  const { setSessionActive } = useActiveSession();

  // Keep AppShell updated on immersive active session status
  useEffect(() => {
    setSessionActive(true);
    return () => {
      setSessionActive(false);
    };
  }, [setSessionActive]);

  // Supabase Session ID
  const [dbSessionId, setDbSessionId] = useState<string | null>(initialSessionId || null);

  // Voice Session Handle
  const [sessionHandle, setSessionHandle] = useState<VoiceSessionHandle | null>(null);

  // Session State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [turns, setTurns] = useState<TranscriptTurn[]>(initialTranscript);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Completion summary modal state
  const [completedSummary, setCompletedSummary] = useState<DiagnosticRecapResult | null>(null);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Target duration in seconds (if not open-ended)
  const targetSeconds = durationMinutes === 'open' ? null : durationMinutes * 60;
  const hasTriggeredCloseRef = useRef<boolean>(false);

  // Timer interval
  useEffect(() => {
    if (!targetSeconds) return;

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (targetSeconds && next >= targetSeconds && !isTimeUp) {
          setIsTimeUp(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetSeconds, isTimeUp]);

  // Timed closing wrap: wait for turn to finish, trigger final closing line, then finish
  useEffect(() => {
    if (!isTimeUp || hasTriggeredCloseRef.current || !sessionHandle || durationMinutes === 'open') return;
    hasTriggeredCloseRef.current = true;

    let isMounted = true;
    const runFinalWrap = async () => {
      try {
        if (voiceAdapter.triggerFinalClosingTurn) {
          await voiceAdapter.triggerFinalClosingTurn(sessionHandle);
        }
        if (isMounted) {
          await handleFinishSession();
        }
      } catch (err) {
        console.error('Error during scenario timed wrap:', err);
        if (isMounted) {
          await handleFinishSession();
        }
      }
    };

    runFinalWrap();
    return () => {
      isMounted = false;
    };
  }, [isTimeUp, sessionHandle, durationMinutes]);

  // Format MM:SS helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Scroll to bottom when turns update
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, voiceState]);

  // Initialize Voice Adapter & Database Session Row
  const handleFinishRef = useRef<() => Promise<void>>(async () => {});
  const hasSpokenOpenerRef = useRef(false);

  const handleBack = () => {
    voiceAdapter.stopSpeaking?.(sessionHandle || undefined);
    onBack();
  };

  useEffect(() => {
    let active = true;
    let cleanupTranscript: (() => void) | undefined;
    let cleanupState: (() => void) | undefined;
    let cleanupSessionEnded: (() => void) | undefined;

    const init = async () => {
      if (!user) return;

      try {
        // 1. Create or ensure incomplete session in Supabase
        let currentDbId = initialSessionId;
        if (!currentDbId) {
          const { data: newSession, error: sErr } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              tab: 'scenarios',
              mode: mode,
              scenario_type: scenario.title,
              status: 'incomplete',
              transcript: initialTranscript,
              started_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (sErr) throw sErr;
          currentDbId = newSession.id;
          if (active && currentDbId) setDbSessionId(currentDbId);
        }

        // 2. Start Voice Adapter session
        const contentObj = (scenario.content as any) || {};
        const firstPhrase = contentObj.target_phrases?.[0]?.german;

        const handle = await voiceAdapter.startSession({
          tab: 'scenarios',
          mode: mode,
          scenarioType: scenario.title,
          domain: scenario.parent_domain || 'General',
          targetPhrase: firstPhrase,
          durationMinutes: durationMinutes,
        });

        if (!active) return;
        setSessionHandle(handle);

        // 3. Register state change listener
        if (voiceAdapter.onStateChange) {
          cleanupState = voiceAdapter.onStateChange(handle, (st) => {
            if (active) setVoiceState(st);
          });
        }

        // 4. Register session ended listener
        if (voiceAdapter.onSessionEnded) {
          cleanupSessionEnded = voiceAdapter.onSessionEnded(handle, () => {
            if (active) {
              setTimeout(() => {
                if (active) handleFinishRef.current();
              }, 2500);
            }
          });
        }

        // 5. Register transcript listener
        cleanupTranscript = voiceAdapter.onTranscript(handle, async (newTurn) => {
          if (!active) return;
          setTurns((prev) => {
            const existingIdx = prev.findIndex(
              (t) => t === newTurn || (t.timestamp === newTurn.timestamp && t.speaker === newTurn.speaker)
            );
            const updated = existingIdx >= 0
              ? prev.map((t, i) => (i === existingIdx ? { ...newTurn } : t))
              : [...prev, newTurn];

            // Async sync to Supabase sessions table
            if (currentDbId) {
              supabase
                .from('sessions')
                .update({ transcript: updated })
                .eq('id', currentDbId)
                .then();
            }

            return updated;
          });

          if (newTurn.sessionEnded) {
            setTimeout(() => {
              if (active) handleFinishRef.current();
            }, 2500);
          }
        });

        // 6. Proactive AI Guidance: In all scenarios, the AI speaks first and guides the user
        if (!hasSpokenOpenerRef.current && (!initialTranscript || initialTranscript.length === 0)) {
          hasSpokenOpenerRef.current = true;
          const openerText = mode === 'learn'
            ? (firstPhrase
                ? `Welcome to ${scenario.title}. Let's practice our first scenario phrase: "${firstPhrase}". Please repeat after me: "${firstPhrase}"`
                : `Welcome to ${scenario.title}. Let's begin our dialogue simulation.`)
            : `Hallo! Willkommen zu unserer Praxis-Situation: "${scenario.title}". Wie kann ich Ihnen heute helfen?`;

          setTimeout(() => {
            if (active) {
              voiceAdapter.speak(handle, openerText).catch((e) => console.warn('Opener speak notice:', e));
            }
          }, 350);
        }
      } catch (err: any) {
        console.error('Error initializing active scenario session:', err);
        if (active) setErrorMsg(err.message || 'Failed to start scenario session.');
      }
    };

    init();

    return () => {
      active = false;
      voiceAdapter.stopSpeaking?.();
      if (cleanupTranscript) cleanupTranscript();
      if (cleanupState) cleanupState();
      if (cleanupSessionEnded) cleanupSessionEnded();
    };
  }, [user, scenario.title, mode]);

  // Deliver recorded audio chunk to voiceAdapter automatically upon VAD speech-end
  const handleDeliverAudio = useCallback(async (audioBlob?: Blob, clientTranscript?: string) => {
    if (!sessionHandle) return;
    if (voiceAdapter.cancelSilenceTimer) {
      voiceAdapter.cancelSilenceTimer(sessionHandle);
    }
    try {
      setErrorMsg(null);
      await voiceAdapter.sendAudio(sessionHandle, audioBlob, clientTranscript);
    } catch (err: any) {
      console.error('Error sending audio chunk:', err);
      setErrorMsg('Could not transcribe audio clearly. Please try speaking again.');
    }
  }, [sessionHandle]);

  // Automatic Turn-Taking using Client-Side Voice Activity Detection (VAD) & Web Speech
  const {
    isUserSpeaking,
    isManualPaused,
    vadError,
    volumeLevel,
    interimTranscript,
    togglePause,
    manualSubmit,
    manualStartSpeaking,
    requestMicrophonePermission,
  } = useAutoTurnVAD({
    sessionHandle,
    voiceAdapter,
    voiceState,
    onSendAudio: handleDeliverAudio,
    enabled: !isFinishing && !completedSummary,
  });

  // Auto-dismiss transient error messages
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 6000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // Finish session, save diagnostic recap, update streak
  const handleFinishSession = async () => {
    if (!user || isFinishing) return;
    try {
      setIsFinishing(true);
      setErrorMsg(null);

      if (sessionHandle) {
        await voiceAdapter.endSession(sessionHandle);
      }

      let finalRecap: DiagnosticRecapResult | null = null;
      if (dbSessionId) {
        finalRecap = await generateDiagnosticRecap(dbSessionId);

        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', dbSessionId);

        await recordSessionCompletionInStreak(user.id, false);
      }

      setCompletedSummary(finalRecap);
    } catch (err: any) {
      console.error('Error finalizing scenario session:', err);
      setErrorMsg('Failed to finalize session. Please retry.');
      setIsFinishing(false);
    }
  };
  handleFinishRef.current = handleFinishSession;

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] text-[#111111] animate-fadeIn">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors shrink-0"
            title="Back to scenarios"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Level {scenario.min_level}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                mode === 'learn'
                  ? 'bg-blue-50 text-[#255CC1] border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {mode === 'learn' ? 'Learn Mode' : 'Practice Mode'}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#00215C] truncate">
              {scenario.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Timer Display */}
          <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
            isTimeUp
              ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatTime(secondsElapsed)}
              {targetSeconds ? ` / ${formatTime(targetSeconds)}` : ''}
            </span>
          </div>

          <button
            onClick={handleFinishSession}
            disabled={isFinishing || turns.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5 border border-slate-200/60"
          >
            {isFinishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3 h-3 text-slate-600 fill-slate-600" />
            )}
            <span className="hidden sm:inline">Finish</span>
          </button>
        </div>
      </div>

      {/* Scenario Brief Card */}
      <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
            Scenario Brief
          </span>
          {scenario.parent_domain && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
              {scenario.parent_domain}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {scenario.description}
        </p>

        {/* Learn Mode Key Phrases Accordion Preview */}
        {mode === 'learn' && (scenario.content as any)?.target_phrases?.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Helpful German Target Phrases:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(scenario.content as any).target_phrases.slice(0, 4).map((phrase: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex flex-col justify-center"
                >
                  <span className="font-bold text-[#00215C]">{phrase.german}</span>
                  <span className="text-[11px] text-slate-500 font-normal italic">{phrase.english}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Mode Challenge Prompt */}
        {mode === 'practice' && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <HelpCircle className="w-4 h-4 text-[#255CC1] shrink-0" />
              <span>
                <strong>Simulation Active:</strong> Respond naturally in German. All phrasing feedback will be provided in your end diagnostic report.
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Transcript Conversation Area */}
      <div className="flex-1 space-y-3.5 py-2 overflow-y-auto px-1">
        {turns.length === 0 ? (
          <div className="py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs">
            <Volume2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-[#00215C]">Connecting situational dialogue</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Speak your response in German to begin. Turns advance automatically.
            </p>
          </div>
        ) : (
          turns.map((turn, idx) => {
            const isUser = turn.speaker === 'user';
            return (
              <div key={idx} className="space-y-2 animate-fadeIn">
                <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {isUser ? (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs bg-[#00215C] text-white">
                      You
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-200/90 p-1 overflow-hidden">
                      <AppLogo size={28} alt="Scenario Partner" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#00215C] text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <p className="font-normal">{turn.rawTranscript || turn.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 text-right ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {new Date(turn.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Per-Turn Feedback (SCENARIOS LEARN MODE: Only shown when a recurring error pattern is flagged) */}
                {mode === 'learn' && isUser && (!turn.isCorrect && turn.correction) && (
                  <div className="mr-12 ml-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100/90 text-xs text-[#00215C] space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-[#255CC1]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#255CC1]" />
                      <span>Recurring Pattern Note</span>
                    </div>

                    {/* Visually Distinct Element 1: What the user said */}
                    <div className="p-2.5 rounded-lg bg-white border border-rose-100 flex items-start gap-2 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded shrink-0">
                        You said:
                      </span>
                      <span className="text-slate-800 font-medium text-xs break-words">
                        {turn.rawTranscript || turn.text}
                      </span>
                    </div>

                    {/* Visually Distinct Element 2: Correction (shown only when a genuine mistake exists) */}
                    {(!turn.isCorrect && turn.correction && turn.correction.trim().toLowerCase() !== (turn.rawTranscript || turn.text).trim().toLowerCase()) && (
                      <div className="p-2.5 rounded-lg bg-white border border-emerald-100 flex items-start gap-2 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          Correction:
                        </span>
                        <span className="text-emerald-950 font-semibold text-xs break-words">
                          {turn.correction}
                        </span>
                      </div>
                    )}

                    {/* Feedback / Explanation note */}
                    {turn.feedback_en && (
                      <p className="text-slate-700 text-xs leading-relaxed pt-0.5 font-normal">
                        {turn.feedback_en}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live Audio / Speaking Indicators */}
        {voiceState === 'processing' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Analyzing response...</span>
          </div>
        )}

        {voiceState === 'speaking' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#255CC1] text-xs font-medium animate-pulse">
            <Volume2 className="w-4 h-4 text-[#255CC1]" />
            <span>Coach is responding...</span>
          </div>
        )}

        <div ref={turnsEndRef} />
      </div>

      {/* Bottom Voice Status Dock with Automatic Turn-Taking */}
      <AutoTurnStatusDock
        voiceState={voiceState}
        isUserSpeaking={isUserSpeaking}
        isManualPaused={isManualPaused}
        vadError={vadError}
        volumeLevel={volumeLevel}
        interimTranscript={interimTranscript}
        onTogglePause={togglePause}
        onManualSubmit={manualSubmit}
        onManualStartSpeaking={manualStartSpeaking}
        onRequestPermission={requestMicrophonePermission}
        agentName="Coach"
      />

      {/* Completion Recap Modal */}
      {completedSummary && (
        <SessionDetailModal
          isOpen={Boolean(completedSummary)}
          onClose={onCompleted}
          title="Diagnostic Recap"
          subtitle={`${scenario.title} • ${mode === 'learn' ? 'Learn Session' : 'Practice Simulation'}`}
          mode={mode}
          recap={completedSummary}
          actionButtonText="Continue to Scenarios"
          onActionButtonClick={onCompleted}
          sessionId={dbSessionId}
        />
      )}
    </div>
  );
};
