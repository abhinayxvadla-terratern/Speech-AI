import { supabase } from '../lib/supabase';

export interface StoredApiKey {
  id: string;
  provider: 'GROQ_API_KEY' | 'OPENROUTER_API_KEY';
  name: string;
  key_mask: string;
  priority: number;
  is_active: boolean;
  source: 'database' | 'env';
  updated_at: string | null;
  created_at?: string | null;
}

export type ProviderKeyMap = Record<'GROQ_API_KEY' | 'OPENROUTER_API_KEY', StoredApiKey[]>;

/**
 * Fetch all provider API keys grouped by provider and ordered by priority
 */
export async function fetchApiKeysGrouped(): Promise<ProviderKeyMap> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;

    const res = await fetch('/api/keys', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.providers) {
        return data.providers as ProviderKeyMap;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from /api/keys, attempting direct RPC fallback:', err);
  }

  // Fallback: Query metadata directly via list_admin_api_keys RPC
  try {
    const { data: rpcData, error } = await supabase.rpc('list_admin_api_keys');
    if (!error && Array.isArray(rpcData)) {
      const result: ProviderKeyMap = {
        GROQ_API_KEY: [],
        OPENROUTER_API_KEY: [],
      };

      for (const row of rpcData) {
        if (result[row.provider as 'GROQ_API_KEY' | 'OPENROUTER_API_KEY']) {
          result[row.provider as 'GROQ_API_KEY' | 'OPENROUTER_API_KEY'].push({
            id: row.id,
            provider: row.provider,
            name: row.name || `Key #${row.priority}`,
            key_mask: row.key_mask,
            priority: row.priority,
            is_active: row.is_active,
            source: 'database',
            updated_at: row.updated_at,
            created_at: row.created_at,
          });
        }
      }

      return result;
    }
  } catch (rpcErr) {
    console.warn('RPC list_admin_api_keys check failed:', rpcErr);
  }

  // Ultimate fallback to default env representations
  return {
    GROQ_API_KEY: [
      {
        id: 'env-groq',
        provider: 'GROQ_API_KEY',
        name: 'Default Environment Fallback',
        key_mask: 'gsk_...9GiF',
        priority: 1,
        is_active: true,
        source: 'env',
        updated_at: null,
      },
    ],
    OPENROUTER_API_KEY: [
      {
        id: 'env-openrouter',
        provider: 'OPENROUTER_API_KEY',
        name: 'Default Environment Fallback',
        key_mask: 'sk-or-v1-...b21c',
        priority: 1,
        is_active: true,
        source: 'env',
        updated_at: null,
      },
    ],
  };
}

/**
 * Add a new API key as an additional priority entry for a provider (never overwrites)
 */
export async function addProviderApiKey(
  provider: 'GROQ_API_KEY' | 'OPENROUTER_API_KEY',
  key: string,
  name?: string
): Promise<StoredApiKey> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const res = await fetch('/api/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ provider, key, name }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${res.status}`);
  }

  const data = await res.json();
  return data.key;
}

/**
 * Delete a specific API key by id
 */
export async function deleteProviderApiKey(id: string, provider: string): Promise<void> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const res = await fetch('/api/keys', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ id, provider }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete key (${res.status})`);
  }
}

/**
 * Toggle active/inactive status for a specific key
 */
export async function toggleProviderApiKey(
  id: string,
  isActive: boolean,
  provider: string
): Promise<void> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const res = await fetch('/api/keys', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: 'toggle',
      id,
      is_active: isActive,
      provider,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to toggle key status (${res.status})`);
  }
}

/**
 * Reorder priority list for a provider's keys
 */
export async function reorderProviderApiKeys(
  provider: string,
  orderedIds: string[]
): Promise<void> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const res = await fetch('/api/keys', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: 'reorder',
      provider,
      ordered_ids: orderedIds,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to reorder keys (${res.status})`);
  }
}
