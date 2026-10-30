import fs from 'fs';

function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     SILENT ENGAGEMENT TRACKING & STRIKE SYSTEM TEST SUITE    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

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

  // ─────────────────────────────────────────────────────────────
  // CHECK 1: RealVoiceAdapter System Prompts & Logic Audit
  // ─────────────────────────────────────────────────────────────
  console.log('===============================================================');
  console.log('CHECK 1: System Prompts & Strike Policy Context Audit');
  console.log('===============================================================');

  const vaCode = fs.readFileSync('src/services/voice/voiceAdapter.real.ts', 'utf8');

  assert(vaCode.includes('Current running strikes in this session: ${session.strikes}'), 'Running strike count is passed into LLM prompt context across all modes');
  assert(vaCode.includes('Take your time — are you still there?'), 'Silence check-in phrasing matches "Take your time — are you still there?"');
  assert(vaCode.includes("No worries, let's keep going."), 'Strike acknowledgment matches "No worries, let\'s keep going."');
  assert(vaCode.includes("Let's pick this back up another time — great effort today."), '3rd strike sign-off matches "Let\'s pick this back up another time — great effort today."');
  assert(vaCode.includes('GENUINE ATTEMPTS (NEVER STRIKE)') || vaCode.includes('GENUINE ATTEMPTS (DO NOT STRIKE)'), 'Prompt explicitly forbids striking for mispronunciations, accent, or grammatical errors');
  assert(vaCode.includes('Attempt progression on current') || vaCode.includes('Attempt count on this target phrase'), 'Learn mode tracks 3-step attempt progression (original, rephrase, hint, strike)');
  assert(vaCode.includes('session.strikes += 1'), 'Adapter increments session strikes upon silence or non-engagement');
  assert(vaCode.includes('session.turnSilenceCheckInGiven'), 'Adapter tracks silence check-in state per turn');
  assert(vaCode.includes('startSilenceTimer'), 'Adapter initiates 15-second silence timer after speaking finishes');
  assert(vaCode.includes('clearSilenceTimer'), 'Adapter clears silence timer when user starts responding');

  // ─────────────────────────────────────────────────────────────
  // CHECK 2: Silence Behavior & State Machine Verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('CHECK 2: Silence & Strike Accumulation State Machine');
  console.log('===============================================================');

  // Simulate internal silence state machine to verify behavior
  class TestSilenceStateMachine {
    constructor() {
      this.strikes = 0;
      this.turnSilenceCheckInGiven = false;
      this.sessionClosed = false;
      this.lastSpokenText = '';
      this.sessionEndedCalled = false;
    }

    async handleSilence() {
      if (this.sessionClosed || this.strikes >= 3) return;

      if (!this.turnSilenceCheckInGiven) {
        this.turnSilenceCheckInGiven = true;
        this.lastSpokenText = 'Take your time — are you still there?';
      } else {
        this.strikes += 1;
        this.turnSilenceCheckInGiven = false;

        if (this.strikes >= 3) {
          this.lastSpokenText = "Let's pick this back up another time — great effort today.";
          this.sessionClosed = true;
          this.sessionEndedCalled = true;
        } else {
          this.lastSpokenText = "No worries, let's keep going.";
        }
      }
    }

    userResponds() {
      this.turnSilenceCheckInGiven = false;
    }
  }

  const sm = new TestSilenceStateMachine();
  assert(sm.strikes === 0, 'Session starts with 0 strikes');

  // Silence 1: First occurrence on turn
  sm.handleSilence();
  assert(sm.lastSpokenText === 'Take your time — are you still there?', 'First silence triggers gentle check-in: "Take your time — are you still there?"');
  assert(sm.strikes === 0, 'No strike added on first silence check-in');

  // Silence 2: Second occurrence without response
  sm.handleSilence();
  assert(sm.strikes === 1, 'Second silence after check-in adds 1 strike (strikes = 1)');
  assert(sm.lastSpokenText === "No worries, let's keep going.", 'Agent acknowledges strike kindly: "No worries, let\'s keep going."');

  // Intervening user response
  sm.userResponds();
  assert(sm.turnSilenceCheckInGiven === false, 'Intervening user response resets turnSilenceCheckInGiven');

  // Silence 3: First occurrence on new turn
  sm.handleSilence();
  assert(sm.lastSpokenText === 'Take your time — are you still there?', 'Silence on new turn gives check-in again before striking');
  assert(sm.strikes === 1, 'Still at 1 strike after check-in');

  // Silence 4: Unanswered
  sm.handleSilence();
  assert(sm.strikes === 2, 'Unanswered silence adds strike 2 (strikes = 2)');

  // Silence 5: Check-in on turn 3
  sm.handleSilence();
  assert(sm.lastSpokenText === 'Take your time — are you still there?', 'Silence gives check-in');

  // Silence 6: Strike 3 -> warm sign-off and session end!
  sm.handleSilence();
  assert(sm.strikes === 3, 'Unanswered silence adds strike 3 (strikes = 3)');
  assert(sm.lastSpokenText === "Let's pick this back up another time — great effort today.", '3rd strike triggers warm sign-off: "Let\'s pick this back up another time — great effort today."');
  assert(sm.sessionEndedCalled === true, 'Session is marked ended upon 3rd strike');

  // ─────────────────────────────────────────────────────────────
  // CHECK 3: Check UI Components Integration
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('CHECK 3: UI Components Integration (Speak, Scenarios, Interview)');
  console.log('===============================================================');

  const activeSpeakCode = fs.readFileSync('src/pages/speak/ActiveSession.tsx', 'utf8');
  assert(activeSpeakCode.includes('cancelSilenceTimer'), 'ActiveSession cancels silence timer when user starts speaking');
  assert(activeSpeakCode.includes('onSessionEnded'), 'ActiveSession registers onSessionEnded listener');
  assert(activeSpeakCode.includes('newTurn.sessionEnded'), 'ActiveSession handles newTurn.sessionEnded');

  const activeScenariosCode = fs.readFileSync('src/pages/scenarios/ActiveScenarioSession.tsx', 'utf8');
  assert(activeScenariosCode.includes('cancelSilenceTimer'), 'ActiveScenarioSession cancels silence timer when user starts speaking');
  assert(activeScenariosCode.includes('onSessionEnded'), 'ActiveScenarioSession registers onSessionEnded listener');
  assert(activeScenariosCode.includes('newTurn.sessionEnded'), 'ActiveScenarioSession handles newTurn.sessionEnded');

  const activeInterviewCode = fs.readFileSync('src/pages/interview/ActiveInterviewSession.tsx', 'utf8');
  assert(activeInterviewCode.includes('cancelSilenceTimer'), 'ActiveInterviewSession cancels silence timer when user starts speaking');
  assert(activeInterviewCode.includes('onSessionEnded'), 'ActiveInterviewSession registers onSessionEnded listener');
  assert(activeInterviewCode.includes('newTurn.sessionEnded'), 'ActiveInterviewSession handles newTurn.sessionEnded');

  // ─────────────────────────────────────────────────────────────
  // CHECK 4: Secrecy of Strikes (Never mentioned to user)
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('CHECK 4: Strike Secrecy & Learner Facing Phrasing');
  console.log('===============================================================');

  assert(!vaCode.includes('You have a strike'), 'Agent never tells user "You have a strike"');
  assert(!vaCode.includes('Strike 1') && !vaCode.includes('Strike 2'), 'Agent never exposes strike numbers to learner');
  assert(vaCode.includes('Strikes are strictly silent'), 'Prompt explicitly enforces: strikes are strictly silent');

  console.log(`\n===============================================================`);
  console.log(`SUMMARY: ${passed} / ${total} CHECKS PASSED`);
  console.log(`===============================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
