import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
global.WebSocket = WebSocket;
globalThis.WebSocket = WebSocket;

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('GROQ_API_KEY is not defined in .env');
  process.exit(1);
}

const { realVoiceAdapter } = await import('../src/services/voice/index.ts');
const { generateDiagnosticRecap } = await import('../src/services/diagnosticService.ts');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function synthesizeAudio(text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('de-DE-KatjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on('data', (c) => chunks.push(c));
    audioStream.on('end', () => {
      tts.close();
      resolve();
    });
    audioStream.on('error', reject);
  });
  return Buffer.concat(chunks);
}

async function transcribeDirect(audioBuffer, withPrompt) {
  const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
  const form = new FormData();
  form.append('file', file);
  form.append('model', 'whisper-large-v3');
  form.append('language', 'de');
  form.append('response_format', 'json');

  if (withPrompt) {
    form.append(
      'prompt',
      "This is a language learner's German speech practice attempt. It may contain grammar errors, wrong word order, incorrect case usage, or mispronunciations. Transcribe exactly what is said, including any mistakes — do not correct, normalize, or autocorrect the German toward what a fluent speaker would have said."
    );
  }

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = await res.json();
  return data.text?.trim() || '';
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       VOICEADAPTER PART A & PART B ACCEPTANCE SUITE          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 1: Whisper transcription bias reduction
  // ─────────────────────────────────────────────────────────────
  console.log('===============================================================');
  console.log('ACCEPTANCE CHECK 1: Whisper Transcription Bias Test');
  console.log('Testing deliberately disfluent German: "Ich möchte das anmeldet"');
  console.log('===============================================================');

  const disfluentPhrase = 'Ich möchte das anmeldet';
  const audio = await synthesizeAudio(disfluentPhrase);

  const withoutPrompt = await transcribeDirect(audio, false);
  const withPrompt = await transcribeDirect(audio, true);

  console.log(`  Target text (learner speech): "${disfluentPhrase}"`);
  console.log(`  STT WITHOUT prompt:          "${withoutPrompt}"`);
  console.log(`  STT WITH prompt:             "${withPrompt}"`);

  assert(
    withPrompt.toLowerCase().includes('anmeldet'),
    'With prompt parameter: Whisper preserves "anmeldet" verbatim without auto-normalizing grammar'
  );
  assert(
    !withPrompt.includes('dass anmeldet'),
    'With prompt parameter: Whisper does NOT normalize "das" into subordinate clause "dass"'
  );

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 2 & 3: Learn-mode & Practice-mode Real Data
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 2: Learn-Mode Real Turn & Mistake Structure');
  console.log('===============================================================');

  const learnHandle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'learn',
    targetPhrase: 'Ich möchte einen Termin vereinbaren.',
    title: 'Terminvereinbarung',
    cefr_level: 'A2',
    micro_skill: 'Making an appointment',
  });

  let observedTurn = null;
  realVoiceAdapter.onTranscript(learnHandle, (turn) => {
    if (turn.speaker === 'user') {
      observedTurn = turn;
    }
  });

  // Send the deliberately incorrect speech audio
  await realVoiceAdapter.sendAudio(learnHandle, audio);
  const learnTurns = await realVoiceAdapter.endSession(learnHandle);

  assert(observedTurn !== null, 'Learn mode: user transcript turn was emitted');
  assert(
    Boolean(observedTurn?.rawTranscript),
    'Learn mode: user turn contains rawTranscript field populated directly from STT'
  );
  assert(
    observedTurn.rawTranscript.toLowerCase().includes('anmeldet'),
    `Learn mode: rawTranscript "${observedTurn.rawTranscript}" contains raw disfluent speech`
  );
  assert(
    typeof observedTurn.isCorrect === 'boolean',
    'Learn mode: user turn has isCorrect boolean evaluated by LLM'
  );

  const learnRecap = await generateDiagnosticRecap(learnHandle.id, {
    target: { title: 'Terminvereinbarung', micro_skill: 'Making an appointment' },
    mode: 'learn',
    turnsCount: learnTurns.length,
    tab: 'speak',
  });

  console.log('  Learn recap summary EN:', learnRecap.summary_text_en);
  assert(learnRecap.summary_text_de === null, 'Learn recap summary DE is null (English-only)');
  if (learnRecap.mistakes.length > 0) {
    const m = learnRecap.mistakes[0];
    assert(m.example_de === null, 'Learn recap mistake example_de is null');
    assert(Boolean(m.example_en), 'Learn recap mistake example_en holds verbatim what user said');
    assert(Boolean(m.correction_en), 'Learn recap mistake correction_en holds correction');
  }

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 3: Practice-Mode Recap & Verbatim Real Transcript
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 3: Practice-Mode Recap with Verbatim Transcript');
  console.log('===============================================================');

  const practiceHandle = await realVoiceAdapter.startSession({
    tab: 'scenarios',
    mode: 'practice',
    title: 'Bürgeramt Anmeldung',
    cefr_level: 'B1',
    scenarioType: 'Bürgeramt registration',
  });

  await realVoiceAdapter.sendAudio(practiceHandle, audio);
  const practiceTurns = await realVoiceAdapter.endSession(practiceHandle);

  const practiceRecap = await generateDiagnosticRecap(practiceHandle.id, {
    target: { title: 'Bürgeramt Anmeldung', description: 'City registration scenario' },
    mode: 'practice',
    turnsCount: practiceTurns.length,
    tab: 'scenarios',
  });

  console.log('  Practice recap summary DE:', practiceRecap.summary_text_de);
  console.log('  Practice recap summary EN:', practiceRecap.summary_text_en);
  assert(Boolean(practiceRecap.summary_text_de), 'Practice recap has German summary shown first');
  assert(Boolean(practiceRecap.summary_text_en), 'Practice recap has English summary shown beneath');

  if (practiceRecap.mistakes.length > 0) {
    const pm = practiceRecap.mistakes[0];
    assert(Boolean(pm.example_de), 'Practice recap mistake example_de holds raw user transcript');
    assert(Boolean(pm.correction_de), 'Practice recap mistake correction_de holds German correction');
    console.log(`  Practice Mistake: You said: "${pm.example_de}" | Correction: "${pm.correction_de}"`);
  }

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 4: Code Audit of UI Components
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 4: Code Audit of UI Components');
  console.log('===============================================================');

  const activeSessionSrc = fs.readFileSync('src/pages/speak/ActiveSession.tsx', 'utf-8');
  const activeScenarioSrc = fs.readFileSync('src/pages/scenarios/ActiveScenarioSession.tsx', 'utf-8');
  const activeInterviewSrc = fs.readFileSync('src/pages/interview/ActiveInterviewSession.tsx', 'utf-8');
  const sessionDetailModalSrc = fs.readFileSync('src/components/SessionDetailModal.tsx', 'utf-8');
  const sessionDetailSrc = fs.readFileSync('src/pages/SessionDetail.tsx', 'utf-8');

  // Check 4a: Learn-mode feedback card renders "You said:" and "Correction:" distinctly
  assert(
    activeSessionSrc.includes('You said:') && activeSessionSrc.includes('Correction:'),
    'ActiveSession.tsx Learn feedback card contains distinct "You said:" and "Correction:" elements'
  );
  assert(
    activeScenarioSrc.includes('You said:') && activeScenarioSrc.includes('Correction:'),
    'ActiveScenarioSession.tsx Learn feedback card contains distinct "You said:" and "Correction:" elements'
  );
  assert(
    activeInterviewSrc.includes('You said:') && activeInterviewSrc.includes('Correction:'),
    'ActiveInterviewSession.tsx Learn feedback card contains distinct "You said:" and "Correction:" elements'
  );

  // Check 4b: SessionDetailModal renders distinct "You said:" and "Correction:" elements
  assert(
    sessionDetailModalSrc.includes('You said:') && sessionDetailModalSrc.includes('Correction:'),
    'SessionDetailModal.tsx renders distinct "You said:" and "Correction:" elements'
  );

  // Check 4c: SessionDetail renders distinct "You said:" and "Correction:" elements and Verbatim Transcript
  assert(
    sessionDetailSrc.includes('You said:') && sessionDetailSrc.includes('Correction:'),
    'SessionDetail.tsx renders distinct "You said:" and "Correction:" elements'
  );
  assert(
    sessionDetailSrc.includes('Session Transcript (Verbatim)'),
    'SessionDetail.tsx contains the Verbatim Session Transcript viewer'
  );
  assert(
    sessionDetailSrc.includes('turn.rawTranscript || turn.text'),
    'SessionDetail.tsx renders turn.rawTranscript || turn.text directly and verbatim'
  );

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`ALL CHECKS PASSED: ${passedTests} / ${totalTests} tests succeeded!`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

run().catch((err) => {
  console.error('\nTest suite failed with error:', err);
  process.exit(1);
});
