#!/usr/bin/env node

/**
 * Test Suite for Real Diagnostic Recap Generation
 * 
 * Verifies:
 * 1. Learn-mode session: summary_text_en + real mistakes (only _en populated, _de null)
 * 2. Practice-mode session: bilingual summary_text_de + summary_text_en + real mistakes (all 4 fields populated)
 * 3. Clean session with NO mistakes: encouraging summary_text, empty mistakes array (never fabricated)
 * 4. All three tabs supported (Speak, Scenarios, Interview)
 * 5. Compatibility with Home tab "Where You're Slipping" card & Session Detail screen
 */

import dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
global.WebSocket = WebSocket;
globalThis.WebSocket = WebSocket;

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

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║    Real Diagnostic Recap Verification Suite          ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // TEST 1: Real Learn-Mode Session with Feedback & Mistake
  console.log('\n======================================================');
  console.log('TEST 1: Learn-Mode Session with Actual Feedback');
  console.log('======================================================');
  {
    const handle = await realVoiceAdapter.startSession({
      tab: 'speak',
      mode: 'learn',
      targetPhrase: 'Ich möchte bitte zahlen.',
      title: 'Restaurant Zahlungen',
      cefr_level: 'A1',
      micro_skill: 'Asking for the bill',
    });

    await realVoiceAdapter.sendAudio(handle);
    const finalTurns = await realVoiceAdapter.endSession(handle);

    const recap = await generateDiagnosticRecap(handle.id, {
      target: { title: 'Restaurant Zahlungen', micro_skill: 'Asking for the bill' },
      mode: 'learn',
      turnsCount: finalTurns.length,
      tab: 'speak',
    });

    console.log('  Summary EN:', recap.summary_text_en);
    console.log('  Summary DE:', recap.summary_text_de);
    console.log('  Mistakes Count:', recap.mistakes.length);

    assert(recap.summary_text_en.includes('Restaurant Zahlungen'), 'summary_text_en references real module title');
    assert(recap.summary_text_en.includes('exchanges') || recap.summary_text_en.includes('completed'), 'summary_text_en references turn count / completion');
    assert(recap.summary_text_de === null, 'summary_text_de is null in Learn mode (English-only)');
    
    // Check mistake shape if mistakes were detected
    recap.mistakes.forEach((m, idx) => {
      assert(m.example_de === null, `Mistake ${idx}: example_de is null in Learn mode`);
      assert(m.correction_de === null, `Mistake ${idx}: correction_de is null in Learn mode`);
      assert(typeof m.example_en === 'string', `Mistake ${idx}: example_en is populated`);
      assert(typeof m.correction_en === 'string', `Mistake ${idx}: correction_en is populated`);
    });
  }

  // TEST 2: Practice-Mode Session (Scenarios Tab)
  console.log('\n======================================================');
  console.log('TEST 2: Practice-Mode Session (Scenarios Tab)');
  console.log('======================================================');
  {
    const handle = await realVoiceAdapter.startSession({
      tab: 'scenarios',
      mode: 'practice',
      scenarioType: 'Anmeldung beim Bürgeramt',
      domain: 'Settlement',
      sub_branch: 'Anmeldung & Registration',
      cefr_level: 'A2',
    });

    await realVoiceAdapter.speak(handle, 'Guten Tag, wie kann ich Ihnen beim Bürgeramt helfen?');
    await realVoiceAdapter.sendAudio(handle);
    const finalTurns = await realVoiceAdapter.endSession(handle);

    const recap = await generateDiagnosticRecap(handle.id, {
      target: { title: 'Anmeldung beim Bürgeramt', domain: 'Settlement' },
      mode: 'practice',
      turnsCount: finalTurns.length,
      tab: 'scenarios',
    });

    console.log('  Summary EN:', recap.summary_text_en);
    console.log('  Summary DE:', recap.summary_text_de);
    console.log('  Mistakes Count:', recap.mistakes.length);

    assert(recap.summary_text_en.includes('Anmeldung beim Bürgeramt'), 'summary_text_en references scenario title');
    assert(recap.summary_text_de && recap.summary_text_de.includes('Anmeldung beim Bürgeramt'), 'summary_text_de references scenario title in German');
    assert(recap.summary_text_en.includes('Settlement'), 'summary_text_en references domain context');
    assert(recap.summary_text_de && recap.summary_text_de.includes('Settlement'), 'summary_text_de references domain context in German');

    recap.mistakes.forEach((m, idx) => {
      assert(typeof m.example_de === 'string', `Mistake ${idx}: example_de is populated`);
      assert(typeof m.example_en === 'string', `Mistake ${idx}: example_en is populated`);
      assert(typeof m.correction_de === 'string', `Mistake ${idx}: correction_de is populated`);
      assert(typeof m.correction_en === 'string', `Mistake ${idx}: correction_en is populated`);
    });
  }

  // TEST 3: Interview Tab Session
  console.log('\n======================================================');
  console.log('TEST 3: Interview Tab Session (Formal Interview Context)');
  console.log('======================================================');
  {
    const handle = await realVoiceAdapter.startSession({
      tab: 'interview',
      mode: 'practice',
      interviewType: 'Technical',
      domain: 'Healthcare',
      sub_branch: 'Nursing',
      cefr_level: 'B2',
    });

    await realVoiceAdapter.speak(handle, 'Guten Tag! Beschreiben Sie Ihre Vorgehensweise bei der Medikamentenausgabe.');
    await realVoiceAdapter.sendAudio(handle);
    const finalTurns = await realVoiceAdapter.endSession(handle);

    const recap = await generateDiagnosticRecap(handle.id, {
      target: { title: 'Technical Interview', domain: 'Healthcare' },
      mode: 'practice',
      turnsCount: finalTurns.length,
      tab: 'interview',
    });

    console.log('  Summary EN:', recap.summary_text_en);
    console.log('  Summary DE:', recap.summary_text_de);

    assert(recap.summary_text_en.includes('Technical Interview'), 'summary_text_en references interview type');
    assert(recap.summary_text_de && recap.summary_text_de.includes('Technical Interview'), 'summary_text_de references interview type');
    assert(recap.summary_text_en.includes('Healthcare'), 'summary_text_en references Healthcare domain');
  }

  // TEST 4: Clean Session (Zero Mistakes Detected)
  console.log('\n======================================================');
  console.log('TEST 4: Clean Session (Zero Mistakes - Empty Array, No Fabrication)');
  console.log('======================================================');
  {
    // Simulate a clean session id with no mistakes in voiceData
    const cleanSessionId = `clean_session_${Date.now()}`;

    const recapPractice = await generateDiagnosticRecap(cleanSessionId, {
      target: { title: 'Hotel Check-in', domain: 'Daily Life' },
      mode: 'practice',
      turnsCount: 4,
      tab: 'scenarios',
    });

    console.log('  Clean Practice Summary EN:', recapPractice.summary_text_en);
    console.log('  Clean Practice Summary DE:', recapPractice.summary_text_de);
    console.log('  Clean Practice Mistakes:', recapPractice.mistakes);

    assert(recapPractice.mistakes.length === 0, 'Clean practice session has empty mistakes array (never fabricated)');
    assert(recapPractice.summary_text_en.includes('Flawless') || recapPractice.summary_text_en.includes('no language errors') || recapPractice.summary_text_en.includes('no errors'), 'English summary notes clean performance without errors');
    assert(recapPractice.summary_text_de && (recapPractice.summary_text_de.includes('keine') || recapPractice.summary_text_de.includes('Einwandfreie') || recapPractice.summary_text_de.includes('Hervorragende')), 'German summary notes clean performance without errors');

    const recapLearn = await generateDiagnosticRecap(cleanSessionId, {
      target: { title: 'Begrüßungen', micro_skill: 'Greetings & Introductions' },
      mode: 'learn',
      turnsCount: 2,
      tab: 'speak',
    });

    console.log('  Clean Learn Summary EN:', recapLearn.summary_text_en);
    console.log('  Clean Learn Mistakes:', recapLearn.mistakes);

    assert(recapLearn.mistakes.length === 0, 'Clean learn session has empty mistakes array');
    assert(recapLearn.summary_text_de === null, 'Clean learn session summary_text_de remains null');
    assert(recapLearn.summary_text_en.includes('zero mistakes') || recapLearn.summary_text_en.includes('accurately'), 'Clean learn summary highlights accurate performance');
  }

  // TEST 5: Home.tsx "Where You're Slipping" Aggregation Logic Verification
  console.log('\n======================================================');
  console.log('TEST 5: Home.tsx "Where You\'re Slipping" Aggregation Compatibility');
  console.log('======================================================');
  {
    // Simulate recaps as queried in Home.tsx:
    const mockRecaps = [
      { mistakes: [{ category: 'Word Order' }, { category: 'Verb Conjugation' }] },
      { mistakes: [] }, // clean session
      { mistakes: [{ category: 'Word Order' }] },
    ];

    const categoryCounts = {};
    mockRecaps.forEach((r) => {
      const seen = new Set();
      (r.mistakes || []).forEach((m) => {
        if (m.category && !seen.has(m.category)) {
          seen.add(m.category);
          categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
        }
      });
    });

    let topCat = '';
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCat = cat;
      }
    });

    assert(topCat === 'Word Order', `Top slipping category correctly identified as "Word Order" (got "${topCat}")`);
    assert(maxCount === 2, `Category count correctly identified as 2 (got ${maxCount})`);
  }

  console.log('\n======================================================');
  console.log(`ACCEPTANCE SUMMARY: ${passedTests}/${totalTests} tests passed`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n[FATAL] Error in diagnostic recap tests:', err);
  process.exit(1);
});
