import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ArrowRight,
  CheckCircle2, 
  Loader2, 
  Volume2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Square,
  X,
  Compass
} from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';
import { getFallbackScenarioPhrases } from '../../constants/scenarioFallbacks';

const formatTimestamp = (ts?: string) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

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
  const { user, profile } = useAuth();
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
  const [isRepeatedMistakePause, setIsRepeatedMistakePause] = useState<boolean>(false);

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

  const targetPhrases: Array<{ german: string; english: string }> = useMemo(() => {
    let raw: any[] = [];
    if (typeof scenario?.content === 'string') {
      try {
        const parsed = JSON.parse(scenario.content);
        if (Array.isArray(parsed?.target_phrases)) raw = parsed.target_phrases;
      } catch {}
    } else if (Array.isArray((scenario?.content as any)?.target_phrases)) {
      raw = (scenario.content as any).target_phrases;
    }

    if (!raw || raw.length === 0) {
      raw = getFallbackScenarioPhrases(scenario?.title || '');
    }

    const normalized = (raw || [])
      .map((p: any) => {
        if (typeof p === 'string') {
          return { german: p, english: '' };
        }
        return {
          german: p?.german || '',
          english: p?.english || '',
        };
      })
      .filter((p: any) => Boolean(p.german));

    return normalized.length > 0
      ? normalized
      : [{ german: 'Guten Tag! Ich freue mich auf das Gespräch.', english: 'Hello! I look forward to our conversation.' }];
  }, [scenario]);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const currentPhraseIndexRef = useRef<number>(0);
  currentPhraseIndexRef.current = currentPhraseIndex;

  const currentPhrase =
    (targetPhrases && targetPhrases[currentPhraseIndex]) ||
    (targetPhrases && targetPhrases[0]) ||
    { german: 'Guten Tag!', english: 'Hello!' };
  const primaryTargetPhrase = currentPhrase.german;

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
        const handle = await voiceAdapter.startSession({
          tab: 'scenarios',
          mode: mode,
          scenarioType: scenario.title,
          domain: scenario.parent_domain || 'General',
          targetPhrase: primaryTargetPhrase,
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
        let lastTurnWasUser = false;

        cleanupTranscript = voiceAdapter.onTranscript(handle, async (newTurn) => {
          if (!active) return;

          if (newTurn.speaker === 'user') {
            lastTurnWasUser = true;
          }

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
            return;
          }

          // Advance to next phrase after coach finishes speaking feedback to a user turn in Learn mode
          if (mode === 'learn' && newTurn.speaker === 'agent' && lastTurnWasUser) {
            lastTurnWasUser = false;
            const curIdx = currentPhraseIndexRef.current;
            if (curIdx < targetPhrases.length - 1) {
              const nextIdx = curIdx + 1;
              currentPhraseIndexRef.current = nextIdx;
              setCurrentPhraseIndex(nextIdx);
              const nextPhrase = targetPhrases[nextIdx];
              if (handle && handle.context) {
                handle.context.targetPhrase = nextPhrase.german;
              }
              const nextPrompt = `The next phrase is: "${nextPhrase.german}" — which means "${nextPhrase.english}". Now, say it!`;
              setTimeout(() => {
                if (active) {
                  voiceAdapter.speak(handle, nextPrompt).catch(console.warn);
                }
              }, 1200);
            } else {
              // All phrases in this workout completed! Wrap up and finish session
              setTimeout(() => {
                if (active) handleFinishRef.current();
              }, 2000);
            }
          }
        });

        // 6. Proactive AI Guidance: In all scenarios, the AI speaks first and guides the user
        if (!hasSpokenOpenerRef.current && (!initialTranscript || initialTranscript.length === 0)) {
          hasSpokenOpenerRef.current = true;
          setTimeout(() => {
            if (!active) return;
            const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
            if (mode === 'learn') {
              const opener = `Welcome ${userName}! Today we are practicing ${scenario.title}. I will give you a German phrase and explain the meaning in English, then you repeat it. The first phrase is: "${currentPhrase.german}" — which means "${currentPhrase.english}". Now, say it!`;
              voiceAdapter.speak(handle, opener).catch((e) => console.warn('Opener speak notice:', e));
            } else {
              const opener = `Welcome ${userName}! This is a realistic simulation: "${scenario.title}". We are going to have a complete conversation in German. Let's begin! Hallo! Wir starten Ihre Praxis-Situation für "${scenario.title}". Wie kann ich Ihnen heute helfen?`;
              voiceAdapter.speak(handle, opener).catch((e) => console.warn('Opener speak notice:', e));
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

  // Advance to next phrase manually or programmatically in Learn mode
  const handleAdvancePhrase = () => {
    const curIdx = currentPhraseIndexRef.current;
    if (curIdx < targetPhrases.length - 1) {
      const nextIdx = curIdx + 1;
      currentPhraseIndexRef.current = nextIdx;
      setCurrentPhraseIndex(nextIdx);
      const nextPhrase = targetPhrases[nextIdx];
      if (sessionHandle && sessionHandle.context) {
        sessionHandle.context.targetPhrase = nextPhrase.german;
      }
      if (sessionHandle && voiceAdapter.speak) {
        const nextPrompt = `The next phrase is: "${nextPhrase.german}" — which means "${nextPhrase.english}". Now, say it!`;
        voiceAdapter.speak(sessionHandle, nextPrompt).catch(console.warn);
      }
    } else {
      handleFinishSession();
    }
  };

  // Finish session, save diagnostic recap, update streak
  const handleFinishSession = async () => {
    if (!user || isFinishing) return;
    try {
      setIsFinishing(true);
      setErrorMsg(null);

      if (mode === 'practice' && sessionHandle && voiceAdapter.speakPracticeReview) {
        try {
          await voiceAdapter.speakPracticeReview(sessionHandle);
        } catch (e) {
          console.warn('Practice review audio skipped:', e);
        }
      }

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
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100dvh-6rem)] text-[#111111] animate-fadeIn">
      {/* Top Header Bar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-20 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors shrink-0"
            title="Back to scenarios"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Level {scenario.min_level}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                mode === 'learn'
                  ? 'bg-blue-50 text-[#255CC1] border border-blue-200/80'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}>
                {mode === 'learn' ? 'Guided Roleplay' : 'Simulation'}
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${
                isTimeUp
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : 'bg-slate-100 border-slate-200/60 text-slate-700'
              }`}>
                <Clock className="w-3 h-3 text-[#255CC1]" />
                <span>
                  {formatTime(secondsElapsed)}
                  {targetSeconds ? ` / ${formatTime(targetSeconds)}` : ''}
                </span>
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-sm sm:text-base text-[#00215C] truncate mt-0.5">
              {scenario.title}
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
          <span>Complete Simulation</span>
        </button>
      </header>

      {/* Target Phrase Stepper Stage (Learn Mode) */}
      {mode === 'learn' && currentPhrase && (
        <div className="mb-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white to-[#F8FAFF] border border-blue-100 shadow-[0_4px_20px_rgba(37,92,193,0.06)] space-y-3 relative overflow-hidden animate-fadeIn">
          {/* Stepper bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
              Phrase {currentPhraseIndex + 1} of {targetPhrases.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (sessionHandle && voiceAdapter.speak) {
                    voiceAdapter.speak(sessionHandle, currentPhrase.german).catch(console.warn);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#255CC1] text-[11px] font-bold transition-colors"
                title="Listen to German pronunciation"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>
              <span className="font-semibold text-slate-500 text-[11px]">
                {Math.round(((currentPhraseIndex + 1) / targetPhrases.length) * 100)}%
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#255CC1] rounded-full transition-all duration-300"
              style={{ width: `${((currentPhraseIndex + 1) / targetPhrases.length) * 100}%` }}
            />
          </div>

          {/* Large German Phrase */}
          <div className="py-2 text-center sm:text-left">
            <p className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] leading-tight tracking-tight">
              &ldquo;{currentPhrase?.german || ''}&rdquo;
            </p>
            {currentPhrase?.english && (
              <p className="text-sm sm:text-base text-slate-600 font-medium italic mt-1.5">
                &ldquo;{currentPhrase.english}&rdquo;
              </p>
            )}
          </div>

          {/* Latest Feedback for Current Phrase if user has spoken */}
          {(() => {
            const latestUser = turns.slice().reverse().find((t) => t.speaker === 'user');
            if (!latestUser || !latestUser.feedback_en) return null;
            return (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border animate-fadeIn ${
                latestUser.isCorrect
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                  latestUser.isCorrect ? 'text-emerald-600' : 'text-amber-600'
                }`} />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {latestUser.isCorrect ? 'Accurate German Recitation' : 'Feedback & Correction'}
                  </p>
                  <p className="text-[11px] mt-0.5 text-slate-700">
                    {latestUser.feedback_en}
                  </p>
                </div>
              </div>
            );
          })()}
          {/* Action controls for current phrase */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
            <button
              type="button"
              onClick={() => {
                if (sessionHandle && voiceAdapter.speak) {
                  voiceAdapter.speak(sessionHandle, currentPhrase.german).catch(console.warn);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#255CC1] text-xs font-semibold transition-colors cursor-pointer"
              title="Listen to German pronunciation"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen Again</span>
            </button>

            {currentPhraseIndex < targetPhrases.length - 1 ? (
              <button
                type="button"
                onClick={handleAdvancePhrase}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <span>Next Phrase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSession}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finish Simulation</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scenario Brief Stage Card (Practice Mode) */}
      {mode === 'practice' && (
        <div className="mb-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-[#F8FAFF] border border-blue-100 shadow-[0_4px_20px_rgba(37,92,193,0.06)] space-y-2.5 relative overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
              Roleplay Scenario Context
            </span>
            {scenario.parent_domain && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200/60">
                {scenario.parent_domain}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {scenario.description}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-medium">
            <HelpCircle className="w-4 h-4 text-[#255CC1] shrink-0" />
            <span>
              <strong>100% German Roleplay:</strong> The conversation is held entirely in German. Respond naturally. A comprehensive English diagnostic recap will be provided at the end.
            </span>
          </div>
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
          <div className="py-6 sm:py-10 text-center text-slate-400 bg-white/80 rounded-2xl border border-slate-200/70 p-4 sm:p-6 shadow-xs">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center mx-auto mb-2.5 shadow-xs">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <p className="text-sm font-heading font-extrabold text-[#00215C]">Your Simulation Stage is Active</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium leading-relaxed">
              Listen to the opening prompt from your roleplay partner, then respond in German.
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
                      {formatTimestamp(turn.timestamp)}
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
                    {(!turn.isCorrect && turn.correction && (turn.correction || '').trim().toLowerCase() !== ((turn.rawTranscript || turn.text || '')).trim().toLowerCase()) && (
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
          actionButtonText={isRepeatedMistakePause ? "Review Completed • Exit" : "Continue to Scenarios →"}
          onActionButtonClick={onCompleted}
          sessionId={dbSessionId}
          isRepeatedMistakePause={isRepeatedMistakePause}
          phrasesCompleted={mode === 'learn' ? currentPhraseIndex + (turns.some(t => t.speaker === 'user') ? 1 : 0) : undefined}
          totalPhrases={mode === 'learn' ? targetPhrases.length : undefined}
          userTurnsCount={turns.filter(t => t.speaker === 'user').length}
        />
      )}
    </div>
  );
};
