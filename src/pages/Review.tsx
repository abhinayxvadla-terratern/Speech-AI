import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  RotateCcw, 
  HelpCircle, 
  BookOpen, 
  CheckCircle2, 
  Loader2, 
  TrendingDown,
  Clock,
  Play
} from 'lucide-react';
import { 
  fetchUserMistakeReviewData, 
  recordCategoryPracticed, 
  getReviewPhrasesForCategory, 
  AggregatedMistakeCategory 
} from '../services/mistakeReviewService';
import { explainMistake, MistakeExplanation } from '../services/explainAdapter';
import { ActiveSession } from './speak/ActiveSession';
import { Module } from '../lib/database.types';

export const Review: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [categories, setCategories] = useState<AggregatedMistakeCategory[]>([]);
  
  // "Why?" explanations map keyed by categoryIndex-mistakeIndex
  const [explanations, setExplanations] = useState<Record<string, { loading: boolean; data: MistakeExplanation | null }>>({});

  // Active Practice drill state
  const [activeDrillModule, setActiveDrillModule] = useState<Module | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetchUserMistakeReviewData(user.id);
      setTotalSessions(res.totalSessions);
      setCategories(res.categories);
    } catch (err) {
      console.error('Failed to load review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleWhy = async (catIdx: number, mIdx: number, mistake: { example: string; correction: string }, category: string) => {
    const key = `${catIdx}-${mIdx}`;
    if (explanations[key]?.data) {
      // Toggle off
      setExplanations((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    setExplanations((prev) => ({
      ...prev,
      [key]: { loading: true, data: null },
    }));

    try {
      const exp = await explainMistake({
        example: mistake.example,
        correction: mistake.correction,
        category: category,
      });
      setExplanations((prev) => ({
        ...prev,
        [key]: { loading: false, data: exp },
      }));
    } catch (err) {
      console.error('Failed to fetch explanation:', err);
      setExplanations((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleStartPractice = (cat: AggregatedMistakeCategory) => {
    recordCategoryPracticed(cat.category);

    const phrases = getReviewPhrasesForCategory(cat.category, cat.exampleMistakes);

    const userCefr = profile?.cefr_level;
    const moduleLevel: 'A1' | 'A2' | 'B1' | 'B2' =
      userCefr === 'A1' || userCefr === 'A2' ? userCefr : userCefr === 'B2' ? 'B2' : 'B1';

    const drillModule: Module = {
      id: `drill-${encodeURIComponent(cat.category).toLowerCase().slice(0, 30)}`,
      level: moduleLevel,
      module_number: 999,
      title: `Practice: ${cat.category}`,
      micro_skill: 'Targeted Review Drill',
      domain_weight_pct: 0,
      content: {
        target_phrases: phrases,
      },
      is_checkpoint: false,
      created_at: new Date().toISOString(),
    };

    setActiveDrillModule(drillModule);
  };

  const handleFinishDrill = () => {
    setActiveDrillModule(null);
    loadData();
  };

  // If in active practice drill, render ActiveSession directly
  if (activeDrillModule) {
    return (
      <ActiveSession
        module={activeDrillModule}
        mode="practice"
        durationMinutes="open"
        onBack={() => setActiveDrillModule(null)}
        onCompleted={handleFinishDrill}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#00215C] p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-semibold text-slate-400">
          Personalized Review
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <TrendingDown className="w-4 h-4" />
          </span>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C]">
            Where You're Slipping
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Review recurring mistakes from your diagnostic recaps, sorted by most repeated and oldest unpracticed first.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#255CC1]" />
          <span className="text-xs font-medium">Analyzing diagnostic records...</span>
        </div>
      ) : totalSessions < 3 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#255CC1] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#00215C]">
            Almost Ready for Review
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You have completed {totalSessions} session{totalSessions === 1 ? '' : 's'}. Complete at least 3 sessions to unlock pattern analysis and targeted practice drills.
          </p>
          <button
            onClick={() => navigate('/speak')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start a Voice Workout</span>
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#00215C]">
            No High-Priority Slipping Areas!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your recent sessions have demonstrated strong accuracy without repetitive mistakes. Keep challenging yourself!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, catIdx) => {
            const isUnpracticed = !cat.lastPracticedAt;
            return (
              <div
                key={cat.category}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Category Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-base text-[#00215C]">
                        {cat.category}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                        {cat.occurrences} {cat.occurrences === 1 ? 'occurrence' : 'occurrences'}
                      </span>
                      {isUnpracticed ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                          Unpracticed
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          Last practiced: {new Date(cat.lastPracticedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartPractice(cat)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Practice this</span>
                  </button>
                </div>

                {/* Example Mistakes & Why button */}
                {cat.exampleMistakes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Sample Mistakes & Corrections
                    </span>
                    <div className="space-y-2">
                      {cat.exampleMistakes.map((m, mIdx) => {
                        const key = `${catIdx}-${mIdx}`;
                        const expState = explanations[key];

                        return (
                          <div
                            key={mIdx}
                            className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0 flex-1">
                                {m.example && (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[10px] font-bold text-rose-600 uppercase shrink-0">You said:</span>
                                    <span className="text-slate-700 italic truncate">&ldquo;{m.example}&rdquo;</span>
                                  </div>
                                )}
                                {m.correction && (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase shrink-0">Correct:</span>
                                    <span className="text-[#00215C] font-semibold">{m.correction}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleWhy(catIdx, mIdx, m, cat.category)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors shrink-0 cursor-pointer ${
                                  expState?.data
                                    ? 'bg-blue-100/80 border-blue-300 text-[#00215C]'
                                    : 'bg-white border-slate-200 text-[#255CC1] hover:bg-blue-50'
                                }`}
                                title="Learn why this mistake occurred"
                              >
                                {expState?.loading ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-[#255CC1]" />
                                ) : (
                                  <HelpCircle className="w-3 h-3 text-[#255CC1]" />
                                )}
                                <span>Why?</span>
                              </button>
                            </div>

                            {/* Slide-down Explanation panel */}
                            {expState?.data && (
                              <div className="p-2.5 rounded-lg bg-blue-50/90 border border-blue-200/80 text-slate-800 text-xs space-y-1 animate-fadeIn">
                                <div className="flex items-center gap-1 text-[#255CC1] font-bold text-[10px] uppercase tracking-wider">
                                  <BookOpen className="w-3 h-3" />
                                  <span>Explanation</span>
                                </div>
                                <p className="font-medium text-[#00215C] leading-relaxed">
                                  {expState.data.why}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
