import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Streak, Module, CefrLevel } from '../lib/database.types';
import { 
  Flame, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  Play, 
  Sparkles, 
  Clock, 
  TrendingDown, 
  Compass, 
  Briefcase, 
  Loader2
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const cefrLevel = (profile?.cefr_level as CefrLevel) || 'B1';
  const isC1C2 = cefrLevel === 'C1' || cefrLevel === 'C2';

  // Loading & State
  const [loading, setLoading] = useState<boolean>(true);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [completedModulesCount, setCompletedModulesCount] = useState<number>(0);

  // Next Recommended Action
  const [nextModule, setNextModule] = useState<Module | null>(null);
  const [allModulesCompleted, setAllModulesCompleted] = useState<boolean>(false);

  // Diagnostic Slipping Analysis
  const [slippingStats, setSlippingStats] = useState<{
    category: string;
    occurrences: number;
    totalSessions: number;
  } | null>(null);

  // Load Home dashboard data
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // 1. Fetch user streak
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (active && streakData) {
          setStreak(streakData as Streak);
        }

        // 2. Fetch completed sessions to compute accurate modules completed count
        const { data: completedSessions } = await supabase
          .from('sessions')
          .select('module_id')
          .eq('user_id', user.id)
          .eq('tab', 'speak')
          .eq('status', 'completed');

        const completedSet = new Set<string>();
        (completedSessions || []).forEach((s) => {
          if (s.module_id) completedSet.add(s.module_id);
        });

        if (active) {
          setCompletedModulesCount(completedSet.size);
        }

        // Self-heal streak record if mismatched
        if (streakData && streakData.total_modules_completed !== completedSet.size) {
          supabase
            .from('streaks')
            .update({ total_modules_completed: completedSet.size })
            .eq('user_id', user.id)
            .then();
        }

        // Determine Next Recommended Action (for B1/A1-B2 levels)
        if (!isC1C2) {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('*')
            .eq('level', cefrLevel)
            .order('module_number', { ascending: true });

          const mods = (modulesData as Module[]) || [];
          const nextIncomplete = mods.find((m) => !completedSet.has(m.id));

          if (active) {
            if (mods.length > 0 && !nextIncomplete) {
              setAllModulesCompleted(true);
            } else {
              setNextModule(nextIncomplete || null);
            }
          }
        }

        // 3. Query Diagnostic Recaps for "Where You're Slipping"
        const { data: recapsData } = await supabase
          .from('diagnostic_recaps')
          .select('mistakes')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (active && recapsData && recapsData.length >= 3) {
          const categoryCounts: Record<string, number> = {};
          recapsData.forEach((r) => {
            const mistakesList = (r.mistakes as any[]) || [];
            const seenInThisSession = new Set<string>();
            mistakesList.forEach((m) => {
              if (m.category && !seenInThisSession.has(m.category)) {
                seenInThisSession.add(m.category);
                categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
              }
            });
          });

          let topCat = '';
          let maxCount = 0;
          Object.entries(categoryCounts).forEach(([cat, cnt]) => {
            if (cnt > maxCount) {
              maxCount = cnt;
              topCat = cat;
            }
          });

          if (topCat && maxCount > 0) {
            setSlippingStats({
              category: topCat,
              occurrences: maxCount,
              totalSessions: recapsData.length,
            });
          }
        }
      } catch (err) {
        console.error('Error loading Home data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [user, cefrLevel, isC1C2]);

  // Relative Date Formatter
  const formatRelativeDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No sessions yet';
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) return 'Yesterday';

    const dateObj = new Date(dateStr);
    const todayObj = new Date(todayStr);
    const diffDays = Math.round((todayObj.getTime() - dateObj.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 1) {
      return `${diffDays} days ago`;
    }
    return dateStr;
  };

  // Quick Start Handler
  const handleQuickStart = (duration: number) => {
    navigate('/scenarios', {
      state: {
        autoStart: true,
        duration: duration,
        mode: 'practice',
      },
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
        <p className="text-xs font-medium">Loading your German progress...</p>
      </div>
    );
  }

  // ==========================================
  // NEW-USER STATE (total_sessions === 0)
  // ==========================================
  const isNewUser = !streak || streak.total_sessions === 0;

  if (isNewUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 py-8 animate-fadeIn text-[#111111]">
        {/* Executive Voice Training Mascot Badge */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200/90 flex items-center justify-center p-3 shadow-sm overflow-hidden">
            <img src="/terratern-emblem.png" alt="TerraTern Mascot" className="w-full h-full object-contain" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00215C] text-white shadow-xs">
            DE
          </span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight leading-tight">
          Master Professional Spoken German
        </h1>

        <p className="mt-3 text-sm text-slate-600 font-normal leading-relaxed">
          Realistic voice simulations tailored to your field — healthcare, Ausbildung, and university study.
        </p>

        <div className="mt-8 w-full">
          <Link
            to={isC1C2 ? '/scenarios' : '/speak'}
            className="w-full py-3.5 px-6 rounded-xl bg-[#f1c819] hover:bg-[#e6bd0d] text-[#00215C] font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99] transition-all"
          >
            <span>Start Practice</span>
            <ArrowRight className="w-4 h-4 text-[#00215C]" />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // RETURNING-USER STATE (total_sessions > 0)
  // ==========================================
  let urgencyRemainingDays: number | null = null;
  if (profile?.urgency_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(profile.urgency_date);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    urgencyRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-[#111111] animate-fadeIn">
      {/* Page Title & User Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
            Welcome, {profile?.name?.split(' ')[0] || 'Learner'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            German conversational training • {profile?.primary_domain || 'General Professional'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#255CC1]" />
            Level {cefrLevel}
          </span>
          {streak && streak.current_streak > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {streak.current_streak} {streak.current_streak === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>
      </div>

      {/* 1. QUICK SIMULATION HERO CARD (Terratern Navy & Blue) */}
      <div className="bg-gradient-to-br from-[#00215C] via-[#05296e] to-[#0f388a] rounded-2xl p-6 sm:p-7 text-white shadow-card border border-[#00215C]/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 backdrop-blur-xs">
              Quick Simulation
            </span>
            <span className="text-xs text-blue-100 font-medium">Daily Dialogue Practice</span>
          </div>
          <Sparkles className="w-4 h-4 text-blue-200" />
        </div>

        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Start Voice Practice
        </h2>
        <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-lg leading-relaxed font-normal">
          Select duration to begin an instant German roleplay scenario:
        </p>

        {/* 3 Quick-Start Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[5, 10, 15].map((mins) => (
            <button
              key={mins}
              onClick={() => handleQuickStart(mins)}
              className="py-3 px-2 rounded-xl bg-white text-[#00215C] hover:bg-slate-50 transition-all font-semibold text-xs sm:text-sm shadow-xs active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 group border border-slate-100"
            >
              <span className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C] leading-none">
                {mins} <span className="text-xs font-semibold text-slate-500">min</span>
              </span>
              <span className="text-[11px] text-[#255CC1] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 mt-0.5">
                Launch <Play className="w-3 h-3 fill-[#255CC1]" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. STREAK + STATS ROW (Unified classic cards) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Current Streak */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Daily Streak
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C]">
              {streak?.current_streak ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">days</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Active streak
          </span>
        </div>

        {/* Modules Completed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Modules
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C]">
              {completedModulesCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Completed</span>
        </div>

        {/* Last Session Date */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Last Active
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock className="w-4 h-4 text-[#255CC1] shrink-0" />
            <span className="font-heading font-bold text-sm sm:text-base text-[#00215C] truncate">
              {formatRelativeDate(streak?.last_session_date || null)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 truncate">
            {streak?.total_sessions || 0} sessions completed
          </span>
        </div>
      </div>

      {/* 3. NEXT RECOMMENDED ACTION CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider block mb-1">
          Recommended Next Step
        </span>

        {allModulesCompleted ? (
          <div className="space-y-3 pt-1">
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C]">
              You've completed all available {cefrLevel} content!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Explore Scenarios or Mock Interviews to continue practicing.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <Link
                to="/scenarios"
                className="px-4 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Compass className="w-4 h-4 text-blue-200" />
                <span>Explore Scenarios</span>
              </Link>
              <Link
                to="/interview"
                className="px-4 py-2.5 rounded-xl bg-[#EBF2FF] hover:bg-blue-100 text-[#00215C] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-100"
              >
                <Briefcase className="w-4 h-4 text-[#255CC1]" />
                <span>Practice Interviews</span>
              </Link>
            </div>
          </div>
        ) : nextModule ? (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2">
              {nextModule.is_checkpoint ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#255CC1] border border-blue-200">
                  Checkpoint Milestone
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Module {nextModule.module_number}
                </span>
              )}
            </div>

            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C] leading-snug">
              {nextModule.is_checkpoint ? 'Time for a checkpoint!' : nextModule.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {nextModule.micro_skill}
            </p>

            <div className="pt-2">
              <button
                onClick={() =>
                  navigate('/speak', {
                    state: { autoOpenModuleId: nextModule.id },
                  })
                }
                className="px-5 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C]">
              Workplace Situational Practice
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Specialized conversational practice for your field.
            </p>
            <div className="pt-1">
              <Link
                to="/scenarios"
                className="px-5 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Go to Scenarios</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. DEADLINE CARD (ONLY shown if profiles.urgency_date is set) */}
      {urgencyRemainingDays !== null && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#255CC1]" />
                Target Timeline
              </span>

              {urgencyRemainingDays > 0 ? (
                <>
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#00215C]">
                    {urgencyRemainingDays} days until target date
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Steady daily practice toward your milestone.
                  </p>
                </>
              ) : urgencyRemainingDays === 0 ? (
                <>
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#255CC1]">
                    Today is your target date!
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Today is your milestone target date.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#00215C]">
                    Target date reached
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Continue daily practice toward your next milestone.
                  </p>
                </>
              )}
            </div>

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full shrink-0 border border-slate-200/60">
              {new Date(profile!.urgency_date!).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* 5. FOCUS AREAS (ONLY shown if 3+ diagnostic_recaps rows exist) */}
      {slippingStats && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
              <TrendingDown className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#00215C] uppercase tracking-wider">
              Focus Areas
            </span>
          </div>

          <p className="font-heading font-bold text-sm sm:text-base text-[#00215C] leading-snug">
            You've had difficulty with <span className="text-[#255CC1] font-extrabold">"{slippingStats.category}"</span> in {slippingStats.occurrences} of your last {slippingStats.totalSessions} sessions.
          </p>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
            Target this pattern in your next voice simulation.
          </p>
        </div>
      )}
    </div>
  );
};
