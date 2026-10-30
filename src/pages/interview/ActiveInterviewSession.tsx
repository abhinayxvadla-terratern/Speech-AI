import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveSession } from '../../contexts/ActiveSessionContext';
import { voiceAdapter, VoiceSessionHandle, TranscriptTurn, VoiceState } from '../../services/voice';
import { generateDiagnosticRecap, DiagnosticRecapResult } from '../../services/diagnosticService';
import { recordSessionCompletionInStreak } from '../../lib/streaks';
import { PressureMode, InterviewSampleQuestion, ExamSpeakingPromptText } from '../../lib/database.types';
import { PRESSURE_MODES } from '../../constants/interview';
import { getFallbackInterviewQuestions } from '../../constants/interviewFallbacks';
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
  X,
  Briefcase
} from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

const formatTimestamp = (ts?: string) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

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

  const effectiveQuestions: InterviewSampleQuestion[] = useMemo(() => {
    if (Array.isArray(sampleQuestions) && sampleQuestions.length > 0) {
      return sampleQuestions;
    }
    return getFallbackInterviewQuestions(interviewTypeName);
  }, [sampleQuestions, interviewTypeName]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const currentQuestionIndexRef = useRef<number>(0);
  currentQuestionIndexRef.current = currentQuestionIndex;

  const currentQuestion = effectiveQuestions[currentQuestionIndex] || effectiveQuestions[0];

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
          targetPhrase: currentQuestion.german,
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

          // Advance to next question after coach finishes feedback in Learn mode
          if (mode === 'learn' && newTurn.speaker === 'agent' && lastTurnWasUser) {
            lastTurnWasUser = false;
            const curIdx = currentQuestionIndexRef.current;
            if (curIdx < effectiveQuestions.length - 1) {
              const nextIdx = curIdx + 1;
              currentQuestionIndexRef.current = nextIdx;
              setCurrentQuestionIndex(nextIdx);
              const nextQ = effectiveQuestions[nextIdx];
              if (handle && handle.context) {
                handle.context.targetPhrase = nextQ.german;
              }
              const nextPrompt = `The next interview question is: "${nextQ.german}" — which means "${nextQ.english}". How would you answer this? Please respond in German.`;
              setTimeout(() => {
                if (active) {
                  voiceAdapter.speak(handle, nextPrompt).catch(console.warn);
                }
              }, 1200);
            } else {
              // Completed all questions in the interview workout!
              setTimeout(() => {
                if (active) handleFinishRef.current();
              }, 2000);
            }
          }
        });

        // 6. Proactive AI Guidance: In all interview sessions, the interviewer speaks first and asks the first question
        if (!hasSpokenOpenerRef.current && (!initialTranscript || initialTranscript.length === 0)) {
          hasSpokenOpenerRef.current = true;
          const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
          const firstQuestion = currentQuestion.german;

          setTimeout(() => {
            if (!active) return;
            if (isExamMode && examPromptText) {
              const opener = `Willkommen zur mündlichen Prüfung. ${examPromptText.german || firstQuestion}`;
              voiceAdapter.speak(handle, opener).catch((e) => console.warn('Opener speak notice:', e));
            } else if (mode === 'learn') {
              const opener = `Welcome ${userName}! Today we are preparing for your interview: ${interviewTypeName}. I will guide you through key questions one by one. The first question is: "${currentQuestion.german}" — which means "${currentQuestion.english}". How would you answer this? Please respond in German.`;
              voiceAdapter.speak(handle, opener).catch((e) => console.warn('Opener speak notice:', e));
            } else {
              const opener = `Welcome ${userName}! This is your practice interview for ${interviewTypeName}. From this moment on, the interview will be conducted entirely in German. Let's begin! Guten Tag! Lassen Sie uns direkt beginnen: ${firstQuestion}. Bitte antworten Sie auf Deutsch, sobald Sie bereit sind.`;
              voiceAdapter.speak(handle, opener).catch((e) => console.warn('Opener speak notice:', e));
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
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100dvh-6rem)] text-[#111111] animate-fadeIn">
      {/* Top Header Bar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-20 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors shrink-0"
            title="Back to interview setup"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {pressureConfig.title} Pace
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isOpenInterview
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : mode === 'learn'
                  ? 'bg-blue-50 text-[#255CC1] border border-blue-200/80'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}>
                {isOpenInterview ? 'Open Simulation' : mode === 'learn' ? 'Guided Interview' : 'Evaluation'}
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
              {interviewTypeName}
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
          <span>Complete Interview</span>
        </button>
      </header>

      {/* Question Stepper Stage (Learn Mode) */}
      {mode === 'learn' && !isOpenInterview && currentQuestion && (
        <div className="mb-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white to-[#F8FAFF] border border-blue-100 shadow-[0_4px_20px_rgba(37,92,193,0.06)] space-y-3 relative overflow-hidden animate-fadeIn">
          {/* Stepper bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
              Question {currentQuestionIndex + 1} of {effectiveQuestions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (sessionHandle && voiceAdapter.speak) {
                    voiceAdapter.speak(sessionHandle, currentQuestion.german).catch(console.warn);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#255CC1] text-[11px] font-bold transition-colors"
                title="Listen to German question"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>
              <span className="font-semibold text-slate-500 text-[11px]">
                {Math.round(((currentQuestionIndex + 1) / effectiveQuestions.length) * 100)}%
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#255CC1] rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / effectiveQuestions.length) * 100}%` }}
            />
          </div>

          {/* Large German Question */}
          <div className="py-2 text-center sm:text-left">
            <p className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] leading-tight tracking-tight">
              &ldquo;{currentQuestion.german}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-600 font-medium italic mt-1.5">
              &ldquo;{currentQuestion.english}&rdquo;
            </p>
          </div>

          {/* Answering Guidance Note */}
          {currentQuestion.guidance && (
            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-[#00215C]">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#255CC1] block mb-0.5">
                Strategic Guidance:
              </span>
              <p className="text-slate-700">{currentQuestion.guidance}</p>
            </div>
          )}

          {/* Latest Feedback for Current Question if user has spoken */}
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
                    {latestUser.isCorrect ? 'Strong Response' : 'Coach Guidance & Feedback'}
                  </p>
                  <p className="text-[11px] mt-0.5 text-slate-700">
                    {latestUser.feedback_en}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Practice Mode / Simulation Context Card */}
      {(mode === 'practice' || isOpenInterview) && (
        <div className="mb-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-[#F8FAFF] border border-blue-100 shadow-[0_4px_20px_rgba(37,92,193,0.06)] space-y-2.5 relative overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
              Professional German Interview Simulation
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200/60">
              {pressureMode} Pacing
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {description}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-medium">
            <HelpCircle className="w-4 h-4 text-[#255CC1] shrink-0" />
            <span>
              <strong>100% German Interview:</strong> The simulation is conducted entirely in formal German (Sie). Respond spontaneously. Full diagnostic review in English will be provided at the end.
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
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <p className="text-sm font-heading font-extrabold text-[#00215C]">Interview Studio Active</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium leading-relaxed">
              Listen to the interviewer’s opening question, then respond with professional German phrasing.
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
                      {formatTimestamp(turn.timestamp)}
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
          actionButtonText={isRepeatedMistakePause ? "Review Completed • Exit" : "Continue to Interviews →"}
          onActionButtonClick={onCompleted}
          sessionId={dbSessionId}
          isRepeatedMistakePause={isRepeatedMistakePause}
        />
      )}
    </div>
  );
};
