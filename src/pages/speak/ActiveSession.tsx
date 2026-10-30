import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Module } from '../../lib/database.types';
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
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Volume2, 
  AlertCircle,
  Square,
  Clock,
  X
} from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

interface ActiveSessionProps {
  module: Module;
  mode: 'learn' | 'practice';
  durationMinutes?: number | 'open';
  initialSessionId?: string | null;
  initialTranscript?: TranscriptTurn[];
  onBack: () => void;
  onCompleted: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({
  module,
  mode,
  durationMinutes,
  initialSessionId,
  initialTranscript = [],
  onBack,
  onCompleted,
}) => {
  const { user, profile } = useAuth();
  const { setSessionActive } = useActiveSession();

  // Keep AppShell updated on immersive active session status
  useEffect(() => {
    setSessionActive(true);
    return () => {
      setSessionActive(false);
    };
  }, [setSessionActive]);

  // Supabase session id
  const [dbSessionId, setDbSessionId] = useState<string | null>(initialSessionId || null);

  // Voice Adapter Session Handle
  const [sessionHandle, setSessionHandle] = useState<VoiceSessionHandle | null>(null);

  // Session State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [turns, setTurns] = useState<TranscriptTurn[]>(initialTranscript);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [isRepeatedMistakePause, setIsRepeatedMistakePause] = useState<boolean>(false);

  // Timer State (for timed checkpoint sessions)
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const targetSeconds = durationMinutes && durationMinutes !== 'open' ? Number(durationMinutes) * 60 : null;
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

  // Timed closing wrap: wait for turn to finish, trigger mode-appropriate closing line, then finish
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
        console.error('Error during speak timed wrap:', err);
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Completion summary modal state
  const [completedSummary, setCompletedSummary] = useState<DiagnosticRecapResult | null>(null);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Extract content fields & resolve domain variants if user has a matching primary_domain
  const contentObj = (module.content as any) || {};
  const userDomain = profile?.primary_domain;
  const domainVariant = userDomain && contentObj.domain_variants?.[userDomain] ? contentObj.domain_variants[userDomain] : null;
  const effectiveContent = domainVariant || contentObj;

  const targetPhrases: Array<{ german: string; english: string }> = 
    effectiveContent.target_phrases || 
    (effectiveContent.target_phrase ? [{ german: effectiveContent.target_phrase, english: effectiveContent.english_meaning || '' }] : []);

  const primaryTargetPhrase = targetPhrases[0]?.german || effectiveContent.target_phrase || '';

  // Scroll to bottom when turns update
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, voiceState]);

  // Initialize Voice Adapter & Database Session Row on mount
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
              tab: 'speak',
              mode: mode,
              module_id: module.id,
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
        const handle = await voiceAdapter.startSession({
          tab: 'speak',
          mode: mode,
          moduleId: module.id,
          targetPhrase: primaryTargetPhrase,
          durationMinutes: durationMinutes,
          isCheckpoint: module.is_checkpoint,
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
          cleanupSessionEnded = voiceAdapter.onSessionEnded(handle, (reason) => {
            if (active) {
              if (reason === 'repeated_mistake_threshold') {
                setIsRepeatedMistakePause(true);
              }
              setTimeout(() => {
                if (active) handleFinishRef.current();
              }, reason === 'repeated_mistake_threshold' ? 1200 : 2500);
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

        // 6. Proactive AI Guidance: In all modules, the AI speaks first and guides the user
        if (!hasSpokenOpenerRef.current && (!initialTranscript || initialTranscript.length === 0)) {
          hasSpokenOpenerRef.current = true;
          setTimeout(() => {
            if (!active) return;
            if (mode === 'learn') {
              const englishMeaning = targetPhrases[0]?.english ? ` ("${targetPhrases[0].english}")` : '';
              const segments = [
                {
                  text: `Welcome to ${module.title}. Today, we master: "${primaryTargetPhrase}"${englishMeaning}. Listen closely:`,
                  lang: 'en' as const,
                },
                {
                  text: primaryTargetPhrase,
                  lang: 'de' as const,
                },
                {
                  text: `Now, speak with natural cadence. Whenever you're ready, recite the sentence in German.`,
                  lang: 'en' as const,
                },
              ];
              if (voiceAdapter.speakSegments) {
                voiceAdapter.speakSegments(handle, segments).catch((e) => console.warn('Opener speak notice:', e));
              } else {
                voiceAdapter.speak(handle, segments.map((s) => s.text).join('\n\n')).catch((e) => console.warn('Opener speak notice:', e));
              }
            } else {
              const segments = [
                {
                  text: `Starting your practice simulation for ${module.title}. Speak with natural German phrasing:`,
                  lang: 'en' as const,
                },
                {
                  text: `Hallo! Wir starten Ihre Praxis-Situation für "${module.title}". Bitte antworten Sie auf Deutsch, sobald Sie bereit sind.`,
                  lang: 'de' as const,
                },
              ];
              if (voiceAdapter.speakSegments) {
                voiceAdapter.speakSegments(handle, segments).catch((e) => console.warn('Opener speak notice:', e));
              } else {
                voiceAdapter.speak(handle, segments.map((s) => s.text).join('\n\n')).catch((e) => console.warn('Opener speak notice:', e));
              }
            }
          }, 350);
        }
      } catch (err: any) {
        console.error('Error initializing active speak session:', err);
        if (active) setErrorMsg(err.message || 'Failed to start voice session.');
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
  }, [user, module.id, mode, primaryTargetPhrase]);

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

      // Stop voice adapter session
      if (sessionHandle) {
        await voiceAdapter.endSession(sessionHandle);
      }

      // Generate real diagnostic recap
      let finalRecap: DiagnosticRecapResult | null = null;
      if (dbSessionId) {
        finalRecap = await generateDiagnosticRecap(dbSessionId);

        // Update session status to completed
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', dbSessionId);

        // Record streak
        await recordSessionCompletionInStreak(user.id, true);
      }

      setCompletedSummary(finalRecap);
    } catch (err: any) {
      console.error('Error finalizing session:', err);
      setErrorMsg('Failed to finalize session. Please retry.');
      setIsFinishing(false);
    }
  };
  handleFinishRef.current = handleFinishSession;

  // Learn Mode per-turn coaching feedback helper
  const getLearnFeedback = (turnIndex: number) => {
    const userTurn = turns[turnIndex];
    if (!userTurn || userTurn.speaker !== 'user') return null;
    if (userTurn.feedback_en) return userTurn.feedback_en;
    if (userTurn.isCorrect) {
      return 'Ausgezeichnet! Natural sentence structure and accurate German case endings.';
    }
    return userTurn.correction
      ? `Try adjusting your phrasing: "${userTurn.correction}"`
      : 'Good attempt. Pay attention to verb placement and article endings.';
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100dvh-6rem)] text-[#111111] animate-fadeIn">
      {/* Top Workout Status Bar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-20 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors shrink-0"
            title="Exit workout"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Module {module.module_number}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                mode === 'learn'
                  ? 'bg-blue-50 text-[#255CC1] border border-blue-200/80'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}>
                {mode === 'learn' ? 'Learn & Recite' : 'Simulation'}
              </span>
              {targetSeconds ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isTimeUp
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                    : 'bg-slate-100 border-slate-200/60 text-slate-700'
                }`}>
                  <Clock className="w-3 h-3 text-[#255CC1]" />
                  <span>{formatTime(secondsElapsed)} / {formatTime(targetSeconds)}</span>
                </span>
              ) : durationMinutes ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                  {durationMinutes === 'open' ? 'Open Workout' : `${durationMinutes}m`}
                </span>
              ) : null}
            </div>
            <h1 className="font-heading font-extrabold text-sm sm:text-base text-[#00215C] truncate mt-0.5">
              {module.title}
            </h1>
          </div>
        </div>

        <button
          onClick={handleFinishSession}
          disabled={isFinishing || turns.length === 0}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#00215C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
        >
          {isFinishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Square className="w-3 h-3 fill-white" />
          )}
          <span>Complete Workout</span>
        </button>
      </header>

      {/* Target Phrase Teleprompter Stage (Learn Mode) */}
      {mode === 'learn' && primaryTargetPhrase && (
        <div className="mb-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-[#F8FAFF] border border-blue-100 shadow-[0_4px_20px_rgba(37,92,193,0.06)] space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
              Target German Phrase
            </span>
            {domainVariant && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200/60">
                {userDomain}
              </span>
            )}
          </div>
          <p className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C] leading-snug tracking-tight">
            &ldquo;{primaryTargetPhrase}&rdquo;
          </p>
          {targetPhrases[0]?.english && (
            <p className="text-xs text-slate-600 font-medium italic border-t border-slate-100 pt-2 flex items-center gap-1.5">
              <span className="text-slate-400 not-italic font-bold text-[10px] uppercase">Meaning:</span>
              <span>{targetPhrases[0].english}</span>
            </p>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="mb-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMsg}</span>
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

      {/* Transcript Conversation Area with Guaranteed Bottom Clearance */}
      <div className="flex-1 space-y-3.5 py-2 overflow-y-auto px-1 pb-36">
        {turns.length === 0 ? (
          <div className="py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs">
            <Volume2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-[#00215C]">Ready for voice practice</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Recite the German target phrase clearly into your microphone — automatic turn-taking is active.
            </p>
          </div>
        ) : (
          turns.map((turn, idx) => {
            const isUser = turn.speaker === 'user';
            return (
              <div key={idx} className="space-y-2 animate-fadeIn">
                <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* Speaker Avatar */}
                  {isUser ? (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs bg-[#00215C] text-white">
                      You
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-200/90 p-1 overflow-hidden">
                      <AppLogo size={28} alt="AI Coach" />
                    </div>
                  )}

                  {/* Speech Bubble */}
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

                {/* Per-Turn Instant Feedback (LEARN MODE ONLY) */}
                {mode === 'learn' && isUser && (
                  <div className="mr-12 ml-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100/90 text-xs text-[#00215C] space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-[#255CC1]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#255CC1]" />
                      <span>Instant Pronunciation Feedback</span>
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

                    {/* Feedback / Explanation */}
                    <p className="text-slate-700 text-xs leading-relaxed pt-0.5 font-normal">
                      {turn.feedback_en || (turn.isCorrect ? 'Great job, your pronunciation was clear!' : getLearnFeedback(idx))}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live Speaking / Processing Animation Indicators */}
        {voiceState === 'processing' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Analyzing response...</span>
          </div>
        )}

        {voiceState === 'speaking' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#255CC1] text-xs font-medium animate-pulse">
            <Volume2 className="w-4 h-4 text-[#255CC1]" />
            <span>Coach is speaking...</span>
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
          subtitle={`${mode === 'learn' ? 'Learn Session' : 'Practice Simulation'} • Module ${module.module_number}: ${module.title}`}
          mode={mode}
          recap={completedSummary}
          actionButtonText={isRepeatedMistakePause ? "Review Completed • Exit" : "Continue to Modules"}
          onActionButtonClick={onCompleted}
          sessionId={dbSessionId}
          isRepeatedMistakePause={isRepeatedMistakePause}
        />
      )}
    </div>
  );
};
