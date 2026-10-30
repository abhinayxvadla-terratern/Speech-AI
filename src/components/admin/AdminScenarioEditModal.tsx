import React, { useState } from 'react';
import { 
  X, 
  Compass, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { Scenario, CefrLevel, ScenarioTrack, ParentDomain } from '../../lib/database.types';
import { saveAdminScenario, deleteAdminScenario } from '../../services/adminContentService';

interface AdminScenarioEditModalProps {
  scenario: Scenario | null; // null means create new
  adminUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DOMAINS: ParentDomain[] = [
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];

export const AdminScenarioEditModal: React.FC<AdminScenarioEditModalProps> = ({
  scenario: initialScenario,
  adminUserId,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(initialScenario?.id);

  const existingContent: any = 
    initialScenario?.content && typeof initialScenario.content === 'object' && !Array.isArray(initialScenario.content)
      ? initialScenario.content
      : {};

  // Form Fields
  const [track, setTrack] = useState<ScenarioTrack>(initialScenario?.track || 'daily_life');
  const [parentDomain, setParentDomain] = useState<ParentDomain | null>(initialScenario?.parent_domain || null);
  const [subBranch, setSubBranch] = useState<string>(initialScenario?.sub_branch || '');
  const [title, setTitle] = useState<string>(initialScenario?.title || '');
  const [description, setDescription] = useState<string>(initialScenario?.description || '');
  const [minLevel, setMinLevel] = useState<CefrLevel>(initialScenario?.min_level || 'A1');
  const [icon, setIcon] = useState<string>(initialScenario?.icon || '');
  const [isBaseline, setIsBaseline] = useState<boolean>(initialScenario?.is_baseline ?? false);

  // Target phrases
  const initialPhrases = Array.isArray(existingContent.target_phrases)
    ? existingContent.target_phrases
    : [{ german: '', english: '' }];
  const [targetPhrases, setTargetPhrases] = useState<Array<{ german: string; english: string }>>(initialPhrases);

  // Example sentences
  const initialSentences = Array.isArray(existingContent.example_sentences)
    ? existingContent.example_sentences
    : [''];
  const [exampleSentences, setExampleSentences] = useState<string[]>(initialSentences);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddPhrase = () => {
    setTargetPhrases([...targetPhrases, { german: '', english: '' }]);
  };

  const handleUpdatePhrase = (index: number, field: 'german' | 'english', value: string) => {
    const updated = [...targetPhrases];
    updated[index] = { ...updated[index], [field]: value };
    setTargetPhrases(updated);
  };

  const handleRemovePhrase = (index: number) => {
    setTargetPhrases(targetPhrases.filter((_, i) => i !== index));
  };

  const handleAddSentence = () => {
    setExampleSentences([...exampleSentences, '']);
  };

  const handleUpdateSentence = (index: number, value: string) => {
    const updated = [...exampleSentences];
    updated[index] = value;
    setExampleSentences(updated);
  };

  const handleRemoveSentence = (index: number) => {
    setExampleSentences(exampleSentences.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a scenario title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a scenario description.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const cleanedPhrases = targetPhrases.filter((p) => p.german.trim() !== '');
      const cleanedSentences = exampleSentences.filter((s) => s.trim() !== '');

      const contentPayload = {
        target_phrases: cleanedPhrases,
        example_sentences: cleanedSentences,
      };

      await saveAdminScenario(adminUserId, {
        ...(initialScenario?.id ? { id: initialScenario.id } : {}),
        track,
        parent_domain: track === 'domain' ? parentDomain : null,
        sub_branch: track === 'domain' && subBranch.trim() ? subBranch.trim() : null,
        title: title.trim(),
        description: description.trim(),
        min_level: minLevel,
        icon: icon.trim() || null,
        is_baseline: isBaseline,
        content: contentPayload,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save scenario:', err);
      setErrorMsg(err?.message || 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialScenario?.id) return;
    if (!window.confirm(`Delete scenario "${initialScenario.title}"?`)) return;

    try {
      setDeleting(true);
      await deleteAdminScenario(adminUserId, initialScenario.id, initialScenario.title);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete scenario:', err);
      setErrorMsg(err?.message || 'Failed to delete scenario');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col my-auto text-[#111111] animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00215C] text-white flex items-center justify-center">
              <Compass className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#00215C]">
                {isEditing ? `Edit Scenario: ${initialScenario?.title || ''}` : 'Create New Scenario'}
              </h3>
              <p className="text-xs text-slate-500 font-body">
                Roleplay scenario topic for real-world German speaking simulations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2 border-b border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFBFF]">
          {/* General Fields */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <h4 className="font-heading font-bold text-sm text-[#00215C] border-b border-slate-100 pb-2">
              General Scenario Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Track
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as ScenarioTrack)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#00215C]"
                >
                  <option value="daily_life">Daily Life (Allgemein)</option>
                  <option value="domain">Domain Specialized</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Minimum Level
                </label>
                <select
                  value={minLevel}
                  onChange={(e) => setMinLevel(e.target.value as CefrLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#00215C]"
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Baseline Scenario
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isBaseline}
                    onChange={(e) => setIsBaseline(e.target.checked)}
                    className="w-4 h-4 rounded text-[#255CC1]"
                  />
                  <span>Baseline Placement</span>
                </label>
              </div>
            </div>

            {track === 'domain' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Parent Domain
                  </label>
                  <select
                    value={parentDomain || DOMAINS[0]}
                    onChange={(e) => setParentDomain(e.target.value as ParentDomain)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Subbranch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inpatient Nursing or CNC Setup"
                    value={subBranch}
                    onChange={(e) => setSubBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Scenario Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Registering Your Address (Anmeldung)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#00215C]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Icon / Emoji (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🏢 or coffee"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Scenario Description / Roleplay Brief
              </label>
              <textarea
                rows={3}
                placeholder="Describe the situation, user role, and conversational goal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-body"
              />
            </div>
          </div>

          {/* Form-Based Target Phrases */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#00215C]">
                  Target Key Phrases
                </h4>
                <p className="text-[11px] text-slate-500">
                  Recommended German expressions for this simulation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPhrase}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Phrase
              </button>
            </div>

            <div className="space-y-3">
              {targetPhrases.map((phrase, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Phrase #{idx + 1}</span>
                    {targetPhrases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhrase(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="German sentence..."
                      value={phrase.german}
                      onChange={(e) => handleUpdatePhrase(idx, 'german', e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="English translation..."
                      value={phrase.english}
                      onChange={(e) => handleUpdatePhrase(idx, 'english', e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form-Based Example Sentences */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#00215C]">
                  Example Sentences
                </h4>
                <p className="text-[11px] text-slate-500">
                  Full dialogue cues and prompts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSentence}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sentence
              </button>
            </div>

            <div className="space-y-2">
              {exampleSentences.map((sent, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Example sentence #${idx + 1}...`}
                    value={sent}
                    onChange={(e) => handleUpdateSentence(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  {exampleSentences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSentence(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex items-center justify-between shrink-0">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete Scenario'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] transition-colors shadow-2xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Scenario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
