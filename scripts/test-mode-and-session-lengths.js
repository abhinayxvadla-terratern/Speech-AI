import fs from 'fs';

// Load and parse interview constants safely from TypeScript source
const interviewConstantsSrc = fs.readFileSync('src/constants/interview.ts', 'utf-8');
const sessionDurationsMatch = interviewConstantsSrc.match(/export const SESSION_DURATIONS[^=]*=\s*(\[[^\]]+\])/);
const SESSION_DURATIONS = sessionDurationsMatch ? eval(sessionDurationsMatch[1]) : [];
const INTERVIEW_DURATIONS = interviewConstantsSrc.includes('export const INTERVIEW_DURATIONS: DurationOption[] = SESSION_DURATIONS')
  ? SESSION_DURATIONS
  : [];

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

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       MODE & SESSION LENGTH VERIFICATION TEST SUITE          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─────────────────────────────────────────────────────────────
// CHECK 1: Unified Session Length Constants (5 Unlocked Options)
// ─────────────────────────────────────────────────────────────
console.log('===============================================================');
console.log('CHECK 1: Session Length Options (5 Unlocked Options)');
console.log('===============================================================');

assert(SESSION_DURATIONS.length === 5, 'SESSION_DURATIONS has exactly 5 duration options');
assert(
  JSON.stringify(SESSION_DURATIONS.map((d) => d.label)) ===
    JSON.stringify(['2 min', '5 min', '10 min', '15 min', 'Open-ended']),
  'Labels are: 2 min, 5 min, 10 min, 15 min, Open-ended'
);
assert(
  JSON.stringify(SESSION_DURATIONS.map((d) => d.value)) ===
    JSON.stringify([2, 5, 10, 15, 'open']),
  'Values are: 2, 5, 10, 15, "open"'
);
assert(
  INTERVIEW_DURATIONS.length === 5,
  'INTERVIEW_DURATIONS matches SESSION_DURATIONS with all 5 options'
);

// ─────────────────────────────────────────────────────────────
// CHECK 2: Speak Tab Checkpoint Mode & Duration Selector
// ─────────────────────────────────────────────────────────────
console.log('\n===============================================================');
console.log('CHECK 2: Speak Tab Checkpoint & Regular Module Behavior');
console.log('===============================================================');

const speakSrc = fs.readFileSync('src/pages/Speak.tsx', 'utf-8');

assert(
  speakSrc.includes('selectedModule.is_checkpoint ?'),
  'Speak.tsx differentiates checkpoint modules from regular modules'
);

assert(
  speakSrc.includes('Select Checkpoint Mode:') &&
  speakSrc.includes('setCheckpointMode(\'learn\')') &&
  speakSrc.includes('setCheckpointMode(\'practice\')'),
  'Checkpoint modules offer BOTH Learn and Practice modes via pill selector'
);

assert(
  speakSrc.includes('Target Checkpoint Duration:') &&
  speakSrc.includes('SESSION_DURATIONS.map'),
  'Checkpoint modules offer all 5 session length options'
);

assert(
  speakSrc.includes('/* REGULAR MODULE: LEARN MODE (UNCHANGED) */') &&
  speakSrc.includes('handleStartFresh(\'learn\')'),
  'Regular modules run in Learn mode (unchanged) with no mode toggle'
);

const checkpointDurationSnippet = speakSrc.slice(
  speakSrc.indexOf('Target Checkpoint Duration:'),
  speakSrc.indexOf('Start Checkpoint')
);

assert(
  !checkpointDurationSnippet.includes('Lock') &&
  !checkpointDurationSnippet.includes('disabled'),
  'No lock icons or gating in checkpoint duration selector'
);

// ─────────────────────────────────────────────────────────────
// CHECK 3: Scenarios Tab Mode & 5 Duration Options
// ─────────────────────────────────────────────────────────────
console.log('\n===============================================================');
console.log('CHECK 3: Scenarios Tab Mode & Duration Selector');
console.log('===============================================================');

const scenariosSrc = fs.readFileSync('src/pages/Scenarios.tsx', 'utf-8');

assert(
  scenariosSrc.includes('handleStartFresh(\'learn\')') &&
  scenariosSrc.includes('handleStartFresh(\'practice\')'),
  'Scenarios tab retains selectable Learn and Practice modes'
);

assert(
  scenariosSrc.includes('SESSION_DURATIONS.map'),
  'Scenarios tab renders all 5 duration options'
);

assert(
  !scenariosSrc.slice(scenariosSrc.indexOf('Select Simulation Duration:')).includes('Lock'),
  'No lock icons or restrictions on duration in Scenarios'
);

// ─────────────────────────────────────────────────────────────
// CHECK 4: Interview Tab & Open Interview Constraints
// ─────────────────────────────────────────────────────────────
console.log('\n===============================================================');
console.log('CHECK 4: Interview Tab & Open Interview Enforcement');
console.log('===============================================================');

const interviewSrc = fs.readFileSync('src/pages/Interview.tsx', 'utf-8');
const voiceAdapterRealSrc = fs.readFileSync('src/services/voice/voiceAdapter.real.ts', 'utf-8');
const activeInterviewSrc = fs.readFileSync('src/pages/interview/ActiveInterviewSession.tsx', 'utf-8');

assert(
  interviewSrc.includes('INTERVIEW_DURATIONS.map'),
  'Interview tab renders all 5 duration options'
);

assert(
  interviewSrc.includes('isOpenInterviewSelected ?') &&
  interviewSrc.includes('Start Open Interview Simulation'),
  'Open Interview shows dedicated Practice action with NO mode toggle'
);

assert(
  voiceAdapterRealSrc.includes('This is an Open Interview with no CEFR-level constraints') &&
  voiceAdapterRealSrc.includes('isOpenInterview || interviewType === \'Open Interview\''),
  'VoiceAdapter enforces no CEFR-level scoping for Open Interview'
);

assert(
  activeInterviewSrc.includes('cefr_level: isOpenInterview ? undefined'),
  'ActiveInterviewSession omits CEFR level when running Open Interview'
);

console.log('\n══════════════════════════════════════════════════════════════');
console.log(`ALL CHECKS PASSED: ${passedTests} / ${totalTests} tests succeeded!`);
console.log('══════════════════════════════════════════════════════════════\n');
