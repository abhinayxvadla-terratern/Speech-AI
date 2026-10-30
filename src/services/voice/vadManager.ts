/**
 * vadManager.ts
 * Client-side Voice Activity Detection (VAD) wrapper using @ricky0123/vad-web.
 * Runs completely locally in the browser with ONNX WebAssembly & Silero VAD model.
 */

import { MicVAD, utils } from '@ricky0123/vad-web';

export interface VadManagerConfig {
  /** Conservative pause / silence threshold in ms before triggering speech end (default: 2000ms) */
  redemptionMs?: number;
  /** Speech probability threshold for onset (0-1, default: 0.5) */
  positiveSpeechThreshold?: number;
  /** Speech probability threshold for silence (0-1, default: 0.35) */
  negativeSpeechThreshold?: number;
  /** Pre-speech padding prepended to audio chunk in ms (default: 400ms) */
  preSpeechPadMs?: number;
  /** Minimum speech duration in ms to avoid noise clicks (default: 250ms) */
  minSpeechMs?: number;
  /** Base asset path for Silero ONNX model and worklet (default: '/vad/') */
  baseAssetPath?: string;
  /** Base path for ONNX WASM binaries (default: '/vad/') */
  onnxWASMBasePath?: string;
  /** Callback fired when speech onset is detected */
  onSpeechStart?: () => void;
  /** Callback fired when speech ends, returning a standard 16-bit PCM WAV Blob */
  onSpeechEnd?: (wavBlob: Blob) => void;
  /** Callback fired when noise / misfire occurs */
  onVADMisfire?: () => void;
  /** Callback fired on fatal error */
  onError?: (err: Error) => void;
}

export class VadManager {
  private micVad: MicVAD | null = null;
  private isDestroyed = false;
  private isListeningActive = false;
  private isManuallyPaused = false;
  private config: VadManagerConfig;

  constructor(config: VadManagerConfig = {}) {
    this.config = {
      redemptionMs: 2000,
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      preSpeechPadMs: 400,
      minSpeechMs: 250,
      baseAssetPath: '/vad-assets/',
      onnxWASMBasePath: '/vad-assets/',
      ...config,
    };
  }

  /**
   * Initialize MicVAD and request microphone permission once.
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('[VadManager] Web Audio / getUserMedia not supported in this environment.');
      return;
    }

    try {
      this.micVad = await MicVAD.new({
        baseAssetPath: this.config.baseAssetPath,
        onnxWASMBasePath: this.config.onnxWASMBasePath,
        positiveSpeechThreshold: this.config.positiveSpeechThreshold,
        negativeSpeechThreshold: this.config.negativeSpeechThreshold,
        redemptionMs: this.config.redemptionMs,
        preSpeechPadMs: this.config.preSpeechPadMs,
        minSpeechMs: this.config.minSpeechMs,
        startOnLoad: false,
        ortConfig: (ort: any) => {
          if (ort && ort.env && ort.env.wasm) {
            ort.env.wasm.numThreads = 1;
            ort.env.wasm.proxy = false;
          }
        },
        onSpeechStart: () => {
          if (this.isDestroyed || this.isManuallyPaused || !this.isListeningActive) return;
          this.config.onSpeechStart?.();
        },
        onSpeechEnd: (audio: Float32Array) => {
          if (this.isDestroyed || this.isManuallyPaused || !this.isListeningActive) return;
          try {
            // Encode Float32Array (16kHz mono) to 16-bit PCM WAV
            const wavBuffer = utils.encodeWAV(audio, 1, 16000, 1, 16);
            const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
            this.config.onSpeechEnd?.(wavBlob);
          } catch (err: any) {
            console.error('[VadManager] Error encoding WAV audio:', err);
            this.config.onError?.(err);
          }
        },
        onVADMisfire: () => {
          if (this.isDestroyed || this.isManuallyPaused) return;
          this.config.onVADMisfire?.();
        },
      });

      console.log('[VadManager] Initialized successfully with client-side Silero VAD.');
    } catch (err: any) {
      console.error('[VadManager] Initialization failed:', err);
      this.config.onError?.(err);
      throw err;
    }
  }

  /**
   * Start or resume listening (e.g. after agent finishes speaking).
   */
  async startListening(): Promise<void> {
    if (!this.micVad || this.isDestroyed || this.isManuallyPaused) return;
    this.isListeningActive = true;
    try {
      await this.micVad.start();
    } catch (err) {
      console.warn('[VadManager] Error in start():', err);
    }
  }

  /**
   * Stop / pause listening (e.g. while agent is speaking or processing).
   */
  async stopListening(): Promise<void> {
    this.isListeningActive = false;
    if (!this.micVad || this.isDestroyed) return;
    try {
      await this.micVad.pause();
    } catch (err) {
      console.warn('[VadManager] Error in pause():', err);
    }
  }

  /**
   * Manual pause override by user.
   */
  async pauseManually(): Promise<void> {
    this.isManuallyPaused = true;
    await this.stopListening();
  }

  /**
   * Resume manual override by user.
   */
  async resumeManually(): Promise<void> {
    this.isManuallyPaused = false;
    await this.startListening();
  }

  isPaused(): boolean {
    return this.isManuallyPaused;
  }

  isListening(): boolean {
    return this.isListeningActive && !this.isManuallyPaused;
  }

  /**
   * Clean up and release mic stream / audio context.
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.isListeningActive = false;
    if (this.micVad) {
      try {
        await this.micVad.destroy();
      } catch (err) {
        console.warn('[VadManager] Error during destroy():', err);
      }
      this.micVad = null;
    }
  }
}
