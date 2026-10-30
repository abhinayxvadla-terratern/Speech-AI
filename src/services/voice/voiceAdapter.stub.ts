import {
  VoiceAdapter,
  VoiceSessionContext,
  VoiceSessionHandle,
  TranscriptTurn,
  TranscriptCallback,
  VoiceState,
  VoiceStateCallback,
  SessionEndedCallback,
} from './types';

interface InternalSessionState {
  handle: VoiceSessionHandle;
  turns: TranscriptTurn[];
  transcriptListeners: Set<TranscriptCallback>;
  stateListeners: Set<VoiceStateCallback>;
  sessionEndedListeners: Set<SessionEndedCallback>;
  currentState: VoiceState;
  strikes: number;
  turnSilenceCheckInGiven: boolean;
  targetPhraseAttempts: number;
}

class StubVoiceAdapter implements VoiceAdapter {
  private sessions = new Map<string, InternalSessionState>();

  private updateState(session: InternalSessionState, newState: VoiceState) {
    session.currentState = newState;
    session.stateListeners.forEach((callback) => {
      try {
        callback(newState);
      } catch (e) {
        console.error('Error in voice state callback:', e);
      }
    });
  }

  async startSession(context: VoiceSessionContext): Promise<VoiceSessionHandle> {
    const sessionId = `vh_stub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const handle: VoiceSessionHandle = {
      id: sessionId,
      context,
      createdAt: Date.now(),
    };

    const sessionState: InternalSessionState = {
      handle,
      turns: [],
      transcriptListeners: new Set(),
      stateListeners: new Set(),
      sessionEndedListeners: new Set(),
      currentState: 'idle',
      strikes: 0,
      turnSilenceCheckInGiven: false,
      targetPhraseAttempts: 1,
    };

    this.sessions.set(sessionId, sessionState);
    return handle;
  }

  getStrikes(sessionHandle: VoiceSessionHandle): number {
    const session = this.sessions.get(sessionHandle.id);
    return session ? session.strikes : 0;
  }

  onSessionEnded(sessionHandle: VoiceSessionHandle, callback: SessionEndedCallback): () => void {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) return () => {};

    session.sessionEndedListeners.add(callback);
    return () => {
      session.sessionEndedListeners.delete(callback);
    };
  }

  cancelSilenceTimer(_sessionHandle: VoiceSessionHandle): void {}

  async handleSilence(sessionHandle: VoiceSessionHandle): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) return;

    if (!session.turnSilenceCheckInGiven) {
      session.turnSilenceCheckInGiven = true;
      await this.speak(sessionHandle, 'Take your time — are you still there?');
    } else {
      session.strikes += 1;
      session.turnSilenceCheckInGiven = false;

      if (session.strikes >= 3) {
        const signOff = "Let's pick this back up another time — great effort today.";
        await this.speak(sessionHandle, signOff);
        const lastTurn = session.turns[session.turns.length - 1];
        if (lastTurn) lastTurn.sessionEnded = true;
        session.sessionEndedListeners.forEach((cb) => cb('strikes_exceeded'));
      } else {
        const nextPrompt = "No worries, let's keep going.";
        await this.speak(sessionHandle, nextPrompt);
      }
    }
  }

  onTranscript(sessionHandle: VoiceSessionHandle, callback: TranscriptCallback): () => void {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      console.warn(`[VoiceAdapter.stub] Session ${sessionHandle.id} not found.`);
      return () => {};
    }

    session.transcriptListeners.add(callback);
    return () => {
      session.transcriptListeners.delete(callback);
    };
  }

  onStateChange(sessionHandle: VoiceSessionHandle, callback: VoiceStateCallback): () => void {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      return () => {};
    }

    session.stateListeners.add(callback);
    // Immediately emit current state
    callback(session.currentState);

    return () => {
      session.stateListeners.delete(callback);
    };
  }

  async sendAudio(sessionHandle: VoiceSessionHandle, _audioChunk?: any): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      throw new Error(`Session ${sessionHandle.id} does not exist`);
    }

    // 1. Enter processing state (thinking delay: 1.5s)
    this.updateState(session, 'processing');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Generate simulated user transcript
    const phrase = session.handle.context.targetPhrase;
    let simulatedText = '[Simulated user response]';
    if (phrase) {
      simulatedText = phrase;
    } else {
      simulatedText = '[Simulated user response: Ich verstehe die Anweisung und werde sie sofort ausführen.]';
    }

    const turn: TranscriptTurn = {
      speaker: 'user',
      text: simulatedText,
      rawTranscript: simulatedText,
      timestamp: new Date().toISOString(),
    };

    session.turns.push(turn);
    this.updateState(session, 'idle');

    // Notify transcript listeners
    session.transcriptListeners.forEach((cb) => {
      try {
        cb(turn);
      } catch (err) {
        console.error('Error in onTranscript callback:', err);
      }
    });
  }

  async triggerFinalClosingTurn(sessionHandle: VoiceSessionHandle): Promise<TranscriptTurn | null> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) return null;

    const mode = session.handle.context.mode || 'learn';
    const tab = session.handle.context.tab || 'speak';
    const text = mode === 'learn'
      ? "That's our time for today's session — nice work practicing today!"
      : (tab === 'interview'
          ? "Das wären meine Fragen für heute, vielen Dank für das Gespräch."
          : "Unsere Zeit ist für heute um, vielen Dank für das Gespräch. Bis bald!");

    await this.speak(sessionHandle, text);
    return session.turns[session.turns.length - 1] || null;
  }

  async speak(sessionHandle: VoiceSessionHandle, text: string): Promise<void> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      throw new Error(`Session ${sessionHandle.id} does not exist`);
    }

    // 1. Simulate brief speaking animation state (~1.0 second)
    this.updateState(session, 'speaking');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. Push turn & reset to idle
    const turn: TranscriptTurn = {
      speaker: 'agent',
      text,
      timestamp: new Date().toISOString(),
    };

    session.turns.push(turn);
    this.updateState(session, 'idle');

    // Notify transcript listeners
    session.transcriptListeners.forEach((cb) => {
      try {
        cb(turn);
      } catch (err) {
        console.error('Error in onTranscript callback for agent speak:', err);
      }
    });
  }

  stopSpeaking(_sessionHandle?: VoiceSessionHandle): void {
    // Stub implementation
  }

  async endSession(sessionHandle: VoiceSessionHandle): Promise<TranscriptTurn[]> {
    const session = this.sessions.get(sessionHandle.id);
    if (!session) {
      return [];
    }

    const finalTurns = [...session.turns];
    session.transcriptListeners.clear();
    session.stateListeners.clear();
    session.sessionEndedListeners.clear();
    this.sessions.delete(sessionHandle.id);

    return finalTurns;
  }

  async callLLM(
    _messages: Array<{ role: string; content: string }>,
    _context?: VoiceSessionContext
  ): Promise<{ parsed: any; provider: 'groq' | 'openrouter' }> {
    return {
      parsed: { reply_de: 'Hallo, danke für Ihre Antwort.', is_correct: true, detected_mistakes: [] },
      provider: 'groq',
    };
  }
}

export const stubVoiceAdapter: VoiceAdapter = new StubVoiceAdapter();
