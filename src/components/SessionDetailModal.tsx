import React, { useState } from 'react';
import { Award, HelpCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { DiagnosticRecapResult } from '../services/diagnosticService';
import { FeedbackModal } from './feedback/FeedbackModal';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  mode: 'learn' | 'practice';
  recap: DiagnosticRecapResult;
  actionButtonText: string;
  onActionButtonClick: () => void;
  sessionId?: string | null;
  isRepeatedMistakePause?: boolean;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  title,
  subtitle,
  mode,
  recap,
  actionButtonText,
  onActionButtonClick,
  sessionId = null,
  isRepeatedMistakePause = false,
}) => {
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const isPractice = mode === 'practice';
  const hasGermanRecap = isPractice && Boolean(recap.summary_text_de);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-5 sm:p-7 max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200/80 animate-fadeIn my-auto text-[#111111]">
        {/* Modal Header */}
        <div className="shrink-0 text-center pb-2">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto border shadow-xs mb-3 ${
            isRepeatedMistakePause
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-[#EBF2FF] text-[#255CC1] border-blue-100'
          }`}>
            {isRepeatedMistakePause ? (
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
            isRepeatedMistakePause
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-[#EBF2FF] text-[#255CC1] border-blue-100'
          }`}>
            {isRepeatedMistakePause ? 'Manual Review Required' : 'Session Completed'}
          </span>
          <h3 className="font-heading font-extrabold text-lg sm:text-2xl text-[#00215C] mt-2">
            {isRepeatedMistakePause ? 'Time to Review & Read' : title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {subtitle}
          </p>
        </div>

        {/* 5-Mistake Threshold Notice Banner */}
        {isRepeatedMistakePause && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 my-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">5 Repeated Mistakes Detected</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed font-normal">
                Let's step back from voice practice for a moment. Please read the correct grammatical pattern and example corrections below at your own pace before trying again.
              </p>
            </div>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
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
              <div className="space-y-2">
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
        </div>

        {/* Modal Action Footer */}
        <div className="shrink-0 pt-3 border-t border-slate-100 space-y-2">
          {/* Diagnostic Feedback Help Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#255CC1] transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="underline underline-offset-2">Something wrong with this feedback?</span>
            </button>
          </div>

          <button
            onClick={onActionButtonClick}
            className="w-full py-3.5 px-5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            {actionButtonText}
          </button>
        </div>
      </div>

      {/* Embedded Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultCategory="Content issue"
        sessionId={sessionId || (recap as any)?.session_id || null}
      />
    </div>
  );
};
