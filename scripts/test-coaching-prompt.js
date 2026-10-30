import dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
global.WebSocket = WebSocket;
globalThis.WebSocket = WebSocket;

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('GROQ_API_KEY missing');
  process.exit(1);
}

const cefrLevel = 'A2';
const microSkill = 'Paying at a restaurant';
const targetPhrases = 'Ich möchte bitte zahlen.';
const domainVariants = 'None';

const learnPrompt = `You are a supportive German language tutor for a learner at ${cefrLevel} level.
This session covers: ${microSkill}
Target phrase(s): ${targetPhrases}
Domain context (if applicable): ${domainVariants}

The learner has just attempted to say a German phrase. You will receive:
- The target phrase they were asked to produce
- Their actual spoken transcript (via STT — transcribed as closely as possible to what was actually said, including any errors)
- STT confidence level for this transcript, if available

Your job:
1. First, judge warmly: is this correct, close, or a genuine deviation? Acceptable phrasing variations or near-matches should be treated as correct — don't nitpick.
2. If STT confidence is low, hedge your judgment rather than asserting it confidently.
3. If there is a genuine deviation, identify ONE primary category from: verb conjugation, case agreement, word order, vocabulary choice, missing word, other.
4. Return ONLY valid JSON:
{
  "correct": true/false,
  "confidence_hedge": true/false,
  "category": "<category or null>",
  "example": "<the raw transcript, unmodified>",
  "correction": "<corrected German version, or null if correct>",
  "feedback_en": "<one warm, coaching-toned sentence in English>"
}

Never put anything in "example" other than the raw transcript. Never include anything outside the JSON object. feedback_en must be English only, short, encouraging, never harsh or pedantic.`;

async function evaluateAttempt(transcript, confidence = 'high') {
  const messages = [
    { role: 'system', content: learnPrompt },
    {
      role: 'user',
      content: `Target phrase: "${targetPhrases}"\nLearner transcript: "${transcript}"\nSTT confidence level: ${confidence}`,
    },
  ];

  const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'llama-3.3-70b-versatile'];

  for (const m of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (res.status === 404) continue;
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      if (m === models[models.length - 1]) throw err;
    }
  }
}

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

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        SPEAK AGENT (LEARN MODE) COACHING PROMPT SUITE        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // TEST 1: Acceptable phrasing variation (near-correct, natural German alternative)
  console.log('---------------------------------------------------------------');
  console.log('TEST 1: Acceptable Phrasing Variation / Near-Correct');
  console.log('Target: "Ich möchte bitte zahlen." | Attempt: "Ich würde gerne bezahlen, bitte."');
  console.log('---------------------------------------------------------------');
  const variation = 'Ich würde gerne bezahlen, bitte.';
  const res1 = await evaluateAttempt(variation, 'high');
  console.log('  Result 1:', JSON.stringify(res1, null, 2));

  assert(res1.correct === true, 'Acceptable variation is judged correct (not marked as an error)');
  assert(res1.example === variation, 'Example field matches raw transcript unmodified');
  assert(
    !res1.feedback_en.toLowerCase().includes('wrong') &&
    !res1.feedback_en.toLowerCase().includes('incorrect'),
    'Feedback avoids harsh/pedantic grading terms'
  );

  // TEST 2: Genuinely incorrect attempt (wrong vocabulary / grammar)
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 2: Genuinely Wrong Attempt');
  console.log('Target: "Ich möchte bitte zahlen." | Attempt: "Ich will Geld geben jetzt."');
  console.log('---------------------------------------------------------------');
  const wrongAttempt = 'Ich will Geld geben jetzt.';
  const res2 = await evaluateAttempt(wrongAttempt, 'high');
  console.log('  Result 2:', JSON.stringify(res2, null, 2));

  assert(res2.correct === false, 'Genuinely wrong attempt is correctly marked incorrect');
  assert(Boolean(res2.category), `Category is identified: "${res2.category}"`);
  assert(Boolean(res2.correction), `Correction provided: "${res2.correction}"`);
  assert(res2.example === wrongAttempt, 'Example field matches raw transcript exactly');
  assert(
    typeof res2.feedback_en === 'string' && res2.feedback_en.length > 10,
    'Feedback provides supportive coaching explanation'
  );

  // TEST 3: Low STT confidence hedging
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 3: Low STT Confidence Hedging');
  console.log('Target: "Ich möchte bitte zahlen." | Attempt: "Isch möschte zahln" (Low confidence)');
  console.log('---------------------------------------------------------------');
  const lowConfAttempt = 'Isch möschte zahln';
  const res3 = await evaluateAttempt(lowConfAttempt, 'low');
  console.log('  Result 3:', JSON.stringify(res3, null, 2));

  assert(
    res3.confidence_hedge === true ||
    res3.feedback_en.toLowerCase().includes('heard') ||
    res3.feedback_en.toLowerCase().includes('sounded') ||
    res3.feedback_en.toLowerCase().includes('try') ||
    res3.feedback_en.toLowerCase().includes('sure'),
    'Low confidence triggers hedging in feedback rather than flat assertion'
  );
  assert(res3.example === lowConfAttempt, 'Example matches raw transcript verbatim');

  // TEST 4: Full integration with RealVoiceAdapter
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 4: Integration with RealVoiceAdapter & Session State');
  console.log('---------------------------------------------------------------');
  const { realVoiceAdapter } = await import('../src/services/voice/index.ts');

  const handle = await realVoiceAdapter.startSession({
    tab: 'speak',
    mode: 'learn',
    targetPhrase: 'Ich möchte bitte zahlen.',
    title: 'Restaurant Zahlungen',
    cefr_level: 'A2',
    micro_skill: 'Asking for the bill at a restaurant',
  });

  let emittedTurn = null;
  realVoiceAdapter.onTranscript(handle, (turn) => {
    if (turn.speaker === 'user') emittedTurn = turn;
  });

  // Test with acceptable variation synthesized speech
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('de-DE-KatjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream('Ich möchte bezahlen, bitte.');
  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on('data', (c) => chunks.push(c));
    audioStream.on('end', () => {
      tts.close();
      resolve();
    });
    audioStream.on('error', reject);
  });
  const audioBuf = Buffer.concat(chunks);

  await realVoiceAdapter.sendAudio(handle, audioBuf);
  const finalTurns = await realVoiceAdapter.endSession(handle);

  assert(emittedTurn !== null, 'Turn was emitted to listener');
  assert(emittedTurn.isCorrect === true, 'Acceptable phrasing recognized as correct by RealVoiceAdapter');
  assert(Boolean(emittedTurn.rawTranscript), 'Raw transcript recorded');
  assert(Boolean(emittedTurn.feedback_en), `Coaching feedback provided: "${emittedTurn.feedback_en}"`);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`ALL CHECKS PASSED: ${passedTests} / ${totalTests} tests succeeded!`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
