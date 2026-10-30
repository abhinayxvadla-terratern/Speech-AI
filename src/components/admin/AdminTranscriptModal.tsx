import React from 'react';
import { X, MessageSquare, Award, Clock, Calendar } from 'lucide-react';
import { Session, DiagnosticRecap } from '../../lib/database.types';

interface AdminTranscriptModalProps {
  session: Session | null;
  recap?: DiagnosticRecap | null;
  onClose: () => void;
}

export const AdminTranscriptModal: React.FC<AdminTranscriptModalProps> = ({
  session,
  recap,
  onClose,
}) => {
  if (!session) return null;

  const turns = Array.isArray(session.transcript) ? session.transcript : [];
  const mistakes = Array.isArray(recap?.mistakes) ? recap.mistakes : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col my-auto text-[#111111] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-[#00215C]">
                  Session Transcript & Diagnostics
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00215C] text-white">
                  {session.tab} • {session.mode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                    session.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(session.started_at).toLocaleString()}
                </span>
                {session.ended_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Duration: {Math.max(1, Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000))} min
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Diagnostic Recap Section (if present) */}
          {recap && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00215C] uppercase tracking-wider">
                <Award className="w-4 h-4 text-[#255CC1]" />
                Diagnostic Evaluation
              </div>

              {recap.summary_text_de && (
                <div className="text-xs p-3 rounded-lg bg-white border border-slate-200 text-slate-700">
                  <span className="font-bold text-[#00215C] block mb-0.5">German Summary:</span>
                  {recap.summary_text_de}
                </div>
              )}

              {(recap.summary_text_en || recap.summary_text) && (
                <div className="text-xs p-3 rounded-lg bg-white border border-slate-200 text-slate-700">
                  <span className="font-bold text-[#00215C] block mb-0.5">English Feedback:</span>
                  {recap.summary_text_en || recap.summary_text}
                </div>
              )}

              {/* Mistakes */}
              {mistakes.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recorded Mistakes ({mistakes.length})
                  </span>
                  <div className="space-y-2">
                    {mistakes.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-[#00215C] text-[11px]">{m.category}</span>
                        <div className="text-slate-600">
                          <span className="text-rose-600 font-semibold">User: </span>
                          "{m.example_de || m.example_en || m.example || '—'}"
                        </div>
                        {(m.correction_de || m.correction_en || m.correction) && (
                          <div className="text-emerald-700 font-medium">
                            <span className="font-semibold">Correction: </span>
                            "{m.correction_de || m.correction_en || m.correction}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transcript Turns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#00215C] uppercase tracking-wider">
              <span>Conversation Turns ({turns.length})</span>
            </div>

            {turns.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No transcript turns captured for this session.
              </div>
            ) : (
              <div className="space-y-3">
                {turns.map((turn: any, idx: number) => {
                  const isUser = turn.speaker === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-medium">
                        <span className={`font-bold flex items-center gap-1 ${isUser ? 'text-[#00215C]' : 'text-[#255CC1]'}`}>
                          {!isUser && (
                            <img src="/terratern-emblem.png" alt="Mascot" className="w-3.5 h-3.5 object-contain inline-block" />
                          )}
                          {isUser ? 'Learner' : 'Coach / AI'}
                        </span>
                        {turn.timestamp && <span>• {turn.timestamp}</span>}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-xl text-xs leading-relaxed font-body shadow-2xs ${
                          isUser
                            ? 'bg-[#00215C] text-white rounded-tr-xs'
                            : 'bg-slate-100 text-[#111111] rounded-tl-xs border border-slate-200/80'
                        }`}
                      >
                        {turn.text || turn.rawTranscript || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
