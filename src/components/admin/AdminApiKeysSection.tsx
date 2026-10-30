import React, { useState, useEffect, useCallback } from 'react';
import { 
  Key, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Cpu,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Power
} from 'lucide-react';
import { 
  StoredApiKey, 
  ProviderKeyMap, 
  fetchApiKeysGrouped, 
  addProviderApiKey, 
  deleteProviderApiKey, 
  toggleProviderApiKey, 
  reorderProviderApiKeys 
} from '../../services/adminApiKeysService';

const PROVIDER_METADATA: Record<string, { title: string; subtitle: string; icon: string; docsUrl: string; placeholder: string; prefix: string }> = {
  GROQ_API_KEY: {
    title: 'Groq Cloud API Keys',
    subtitle: 'Primary conversational Llama 3.3 (70B) inference. Multi-key cascade tries Priority 1 first, then Priority 2 on 429/5xx.',
    icon: 'GQ',
    docsUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    prefix: 'gsk_',
  },
  OPENROUTER_API_KEY: {
    title: 'OpenRouter Fallback Keys',
    subtitle: 'Secondary failover inference provider with multi-model redundancy. Keys are attempted in priority order.',
    icon: 'OR',
    docsUrl: 'https://openrouter.ai/settings/keys',
    placeholder: 'sk-or-v1-...',
    prefix: 'sk-',
  },
};

export const AdminApiKeysSection: React.FC = () => {
  const [providerKeys, setProviderKeys] = useState<ProviderKeyMap>({
    GROQ_API_KEY: [],
    OPENROUTER_API_KEY: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add Key Modal State
  const [addingForProvider, setAddingForProvider] = useState<'GROQ_API_KEY' | 'OPENROUTER_API_KEY' | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deletingKey, setDeletingKey] = useState<StoredApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApiKeysGrouped();
      setProviderKeys(data);
    } catch (err: any) {
      console.error('Error fetching API key groups:', err);
      setError(err?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  // 1. Add Key
  const handleOpenAdd = (provider: 'GROQ_API_KEY' | 'OPENROUTER_API_KEY') => {
    setAddingForProvider(provider);
    const count = providerKeys[provider]?.length || 0;
    setNewKeyName(`Fallback Key #${count + 1}`);
    setNewKeyValue('');
    setShowPlaintext(false);
  };

  const handleSaveNewKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingForProvider || !newKeyValue.trim()) {
      alert('Please enter a valid API key');
      return;
    }

    try {
      setSaving(true);
      const added = await addProviderApiKey(
        addingForProvider,
        newKeyValue.trim(),
        newKeyName.trim() || undefined
      );
      showToast(`Added ${added.name} to ${addingForProvider} chain (Priority #${added.priority})`);
      setAddingForProvider(null);
      setNewKeyValue('');
      setNewKeyName('');
      await loadKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to add API key');
    } finally {
      setSaving(false);
    }
  };

  // 2. Toggle Key Active / Inactive
  const handleToggleActive = async (key: StoredApiKey) => {
    if (key.source === 'env') {
      alert('Environment fallback keys cannot be toggled in database. Add a database key to manage status.');
      return;
    }

    try {
      const nextActive = !key.is_active;
      await toggleProviderApiKey(key.id, nextActive, key.provider);
      showToast(`${key.name} ${nextActive ? 'activated' : 'paused'}`);
      await loadKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle key status');
    }
  };

  // 3. Move Key Priority (Up / Down)
  const handleMovePriority = async (key: StoredApiKey, direction: 'up' | 'down') => {
    if (key.source === 'env') return;
    const currentList = [...(providerKeys[key.provider] || [])].filter((k) => k.source !== 'env');
    const currentIndex = currentList.findIndex((k) => k.id === key.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    // Swap positions
    const [moved] = currentList.splice(currentIndex, 1);
    currentList.splice(targetIndex, 0, moved);

    const orderedIds = currentList.map((k) => k.id);
    try {
      await reorderProviderApiKeys(key.provider, orderedIds);
      showToast(`Reordered ${key.provider} priority chain`);
      await loadKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to reorder keys');
    }
  };

  // 4. Delete Key
  const handleConfirmDelete = async () => {
    if (!deletingKey || deletingKey.source === 'env') return;

    try {
      setDeleting(true);
      await deleteProviderApiKey(deletingKey.id, deletingKey.provider);
      showToast(`Deleted ${deletingKey.name} from ${deletingKey.provider}`);
      setDeletingKey(null);
      await loadKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete key');
    } finally {
      setDeleting(false);
    }
  };

  const providers: Array<'GROQ_API_KEY' | 'OPENROUTER_API_KEY'> = [
    'GROQ_API_KEY',
    'OPENROUTER_API_KEY',
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#255CC1]">
              <Key className="w-5 h-5" />
            </span>
            <h3 className="font-heading font-extrabold text-lg text-[#00215C] tracking-tight">
              Encrypted Provider API Keys & Fallback Chains
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure multi-key fallback pools for Groq and OpenRouter. Keys are encrypted at rest with AES-256 and tried in priority order (1 &rarr; 2 &rarr; 3...) when rate limits (429) or server errors (5xx) occur.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {toastMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fadeIn">
              {toastMsg}
            </span>
          )}

          <button
            onClick={() => loadKeys()}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Key Statuses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#255CC1]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Security & Cascade Architecture Callout */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-xs text-indigo-900 flex items-center gap-1.5">
              <span>Automatic Priority Cascade Order:</span>
              <span className="font-mono text-[11px] text-indigo-700 font-normal">
                Groq Key 1 &rarr; Groq Key 2 &rarr; OpenRouter Key 1 &rarr; OpenRouter Key 2
              </span>
            </h4>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              If Priority 1 hits a rate limit or 5xx, the server immediately attempts Priority 2 for that same provider before failing over. Plaintext values are <strong>never sent to the client</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Lock className="w-3 h-3 text-indigo-600" />
            AES-256-GCM
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-600" />
            60s Cache TTL
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadKeys()} className="font-bold underline hover:text-red-900 ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Provider Keys Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => {
          const meta = PROVIDER_METADATA[provider];
          const keysList = providerKeys[provider] || [];
          const dbKeysCount = keysList.filter((k) => k.source === 'database').length;

          return (
            <div
              key={provider}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                        provider === 'GROQ_API_KEY'
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'bg-purple-50 text-purple-600 border border-purple-200'
                      }`}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-[#00215C]">
                        {meta.title}
                      </h4>
                      <code className="text-[10px] font-mono text-slate-400">
                        {provider}
                      </code>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAdd(provider)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#255CC1] hover:bg-[#00215C] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Key</span>
                  </button>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  {meta.subtitle}
                </p>

                {/* Keys List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Configured Keys ({keysList.length})</span>
                    <span>Cascade Order</span>
                  </div>

                  {keysList.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      No keys configured for this provider. Click <strong>Add Key</strong> to store an encrypted credential.
                    </div>
                  ) : (
                    keysList.map((key, index) => {
                      const isDb = key.source === 'database';
                      const canMoveUp = isDb && index > 0;
                      const canMoveDown = isDb && index < keysList.filter((k) => k.source === 'database').length - 1;

                      return (
                        <div
                          key={key.id}
                          className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                            key.is_active
                              ? 'bg-slate-50/80 border-slate-200'
                              : 'bg-slate-100/50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Priority Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono border ${
                                  key.priority === 1
                                    ? 'bg-[#00215C] text-white border-[#00215C]'
                                    : 'bg-slate-200 text-slate-700 border-slate-300'
                                }`}
                              >
                                Priority {key.priority}
                              </span>

                              <span className="font-heading font-bold text-xs text-[#00215C]">
                                {key.name}
                              </span>

                              {/* Source Badge */}
                              <span className="text-[10px] font-medium text-slate-400">
                                {isDb ? '(DB Encrypted)' : '(Env Fallback)'}
                              </span>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-1">
                              {/* Reorder Buttons */}
                              {isDb && (
                                <>
                                  <button
                                    onClick={() => handleMovePriority(key, 'up')}
                                    disabled={!canMoveUp}
                                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move priority up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMovePriority(key, 'down')}
                                    disabled={!canMoveDown}
                                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move priority down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Active / Inactive Toggle */}
                              {isDb && (
                                <button
                                  onClick={() => handleToggleActive(key)}
                                  className={`p-1 rounded-lg transition-colors ${
                                    key.is_active
                                      ? 'text-emerald-600 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={key.is_active ? 'Active (click to pause)' : 'Paused (click to activate)'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Button */}
                              {isDb && (
                                <button
                                  onClick={() => setDeletingKey(key)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                  title="Delete this key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Masked Key & Metadata Row */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                            <code className="font-mono text-xs font-semibold text-[#00215C]">
                              {key.key_mask}
                            </code>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {key.updated_at
                                ? `Updated ${new Date(key.updated_at).toLocaleDateString()}`
                                : 'Active via .env'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {dbKeysCount > 0 ? `${dbKeysCount} stored database key(s)` : 'Using environment fallback'}
                </span>
                <a
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#255CC1] hover:underline"
                >
                  Get API Key &rarr;
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD NEW KEY */}
      {addingForProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#255CC1]">
                  <Plus className="w-4 h-4" />
                </span>
                <h4 className="font-heading font-extrabold text-sm text-[#00215C]">
                  Add Fallback Key for {PROVIDER_METADATA[addingForProvider]?.title}
                </h4>
              </div>
              <button
                onClick={() => setAddingForProvider(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewKey} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                <p className="font-bold">Fallback Option (Never Overwrites)</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  This key will be appended as an additional fallback option in the priority chain. Existing keys remain active and untouched.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Key Label / Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Backup Key #2 (Secondary Tier)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#255CC1] bg-[#FAFBFF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  API Key Secret
                </label>
                <div className="relative">
                  <input
                    type={showPlaintext ? 'text' : 'password'}
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder={PROVIDER_METADATA[addingForProvider]?.placeholder || 'Enter API Key...'}
                    required
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#255CC1] bg-[#FAFBFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlaintext(!showPlaintext)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPlaintext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddingForProvider(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newKeyValue.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#255CC1] text-white text-xs font-bold hover:bg-[#00215C] transition-all shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Encrypting & Storing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Encrypt & Save Key
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm text-[#00215C]">
                  Delete API Key?
                </h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove this key?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Provider:</span>
                <span className="font-bold text-[#00215C]">{deletingKey.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Label:</span>
                <span className="font-bold text-[#00215C]">{deletingKey.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Mask:</span>
                <code className="font-mono text-slate-700">{deletingKey.key_mask}</code>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Other keys in this provider chain will automatically re-normalize their priority order.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingKey(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
