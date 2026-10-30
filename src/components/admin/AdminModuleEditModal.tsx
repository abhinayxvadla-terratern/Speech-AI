import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { Module, ModuleContent, ModuleTargetPhrase, ModuleVariantContent, ModuleLevel } from '../../lib/database.types';
import { saveAdminModule, deleteAdminModule } from '../../services/adminContentService';

interface AdminModuleEditModalProps {
  module: Module | null; // null means create new
  adminUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

const CEFR_LEVELS: ModuleLevel[] = ['A1', 'A2', 'B1', 'B2'];
const DOMAINS = [
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];

export const AdminModuleEditModal: React.FC<AdminModuleEditModalProps> = ({
  module: initialModule,
  adminUserId,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(initialModule?.id);

  // Parse existing content
  const existingContent: ModuleContent = 
    initialModule?.content && typeof initialModule.content === 'object' && !Array.isArray(initialModule.content)
      ? (initialModule.content as ModuleContent)
      : {};

  // Form Fields
  const [level, setLevel] = useState<ModuleLevel>(initialModule?.level || 'A1');
  const [moduleNumber, setModuleNumber] = useState<number>(initialModule?.module_number || 1);
  const [title, setTitle] = useState<string>(initialModule?.title || '');
  const [microSkill, setMicroSkill] = useState<string>(initialModule?.micro_skill || '');
  const [domainWeightPct, setDomainWeightPct] = useState<number>(initialModule?.domain_weight_pct ?? 0);
  const [isCheckpoint, setIsCheckpoint] = useState<boolean>(initialModule?.is_checkpoint ?? false);

  // Base Target Phrases
  const initialBasePhrases: ModuleTargetPhrase[] = Array.isArray(existingContent.target_phrases)
    ? existingContent.target_phrases
    : existingContent.target_phrase
    ? [{ german: existingContent.target_phrase, english: existingContent.english_meaning || '' }]
    : [{ german: '', english: '' }];

  const [basePhrases, setBasePhrases] = useState<ModuleTargetPhrase[]>(initialBasePhrases);

  // Base Example Sentences
  const initialBaseSentences: string[] = Array.isArray(existingContent.example_sentences)
    ? existingContent.example_sentences
    : [''];

  const [baseSentences, setBaseSentences] = useState<string[]>(initialBaseSentences);

  // Domain Variants
  const [activeDomainTab, setActiveDomainTab] = useState<string>(DOMAINS[0]);
  const [domainVariants, setDomainVariants] = useState<{ [domain: string]: ModuleVariantContent }>(
    existingContent.domain_variants || {}
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helpers for Base Phrases
  const handleAddBasePhrase = () => {
    setBasePhrases([...basePhrases, { german: '', english: '' }]);
  };

  const handleUpdateBasePhrase = (index: number, field: 'german' | 'english', value: string) => {
    const updated = [...basePhrases];
    updated[index] = { ...updated[index], [field]: value };
    setBasePhrases(updated);
  };

  const handleRemoveBasePhrase = (index: number) => {
    setBasePhrases(basePhrases.filter((_, i) => i !== index));
  };

  // Helpers for Base Sentences
  const handleAddBaseSentence = () => {
    setBaseSentences([...baseSentences, '']);
  };

  const handleUpdateBaseSentence = (index: number, value: string) => {
    const updated = [...baseSentences];
    updated[index] = value;
    setBaseSentences(updated);
  };

  const handleRemoveBaseSentence = (index: number) => {
    setBaseSentences(baseSentences.filter((_, i) => i !== index));
  };

  // Helpers for Domain Variants
  const currentVariant: ModuleVariantContent = domainVariants[activeDomainTab] || {
    target_phrases: [],
    example_sentences: [],
  };

  const handleAddVariantPhrase = () => {
    const updatedVariant = {
      ...currentVariant,
      target_phrases: [...(currentVariant.target_phrases || []), { german: '', english: '' }],
    };
    setDomainVariants({ ...domainVariants, [activeDomainTab]: updatedVariant });
  };

  const handleUpdateVariantPhrase = (index: number, field: 'german' | 'english', value: string) => {
    const phrases = [...(currentVariant.target_phrases || [])];
    phrases[index] = { ...phrases[index], [field]: value };
    const updatedVariant = { ...currentVariant, target_phrases: phrases };
    setDomainVariants({ ...domainVariants, [activeDomainTab]: updatedVariant });
  };

  const handleRemoveVariantPhrase = (index: number) => {
    const phrases = (currentVariant.target_phrases || []).filter((_, i) => i !== index);
    setDomainVariants({
      ...domainVariants,
      [activeDomainTab]: { ...currentVariant, target_phrases: phrases },
    });
  };

  const handleAddVariantSentence = () => {
    const updatedVariant = {
      ...currentVariant,
      example_sentences: [...(currentVariant.example_sentences || []), ''],
    };
    setDomainVariants({ ...domainVariants, [activeDomainTab]: updatedVariant });
  };

  const handleUpdateVariantSentence = (index: number, value: string) => {
    const sentences = [...(currentVariant.example_sentences || [])];
    sentences[index] = value;
    const updatedVariant = { ...currentVariant, example_sentences: sentences };
    setDomainVariants({ ...domainVariants, [activeDomainTab]: updatedVariant });
  };

  const handleRemoveVariantSentence = (index: number) => {
    const sentences = (currentVariant.example_sentences || []).filter((_, i) => i !== index);
    setDomainVariants({
      ...domainVariants,
      [activeDomainTab]: { ...currentVariant, example_sentences: sentences },
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a module title.');
      return;
    }
    if (!microSkill.trim()) {
      setErrorMsg('Please specify a micro skill.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // Clean empty phrases/sentences
      const cleanedBasePhrases = basePhrases.filter((p) => p.german.trim() !== '');
      const cleanedBaseSentences = baseSentences.filter((s) => s.trim() !== '');

      // Clean domain variants
      const cleanedVariants: { [domain: string]: ModuleVariantContent } = {};
      for (const [dom, variant] of Object.entries(domainVariants)) {
        const vPhrases = (variant.target_phrases || []).filter((p) => p.german.trim() !== '');
        const vSentences = (variant.example_sentences || []).filter((s) => s.trim() !== '');
        if (vPhrases.length > 0 || vSentences.length > 0) {
          cleanedVariants[dom] = {
            target_phrases: vPhrases,
            example_sentences: vSentences,
          };
        }
      }

      const contentPayload: ModuleContent = {
        target_phrases: cleanedBasePhrases,
        example_sentences: cleanedBaseSentences,
        domain_variants: cleanedVariants,
        target_phrase: cleanedBasePhrases[0]?.german || '',
        english_meaning: cleanedBasePhrases[0]?.english || '',
      };

      await saveAdminModule(adminUserId, {
        ...(initialModule?.id ? { id: initialModule.id } : {}),
        level,
        module_number: Number(moduleNumber),
        title: title.trim(),
        micro_skill: microSkill.trim(),
        domain_weight_pct: Number(domainWeightPct),
        is_checkpoint: isCheckpoint,
        content: contentPayload,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save module:', err);
      setErrorMsg(err?.message || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialModule?.id) return;
    if (!window.confirm(`Are you sure you want to delete module "${initialModule.title}"?`)) return;

    try {
      setDeleting(true);
      await deleteAdminModule(adminUserId, initialModule.id, initialModule.title);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete module:', err);
      setErrorMsg(err?.message || 'Failed to delete module');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col my-auto text-[#111111] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00215C] text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#00215C]">
                {isEditing ? `Edit Module: ${initialModule?.title || ''}` : 'Create New Curriculum Module'}
              </h3>
              <p className="text-xs text-slate-500 font-body">
                Structured curriculum editor with CEFR level, micro-skill, and domain variant pairs.
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFBFF]">
          {/* Section 1: Basic Module Properties */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <h4 className="font-heading font-bold text-sm text-[#00215C] border-b border-slate-100 pb-2">
              1. General Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  CEFR Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ModuleLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#00215C]"
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Module Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={moduleNumber}
                  onChange={(e) => setModuleNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Domain Weight (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={domainWeightPct}
                  onChange={(e) => setDomainWeightPct(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Checkpoint Milestone
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isCheckpoint}
                    onChange={(e) => setIsCheckpoint(e.target.checked)}
                    className="w-4 h-4 rounded text-[#255CC1] focus:ring-0"
                  />
                  <span>Is Checkpoint Module</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Module Title
              </label>
              <input
                type="text"
                placeholder="e.g. Process Standardization & Safety Compliance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#00215C]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Micro-Skill Objective
              </label>
              <input
                type="text"
                placeholder="e.g. Explain safety compliance standards and operational guidelines using passive..."
                value={microSkill}
                onChange={(e) => setMicroSkill(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>
          </div>

          {/* Section 2: Base Target Phrases */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#00215C]">
                  2. Base Target Phrases (General Core)
                </h4>
                <p className="text-[11px] text-slate-500">
                  German phrases and corresponding English meanings taught in this module.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBasePhrase}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Phrase
              </button>
            </div>

            <div className="space-y-3">
              {basePhrases.map((phrase, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Phrase #{idx + 1}</span>
                    {basePhrases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBasePhrase(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        GERMAN (TARGET)
                      </label>
                      <input
                        type="text"
                        placeholder="German target sentence..."
                        value={phrase.german}
                        onChange={(e) => handleUpdateBasePhrase(idx, 'german', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        ENGLISH MEANING
                      </label>
                      <input
                        type="text"
                        placeholder="English translation / meaning..."
                        value={phrase.english}
                        onChange={(e) => handleUpdateBasePhrase(idx, 'english', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Base Example Sentences */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#00215C]">
                  3. Base Example Sentences
                </h4>
                <p className="text-[11px] text-slate-500">
                  Contextual German model sentences demonstrating the target skill.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBaseSentence}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sentence
              </button>
            </div>

            <div className="space-y-2">
              {baseSentences.map((sent, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Example sentence #${idx + 1}...`}
                    value={sent}
                    onChange={(e) => handleUpdateBaseSentence(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  {baseSentences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBaseSentence(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Domain-Flavored Variants */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="font-heading font-bold text-sm text-[#00215C] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#255CC1]" />
                4. Domain-Flavored Variants
              </h4>
              <p className="text-[11px] text-slate-500">
                Industry-specific phrasing tailored to healthcare, engineering, universities, or settlement.
              </p>
            </div>

            {/* Domain Tab Selector */}
            <div className="flex flex-wrap gap-2 pt-1">
              {DOMAINS.map((dom) => {
                const isActive = activeDomainTab === dom;
                const hasVariantData = Boolean(
                  domainVariants[dom]?.target_phrases?.length ||
                  domainVariants[dom]?.example_sentences?.length
                );

                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setActiveDomainTab(dom)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#00215C] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{dom}</span>
                    {hasVariantData && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-300' : 'bg-[#255CC1]'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Domain Editor Panel */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-[#00215C]">
                  {activeDomainTab} Phrases ({currentVariant.target_phrases?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={handleAddVariantPhrase}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#255CC1] text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs"
                >
                  <Plus className="w-3 h-3" /> Add Domain Phrase
                </button>
              </div>

              {(currentVariant.target_phrases || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No domain-specific phrases defined for {activeDomainTab}. Fallback to base phrases will be used.
                </p>
              ) : (
                <div className="space-y-3">
                  {(currentVariant.target_phrases || []).map((p, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>{activeDomainTab} Phrase #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantPhrase(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Domain German target..."
                            value={p.german}
                            onChange={(e) => handleUpdateVariantPhrase(idx, 'german', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Domain English meaning..."
                            value={p.english}
                            onChange={(e) => handleUpdateVariantPhrase(idx, 'english', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Domain Example Sentences */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-xs text-[#00215C]">
                    {activeDomainTab} Example Sentences ({currentVariant.example_sentences?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariantSentence}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#255CC1] text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" /> Add Domain Sentence
                  </button>
                </div>

                {(currentVariant.example_sentences || []).map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Domain example sentence #${idx + 1}...`}
                      value={s}
                      onChange={(e) => handleUpdateVariantSentence(idx, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantSentence(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex items-center justify-between shrink-0">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete Module'}
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
              {saving ? 'Saving...' : 'Save Module'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
