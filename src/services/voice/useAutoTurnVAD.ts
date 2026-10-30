import { useEffect, useRef, useState, useCallback } from 'react';
import { VadManager } from './vadManager';
import { VoiceAdapter, VoiceSessionHandle, VoiceState } from './types';

export interface UseAutoTurnVADOptions {
  sessionHandle: VoiceSessionHandle | null;
  voiceAdapter: VoiceAdapter;
  voiceState: VoiceState;
  onSendAudio: (audioBlob?: Blob) => Promise<void>;
  onError?: (err: Error) => void;
  enabled?: boolean;
}

export function useAutoTurnVAD({
  sessionHandle,
  voiceAdapter,
  voiceState,
  onSendAudio,
  onError,
  enabled = true,
}: UseAutoTurnVADOptions) {
  const [isVadInitialized, setIsVadInitialized] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [vadError, setVadError] = useState<string | null>(null);

  const vadManagerRef = useRef<VadManager | null>(null);
  const isSendingAudioRef = useRef(false);
  const latestWavBlobRef = useRef<Blob | null>(null);

  // Initialize VadManager once when sessionHandle is available
  useEffect(() => {
    if (!enabled || !sessionHandle) return;

    let isMounted = true;
    const vad = new VadManager({
      // Conservative pause / silence threshold (1.3 seconds, respecting learner pauses)
      redemptionMs: 1300,
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      preSpeechPadMs: 400,
      minSpeechMs: 250,
      baseAssetPath: '/vad-assets/',
      onnxWASMBasePath: '/vad-assets/',
      onSpeechStart: () => {
        if (!isMounted) return;
        setIsUserSpeaking(true);
        // Cancel silence timer as soon as speech onset is detected
        if (voiceAdapter.cancelSilenceTimer && sessionHandle) {
          voiceAdapter.cancelSilenceTimer(sessionHandle);
        }
      },
      onSpeechEnd: async (wavBlob: Blob) => {
        if (!isMounted || isSendingAudioRef.current) return;
        latestWavBlobRef.current = wavBlob;
        setIsUserSpeaking(false);
        isSendingAudioRef.current = true;
        try {
          // Stop VAD capture while processing and while agent responds
          await vad.stopListening();
          await onSendAudio(wavBlob);
        } catch (err: any) {
          console.error('[useAutoTurnVAD] Error delivering speech audio:', err);
        } finally {
          isSendingAudioRef.current = false;
        }
      },
      onVADMisfire: () => {
        if (!isMounted) return;
        setIsUserSpeaking(false);
      },
      onError: (err) => {
        if (!isMounted) return;
        console.warn('[useAutoTurnVAD] VAD error notice:', err);
        setVadError('Voice activity detection unavailable. Tap to Speak mode active.');
        onError?.(err);
      },
    });

    vadManagerRef.current = vad;

    vad
      .init()
      .then(() => {
        if (!isMounted) return;
        setIsVadInitialized(true);
        // If current voiceState is already idle, immediately start listening
        if (voiceState === 'idle') {
          vad.startListening();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[useAutoTurnVAD] Microphone permission or VAD init warning:', err);
        setVadError('Microphone permission required or VAD unavailable. Tap to Speak mode active.');
      });

    return () => {
      isMounted = false;
      vad.destroy();
      vadManagerRef.current = null;
    };
  }, [sessionHandle, enabled]);

  // Synchronize VAD listening with agent voiceState
  // Crucial: VAD is strictly OFF while agent is speaking (TTS playing) or processing
  useEffect(() => {
    const vad = vadManagerRef.current;
    if (!vad || !isVadInitialized || isManualPaused) return;

    if (voiceState === 'speaking' || voiceState === 'processing') {
      vad.stopListening();
      setIsUserSpeaking(false);
    } else if (voiceState === 'idle' && !isSendingAudioRef.current) {
      // Auto-start listening as soon as agent finishes speaking
      vad.startListening();
    }
  }, [voiceState, isVadInitialized, isManualPaused]);

  // Manual pause / resume override
  const togglePause = useCallback(async () => {
    const vad = vadManagerRef.current;
    if (!vad) return;

    if (isManualPaused) {
      setIsManualPaused(false);
      await vad.resumeManually();
    } else {
      setIsManualPaused(true);
      setIsUserSpeaking(false);
      await vad.pauseManually();
      // Cancel active silence timer when paused
      if (voiceAdapter.cancelSilenceTimer && sessionHandle) {
        voiceAdapter.cancelSilenceTimer(sessionHandle);
      }
    }
  }, [isManualPaused, sessionHandle, voiceAdapter]);

  // Manual start speaking fallback (if VAD is unavailable or user taps directly)
  const manualStartSpeaking = useCallback(() => {
    setIsUserSpeaking(true);
    if (voiceAdapter.cancelSilenceTimer && sessionHandle) {
      voiceAdapter.cancelSilenceTimer(sessionHandle);
    }
  }, [voiceAdapter, sessionHandle]);

  // Manual submit fallback (if user wants to submit immediately without waiting for pause)
  const manualSubmit = useCallback(async () => {
    if (isSendingAudioRef.current) return;
    const vad = vadManagerRef.current;
    if (vad) {
      await vad.stopListening();
    }
    setIsUserSpeaking(false);
    isSendingAudioRef.current = true;
    try {
      await onSendAudio(latestWavBlobRef.current || undefined);
    } finally {
      isSendingAudioRef.current = false;
    }
  }, [onSendAudio]);

  return {
    isVadInitialized,
    isUserSpeaking,
    isManualPaused,
    vadError,
    togglePause,
    manualSubmit,
    manualStartSpeaking,
  };
}
