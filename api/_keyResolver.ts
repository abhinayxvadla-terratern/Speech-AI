import { decryptSecret } from './_encryption';

export interface DecryptedKeyEntry {
  id: string;
  key: string;
  name: string;
  priority: number;
  source: 'database' | 'env';
}

interface CachedProviderKeys {
  keys: DecryptedKeyEntry[];
  expiresAt: number;
}

// In-memory cache with 60-second TTL per provider
const memoryCache = new Map<string, CachedProviderKeys>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const DEFAULT_URL = 'https://arsfidkuebytexuzlohm.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyc2ZpZGt1ZWJ5dGV4dXpsb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTg0MDIsImV4cCI6MjEwODczNDQwMn0.R-7w4j6HQE3eunm-xoBOAgBreKKXe5MenH_FEABpPAU';

/**
 * Resolves all active API keys for a provider ordered by priority (1, 2, 3...)
 * 1. Checks memory cache (if valid, returns cached key list)
 * 2. Queries encrypted_api_keys table from Supabase via get_encrypted_provider_keys RPC
 * 3. Decrypts each active key with server-side ADMIN_ENCRYPTION_KEY secret
 * 4. Falls back to process.env if no active database keys exist
 */
export async function getProviderApiKeys(
  provider: 'GROQ_API_KEY' | 'OPENROUTER_API_KEY'
): Promise<DecryptedKeyEntry[]> {
  const now = Date.now();
  const cached = memoryCache.get(provider);

  if (cached && now < cached.expiresAt && cached.keys.length > 0) {
    return cached.keys;
  }

  // 1. Try reading from encrypted_api_keys via Security Definer RPC
  try {
    const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL).trim();
    const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim();

    const rpcRes = await fetch(`${url}/rest/v1/rpc/get_encrypted_provider_keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ p_provider: provider }),
    });

    if (rpcRes.ok) {
      const data = await rpcRes.json();

      if (Array.isArray(data) && data.length > 0) {
        const decryptedList: DecryptedKeyEntry[] = [];

        for (const row of data) {
          if (!row.encrypted_value) continue;
          try {
            const decrypted = decryptSecret(row.encrypted_value);
            if (decrypted && decrypted.trim().length > 0) {
              decryptedList.push({
                id: row.id,
                key: decrypted.trim(),
                name: row.name || `Key #${row.priority}`,
                priority: row.priority || 1,
                source: 'database',
              });
            }
          } catch (decErr) {
            console.warn(`[KeyResolver] Error decrypting key ID ${row.id} for ${provider}:`, decErr);
          }
        }

        if (decryptedList.length > 0) {
          decryptedList.sort((a, b) => a.priority - b.priority);
          memoryCache.set(provider, {
            keys: decryptedList,
            expiresAt: now + CACHE_TTL_MS,
          });
          return decryptedList;
        }
      }
    } else {
      const errText = await rpcRes.text();
      console.warn(`[KeyResolver] RPC HTTP ${rpcRes.status}:`, errText);
    }
  } catch (dbErr) {
    console.warn(`[KeyResolver] Error retrieving database keys for ${provider}:`, dbErr);
  }

  // 2. Fall back to process.env if no database records exist
  const envKey =
    process.env[provider] ||
    process.env[`VITE_${provider}`] ||
    '';

  if (envKey) {
    const envList: DecryptedKeyEntry[] = [
      {
        id: `env-${provider}`,
        key: envKey,
        name: 'Environment Variable Fallback',
        priority: 1,
        source: 'env',
      },
    ];

    memoryCache.set(provider, {
      keys: envList,
      expiresAt: now + CACHE_TTL_MS,
    });

    return envList;
  }

  return [];
}

/**
 * Backward compatibility helper for single-key resolution (returns top priority key)
 */
export async function getProviderApiKey(
  provider: 'GROQ_API_KEY' | 'OPENROUTER_API_KEY'
): Promise<{ key: string; source: 'database' | 'env' }> {
  const keys = await getProviderApiKeys(provider);
  if (keys.length > 0 && keys[0].key) {
    return { key: keys[0].key, source: keys[0].source };
  }
  return { key: '', source: 'env' };
}

/**
 * Invalidate cached key so the next call immediately queries the database
 */
export function invalidateKeyCache(provider?: string) {
  if (provider) {
    memoryCache.delete(provider);
  } else {
    memoryCache.clear();
  }
}
