import React from 'react';
import { Award } from 'lucide-react';
import { DiagnosticRecapResult } from '../services/diagnosticService';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  mode: 'learn' | 'practice';
  recap: DiagnosticRecapResult;
  actionButtonText: string;
  onActionButtonClick: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  title,
  subtitle,
  mode,
  recap,
  actionButtonText,
  onActionButtonClick,
}) => {
  if (!isOpen) return null;

  const isPractice = mode === 'practice';
  const hasGermanRecap = isPractice && Boolean(recap.summary_text_de);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-xl border border-slate-200/80 animate-fadeIn space-y-5 my-8 text-[#111111]">
        <div className="w-12 h-12 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
          <Award className="w-6 h-6" />
        </div>

        <div className="text-center">
          <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF2FF] border border-blue-100">
            Session Completed
          </span>
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] mt-2">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {subtitle}
          </p>
        </div>

        {/* Performance Summary / Recaps */}
        {isPractice ? (
          <div className="space-y-3">
            {/* German Recap Shown FIRST for Practice mode */}
            {hasGermanRecap && (
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#00215C] font-bold">
                  <span className="text-sm">🇩🇪</span>
                  <span className="uppercase tracking-wider font-extrabold text-[11px]">German Summary</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-normal">{recap.summary_text_de}</p>
              </div>
            )}

            {/* English Recap Shown BENEATH German */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#00215C] font-bold">
                <span className="text-sm">🇬🇧</span>
                <span className="uppercase tracking-wider font-extrabold text-[11px]">English Summary</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-normal">
                {recap.summary_text_en || recap.summary_text || recap.summaryText}
              </p>
            </div>
          </div>
        ) : (
          /* Learn Sessions: English summary only */
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-[#00215C] uppercase tracking-wider text-[11px]">Performance Summary</p>
            <p className="text-slate-800 leading-relaxed font-normal">
              {recap.summary_text_en || recap.summary_text || recap.summaryText}
            </p>
          </div>
        )}

        {/* Diagnostic Mistakes */}
        {recap.mistakes && recap.mistakes.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-[#00215C] uppercase tracking-wider">
              Diagnostic Insights:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recap.mistakes.map((m, i) => {
                const rawSpoken = m.example_de || m.example_en || m.example || '';
                const correctedVersion = isPractice
                  ? (m.correction_de || m.correction || m.correction_en)
                  : (m.correction_en || m.correction || m.correction_de);
                const hasCorrection = Boolean(
                  correctedVersion &&
                  correctedVersion.trim() !== '' &&
                  correctedVersion.trim().toLowerCase() !== rawSpoken.trim().toLowerCase()
                );

                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00215C]">{m.category}</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Distinct Element 1: What the user said */}
                      <div className="p-2 rounded-lg bg-white border border-rose-100 flex items-start gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 shrink-0">
                          You said:
                        </span>
                        <span className="text-slate-800 font-medium text-xs break-words">
                          {rawSpoken || '—'}
                        </span>
                      </div>

                      {/* Distinct Element 2: Correction */}
                      {hasCorrection && (
                        <div className="p-2 rounded-lg bg-white border border-emerald-100 flex items-start gap-1.5 shadow-2xs">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 shrink-0">
                            Correction:
                          </span>
                          <div className="text-xs break-words font-normal">
                            <span className="font-bold text-emerald-900">
                              {correctedVersion}
                            </span>
                            {isPractice && m.correction_en && m.correction_de && m.correction_en !== m.correction_de && (
                              <span className="text-slate-500 italic block mt-0.5">
                                {m.correction_en}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onActionButtonClick}
            className="w-full py-3.5 px-5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            {actionButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
