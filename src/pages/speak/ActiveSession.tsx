import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { VoiceTurnControls } from '../../components/voice/VoiceTurnControls';
import { analyzeSentenceLinguistics } from '../../services/germanLinguisticsService';
import { LearnLinguisticStage } from '../../components/voice/LearnLinguisticStage';
import { 
  ArrowLeft, 
  ArrowRight,
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

  // Session State - starts in 'speaking' during opener to keep mic muted until coach finishes speaking
  const [voiceState, setVoiceState] = useState<VoiceState>(initialTranscript && initialTranscript.length > 0 ? 'idle' : 'speaking');
  const [turns, setTurns] = useState<TranscriptTurn[]>(initialTranscript);
  const [displayedTurns, setDisplayedTurns] = useState<TranscriptTurn[]>(initialTranscript);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [isRepeatedMistakePause, setIsRepeatedMistakePause] = useState<boolean>(false);

  // Voice Turn Controls Handlers
  const handleSlower = () => {
    if (!sessionHandle) return;
    const eventTurn: TranscriptTurn = {
      speaker: 'event',
      text: 'Voice turn control: Slower (-20%)',
      timestamp: new Date().toISOString(),
      control: 'slower',
    };
    setTurns((prev) => {
      const updated = [...prev, eventTurn];
      if (dbSessionId) {
        supabase.from('sessions').update({ transcript: updated }).eq('id', dbSessionId).then();
      }
      return updated;
    });
    setDisplayedTurns((prev) => [...prev, eventTurn]);
    voiceAdapter.repeatLastPrompt?.(sessionHandle, { rate: '-20%' });
  };

  const handleRepeat = () => {
    if (!sessionHandle) return;
    const eventTurn: TranscriptTurn = {
      speaker: 'event',
      text: 'Voice turn control: Repeat',
      timestamp: new Date().toISOString(),
      control: 'repeat',
    };
    setTurns((prev) => {
      const updated = [...prev, eventTurn];
      if (dbSessionId) {
        supabase.from('sessions').update({ transcript: updated }).eq('id', dbSessionId).then();
      }
      return updated;
    });
    setDisplayedTurns((prev) => [...prev, eventTurn]);
    voiceAdapter.repeatLastPrompt?.(sessionHandle);
  };

  const handleHint = () => {
    const eventTurn: TranscriptTurn = {
      speaker: 'event',
      text: 'Voice turn control: Hint requested',
      timestamp: new Date().toISOString(),
      control: 'hint',
    };
    setTurns((prev) => {
      const updated = [...prev, eventTurn];
      if (dbSessionId) {
        supabase.from('sessions').update({ transcript: updated }).eq('id', dbSessionId).then();
      }
      return updated;
    });
    setDisplayedTurns((prev) => [...prev, eventTurn]);
  };

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
  const [earnedScore, setEarnedScore] = useState<number>(5);
  const [passedStatus, setPassedStatus] = useState<boolean>(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Extract content fields & resolve domain variants if user has a matching primary_domain
  const contentObj = (module.content as any) || {};
  const userDomain = profile?.primary_domain;
  const domainVariant = userDomain && contentObj.domain_variants?.[userDomain] ? contentObj.domain_variants[userDomain] : null;
  const effectiveContent = domainVariant || contentObj;

  const targetPhrases: Array<{ german: string; english: string }> = useMemo(() => {
    let rawPhrases: Array<{ german: string; english: string }> = [];
    if (Array.isArray(effectiveContent.target_phrases) && effectiveContent.target_phrases.length > 0) {
      rawPhrases = effectiveContent.target_phrases;
    } else if (effectiveContent.target_phrase) {
      rawPhrases = [{ german: effectiveContent.target_phrase, english: effectiveContent.english_meaning || '' }];
    } else {
      rawPhrases = [{ german: 'Guten Tag!', english: 'Good day! / Hello!' }];
    }

    // Sort in strictly increasing order of length (word count, then character length)
    return [...rawPhrases].sort((a, b) => {
      const aWords = a.german.trim().split(/\s+/).filter(Boolean).length;
      const bWords = b.german.trim().split(/\s+/).filter(Boolean).length;
      if (aWords !== bWords) return aWords - bWords;
      return a.german.trim().length - b.german.trim().length;
    });
  }, [effectiveContent]);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const currentPhraseIndexRef = useRef<number>(0);
  currentPhraseIndexRef.current = currentPhraseIndex;

  const [phraseAttempts, setPhraseAttempts] = useState<number>(1);
  const phraseAttemptsRef = useRef<number>(1);
  phraseAttemptsRef.current = phraseAttempts;

  const lastUserTurnRef = useRef<TranscriptTurn | null>(null);
  const [currentPhraseUserTurn, setCurrentPhraseUserTurn] = useState<TranscriptTurn | null>(null);
  const pendingAdvanceRef = useRef<boolean>(false);

  const currentPhrase = targetPhrases[currentPhraseIndex] || targetPhrases[0];

  const currentLinguisticAnalysis = useMemo(() => {
    if (mode !== 'learn' || !currentPhrase?.german) return null;
    return analyzeSentenceLinguistics(currentPhrase.german, currentPhrase.english || '');
  }, [mode, currentPhrase]);

  // Scroll to bottom when turns update
  // (extended below to also scroll on live speech transcription)

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
        const initialPhrase = targetPhrases[0]?.german || 'Guten Tag!';
        const handle = await voiceAdapter.startSession({
          tab: 'speak',
          mode: mode,
          moduleId: module.id,
          targetPhrase: initialPhrase,
          durationMinutes: durationMinutes,
          isCheckpoint: module.is_checkpoint,
        });

        if (!active) return;
        setSessionHandle(handle);

        // 3. Register state change listener
        if (voiceAdapter.onStateChange) {
          cleanupState = voiceAdapter.onStateChange(handle, (st) => {
            if (active) setVoiceState(st);

            // If phrase advancement is queued, advance as soon as AI appreciation speech finishes ('idle')
            if (active && st === 'idle' && pendingAdvanceRef.current) {
              pendingAdvanceRef.current = false;
              const curIdx = currentPhraseIndexRef.current;
              const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

              if (curIdx < targetPhrases.length - 1) {
                const nextIdx = curIdx + 1;
                currentPhraseIndexRef.current = nextIdx;
                setCurrentPhraseIndex(nextIdx);
                setCurrentPhraseUserTurn(null);
                setDisplayedTurns([]); // Reset transcript stage cleanly for next word
                const nextPhrase = targetPhrases[nextIdx];
                if (handle && handle.context) {
                  handle.context.targetPhrase = nextPhrase.german;
                }
                setTimeout(() => {
                  if (active && handle) {
                    voiceAdapter.speakPhrasePrompt?.(handle, nextPhrase, false, userName, module.title).catch(console.warn);
                  }
                }, 350);
              } else {
                // All phrases completed! Wrap up and finish session
                setTimeout(() => {
                  if (active) handleFinishRef.current();
                }, 500);
              }
            }
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
            lastUserTurnRef.current = newTurn;
            setCurrentPhraseUserTurn(newTurn);
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

          setDisplayedTurns((prev) => {
            const existingIdx = prev.findIndex(
              (t) => t === newTurn || (t.timestamp === newTurn.timestamp && t.speaker === newTurn.speaker)
            );
            return existingIdx >= 0
              ? prev.map((t, i) => (i === existingIdx ? { ...newTurn } : t))
              : [...prev, newTurn];
          });

          if (newTurn.sessionEnded) {
            setTimeout(() => {
              if (active) handleFinishRef.current();
            }, 2500);
            return;
          }

          // In Learn mode: analyze user attempt on current phrase -> advance or prepare retry
          if (mode === 'learn' && newTurn.speaker === 'agent' && lastTurnWasUser) {
            lastTurnWasUser = false;
            const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

            const lastUserTurn = lastUserTurnRef.current;
            const turnScore = typeof lastUserTurn?.score === 'number'
              ? lastUserTurn.score
              : (lastUserTurn?.isCorrect ? 5 : 2);
            const isPassed = turnScore >= 4 || lastUserTurn?.isCorrect === true;

            if (!isPassed && phraseAttemptsRef.current < 3) {
              // Mistakes detected: stay on current phrase for next attempt (up to 3 attempts)
              // The coach's spoken feedback already told the learner what to change and asked to retry.
              const nextAttempt = phraseAttemptsRef.current + 1;
              phraseAttemptsRef.current = nextAttempt;
              setPhraseAttempts(nextAttempt);
            } else {
              // Mastered phrase (score >= 4) OR reached max 3 attempts:
              // Reset attempts for next phrase
              phraseAttemptsRef.current = 1;
              setPhraseAttempts(1);

              // Queue advancement when AI appreciation speech finishes:
              pendingAdvanceRef.current = true;

              // Fallback timer: in case onStateChange doesn't fire idle (e.g. muted audio)
              setTimeout(() => {
                if (active && pendingAdvanceRef.current) {
                  pendingAdvanceRef.current = false;
                  const cIdx = currentPhraseIndexRef.current;
                  if (cIdx < targetPhrases.length - 1) {
                    const nextIdx = cIdx + 1;
                    currentPhraseIndexRef.current = nextIdx;
                    setCurrentPhraseIndex(nextIdx);
                    setCurrentPhraseUserTurn(null);
                    setDisplayedTurns([]); // Reset transcript stage cleanly for next word
                    const nextPhrase = targetPhrases[nextIdx];
                    if (handle && handle.context) {
                      handle.context.targetPhrase = nextPhrase.german;
                    }
                    voiceAdapter.speakPhrasePrompt?.(handle, nextPhrase, false, userName, module.title).catch(console.warn);
                  } else {
                    handleFinishRef.current();
                  }
                }
              }, 4500);
            }
          }
        });

        // 6. Proactive AI Guidance: In all modules, the AI speaks first and guides the user
        if (!hasSpokenOpenerRef.current && (!initialTranscript || initialTranscript.length === 0)) {
          hasSpokenOpenerRef.current = true;
          setTimeout(() => {
            if (!handle) return;
            const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
            if (mode === 'learn') {
              const firstPhrase = targetPhrases[0] || { german: 'Guten Tag!', english: 'Good day! / Hello!' };
              voiceAdapter.speakPhrasePrompt?.(handle, firstPhrase, true, userName, module.title).catch((e) => console.warn('Opener speak notice:', e));
            } else {
              const opener = `Welcome ${userName}! This is a realistic scenario: "${module.title}". We will have a complete German conversation. Let's begin! Hallo! Wir starten Ihre Praxis-Situation für "${module.title}". Bitte antworten Sie auf Deutsch, sobald Sie bereit sind.`;
              voiceAdapter.speak(handle, opener).catch((e) => console.warn('Opener speak notice:', e));
            }
          }, 400);
        }
      } catch (err: any) {
        console.error('Error initializing active speak session:', err);
        if (active) setErrorMsg(err.message || 'Failed to start voice session.');
      }
    };

    init();

    return () => {
      active = false;
      hasSpokenOpenerRef.current = false;
      voiceAdapter.stopSpeaking?.();
      if (cleanupTranscript) cleanupTranscript();
      if (cleanupState) cleanupState();
      if (cleanupSessionEnded) cleanupSessionEnded();
    };
  }, [user, module.id, mode]);

  // Deliver recorded audio chunk to voiceAdapter automatically upon VAD speech-end
  const handleDeliverAudio = useCallback(async (audioBlob?: Blob, clientTranscript?: string) => {
    if (!sessionHandle) return;
    if (voiceAdapter.cancelSilenceTimer) {
      voiceAdapter.cancelSilenceTimer(sessionHandle);
    }
    try {
      setErrorMsg(null);
      // Ensure the voice adapter context is strictly aligned with the current active phrase
      const activePhraseObj = targetPhrases[currentPhraseIndexRef.current] || currentPhrase;
      if (sessionHandle.context) {
        sessionHandle.context.targetPhrase = activePhraseObj.german;
      }
      await voiceAdapter.sendAudio(sessionHandle, audioBlob, clientTranscript);
    } catch (err: any) {
      console.error('Error sending audio chunk:', err);
      setErrorMsg('Could not transcribe audio clearly. Please try speaking again.');
    }
  }, [sessionHandle, currentPhrase, targetPhrases]);

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

  // Duolingo-style Word-by-Word Alignment & Pronunciation Verification (Evaluated upon speech completion)
  const activeSpokenText = useMemo(() => {
    return (currentPhraseUserTurn?.rawTranscript || currentPhraseUserTurn?.text || '').trim();
  }, [currentPhraseUserTurn]);

  const wordAlignment = useMemo(() => {
    if (!currentPhrase?.german) return [];
    const tokens = currentPhrase.german.trim().split(/\s+/).filter(Boolean);
    if (!activeSpokenText) {
      return tokens.map((word) => ({ word, status: 'pending' as 'matched' | 'missed' | 'pending' }));
    }

    // Clean spoken words array
    const spokenClean = activeSpokenText
      .toLowerCase()
      .replace(/[.,!?;:\"'()]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    return tokens.map((word) => {
      const cleanTarget = word.toLowerCase().replace(/[.,!?;:\"'()]/g, '');
      const isMatched = spokenClean.some((spk) => {
        if (spk === cleanTarget) return true;
        // Normalize German umlauts
        const normSpk = spk.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
        const normTgt = cleanTarget.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
        if (normSpk === normTgt) return true;
        if (cleanTarget.length >= 4 && (spk.startsWith(cleanTarget) || cleanTarget.startsWith(spk))) {
          return true;
        }
        return false;
      });

      return {
        word,
        status: isMatched
          ? ('matched' as const)
          : currentPhraseUserTurn
          ? ('missed' as const)
          : ('pending' as const),
      };
    });
  }, [currentPhrase, activeSpokenText, currentPhraseUserTurn]);

  // Scroll internal chat stream to bottom when turns or live speech updates without moving the page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [turns, voiceState, isUserSpeaking, interimTranscript]);

  // Auto-dismiss transient error messages
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 6000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // Advance to next phrase manually or programmatically
  const handleAdvancePhrase = () => {
    pendingAdvanceRef.current = false;
    const curIdx = currentPhraseIndexRef.current;
    phraseAttemptsRef.current = 1;
    setPhraseAttempts(1);
    lastUserTurnRef.current = null;
    setCurrentPhraseUserTurn(null);

    if (curIdx < targetPhrases.length - 1) {
      const nextIdx = curIdx + 1;
      currentPhraseIndexRef.current = nextIdx;
      setCurrentPhraseIndex(nextIdx);
      setDisplayedTurns([]); // Reset transcript stage cleanly for next word
      const nextPhrase = targetPhrases[nextIdx];
      if (sessionHandle) {
        if (sessionHandle.context) {
          sessionHandle.context.targetPhrase = nextPhrase.german;
        }
        const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
        voiceAdapter.speakPhrasePrompt?.(sessionHandle, nextPhrase, false, userName, module.title).catch(console.warn);
      }
    } else {
      handleFinishSession();
    }
  };

  // Finish session, compute rating, save diagnostic recap, update streak
  const handleFinishSession = async () => {
    if (!user || isFinishing) return;
    try {
      setIsFinishing(true);
      setErrorMsg(null);

      // Stop voice adapter session
      if (sessionHandle) {
        await voiceAdapter.endSession(sessionHandle);
      }

      // Compute overall score across user turns (scale 1-5)
      const userTurns = turns.filter((t) => t.speaker === 'user');
      const totalScore = userTurns.reduce(
        (acc, t) => acc + (typeof t.score === 'number' ? t.score : t.isCorrect ? 5 : 2),
        0
      );
      const calculatedScore =
        userTurns.length > 0 ? Math.round(totalScore / userTurns.length) : turns.length > 0 ? 3 : 1;
      const finalStars = Math.max(1, Math.min(5, calculatedScore));
      const hasPassed = finalStars > 2;

      setEarnedScore(finalStars);
      setPassedStatus(hasPassed);

      // Spoken closing review
      if (sessionHandle && voiceAdapter.speak) {
        const wrapUpSpeech = hasPassed
          ? `Workout complete! Excellent work. You scored ${finalStars} out of 5 stars. You demonstrated clear pronunciation and accurate sentence structure. You have unlocked the next module!`
          : `Workout complete. You scored ${finalStars} out of 5 stars. A score above 2 is required to unlock the next session. Review your corrections on screen and let's retry this workout!`;
        voiceAdapter.speak(sessionHandle, wrapUpSpeech).catch(() => {});
      }

      // Generate real diagnostic recap
      let finalRecap: DiagnosticRecapResult | null = null;
      if (dbSessionId) {
        finalRecap = await generateDiagnosticRecap(dbSessionId);

        // Update session status to completed with latest turns
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            transcript: turns,
          })
          .eq('id', dbSessionId);

        // Record streak and unlock module in persistent local cache
        if (hasPassed) {
          try {
            const raw = localStorage.getItem('speechai_completed_modules');
            const parsed = raw ? JSON.parse(raw) : [];
            if (!parsed.includes(module.id)) {
              parsed.push(module.id);
              localStorage.setItem('speechai_completed_modules', JSON.stringify(parsed));
            }
          } catch (_) {}
          await recordSessionCompletionInStreak(user.id, true);
        }
      }

      setCompletedSummary(finalRecap);
    } catch (err: any) {
      console.error('Error finalizing session:', err);
      setErrorMsg('Failed to finalize session. Please retry.');
      setIsFinishing(false);
    }
  };
  handleFinishRef.current = handleFinishSession;

  const handleRetryWorkout = async () => {
    setCompletedSummary(null);
    setIsFinishing(false);
    setTurns([]);
    setCurrentPhraseIndex(0);
    currentPhraseIndexRef.current = 0;
    setPhraseAttempts(1);
    phraseAttemptsRef.current = 1;
    lastUserTurnRef.current = null;
    hasSpokenOpenerRef.current = true;
    hasTriggeredCloseRef.current = false;
    setSecondsElapsed(0);
    setIsTimeUp(false);

    if (!user) return;

    try {
      // 1. Create a fresh session row in Supabase with empty transcript
      const { data: newSession, error: sErr } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          tab: 'speak',
          mode: mode,
          module_id: module.id,
          status: 'incomplete',
          transcript: [],
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (sErr) throw sErr;
      const newDbId = newSession.id;
      setDbSessionId(newDbId);

      // 2. Start a fresh Voice Adapter session handle
      const firstPhrase = targetPhrases[0] || { german: 'Guten Tag!', english: 'Good day! / Hello!' };
      const handle = await voiceAdapter.startSession({
        tab: 'speak',
        mode: mode,
        moduleId: module.id,
        targetPhrase: firstPhrase.german,
        durationMinutes: durationMinutes,
        isCheckpoint: module.is_checkpoint,
      });

      setSessionHandle(handle);

      // 3. Proactively speak Phrase 1 opener fresh
      const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
      voiceAdapter.speakPhrasePrompt?.(handle, firstPhrase, true, userName, module.title).catch(console.warn);
    } catch (err) {
      console.error('Error restarting workout on retry:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100dvh-5.5rem)] text-[#111111] overflow-hidden animate-fadeIn">
      {/* Top Fixed Stage (Header + Duolingo Word Chips - Pinned & Non-scrolling) */}
      <div className="shrink-0 space-y-2 z-10 pb-1 bg-transparent">
        {/* Top Workout Status Bar */}
        <header className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
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
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#00215C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isFinishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3 h-3 fill-white" />
            )}
            <span>Finish</span>
          </button>
        </header>

        {/* Target Phrase Stepper Stage (Learn Mode) - Pinned in view */}
        {mode === 'learn' && currentPhrase && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-white to-[#F8FAFF] border border-blue-100 shadow-[0_4px_20px_rgba(37,92,193,0.06)] space-y-2 relative overflow-hidden">
            {/* Stepper bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#255CC1] uppercase tracking-wider text-[11px]">
                Phrase {currentPhraseIndex + 1} of {targetPhrases.length}
              </span>
              <span className="font-semibold text-slate-500 text-[11px]">
                {Math.round(((currentPhraseIndex + 1) / targetPhrases.length) * 100)}%
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#255CC1] rounded-full transition-all duration-300"
                style={{ width: `${((currentPhraseIndex + 1) / targetPhrases.length) * 100}%` }}
              />
            </div>

            {/* Clean German Target Typography (Color Highlights, No Capsules) */}
            <div className="py-1 space-y-1">
              <div className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight leading-relaxed select-none">
                {wordAlignment.map((token, wIdx) => {
                  const colorClass =
                    token.status === 'matched'
                      ? 'text-emerald-600 transition-colors duration-300'
                      : token.status === 'missed'
                      ? 'text-amber-600 transition-colors duration-300'
                      : 'text-[#00215C]';
                  return (
                    <span key={wIdx} className={`${colorClass} mr-2.5 inline-block`}>
                      {token.word}
                    </span>
                  );
                })}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
                &ldquo;{currentPhrase.english}&rdquo;
              </p>

              {/* Interactive Word Breakdown & Grammatical Structure in Learn Mode */}
              {currentLinguisticAnalysis && (
                <div className="pt-1">
                  <LearnLinguisticStage
                    analysis={currentLinguisticAnalysis}
                    sessionHandle={sessionHandle}
                  />
                </div>
              )}
            </div>

            {/* Action controls for current phrase */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80">
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
                  title="Move to the next phrase"
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
                  <span>Finish</span>
                </button>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Internal Chat Conversation Area (Agent on LHS, Human on RHS; Vanishing Top Gradient) */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-1 space-y-3 min-h-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_100%)] pt-3 pb-28"
      >
        {displayedTurns.length === 0 ? (
          <div className="py-6 sm:py-8 text-center text-slate-400 bg-white/80 rounded-2xl border border-slate-200/70 p-4 sm:p-6 shadow-xs">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <p className="text-sm font-heading font-extrabold text-[#00215C]">German Voice Stage Active</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium leading-relaxed">
              Listen to your coach introduction, then speak the target German phrase aloud.
            </p>
          </div>
        ) : (
          displayedTurns.map((turn, idx) => {
            if (turn.speaker === 'event') {
              return (
                <div key={idx} className="flex justify-center my-1.5 animate-fadeIn">
                  <span className="text-[10px] text-slate-500 bg-slate-100/90 border border-slate-200/60 px-2.5 py-0.5 rounded-full font-medium">
                    {turn.control ? `Requested ${turn.control}` : turn.text}
                  </span>
                </div>
              );
            }

            const isUser = turn.speaker === 'user';
            
            // VOICE AGENT TURN: LHS
            if (!isUser) {
              return (
                <div key={idx} className="flex items-start gap-3 justify-start max-w-[85%] sm:max-w-[78%] animate-fadeIn">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-200/90 p-1 overflow-hidden">
                    <AppLogo size={26} alt="German Speech Coach" />
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-2xl rounded-tl-xs bg-white text-slate-800 border border-slate-200/90 shadow-xs text-xs sm:text-sm leading-relaxed">
                    <p className="font-medium text-slate-800">{turn.text}</p>
                    <span className="block text-[10px] mt-1 text-slate-400">
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            }

            // HUMAN LEARNER TURN: RHS
            return (
              <div key={idx} className="flex flex-col items-end gap-1.5 ml-auto max-w-[85%] sm:max-w-[78%] animate-fadeIn">
                <div className="flex items-start gap-3 flex-row-reverse w-full justify-start">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs bg-[#00215C] text-white">
                    You
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-2xl rounded-tr-xs bg-[#00215C] text-white shadow-xs text-xs sm:text-sm leading-relaxed">
                    <p className="font-normal">{turn.rawTranscript || turn.text}</p>
                    <span className="block text-[10px] mt-1 text-right text-blue-200">
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Per-Turn Instant Coaching Feedback attached to User Turn on RHS */}
                {mode === 'learn' && (
                  <div className="mr-11 w-full space-y-1.5 text-xs">
                    {/* What to Change banner */}
                    {turn.what_to_change && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 flex items-start gap-2 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                          Trainer Tip:
                        </span>
                        <span className="text-xs font-semibold leading-relaxed break-words">
                          {turn.what_to_change}
                        </span>
                      </div>
                    )}

                    {/* Accurate state banner */}
                    {turn.isCorrect && (
                      <div className="p-2 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-xs">Sehr gut! Clean German pronunciation</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}




      </div>

      {/* Fixed Bottom Voice Status Dock with Automatic Turn-Taking & Voice-Turn Controls */}
      <AutoTurnStatusDock
        controlsSlot={
          <VoiceTurnControls
            onSlower={handleSlower}
            onRepeat={handleRepeat}
            onHint={handleHint}
            hintText={currentPhrase?.english ? `Meaning: "${currentPhrase.english}"` : null}
            showHint={mode === 'learn'}
            disabled={voiceState === 'speaking' || isFinishing}
          />
        }
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
          title={passedStatus ? "Workout Complete!" : "Workout Needs Review"}
          subtitle={`${mode === 'learn' ? 'Learn Session' : 'Practice Simulation'} • Module ${module.module_number}: ${module.title}`}
          mode={mode}
          recap={completedSummary}
          score={earnedScore}
          passed={passedStatus}
          onRetry={handleRetryWorkout}
          actionButtonText={
            isRepeatedMistakePause
              ? "Review Completed • Exit"
              : passedStatus
              ? "Continue to Next Module →"
              : "Retry This Module ↺"
          }
          onActionButtonClick={
            isRepeatedMistakePause || passedStatus ? onCompleted : handleRetryWorkout
          }
          sessionId={dbSessionId}
          isRepeatedMistakePause={isRepeatedMistakePause}
          phrasesCompleted={currentPhraseIndex + (turns.some(t => t.speaker === 'user') ? 1 : 0)}
          totalPhrases={targetPhrases.length}
          userTurnsCount={turns.filter(t => t.speaker === 'user').length}
        />
      )}
    </div>
  );
};
