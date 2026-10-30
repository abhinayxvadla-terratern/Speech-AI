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
  console.log('║   INTERVIEW MODE LOCKING & NO MID-SESSION FEEDBACK SUITE     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 1: UI Audit for Open Interview Mode Locking
  // ─────────────────────────────────────────────────────────────
  console.log('===============================================================');
  console.log('ACCEPTANCE CHECK 1: UI Audit for Open Interview Mode Locking');
  console.log('===============================================================');

  const interviewPageSrc = fs.readFileSync('src/pages/Interview.tsx', 'utf-8');
  const activeInterviewSrc = fs.readFileSync('src/pages/interview/ActiveInterviewSession.tsx', 'utf-8');

  assert(
    interviewPageSrc.includes('isOpenInterviewSelected ? (') &&
    interviewPageSrc.includes('Start Open Interview Simulation'),
    'Open Interview setup renders dedicated single Start Practice button (no Learn/Practice toggle)'
  );

  assert(
    interviewPageSrc.includes('Start Learn Mode') &&
    interviewPageSrc.includes('Start Practice Mode'),
    'Level-wise interview setup retains both Start Learn Mode and Start Practice Mode options'
  );

  assert(
    !activeInterviewSrc.includes('Interviewer Evaluation') &&
    !activeInterviewSrc.includes('getLearnFeedback'),
    'ActiveInterviewSession has removed all mid-session evaluation boxes & helpers'
  );

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 2: Live Interview Session in Learn Mode
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 2: Live Interview Session (Learn Mode)');
  console.log('Learner says: "Ich habe gearbeitet in Krankenhaus."');
  console.log('===============================================================');

  const learnHandle = await realVoiceAdapter.startSession({
    tab: 'interview',
    mode: 'learn',
    interviewType: 'Behavioral',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    pressure_mode: 'Standard',
    cefr_level: 'B1',
  });

  let learnUserTurn = null;
  let learnAgentTurn = null;
  realVoiceAdapter.onTranscript(learnHandle, (turn) => {
    if (turn.speaker === 'user') learnUserTurn = turn;
    if (turn.speaker === 'agent') learnAgentTurn = turn;
  });

  const audioMistake = await synthesize('Ich habe gearbeitet in Krankenhaus.');
  await realVoiceAdapter.sendAudio(learnHandle, audioMistake);
  const finalLearnTurns = await realVoiceAdapter.endSession(learnHandle);

  console.log('  Live User Turn:', learnUserTurn);
  console.log('  Live Agent Interviewer Reply:\n ', learnAgentTurn?.text);

  assert(
    learnUserTurn?.correction === null || learnUserTurn?.correction === undefined,
    'Live user turn in Interview Learn mode has NO mid-session correction'
  );
  assert(
    learnUserTurn?.feedback_en === null || learnUserTurn?.feedback_en === undefined,
    'Live user turn in Interview Learn mode has NO mid-session feedback_en'
  );
  assert(
    !learnAgentTurn?.text.toLowerCase().includes('correction') &&
    !learnAgentTurn?.text.toLowerCase().includes('wrong') &&
    !learnAgentTurn?.text.toLowerCase().includes('note:'),
    'Interviewer maintains character in German without giving mid-interview grammar lessons'
  );

  // Check end-of-session diagnostic recap for Learn mode
  const learnRecap = await generateDiagnosticRecap(learnHandle.id, {
    target: { title: 'Behavioral (Standard)', description: 'Nursing behavioral interview' },
    mode: 'learn',
    turnsCount: finalLearnTurns.length,
    tab: 'interview',
  });

  console.log('  Post-session recap mistakes count:', learnRecap.mistakes.length);
  if (learnRecap.mistakes.length > 0) {
    console.log('  Captured mistake in recap:', learnRecap.mistakes[0]);
  }
  assert(
    learnRecap.mistakes.length > 0,
    'Post-session diagnostic recap successfully captured and surfaced the silently logged mistake'
  );

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 3: Live Interview Session in Practice Mode
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 3: Live Interview Session (Practice Mode)');
  console.log('Learner says: "Ich habe nicht viel Erfahrung mit diese Geräte."');
  console.log('===============================================================');

  const practiceHandle = await realVoiceAdapter.startSession({
    tab: 'interview',
    mode: 'practice',
    interviewType: 'Technical',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    pressure_mode: 'Standard',
    cefr_level: 'B2',
  });

  let practiceUserTurn = null;
  let practiceAgentTurn = null;
  realVoiceAdapter.onTranscript(practiceHandle, (turn) => {
    if (turn.speaker === 'user') practiceUserTurn = turn;
    if (turn.speaker === 'agent') practiceAgentTurn = turn;
  });

  const audioMistake2 = await synthesize('Ich habe nicht viel Erfahrung mit diese Geräte.');
  await realVoiceAdapter.sendAudio(practiceHandle, audioMistake2);
  const finalPracticeTurns = await realVoiceAdapter.endSession(practiceHandle);

  console.log('  Live User Turn:', practiceUserTurn);
  console.log('  Live Agent Interviewer Reply:\n ', practiceAgentTurn?.text);

  assert(
    practiceUserTurn?.correction === null || practiceUserTurn?.correction === undefined,
    'Live user turn in Interview Practice mode has NO mid-session correction'
  );
  assert(
    !practiceAgentTurn?.text.toLowerCase().includes('correction') &&
    !practiceAgentTurn?.text.toLowerCase().includes('note:'),
    'Interviewer maintains professional character in German with zero mid-session feedback'
  );

  const practiceRecap = await generateDiagnosticRecap(practiceHandle.id, {
    target: { title: 'Technical (Standard)', description: 'Nursing technical interview' },
    mode: 'practice',
    turnsCount: finalPracticeTurns.length,
    tab: 'interview',
  });

  console.log('  Post-session Practice recap mistakes count:', practiceRecap.mistakes.length);
  if (practiceRecap.mistakes.length > 0) {
    console.log('  Captured mistake in Practice recap:', practiceRecap.mistakes[0]);
  }
  assert(
    practiceRecap.mistakes.length > 0,
    'Post-session Practice diagnostic recap captures and surfaces mistakes'
  );

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`ALL CHECKS PASSED: ${passedTests} / ${totalTests} tests succeeded!`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
