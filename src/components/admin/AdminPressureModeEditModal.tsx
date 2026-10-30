import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Save, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { PressureModeRecord } from '../../lib/database.types';
import { saveAdminPressureMode, deleteAdminPressureMode } from '../../services/adminContentService';

interface AdminPressureModeEditModalProps {
  item: PressureModeRecord | null; // null means create new
  adminUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminPressureModeEditModal: React.FC<AdminPressureModeEditModalProps> = ({
  item: initialItem,
  adminUserId,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(initialItem?.id);

  const [id, setId] = useState<string>(initialItem?.id || '');
  const [name, setName] = useState<string>(initialItem?.name || '');
  const [description, setDescription] = useState<string>(initialItem?.description || '');
  const [badgeColor, setBadgeColor] = useState<string>(
    initialItem?.badge_color || 'bg-blue-50 text-[#255CC1] border-blue-200'
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a pressure mode name.');
      return;
    }
    const finalId = id.trim() || name.trim();

    try {
      setSaving(true);
      setErrorMsg(null);

      await saveAdminPressureMode(adminUserId, {
        id: finalId,
        name: name.trim(),
        description: description.trim(),
        badge_color: badgeColor.trim(),
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save pressure mode:', err);
      setErrorMsg(err?.message || 'Failed to save pressure mode');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialItem?.id) return;
    if (!window.confirm(`Delete pressure mode "${initialItem.name}"?`)) return;

    try {
      setDeleting(true);
      await deleteAdminPressureMode(adminUserId, initialItem.id, initialItem.name);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete pressure mode:', err);
      setErrorMsg(err?.message || 'Failed to delete pressure mode');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col text-[#111111] animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00215C] text-white flex items-center justify-center">
              <Sliders className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#00215C]">
                {isEditing ? `Edit Pressure Mode: ${initialItem?.name || ''}` : 'New Pressure Mode'}
              </h3>
              <p className="text-xs text-slate-500 font-body">
                Interviewer pacing & pressure simulation settings.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="px-5 py-2 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2 border-b border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-4 text-xs font-body">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Mode Name
            </label>
            <input
              type="text"
              placeholder="e.g. Standard, High-Pressure, Relaxed"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEditing && !id) setId(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-[#00215C]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Description / Cadence
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Fast follow-ups, interruptions simulated..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Badge Styling Class (Tailwind)
            </label>
            <input
              type="text"
              placeholder="e.g. bg-blue-50 text-[#255CC1] border-blue-200"
              value={badgeColor}
              onChange={(e) => setBadgeColor(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[11px]"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Preview:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                {name || 'Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex items-center justify-between">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
