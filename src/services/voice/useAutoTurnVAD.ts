import { useEffect, useRef, useState, useCallback } from 'react';
import { VadManager } from './vadManager';
import { VoiceAdapter, VoiceSessionHandle, VoiceState } from './types';

export interface UseAutoTurnVADOptions {
  sessionHandle: VoiceSessionHandle | null;
  voiceAdapter: VoiceAdapter;
  voiceState: VoiceState;
  onSendAudio: (audioBlob?: Blob, clientTranscript?: string) => Promise<void>;
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
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const vadManagerRef = useRef<VadManager | null>(null);
  const isSendingAudioRef = useRef(false);
  const latestWavBlobRef = useRef<Blob | null>(null);

  // Audio capture & analysis refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Speech API recognition ref (client-side German STT)
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  // ---------------------------------------------------------------------------
  // 1. Audio Meter Setup (Volume level visualization)
  // ---------------------------------------------------------------------------
  const startVolumeMeter = useCallback((stream: MediaStream) => {
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize 0 - 100
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setVolumeLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('[useAutoTurnVAD] Audio meter setup warning:', err);
    }
  }, []);

  const stopVolumeMeter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Request Mic Stream
  // ---------------------------------------------------------------------------
  const getMicStream = useCallback(async (): Promise<MediaStream> => {
    if (mediaStreamRef.current && mediaStreamRef.current.active) {
      return mediaStreamRef.current;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    mediaStreamRef.current = stream;
    startVolumeMeter(stream);
    return stream;
  }, [startVolumeMeter]);

  // ---------------------------------------------------------------------------
  // 3. Web Speech Recognition (German de-DE for live transcript)
  // ---------------------------------------------------------------------------
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'de-DE';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + ' ';
        }
        text = text.trim();
        latestTranscriptRef.current = text;
        setInterimTranscript(text);
      };

      recognition.onerror = (e: any) => {
        // Non-fatal, as Groq Whisper STT is primary
        console.debug('[useAutoTurnVAD] Speech recognition notice:', e.error);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[useAutoTurnVAD] Web Speech API init error:', e);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 4. MediaRecorder recording start/stop
  // ---------------------------------------------------------------------------
  const startRecordingStream = useCallback(async () => {
    try {
      const stream = await getMicStream();
      audioChunksRef.current = [];
      latestTranscriptRef.current = '';
      setInterimTranscript('');

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) mimeType = 'audio/ogg;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      // Start client speech recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
    } catch (err: any) {
      console.error('[useAutoTurnVAD] Failed to start MediaRecorder:', err);
      setVadError('Microphone permission required. Tap to grant permission.');
    }
  }, [getMicStream]);

  const stopRecordingStream = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: mimeType }) : null;
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  // ---------------------------------------------------------------------------
  // 5. Initialize VadManager & Web Speech on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !sessionHandle) return;

    let isMounted = true;
    initSpeechRecognition();

    const vad = new VadManager({
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
        if (voiceAdapter.cancelSilenceTimer && sessionHandle) {
          voiceAdapter.cancelSilenceTimer(sessionHandle);
        }
        // Start speech recognition for live visual German transcription
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (_) {}
        }
      },
      onSpeechEnd: async (wavBlob: Blob) => {
        if (!isMounted || isSendingAudioRef.current) return;
        latestWavBlobRef.current = wavBlob;
        setIsUserSpeaking(false);
        isSendingAudioRef.current = true;

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }

        try {
          await vad.stopListening();
          const transcriptToSend = latestTranscriptRef.current;
          await onSendAudio(wavBlob, transcriptToSend);
        } catch (err: any) {
          console.error('[useAutoTurnVAD] Error delivering speech audio:', err);
        } finally {
          isSendingAudioRef.current = false;
          setInterimTranscript('');
          latestTranscriptRef.current = '';
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
      .then(async () => {
        if (!isMounted) return;
        setIsVadInitialized(true);
        setVadError(null);

        // Pre-request stream for volume meter if allowed
        try {
          await getMicStream();
        } catch (_) {}

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
      stopVolumeMeter();

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [sessionHandle, enabled, initSpeechRecognition, getMicStream, stopVolumeMeter]);

  // Synchronize VAD listening with agent voiceState
  useEffect(() => {
    const vad = vadManagerRef.current;
    if (!vad || !isVadInitialized || isManualPaused) return;

    if (voiceState === 'speaking' || voiceState === 'processing') {
      vad.stopListening();
      setIsUserSpeaking(false);
    } else if (voiceState === 'idle' && !isSendingAudioRef.current) {
      vad.startListening();
    }
  }, [voiceState, isVadInitialized, isManualPaused]);

  // ---------------------------------------------------------------------------
  // 6. User Actions (Manual toggle pause, start speaking, submit)
  // ---------------------------------------------------------------------------
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
      if (voiceAdapter.cancelSilenceTimer && sessionHandle) {
        voiceAdapter.cancelSilenceTimer(sessionHandle);
      }
    }
  }, [isManualPaused, sessionHandle, voiceAdapter]);

  const manualStartSpeaking = useCallback(async () => {
    setIsUserSpeaking(true);
    setVadError(null);
    if (voiceAdapter.cancelSilenceTimer && sessionHandle) {
      voiceAdapter.cancelSilenceTimer(sessionHandle);
    }
    // Genuinely start recording user audio via MediaRecorder
    await startRecordingStream();
  }, [voiceAdapter, sessionHandle, startRecordingStream]);

  const manualSubmit = useCallback(async () => {
    if (isSendingAudioRef.current) return;
    const vad = vadManagerRef.current;
    if (vad) {
      await vad.stopListening();
    }
    setIsUserSpeaking(false);
    isSendingAudioRef.current = true;

    try {
      const recordedBlob = await stopRecordingStream();
      const finalBlob = recordedBlob || latestWavBlobRef.current || undefined;
      const transcriptToSend = latestTranscriptRef.current;

      await onSendAudio(finalBlob, transcriptToSend);
    } catch (err: any) {
      console.error('[useAutoTurnVAD] Manual submit audio error:', err);
    } finally {
      isSendingAudioRef.current = false;
      setInterimTranscript('');
      latestTranscriptRef.current = '';
    }
  }, [onSendAudio, stopRecordingStream]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await getMicStream();
      setVadError(null);
      if (vadManagerRef.current) {
        vadManagerRef.current.startListening();
      }
      return stream;
    } catch (err) {
      console.error('[useAutoTurnVAD] Failed to obtain microphone permission:', err);
      setVadError('Microphone permission was denied. Please allow microphone access in your browser settings.');
      return null;
    }
  }, [getMicStream]);

  return {
    isVadInitialized,
    isUserSpeaking,
    isManualPaused,
    vadError,
    volumeLevel,
    interimTranscript,
    togglePause,
    manualSubmit,
    manualStartSpeaking,
    requestMicrophonePermission,
  };
}
