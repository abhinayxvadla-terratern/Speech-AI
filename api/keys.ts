import { encryptSecret, maskApiKey } from './_encryption';
import { invalidateKeyCache } from './_keyResolver';

const DEFAULT_URL = 'https://arsfidkuebytexuzlohm.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyc2ZpZGt1ZWJ5dGV4dXpsb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTg0MDIsImV4cCI6MjEwODczNDQwMn0.R-7w4j6HQE3eunm-xoBOAgBreKKXe5MenH_FEABpPAU';

/**
 * Direct PostgREST fetch helper that completely bypasses @supabase/supabase-js
 * Realtime WebSocket initialization, which fails in Node.js 20.
 */
async function supabaseFetch(
  endpoint: string,
  options: { method?: string; token?: string; body?: any } = {}
) {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL).trim();
  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_ANON_KEY
  ).trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: options.token ? `Bearer ${options.token}` : `Bearer ${anonKey}`,
  };

  const res = await fetch(`${url}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(errText);
    } catch {}
    const message = parsed?.message || parsed?.error || parsed?.details || errText || `HTTP ${res.status}`;
    const err = new Error(message);
    (err as any).status = res.status;
    throw err;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default async function handler(req: any, res: any) {
  const method = req.method;

  // Extract auth token
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  // 1. GET: List all keys grouped by provider
  if (method === 'GET') {
    try {
      const knownProviders: Array<'GROQ_API_KEY' | 'OPENROUTER_API_KEY'> = [
        'GROQ_API_KEY',
        'OPENROUTER_API_KEY',
      ];

      const providersMap: Record<string, any[]> = {
        GROQ_API_KEY: [],
        OPENROUTER_API_KEY: [],
      };

      // Fetch metadata from database via Security Definer RPC
      let dbKeys: any[] = [];
      try {
        dbKeys = await supabaseFetch('/rest/v1/rpc/list_admin_api_keys', {
          method: 'POST',
          token,
          body: {},
        });
      } catch (rpcErr) {
        // If unauthenticated or token not superadmin, attempt direct read if permitted, or fallback
        console.warn('[API /api/keys] list_admin_api_keys RPC note:', (rpcErr as any)?.message);
      }

      if (Array.isArray(dbKeys) && dbKeys.length > 0) {
        for (const k of dbKeys) {
          if (providersMap[k.provider]) {
            providersMap[k.provider].push({
              id: k.id,
              provider: k.provider,
              name: k.name || `Key #${k.priority}`,
              key_mask: k.key_mask,
              priority: k.priority,
              is_active: k.is_active,
              source: 'database',
              updated_at: k.updated_at,
              created_at: k.created_at,
            });
          }
        }
      }

      // Check environment fallbacks if no database keys exist for a provider
      for (const p of knownProviders) {
        if (providersMap[p].length === 0) {
          const envVal =
            process.env[p] ||
            process.env[`VITE_${p}`] ||
            '';

          if (envVal) {
            providersMap[p].push({
              id: `env-${p}`,
              provider: p,
              name: 'Environment Variable (.env)',
              key_mask: maskApiKey(envVal),
              priority: 1,
              is_active: true,
              source: 'env',
              updated_at: null,
            });
          }
        }
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true, providers: providersMap });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to retrieve API keys' });
    }
  }

  // 2. POST: Add a new key as an additional fallback entry (never overwrite)
  if (method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { provider, key, name } = body || {};

      if (!provider || !key || typeof key !== 'string' || key.trim().length === 0) {
        return res.status(400).json({ error: 'Missing required "provider" or "key"' });
      }

      if (provider !== 'GROQ_API_KEY' && provider !== 'OPENROUTER_API_KEY') {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }

      const trimmedKey = key.trim();
      const encryptedValue = encryptSecret(trimmedKey);
      const keyMask = maskApiKey(trimmedKey);
      const keyName = name && typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;

      const data = await supabaseFetch('/rest/v1/rpc/add_encrypted_provider_key', {
        method: 'POST',
        token,
        body: {
          p_provider: provider,
          p_encrypted_value: encryptedValue,
          p_key_mask: keyMask,
          p_name: keyName,
        },
      });

      // Invalidate in-memory server cache so next LLM call picks up new key
      invalidateKeyCache(provider);

      const createdRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        success: true,
        key: {
          id: createdRow?.id,
          provider,
          name: createdRow?.name || keyName || 'Key',
          key_mask: keyMask,
          priority: createdRow?.priority || 1,
          is_active: true,
          updated_at: createdRow?.updated_at || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('Error adding provider API key:', err);
      return res.status(500).json({ error: err?.message || 'Failed to store API key' });
    }
  }

  // 3. DELETE: Delete a specific key by id
  if (method === 'DELETE') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = req.query?.id || body?.id;
      const provider = req.query?.provider || body?.provider;

      if (!id) {
        return res.status(400).json({ error: 'Missing required key "id"' });
      }

      await supabaseFetch(`/rest/v1/encrypted_api_keys?id=eq.${id}`, {
        method: 'DELETE',
        token,
      });

      // Invalidate cache
      if (provider) {
        invalidateKeyCache(provider);
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error('Error deleting API key:', err);
      return res.status(500).json({ error: err?.message || 'Failed to delete API key' });
    }
  }

  // 4. PATCH: Toggle active/inactive or reorder priorities
  if (method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { action, id, is_active, provider, ordered_ids } = body || {};

      if (action === 'toggle') {
        if (!id || typeof is_active !== 'boolean') {
          return res.status(400).json({ error: 'Missing "id" or "is_active" for toggle action' });
        }

        await supabaseFetch('/rest/v1/rpc/toggle_encrypted_provider_key', {
          method: 'POST',
          token,
          body: {
            p_key_id: id,
            p_is_active: is_active,
          },
        });

        invalidateKeyCache(provider);
        return res.status(200).json({ success: true, id, is_active });
      }

      if (action === 'reorder') {
        if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
          return res.status(400).json({ error: 'Missing "ordered_ids" array for reorder action' });
        }

        await supabaseFetch('/rest/v1/rpc/reorder_encrypted_provider_keys', {
          method: 'POST',
          token,
          body: {
            p_key_ids: ordered_ids,
          },
        });

        invalidateKeyCache(provider);
        return res.status(200).json({ success: true, ordered_ids });
      }

      return res.status(400).json({ error: `Unsupported action: ${action}` });
    } catch (err: any) {
      console.error('Error patching API key:', err);
      return res.status(500).json({ error: err?.message || 'Failed to modify API key' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
