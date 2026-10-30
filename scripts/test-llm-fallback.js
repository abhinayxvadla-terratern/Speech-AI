import 'dotenv/config';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const groqModels = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

const openRouterFreeModels = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'nvidia/nemotron-3.5-lightning:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
];

async function callGroq(messages, forceError = false) {
  if (forceError) {
    const err = new Error('Groq LLM HTTP 429: Rate limit exceeded (simulated test)');
    err.status = 429;
    throw err;
  }

  for (const m of groqModels) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: m,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
    });

    if (res.status === 404 || res.status === 400) continue;

    if (!res.ok) {
      const err = new Error(`Groq LLM HTTP ${res.status}: ${await res.text()}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    return { parsed: JSON.parse(raw), model: m };
  }
  throw new Error('All Groq models failed');
}

async function callOpenRouter(messages) {
  for (const m of openRouterFreeModels) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://speechai.app',
          'X-Title': 'SpeechAI',
        },
        body: JSON.stringify({
          model: m,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      if (res.status === 404 || res.status === 400) continue;
      if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '{}';
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      return { parsed: JSON.parse(cleaned), model: m };
    } catch (e) {
      if (m === openRouterFreeModels[openRouterFreeModels.length - 1]) throw e;
    }
  }
  throw new Error('All OpenRouter models failed');
}

async function callLLM(messages, forceGroq429 = false) {
  try {
    const res = await callGroq(messages, forceGroq429);
    return { parsed: res.parsed, provider: 'groq', model: res.model };
  } catch (err) {
    const msg = (err?.message || '').toLowerCase();
    const is429 = msg.includes('429') || err?.status === 429;
    const is5xx = /5\d{2}/.test(msg) || (err?.status >= 500 && err?.status < 600);

    if (is429 || is5xx) {
      console.log(`[callLLM] Catching ${is429 ? '429 rate limit' : '5xx server error'} (${err.message}) -> Falling back to OpenRouter free tier...`);
      const { parsed, model } = await callOpenRouter(messages);
      return { parsed, provider: 'openrouter', model };
    }
    throw err;
  }
}

async function main() {
  const messages = [
    {
      role: 'system',
      content: 'You are a German conversational partner. Return JSON ONLY: {"reply_de": "Hallo! Wie kann ich Ihnen heute helfen?", "detected_mistakes": []}'
    },
    { role: 'user', content: 'Guten Tag!' }
  ];

  console.log('\n--- Step 1: Normal Call (Groq Primary) ---');
  const res1 = await callLLM(messages, false);
  console.log('Result 1 Provider:', res1.provider);
  console.log('Result 1 Model Used:', res1.model);
  console.log('Result 1 Payload:', JSON.stringify(res1.parsed));

  console.log('\n--- Step 2: Simulated 429 Rate Limit (Fallback to OpenRouter) ---');
  const res2 = await callLLM(messages, true);
  console.log('Result 2 Provider:', res2.provider);
  console.log('Result 2 OpenRouter Model Used:', res2.model);
  console.log('Result 2 Payload:', JSON.stringify(res2.parsed));

  console.log('\n--- Step 3: Restored Groq Call ---');
  const res3 = await callLLM(messages, false);
  console.log('Result 3 Provider:', res3.provider);
  console.log('Result 3 Model Used:', res3.model);
  console.log('Result 3 Payload:', JSON.stringify(res3.parsed));

  console.log('\n======================================================');
  console.log('SUCCESS: All 3 steps verified the two-tier LLM fallback!');
  console.log('======================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
