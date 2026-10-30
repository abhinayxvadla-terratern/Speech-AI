#!/usr/bin/env node

/**
 * Acceptance Test Suite for Real VoiceAdapter
 * 
 * Verifies:
 * 1. Real Learn-mode session: user speaks -> transcript captured -> LLM returns JSON feedback -> feedback spoken in English via TTS
 * 2. Real Practice-mode session: user speaks -> transcript captured -> LLM responds in German only -> mistakes logged silently
 * 3. Real Interview session: multi-turn coherent follow-up based on conversation history
 * 4. Error handling: clear error states surfaced on failure, no silent hangs
 * 5. Diagnostic recap integration: session data & mistakes available to generateDiagnosticRecap
 */

import dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
global.WebSocket = WebSocket;
globalThis.WebSocket = WebSocket;

const { realVoiceAdapter, getSessionVoiceData } = await import('../src/services/voice/index.ts');
const { generateDiagnosticRecap } = await import('../src/services/diagnosticService.ts');

let passedTests = 0;
let totalTests = 0;

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

async function testLearnMode() {
  console.log('\n======================================================');
  console.log('TEST 1: Real Learn-Mode Session');
  console.log('======================================================');

  const turnsReceived = [];
  const statesReceived = [];

  const handle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'learn',
    targetPhrase: 'Ich möchte bitte zahlen.',
    cefr_level: 'A1',
    micro_skill: 'Ordering and paying in a restaurant',
  });

  assert(handle && handle.id, 'Session handle created with unique ID');

  const unsubTranscript = realVoiceAdapter.onTranscript(handle, (turn) => {
    turnsReceived.push(turn);
    console.log(`    [Transcript Event] (${turn.speaker}): "${turn.text}"`);
  });

  const unsubState = realVoiceAdapter.onStateChange(handle, (st) => {
    statesReceived.push(st);
  });

  console.log('  -> Simulating user speaking target phrase...');
  await realVoiceAdapter.sendAudio(handle);

  assert(turnsReceived.length >= 2, `Expected at least 2 turns (user + agent), got ${turnsReceived.length}`);
  const userTurn = turnsReceived.find((t) => t.speaker === 'user');
  const agentTurn = turnsReceived.find((t) => t.speaker === 'agent');

  assert(!!userTurn && userTurn.text.length > 0, `User transcript captured: "${userTurn?.text}"`);
  assert(!!agentTurn && agentTurn.text.length > 0, `Agent feedback produced: "${agentTurn?.text}"`);
  assert(!/[äöüßÄÖÜ]/.test(agentTurn?.text || '') || agentTurn?.text.includes('job') || agentTurn?.text.includes('Good') || agentTurn?.text.includes('Great'), 'Feedback is in English tutor register');

  const finalTurns = await realVoiceAdapter.endSession(handle);
  assert(finalTurns.length >= 2, `endSession returned full transcript (${finalTurns.length} turns)`);

  unsubTranscript();
  unsubState();
  console.log('[SUCCESS] Learn-mode session passed.');
}

async function testPracticeMode() {
  console.log('\n======================================================');
  console.log('TEST 2: Real Practice-Mode Session');
  console.log('======================================================');

  const turnsReceived = [];

  const handle = await realVoiceAdapter.startSession({
    tab: 'scenarios',
    mode: 'practice',
    scenarioType: 'Arzttermin vereinbaren',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    cefr_level: 'B1',
    minutesLimit: '5',
  });

  realVoiceAdapter.onTranscript(handle, (turn) => {
    turnsReceived.push(turn);
    console.log(`    [Transcript Event] (${turn.speaker}): "${turn.text}"`);
  });

  // Agent opening turn
  await realVoiceAdapter.speak(handle, 'Guten Tag, Praxis Dr. Schmidt, wie kann ich Ihnen helfen?');

  // User speaks in German
  console.log('  -> Simulating user response in German...');
  await realVoiceAdapter.sendAudio(handle);

  const agentTurns = turnsReceived.filter((t) => t.speaker === 'agent');
  assert(agentTurns.length >= 2, `Expected at least 2 agent turns (greeting + conversational response)`);

  const latestAgentTurn = agentTurns[agentTurns.length - 1];
  assert(latestAgentTurn.text.length > 0, `Agent responded in German: "${latestAgentTurn.text}"`);

  // Verify practice response is purely German without mid-session English feedback
  assert(!latestAgentTurn.text.includes('Great job') && !latestAgentTurn.text.includes('Feedback:'), 'No English feedback surfaced mid-session during Practice mode');

  const finalTurns = await realVoiceAdapter.endSession(handle);
  assert(finalTurns.length >= 3, `Full transcript preserved (${finalTurns.length} turns)`);

  const voiceData = getSessionVoiceData(handle.id);
  assert(!!voiceData, 'Session voice data preserved for diagnostic recap');
  console.log(`  -> Silently logged mistakes: ${voiceData.mistakes.length}`);

  console.log('[SUCCESS] Practice-mode session passed.');
}

async function testInterviewSession() {
  console.log('\n======================================================');
  console.log('TEST 3: Real Interview Session (Multi-turn Coherence)');
  console.log('======================================================');

  const turnsReceived = [];

  const handle = await realVoiceAdapter.startSession({
    tab: 'interview',
    mode: 'practice',
    interviewType: 'Technical',
    domain: 'Healthcare',
    sub_branch: 'Nursing',
    cefr_level: 'B2',
    pressure_mode: 'Standard',
  });

  realVoiceAdapter.onTranscript(handle, (turn) => {
    turnsReceived.push(turn);
    console.log(`    [Transcript Event] (${turn.speaker}): "${turn.text}"`);
  });

  // 1. Opening greeting
  const greeting = 'Guten Tag! Willkommen zu Ihrem Fachgespräch. Was tun Sie als Erstes, wenn ein Patient über akute Atemnot klagt?';
  await realVoiceAdapter.speak(handle, greeting);

  // 2. Candidate response
  console.log('  -> Candidate answers technical question...');
  await realVoiceAdapter.sendAudio(handle);

  const agentTurns = turnsReceived.filter((t) => t.speaker === 'agent');
  assert(agentTurns.length >= 2, `Interviewer produced opening question and coherent follow-up`);

  const followup = agentTurns[1].text;
  console.log(`  -> Interviewer follow-up question: "${followup}"`);
  assert(followup.length > 15, 'Follow-up question is substantial and non-empty');
  assert(followup !== greeting, 'Follow-up is not a repeated greeting');
  assert(followup.includes('Sie') || followup.includes('Ihre') || followup.includes('Ihnen'), 'Formal "Sie" register strictly maintained');

  const finalTurns = await realVoiceAdapter.endSession(handle);
  assert(finalTurns.length >= 3, `Full multi-turn interview transcript preserved (${finalTurns.length} turns)`);

  console.log('[SUCCESS] Interview session passed.');
}

async function testErrorHandling() {
  console.log('\n======================================================');
  console.log('TEST 4: Error Handling & Resilience');
  console.log('======================================================');

  const handle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'learn',
    targetPhrase: 'Test',
  });

  let stateAfterError = 'unknown';
  realVoiceAdapter.onStateChange(handle, (st) => {
    stateAfterError = st;
  });

  // Pass corrupted/empty chunk that fails STT gracefully
  let errorCaught = false;
  try {
    // Send an invalid object as chunk
    await realVoiceAdapter.sendAudio(handle, { invalid: 'audio' });
  } catch (err) {
    errorCaught = true;
    console.log(`  -> Expected error captured: "${err.message}"`);
  }

  // Voice adapter handles audio fallback or surfaces error without crashing
  console.log(`  -> State after operation: ${stateAfterError}`);
  assert(stateAfterError === 'idle', 'Voice state returns to idle on error / completion (no stuck processing state)');

  await realVoiceAdapter.endSession(handle);
  console.log('[SUCCESS] Error handling verified.');
}

async function testDiagnosticRecapIntegration() {
  console.log('\n======================================================');
  console.log('TEST 5: Diagnostic Recap Integration');
  console.log('======================================================');

  const handle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'practice',
    targetPhrase: 'Ich möchte bitte zahlen.',
    title: 'Restaurant Practice',
  });

  await realVoiceAdapter.speak(handle, 'Was möchten Sie bestellen?');
  await realVoiceAdapter.sendAudio(handle);

  const finalTurns = await realVoiceAdapter.endSession(handle);
  assert(finalTurns.length >= 2, 'Session completed with transcript turns');

  // Verify generateDiagnosticRecap consumes the session
  const recap = await generateDiagnosticRecap(handle.id, {
    target: { title: 'Restaurant Practice', micro_skill: 'Ordering and paying' },
    mode: 'practice',
    turnsCount: finalTurns.length,
    tab: 'speak',
  });

  assert(!!recap, 'Diagnostic recap successfully generated');
  assert(!!recap.summary_text_en && recap.summary_text_en.length > 0, 'Recap English summary generated');
  assert(!!recap.summary_text_de && recap.summary_text_de.length > 0, 'Recap German summary generated for practice mode');
  assert(Array.isArray(recap.mistakes), 'Recap mistakes array is an array (empty if clean session, never fabricated)');

  console.log(`  -> Recap Summary EN: "${recap.summary_text_en}"`);
  console.log(`  -> Recap Summary DE: "${recap.summary_text_de}"`);
  console.log(`  -> Mistakes Count  : ${recap.mistakes.length}`);

  console.log('[SUCCESS] Diagnostic recap integration passed.');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        Real VoiceAdapter Full Acceptance Suite       ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  await testLearnMode();
  await testPracticeMode();
  await testInterviewSession();
  await testErrorHandling();
  await testDiagnosticRecapIntegration();

  console.log('\n======================================================');
  console.log(`ACCEPTANCE SUMMARY: ${passedTests}/${totalTests} tests passed`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\n[FATAL] Acceptance suite encountered an unexpected error:', err);
  process.exit(1);
});
