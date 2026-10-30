import fs from 'fs';
import path from 'path';

function runChecks() {
  console.log('===============================================================');
  console.log('AUDIT & ACCEPTANCE CHECK: WHISPER PROMPT & VERBATIM DISPLAY');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
    }
  }

  // CHECK 1: Whisper Prompt in voiceAdapter.real.ts
  const vaCode = fs.readFileSync('src/services/voice/voiceAdapter.real.ts', 'utf8');
  const expectedPrompt = "This is a language learner's German speech practice attempt. It may contain grammar errors, wrong word order, incorrect case usage, or mispronunciations. Transcribe exactly what is said, including any mistakes — do not correct, normalize, or autocorrect the German toward what a fluent speaker would have said.";
  assert(vaCode.includes(expectedPrompt), 'voiceAdapter.real.ts contains the required Whisper bias-reduction prompt parameter');
  assert(/form\.append\(\s*['"]prompt['"]/.test(vaCode), 'Prompt parameter is appended to FormData sent to Groq Whisper');
  assert(vaCode.includes("rawTranscript: transcript"), 'Raw Whisper transcript is preserved on userTurn as rawTranscript');

  // CHECK 2: Learn-mode per-turn feedback in ActiveSession.tsx
  const asCode = fs.readFileSync('src/pages/speak/ActiveSession.tsx', 'utf8');
  assert(asCode.includes('You said:'), 'ActiveSession renders distinct "You said:" label');
  assert(asCode.includes('{turn.rawTranscript || turn.text}'), 'ActiveSession displays raw STT transcript directly under "You said:"');
  assert(asCode.includes('Correction:'), 'ActiveSession renders separate "Correction:" label');
  assert(asCode.includes('!turn.isCorrect && turn.correction'), 'ActiveSession shows correction only when genuine mistake exists');

  // CHECK 3: Learn-mode feedback in ActiveScenarioSession.tsx
  const ascCode = fs.readFileSync('src/pages/scenarios/ActiveScenarioSession.tsx', 'utf8');
  assert(ascCode.includes('You said:'), 'ActiveScenarioSession renders distinct "You said:" label');
  assert(ascCode.includes('{turn.rawTranscript || turn.text}'), 'ActiveScenarioSession displays raw STT transcript directly under "You said:"');
  assert(ascCode.includes('Correction:'), 'ActiveScenarioSession renders separate "Correction:" label');

  // CHECK 4: Practice-mode end-of-session recap in SessionDetailModal.tsx
  const modalCode = fs.readFileSync('src/components/SessionDetailModal.tsx', 'utf8');
  assert(modalCode.includes('You said:'), 'SessionDetailModal renders distinct "You said:" label for mistakes');
  assert(modalCode.includes('Correction:'), 'SessionDetailModal renders distinct "Correction:" label for mistakes');
  assert(modalCode.includes('rawSpoken'), 'SessionDetailModal preserves raw transcript (rawSpoken) alongside correction');
  assert(modalCode.includes('hasCorrection'), 'SessionDetailModal renders correction conditionally when correction exists');

  // CHECK 5: Session Detail transcript viewer across Speak/Scenarios/Interview in SessionDetail.tsx
  const sdCode = fs.readFileSync('src/pages/SessionDetail.tsx', 'utf8');
  assert(sdCode.includes('You said:'), 'SessionDetail renders distinct "You said:" element in diagnostic mistakes');
  assert(sdCode.includes('Correction:'), 'SessionDetail renders distinct "Correction:" element in diagnostic mistakes');
  assert(sdCode.includes('Session Transcript (Verbatim)'), 'SessionDetail has verbatim session transcript viewer');
  assert(sdCode.includes('rawText = turn.rawTranscript || turn.text'), 'SessionDetail transcript viewer reads raw transcript verbatim');

  console.log(`\n===============================================================`);
  console.log(`SUMMARY: ${passed} / ${total} CHECKS PASSED`);
  console.log(`===============================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runChecks();
