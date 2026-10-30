import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveSession } from '../../contexts/ActiveSessionContext';
import { voiceAdapter, VoiceSessionHandle, TranscriptTurn, VoiceState } from '../../services/voice';
import { generateDiagnosticRecap, DiagnosticRecapResult } from '../../services/diagnosticService';
import { recordSessionCompletionInStreak } from '../../lib/streaks';
import { PressureMode, InterviewSampleQuestion, ExamSpeakingPromptText } from '../../lib/database.types';
import { PRESSURE_MODES } from '../../constants/interview';
import { SessionDetailModal } from '../../components/SessionDetailModal';
import { useAutoTurnVAD } from '../../services/voice/useAutoTurnVAD';
import { AutoTurnStatusDock } from '../../components/voice/AutoTurnStatusDock';
import { 
  ArrowLeft, 
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

interface ActiveInterviewSessionProps {
  interviewTypeName: string;
  description: string;
  mode: 'learn' | 'practice';
  pressureMode: PressureMode;
  durationMinutes: number | 'open';
  initialSessionId?: string | null;
  initialTranscript?: TranscriptTurn[];
  isExamMode?: boolean;
  isOpenInterview?: boolean;
  sampleQuestions?: InterviewSampleQuestion[];
  examPromptText?: ExamSpeakingPromptText | null;
  onBack: () => void;
  onCompleted: () => void;
}

export const ActiveInterviewSession: React.FC<ActiveInterviewSessionProps> = ({
  interviewTypeName,
  description,
  mode,
  pressureMode,
  durationMinutes,
  initialSessionId,
  initialTranscript = [],
  isExamMode = false,
  isOpenInterview = false,
  sampleQuestions = [],
  examPromptText = null,
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
  const [showSampleQuestions, setShowSampleQuestions] = useState<boolean>(false);

  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Completion summary modal state
  const [completedSummary, setCompletedSummary] = useState<DiagnosticRecapResult | null>(null);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Target duration in seconds
  const targetSeconds = durationMinutes === 'open' ? null : durationMinutes * 60;
  const hasTriggeredCloseRef = useRef<boolean>(false);

  // Pressure mode metadata
  const pressureConfig = PRESSURE_MODES.find((p) => p.id === pressureMode) || PRESSURE_MODES[1];

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

  // Timed closing wrap: wait for turn to finish, trigger final in-character German closing line, then finish
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
        console.error('Error during interview timed wrap:', err);
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
              tab: 'interview',
              mode: isOpenInterview ? 'practice' : mode,
              interview_type: interviewTypeName,
              pressure_mode: pressureMode,
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
          tab: 'interview',
          mode: isOpenInterview ? 'practice' : mode,
          interviewType: interviewTypeName,
          pressureMode: pressureMode,
          domain: profile?.primary_domain || 'Healthcare',
          sub_branch: profile?.primary_subbranch || 'General',
          durationMinutes: durationMinutes,
          isOpenInterview: isOpenInterview,
          cefr_level: isOpenInterview ? undefined : (profile?.cefr_level || 'B1'),
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

        // 6. Proactive AI Guidance: In all interview sessions, the interviewer speaks first and asks the first question
        if (!hasSpokenOpenerRef.current && (!initialTranscript || initialTranscript.length === 0)) {
          hasSpokenOpenerRef.current = true;
          const firstQuestion = sampleQuestions[0]?.german || 'Können Sie sich bitte kurz vorstellen und Ihren Werdegang beschreiben?';
          setTimeout(() => {
            if (!active) return;
            if (isExamMode && examPromptText) {
              const segments = [
                {
                  text: `Willkommen zur mündlichen Prüfung. ${examPromptText.german || firstQuestion}`,
                  lang: 'de' as const,
                },
              ];
              if (voiceAdapter.speakSegments) {
                voiceAdapter.speakSegments(handle, segments).catch((e) => console.warn('Opener speak notice:', e));
              } else {
                voiceAdapter.speak(handle, segments[0].text).catch((e) => console.warn('Opener speak notice:', e));
              }
            } else if (mode === 'learn') {
              const segments = [
                {
                  text: `Welcome to your interview coaching for ${interviewTypeName}. The interviewer is about to ask an essential question. Listen carefully:`,
                  lang: 'en' as const,
                },
                {
                  text: firstQuestion,
                  lang: 'de' as const,
                },
                {
                  text: `How would you answer this? Please respond in German.`,
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
                  text: `Welcome to your practice interview for ${interviewTypeName}. From this moment on, the interview will be conducted entirely in German. Let's begin.`,
                  lang: 'en' as const,
                },
                {
                  text: `Guten Tag! Lassen Sie uns direkt beginnen: ${firstQuestion}`,
                  lang: 'de' as const,
                },
                {
                  text: `Bitte antworten Sie auf Deutsch, sobald Sie bereit sind.`,
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
        console.error('Error initializing active interview session:', err);
        if (active) setErrorMsg(err.message || 'Failed to start interview session.');
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
  }, [user, interviewTypeName, mode, pressureMode, isOpenInterview]);

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

        await recordSessionCompletionInStreak(user.id);
      }

      setCompletedSummary(finalRecap);
    } catch (err: any) {
      console.error('Error finalizing interview session:', err);
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
            title="Back to interview setup"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {pressureConfig.title} Pressure
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isOpenInterview
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : mode === 'learn'
                  ? 'bg-blue-50 text-[#255CC1] border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isOpenInterview ? 'Open Interview' : mode === 'learn' ? 'Learn Mode' : 'Practice Mode'}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#00215C] truncate">
              {interviewTypeName}
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

      {/* Interview Brief Card */}
      <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
            Simulation Context
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
            {pressureMode} Pace
          </span>
        </div>

        {/* Exam Mode Prompt Banner */}
        {isExamMode && examPromptText ? (
          <div className="space-y-2">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                Official Exam Prompt / Aufgabenstellung:
              </span>
              <p className="text-xs font-bold text-[#00215C]">{examPromptText.german}</p>
              <p className="text-[11px] text-slate-500 italic mt-0.5 font-normal">{examPromptText.english}</p>
            </div>

            {examPromptText.bullet_points && examPromptText.bullet_points.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Leitpunkte / Points to Cover:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 font-normal">
                  {examPromptText.bullet_points.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : mode === 'learn' && !isOpenInterview ? (
          /* Learn Mode Briefing */
          <div className="space-y-2.5">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {description}
            </p>

            {sampleQuestions && sampleQuestions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSampleQuestions(!showSampleQuestions)}
                  className="text-xs font-bold text-[#255CC1] hover:underline flex items-center gap-1"
                >
                  <span>{showSampleQuestions ? 'Hide' : 'View'} Sample Questions & Guidance ({sampleQuestions.length})</span>
                </button>

                {showSampleQuestions && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {sampleQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                        <p className="font-bold text-[#00215C]">{idx + 1}. {q.german}</p>
                        <p className="text-[11px] text-slate-500 italic font-normal">{q.english}</p>
                        <p className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 font-normal">
                          <strong>Coverage note:</strong> {q.guidance}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Practice Mode or Open Interview Note */
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-[#255CC1] shrink-0" />
            <span className="font-normal">
              <strong>Realistic Interview Simulation:</strong> Respond with natural German professional phrasing. No mid-session interruptions occur; full assessment follows upon completion.
            </span>
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
            <p className="text-sm font-semibold text-[#00215C]">Connecting German interview simulation</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Answer the interviewer's opening question in German. Turns advance automatically.
            </p>
          </div>
        ) : (
          turns.map((turn, idx) => {
            const isUser = turn.speaker === 'user';
            return (
              <div key={idx} className="space-y-1.5 animate-fadeIn">
                <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {isUser ? (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs bg-[#00215C] text-white">
                      You
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-200/90 p-1 overflow-hidden">
                      <AppLogo size={28} alt="Interviewer" />
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
              </div>
            );
          })
        )}

        {/* Live Audio / Speaking Indicators */}
        {voiceState === 'processing' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Evaluating response under {pressureMode} pacing...</span>
          </div>
        )}

        {voiceState === 'speaking' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#255CC1] text-xs font-medium animate-pulse">
            <Volume2 className="w-4 h-4 text-[#255CC1]" />
            <span>German interviewer is speaking...</span>
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
        agentName="Interviewer"
      />

      {/* Completion Recap Modal */}
      {completedSummary && (
        <SessionDetailModal
          isOpen={Boolean(completedSummary)}
          onClose={onCompleted}
          title="Diagnostic Assessment"
          subtitle={`${interviewTypeName} • ${pressureMode} Pressure • ${mode === 'learn' ? 'Learn Session' : 'Practice Simulation'}`}
          mode={mode}
          recap={completedSummary}
          actionButtonText={isRepeatedMistakePause ? "Review Completed • Exit" : "Continue to Interview Hub"}
          onActionButtonClick={onCompleted}
          sessionId={dbSessionId}
          isRepeatedMistakePause={isRepeatedMistakePause}
        />
      )}
    </div>
  );
};
