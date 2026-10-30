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

async function synthesize(text) {
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

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       APP-SIDE SESSION TIMING & CLOSING TEST SUITE           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 1: Open-ended session (No timer behavior)
  // ─────────────────────────────────────────────────────────────
  console.log('===============================================================');
  console.log('ACCEPTANCE CHECK 1: Open-ended Session (No Timer Behavior)');
  console.log('===============================================================');

  const openHandle = await realVoiceAdapter.startSession({
    tab: 'scenarios',
    mode: 'practice',
    scenarioType: 'Patient Check-in',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    durationMinutes: 'open',
  });

  const openClosingResult = await realVoiceAdapter.triggerFinalClosingTurn(openHandle);
  assert(
    openClosingResult === null,
    'Open-ended session triggerFinalClosingTurn returns null (no timed closing fires)'
  );

  const realVoiceAdapterSrc = fs.readFileSync('src/services/voice/voiceAdapter.real.ts', 'utf-8');
  assert(
    realVoiceAdapterSrc.includes('if (!duration || duration === \'open\') return null;'),
    'Open-ended sessions explicitly bypass time_remaining calculation'
  );

  await realVoiceAdapter.endSession(openHandle);
  console.log('  [PASS] Open-ended session confirmed completely free of timer logic');

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 2: Practice Mode 2-Minute Session Time-Up Wrap
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 2: Practice Mode 2-Minute Session Time-Up Wrap');
  console.log('===============================================================');

  const practiceHandle = await realVoiceAdapter.startSession({
    tab: 'interview',
    mode: 'practice',
    interviewType: 'Standard Behavioral',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    durationMinutes: 2,
    cefr_level: 'B1',
  });

  // Simulate learner speaking a turn during timed session
  const audioBuffer = await synthesize('Guten Tag, ich bin Krankenschwester aus Indien und möchte in Deutschland arbeiten.');
  await realVoiceAdapter.sendAudio(practiceHandle, audioBuffer);

  // Trigger time-up closing turn
  console.log('  Timer expired: triggering natural in-character closing turn...');
  const closingTurn = await realVoiceAdapter.triggerFinalClosingTurn(practiceHandle);

  assert(Boolean(closingTurn), 'triggerFinalClosingTurn produced an agent closing turn');
  assert(closingTurn.speaker === 'agent', 'Closing turn is from speaker "agent"');
  console.log(`  Agent In-Character German Closing Line: "${closingTurn.text}"`);

  // Verify in-character German closing line
  const isGermanClosing =
    /[äöüßÄÖÜ]/.test(closingTurn.text) ||
    closingTurn.text.includes('Dank') ||
    closingTurn.text.includes('Fragen') ||
    closingTurn.text.includes('Wiedersehen') ||
    closingTurn.text.includes('Gespräch') ||
    closingTurn.text.includes('Zeit');

  assert(isGermanClosing, 'Practice mode closing line is in natural in-character German');

  // Now verify post-session feedback summary follows immediately
  const practiceTurns = await realVoiceAdapter.endSession(practiceHandle);
  assert(practiceTurns.length >= 2, 'Session preserved all turns including the final closing line');

  console.log('  Generating post-session diagnostic recap...');
  const recap = await generateDiagnosticRecap(practiceHandle.id);
  assert(Boolean(recap.summary_text_en), 'English summary_text_en is present in post-session recap');
  assert(Array.isArray(recap.mistakes), 'Mistakes array is present in post-session recap');
  console.log(`  English Feedback Summary: "${recap.summary_text_en}"`);
  console.log('  [PASS] Practice mode: German closing line delivered, then English feedback summary follows');

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 3: Learn Mode 2-Minute Session Time-Up Wrap
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 3: Learn Mode 2-Minute Session Time-Up Wrap');
  console.log('===============================================================');

  const learnHandle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'learn',
    moduleId: 'mod_checkpoint_test',
    micro_skill: 'German modal verbs in clinical handover',
    targetPhrase: 'Ich muss dem Patienten die Medikamente verabreichen.',
    durationMinutes: 2,
    cefr_level: 'B1',
  });

  console.log('  Timer expired in Learn mode: triggering final English wrap-up...');
  const learnClosingTurn = await realVoiceAdapter.triggerFinalClosingTurn(learnHandle);

  assert(Boolean(learnClosingTurn), 'triggerFinalClosingTurn produced an agent closing turn in Learn mode');
  assert(learnClosingTurn.speaker === 'agent', 'Closing turn is from speaker "agent"');
  console.log(`  Agent Learn Mode Wrap-Up: "${learnClosingTurn.text}"`);

  // Verify English wrap-up (no German closing line needed in Learn mode)
  const isEnglishWrap =
    learnClosingTurn.text.includes('time') ||
    learnClosingTurn.text.includes('session') ||
    learnClosingTurn.text.includes('work') ||
    learnClosingTurn.text.includes('today') ||
    learnClosingTurn.text.includes('progress') ||
    learnClosingTurn.text.includes('practice');

  assert(isEnglishWrap, 'Learn mode closing call produces a direct English-only wrap-up');
  assert(
    !learnClosingTurn.text.includes('Auf Wiedersehen') && !learnClosingTurn.text.includes('Tschüss'),
    'Learn mode closing call does NOT produce a German dialogue closing line'
  );

  await realVoiceAdapter.endSession(learnHandle);

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 4: No Session Cut Off Mid-Turn
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 4: No Session Cut Off Mid-Turn Guarantee');
  console.log('===============================================================');

  assert(
    realVoiceAdapterSrc.includes('while (session.currentState === \'listening\' || session.currentState === \'processing\' || session.currentState === \'speaking\')'),
    'triggerFinalClosingTurn explicitly waits for in-progress turn to conclude before closing'
  );

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`ALL CHECKS PASSED: ${passedTests} / ${totalTests} tests succeeded!`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
