import { getProviderApiKeys } from './_keyResolver';

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

const OPENROUTER_FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
];

function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

async function callGroqWithKey(messages: any[], apiKey: string): Promise<any> {
  let lastError: any = null;

  for (const model of GROQ_MODELS) {
    try {
      const payload = {
        model,
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      };

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const err: any = new Error(`Groq LLM HTTP ${res.status}: ${errBody}`);
        err.status = res.status;
        throw err;
      }

      const data: any = await res.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('Groq returned empty completion content');

      return JSON.parse(sanitizeJsonString(rawText));
    } catch (err: any) {
      lastError = err;
      // Key-level issues (rate limits, quota, bad key) should fail fast to next key
      if (err?.status === 429 || err?.status === 401) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All Groq models failed');
}

async function callOpenRouterWithKey(messages: any[], apiKey: string): Promise<any> {
  let lastError: any = null;

  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://speechai.terratern.com',
          'X-Title': 'SpeechAI Platform',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const err: any = new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
        err.status = res.status;
        throw err;
      }

      const data: any = await res.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) continue;

      return JSON.parse(sanitizeJsonString(rawText));
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`All OpenRouter free tier fallback attempts failed. Last error: ${lastError?.message}`);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages, forceOpenRouter, forceFailGroqPriority1 } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "messages" array' });
    }

    // 1. Resolve ordered active keys from encrypted database table
    const [groqKeys, openrouterKeys] = await Promise.all([
      getProviderApiKeys('GROQ_API_KEY'),
      getProviderApiKeys('OPENROUTER_API_KEY'),
    ]);

    const failureLogs: string[] = [];

    // Force OpenRouter simulation if requested
    if (forceOpenRouter) {
      if (openrouterKeys.length === 0) {
        return res.status(500).json({ error: 'No active OpenRouter API keys configured' });
      }

      for (const orKey of openrouterKeys) {
        try {
          const parsed = await callOpenRouterWithKey(messages, orKey.key);
          return res.status(200).json({
            parsed,
            provider: 'openrouter',
            key_id: orKey.id,
            key_priority: orKey.priority,
            key_name: orKey.name,
          });
        } catch (orErr: any) {
          failureLogs.push(`OpenRouter Key #${orKey.priority} (${orKey.name}): ${orErr?.message}`);
        }
      }

      return res.status(502).json({
        error: `All active OpenRouter keys failed: ${failureLogs.join(' | ')}`,
      });
    }

    // 2. Cascade through Groq keys in priority order: Groq Key 1 -> Groq Key 2 -> ...
    if (groqKeys.length > 0) {
      for (const groqKey of groqKeys) {
        try {
          // Simulation parameter to test key-1 failover to key-2
          if (forceFailGroqPriority1 && groqKey.priority === 1) {
            const simulatedErr: any = new Error('Simulated Groq 429 Rate Limit on Priority-1 Key');
            simulatedErr.status = 429;
            throw simulatedErr;
          }

          const parsed = await callGroqWithKey(messages, groqKey.key);
          return res.status(200).json({
            parsed,
            provider: 'groq',
            key_id: groqKey.id,
            key_priority: groqKey.priority,
            key_name: groqKey.name,
          });
        } catch (err: any) {
          const msg = (err?.message || String(err)).toLowerCase();
          const status = err?.status;
          const is429 = msg.includes('429') || status === 429 || msg.includes('rate limit');
          const is5xx = /5\d{2}/.test(msg) || (typeof status === 'number' && status >= 500 && status < 600);

          failureLogs.push(`Groq Key #${groqKey.priority} (${groqKey.name}): ${err?.message}`);
          console.warn(
            `[API /api/llm] Groq Key #${groqKey.priority} failed (${is429 ? '429 RateLimit' : is5xx ? '5xx ServerError' : 'Error'}):`,
            err?.message || err
          );

          // If not 429 and not 5xx, still try next key if available, but log diagnostic
        }
      }
      console.warn('[API /api/llm] All Groq keys exhausted. Cascading to OpenRouter fallback keys...');
    } else {
      console.warn('[API /api/llm] No active Groq API keys available. Cascading to OpenRouter...');
    }

    // 3. Cascade through OpenRouter keys in priority order: OpenRouter Key 1 -> OpenRouter Key 2 -> ...
    if (openrouterKeys.length > 0) {
      for (const orKey of openrouterKeys) {
        try {
          const parsed = await callOpenRouterWithKey(messages, orKey.key);
          return res.status(200).json({
            parsed,
            provider: 'openrouter',
            key_id: orKey.id,
            key_priority: orKey.priority,
            key_name: orKey.name,
          });
        } catch (orErr: any) {
          failureLogs.push(`OpenRouter Key #${orKey.priority} (${orKey.name}): ${orErr?.message}`);
          console.warn(
            `[API /api/llm] OpenRouter Key #${orKey.priority} failed. Cascading...`
          );
        }
      }
    }

    // 4. Exhaustion: Both providers and all keys failed
    return res.status(502).json({
      error: `All provider keys in fallback chain failed. Failures: ${failureLogs.join(' | ')}`,
      attempted_providers: ['groq', 'openrouter'],
      failure_count: failureLogs.length,
    });
  } catch (err: any) {
    console.error('[API /api/llm] Fatal error processing LLM request:', err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
