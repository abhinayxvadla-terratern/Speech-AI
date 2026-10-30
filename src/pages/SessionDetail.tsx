import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DiagnosticRecapResult } from '../services/diagnosticService';
import { ArrowLeft, Award, Clock, Loader2, AlertCircle, MessageSquare } from 'lucide-react';

export const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [recap, setRecap] = useState<DiagnosticRecapResult | null>(null);

  useEffect(() => {
    const fetchSessionAndRecap = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Fetch Session
        const { data: sessionData, error: sErr } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (sErr || !sessionData) {
          throw new Error('Session not found.');
        }
        setSession(sessionData);

        // 2. Fetch Diagnostic Recap
        const { data: recapData, error: rErr } = await supabase
          .from('diagnostic_recaps')
          .select('*')
          .eq('session_id', id)
          .maybeSingle();

        if (rErr) throw rErr;
        if (recapData) {
          setRecap(recapData as DiagnosticRecapResult);
        }
      } catch (err: any) {
        console.error('Error loading session detail:', err);
        setErrorMsg(err.message || 'Could not load session.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndRecap();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
        <p className="text-xs font-medium">Loading session diagnostic recap...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-lg text-[#00215C]">
          {errorMsg || 'Session Not Found'}
        </h3>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-semibold hover:bg-[#143471] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const mode = (session.mode as 'learn' | 'practice') || 'learn';
  const isPractice = mode === 'practice';
  const hasGermanRecap = isPractice && Boolean(recap?.summary_text_de);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 uppercase tracking-wider">
          {session.tab?.toUpperCase()} • {mode.toUpperCase()}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
            <Award className="w-6 h-6" />
          </div>

          <div>
            <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider block">
              Session Performance Review
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] mt-0.5">
              {session.scenario_type || session.interview_type || 'Spoken German Session'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {session.started_at ? new Date(session.started_at).toLocaleString() : 'Recent'}
              </span>
              <span>•</span>
              <span>{Array.isArray(session.transcript) ? `${session.transcript.length} turns` : ''}</span>
            </div>
          </div>
        </div>

        {recap ? (
          <div className="space-y-4 pt-1">
            {/* Summary Section */}
            {isPractice ? (
              <div className="space-y-3">
                {/* German Recap FIRST in Practice Mode */}
                {hasGermanRecap && (
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#00215C] font-bold">
                      <span className="text-base">🇩🇪</span>
                      <span className="uppercase tracking-wider font-extrabold text-xs">German Summary</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed text-sm font-normal">{recap.summary_text_de}</p>
                  </div>
                )}

                {/* English Recap BENEATH German */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#00215C] font-bold">
                    <span className="text-base">🇬🇧</span>
                    <span className="uppercase tracking-wider font-extrabold text-xs">English Summary</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed text-sm font-normal">
                    {recap.summary_text_en || recap.summary_text}
                  </p>
                </div>
              </div>
            ) : (
              /* Learn Mode: English Recap Only */
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1">
                <p className="font-bold text-[#00215C] uppercase tracking-wider text-xs">Performance Summary</p>
                <p className="text-slate-800 leading-relaxed text-sm font-normal">
                  {recap.summary_text_en || recap.summary_text}
                </p>
              </div>
            )}

            {/* Diagnostic Mistakes */}
            <div className="space-y-2.5 pt-2">
              <h4 className="font-heading font-extrabold text-sm text-[#00215C] uppercase tracking-wide">
                Key Diagnostic Feedback
              </h4>

              {recap.mistakes && recap.mistakes.length > 0 ? (
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
                      <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-600 font-semibold">
                          <span className="font-bold text-[#00215C] text-sm">{m.category}</span>
                        </div>

                        <div className="space-y-1.5">
                          {/* Distinct Element 1: What the user said */}
                          <div className="p-2.5 rounded-lg bg-white border border-rose-100 flex items-start gap-2 shadow-2xs">
                            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 shrink-0">
                              You said:
                            </span>
                            <span className="text-slate-800 font-medium text-xs break-words">
                              {rawSpoken || '—'}
                            </span>
                          </div>

                          {/* Distinct Element 2: Correction */}
                          {hasCorrection && (
                            <div className="p-2.5 rounded-lg bg-white border border-emerald-100 flex items-start gap-2 shadow-2xs">
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
              ) : (
                <p className="text-xs text-slate-400 italic">No specific errors recorded for this session.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
            No diagnostic recap was generated for this session yet.
          </div>
        )}

        {/* Verbatim Session Transcript Viewer */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-extrabold text-sm text-[#00215C] uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#255CC1]" />
              <span>Session Transcript (Verbatim)</span>
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              {Array.isArray(session.transcript) ? `${session.transcript.length} turns` : '0 turns'}
            </span>
          </div>

          {Array.isArray(session.transcript) && session.transcript.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              {session.transcript.map((turn: any, tIdx: number) => {
                const isUser = turn.speaker === 'user';
                const rawText = turn.rawTranscript || turn.text;
                return (
                  <div key={tIdx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden ${
                        isUser ? 'bg-[#00215C] text-white shadow-2xs' : 'bg-white border border-slate-200/90 p-0.5 shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        'You'
                      ) : (
                        <img src="/terratern-emblem.png" alt="Mascot" className="w-full h-full object-contain" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#00215C] text-white rounded-tr-xs shadow-2xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-blue-200' : 'text-[#00215C]'}`}>
                          {isUser ? 'You said (Verbatim)' : 'Tutor / Interviewer'}
                        </span>
                        {turn.timestamp && (
                          <span className={`text-[9px] ${isUser ? 'text-blue-200/80' : 'text-slate-400'}`}>
                            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="font-normal">{rawText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No transcript recorded for this session.</p>
          )}
        </div>
      </div>
    </div>
  );
};
