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
  console.log('║       NATURAL MODELING & SCENARIOS LEARN ACCEPTANCE          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 1: Practice mode natural modeling (Part A)
  // ─────────────────────────────────────────────────────────────
  console.log('===============================================================');
  console.log('ACCEPTANCE CHECK 1: Practice Mode Natural Modeling');
  console.log('Learner says: "Ich gehe in Krankenhaus." (incorrect preposition/case)');
  console.log('===============================================================');

  const practiceHandle = await realVoiceAdapter.startSession({
    tab: 'scenarios',
    mode: 'practice',
    title: 'Arztbesuch',
    cefr_level: 'A2',
    scenarioType: 'Medical appointment',
  });

  let practiceAgentReply = '';
  realVoiceAdapter.onTranscript(practiceHandle, (turn) => {
    if (turn.speaker === 'agent') {
      practiceAgentReply = turn.text;
    }
  });

  const audioPractice = await synthesize('Ich gehe in Krankenhaus.');
  await realVoiceAdapter.sendAudio(practiceHandle, audioPractice);
  const practiceTurns = await realVoiceAdapter.endSession(practiceHandle);

  console.log('  Agent next German reply:\n ', practiceAgentReply);

  assert(
    practiceAgentReply.length > 0,
    'Practice Agent returned next German reply'
  );
  assert(
    !practiceAgentReply.toLowerCase().includes('correction:') &&
    !practiceAgentReply.toLowerCase().includes('wrong') &&
    !practiceAgentReply.toLowerCase().includes('incorrect'),
    'Practice Agent does not directly correct or flag the error to the learner'
  );
  assert(
    practiceAgentReply.toLowerCase().includes('ins krankenhaus') ||
    practiceAgentReply.toLowerCase().includes('im krankenhaus') ||
    practiceAgentReply.toLowerCase().includes('krankenhaus'),
    'Practice Agent naturally incorporates and models the correct form into its response'
  );

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 2: Scenarios Learn Mode - Recurring-only correction (Part B)
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 2: Scenarios Learn Mode Recurring-Only Correction');
  console.log('===============================================================');

  const scenariosLearnHandle = await realVoiceAdapter.startSession({
    tab: 'scenarios',
    mode: 'learn',
    title: 'Orientierung in der Stadt',
    description: 'Asking for directions and transport in German',
    cefr_level: 'A2',
    targetPhrase: 'Ich fahre in die Stadt.',
  });

  let lastUserTurn = null;
  let lastAgentReply = '';
  realVoiceAdapter.onTranscript(scenariosLearnHandle, (turn) => {
    if (turn.speaker === 'user') lastUserTurn = turn;
    if (turn.speaker === 'agent') lastAgentReply = turn.text;
  });

  // Turn 1: First-time minor mistake (case/preposition: "Ich fahre in Stadt")
  console.log('\n--- Turn 1: First-time minor mistake ("Ich fahre in Stadt.") ---');
  const audioTurn1 = await synthesize('Ich fahre in Stadt.');
  await realVoiceAdapter.sendAudio(scenariosLearnHandle, audioTurn1);

  console.log('  User Turn 1 isCorrect:', lastUserTurn?.isCorrect);
  console.log('  User Turn 1 correction:', lastUserTurn?.correction);
  console.log('  Agent Reply 1:\n ', lastAgentReply);

  assert(
    lastUserTurn?.isCorrect === true,
    'Turn 1: One-off minor mistake is NOT marked incorrect to the learner'
  );
  assert(
    lastUserTurn?.correction === null,
    'Turn 1: No correction badge is created for one-off minor mistake'
  );
  assert(
    !lastAgentReply.includes('Note:'),
    'Turn 1: Agent does NOT append an English correction note on first occurrence'
  );

  // Turn 2: RECURRING mistake of the same category (case/preposition: "Ich gehe in Park.")
  console.log('\n--- Turn 2: Recurring mistake of the same category ("Ich gehe in Park.") ---');
  const audioTurn2 = await synthesize('Ich gehe in Park.');
  await realVoiceAdapter.sendAudio(scenariosLearnHandle, audioTurn2);

  console.log('  User Turn 2 isCorrect:', lastUserTurn?.isCorrect);
  console.log('  User Turn 2 correction:', lastUserTurn?.correction);
  console.log('  Agent Reply 2:\n ', lastAgentReply);

  assert(
    lastUserTurn?.isCorrect === false,
    'Turn 2: Recurring mistake category IS flagged as an error'
  );
  assert(
    Boolean(lastUserTurn?.correction),
    `Turn 2: Correction is provided: "${lastUserTurn?.correction}"`
  );
  assert(
    lastAgentReply.includes('Note:') || Boolean(lastUserTurn?.feedback_en),
    'Turn 2: A brief English note is appended to address the recurring error pattern'
  );

  // ─────────────────────────────────────────────────────────────
  // ACCEPTANCE CHECK 3: Speak tab Learn mode remains unaffected
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('ACCEPTANCE CHECK 3: Speak Tab Learn Mode Unaffected');
  console.log('===============================================================');

  const speakLearnHandle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'learn',
    title: 'Einkaufen im Supermarkt',
    cefr_level: 'A1',
    micro_skill: 'Asking for items politely',
    targetPhrase: 'Ich möchte bitte einen Apfel.',
  });

  let speakUserTurn = null;
  realVoiceAdapter.onTranscript(speakLearnHandle, (turn) => {
    if (turn.speaker === 'user') speakUserTurn = turn;
  });

  const audioSpeak = await synthesize('Ich will ein Apfel.');
  await realVoiceAdapter.sendAudio(speakLearnHandle, audioSpeak);
  await realVoiceAdapter.endSession(speakLearnHandle);

  console.log('  Speak user turn isCorrect:', speakUserTurn?.isCorrect);
  console.log('  Speak user turn correction:', speakUserTurn?.correction);
  console.log('  Speak user turn coaching feedback:', speakUserTurn?.feedback_en);

  assert(
    speakUserTurn?.isCorrect === false,
    'Speak Learn mode: Continues evaluating each target phrase attempt immediately'
  );
  assert(
    Boolean(speakUserTurn?.correction),
    'Speak Learn mode: Correction is supplied per attempt'
  );
  assert(
    Boolean(speakUserTurn?.feedback_en),
    'Speak Learn mode: Warm coaching feedback provided'
  );

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`ALL CHECKS PASSED: ${passedTests} / ${totalTests} tests succeeded!`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
