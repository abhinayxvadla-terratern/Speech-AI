import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { InterviewType, InterviewSampleQuestion } from '../../lib/database.types';
import { saveAdminInterviewType, deleteAdminInterviewType } from '../../services/adminContentService';

interface AdminInterviewEditModalProps {
  item: InterviewType | null; // null means create new
  adminUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

const CEFR_LEVELS = ['B1', 'B2', 'C1', 'C2'] as const;
const DOMAINS = [
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];
const CANONICAL_TYPES = [
  'Behavioral',
  'Technical',
  'Situational',
  'Panel',
  'Phone Screen'
];

export const AdminInterviewEditModal: React.FC<AdminInterviewEditModalProps> = ({
  item: initialItem,
  adminUserId,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(initialItem?.id);

  const existingContent: any = 
    initialItem?.content && typeof initialItem.content === 'object' && !Array.isArray(initialItem.content)
      ? initialItem.content
      : {};

  // Form Fields
  const [typeName, setTypeName] = useState<string>(initialItem?.type_name || CANONICAL_TYPES[0]);
  const [parentDomain, setParentDomain] = useState<string>(initialItem?.parent_domain || DOMAINS[0]);
  const [subBranch, setSubBranch] = useState<string>(initialItem?.sub_branch || '');
  const [minLevel, setMinLevel] = useState<'B1' | 'B2' | 'C1' | 'C2'>(initialItem?.min_level || 'B1');
  const [description, setDescription] = useState<string>(initialItem?.description || '');

  // Sample questions
  const initialQuestions: InterviewSampleQuestion[] = Array.isArray(existingContent.sample_questions)
    ? existingContent.sample_questions
    : [{ german: '', english: '', guidance: '' }];

  const [questions, setQuestions] = useState<InterviewSampleQuestion[]>(initialQuestions);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions([...questions, { german: '', english: '', guidance: '' }]);
  };

  const handleUpdateQuestion = (index: number, field: keyof InterviewSampleQuestion, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!typeName.trim()) {
      setErrorMsg('Please specify an interview type name.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter an interview description.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const cleanedQuestions = questions.filter((q) => q.german.trim() !== '');

      const contentPayload = {
        sample_questions: cleanedQuestions,
      };

      await saveAdminInterviewType(adminUserId, {
        ...(initialItem?.id ? { id: initialItem.id } : {}),
        type_name: typeName.trim(),
        parent_domain: parentDomain.trim(),
        sub_branch: subBranch.trim() || 'General',
        min_level: minLevel,
        description: description.trim(),
        content: contentPayload,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save interview type:', err);
      setErrorMsg(err?.message || 'Failed to save interview type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialItem?.id) return;
    if (!window.confirm(`Delete interview type "${initialItem.type_name}"?`)) return;

    try {
      setDeleting(true);
      await deleteAdminInterviewType(adminUserId, initialItem.id, initialItem.type_name);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete interview type:', err);
      setErrorMsg(err?.message || 'Failed to delete interview type');
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
              <Briefcase className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#00215C]">
                {isEditing ? `Edit Interview: ${initialItem?.type_name || ''}` : 'Create New Interview Type'}
              </h3>
              <p className="text-xs text-slate-500 font-body">
                Domain-specific interview simulation settings and sample question catalog.
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
              Interview Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Type Name
                </label>
                <input
                  type="text"
                  list="canonical-types"
                  placeholder="e.g. Technical or Behavioral"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#00215C]"
                />
                <datalist id="canonical-types">
                  {CANONICAL_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Parent Domain
                </label>
                <select
                  value={parentDomain}
                  onChange={(e) => setParentDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Minimum Level
                </label>
                <select
                  value={minLevel}
                  onChange={(e) => setMinLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#00215C]"
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Subbranch (e.g. Anesthesia Nursing, Automotive, Civil Engineering)
              </label>
              <input
                type="text"
                placeholder="Subbranch focus..."
                value={subBranch}
                onChange={(e) => setSubBranch(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Description & Interview Persona Brief
              </label>
              <textarea
                rows={3}
                placeholder="Description of the interview format, setting, and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-body"
              />
            </div>
          </div>

          {/* Form-Based Sample Questions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#00215C]">
                  Curated Sample Questions
                </h4>
                <p className="text-[11px] text-slate-500">
                  Target interview questions and response guidance.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Question #{idx + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        GERMAN QUESTION
                      </label>
                      <input
                        type="text"
                        placeholder="Wie gehen Sie in einer Krisensituation vor?"
                        value={q.german}
                        onChange={(e) => handleUpdateQuestion(idx, 'german', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          ENGLISH MEANING
                        </label>
                        <input
                          type="text"
                          placeholder="How do you proceed in a crisis situation?"
                          value={q.english}
                          onChange={(e) => handleUpdateQuestion(idx, 'english', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          RESPONSE GUIDANCE
                        </label>
                        <input
                          type="text"
                          placeholder="Use STAR method, mention protocol..."
                          value={q.guidance}
                          onChange={(e) => handleUpdateQuestion(idx, 'guidance', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
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
                {deleting ? 'Deleting...' : 'Delete Interview Type'}
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
              {saving ? 'Saving...' : 'Save Interview Type'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
