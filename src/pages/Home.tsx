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
  Loader2,
  Smartphone
} from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { PWAInstallInstructionsModal } from '../components/pwa/PWAInstallInstructionsModal';

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { isInstalled, installApp, showInstructionsModal, setShowInstructionsModal } = usePwaInstall();
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
  // UNIFIED USER STATE (Consistent for all users)
  // ==========================================
  const isNewUser = !streak || streak.total_sessions === 0;

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
    <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto text-[#111111] animate-fadeIn pb-6">
      {/* Page Title & User Greeting Header (with Level on the right) */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
            Welcome{isNewUser ? '' : ' back'}, {profile?.name?.split(' ')[0] || 'Learner'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            German Spoken Training • {profile?.primary_domain || 'General Professional'}
          </p>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200/80 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#255CC1]" />
            Level {cefrLevel}
          </span>
        </div>
      </div>

      {/* 1. PRIMARY HERO CARD: TODAY'S SPOKEN WORKOUT (Classic & Clean - Deep Navy & White) */}
      <div className="bg-gradient-to-br from-[#00215C] via-[#052d75] to-[#0a3a96] rounded-3xl p-6 sm:p-7 text-white shadow-card border border-[#00215C]/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-xs shadow-2xs flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-200" />
              Today's Spoken Workout
            </span>
            {nextModule && (
              <span className="text-xs text-blue-200/90 font-semibold">
                Module {nextModule.module_number}
              </span>
            )}
          </div>
          <Sparkles className="w-4 h-4 text-blue-200/70" />
        </div>

        {allModulesCompleted ? (
          <div className="space-y-3 pt-1">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              You've completed all {cefrLevel} modules!
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal max-w-lg">
              Reinforce your fluency with realistic workplace roleplays or mock interviews.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <Link
                to="/scenarios"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#00215C] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <Compass className="w-4 h-4 text-[#255CC1]" />
                <span>Explore Scenarios</span>
              </Link>
              <Link
                to="/interview"
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors border border-white/20"
              >
                <Briefcase className="w-4 h-4 text-blue-200" />
                <span>Mock Interviews</span>
              </Link>
            </div>
          </div>
        ) : nextModule ? (
          <div className="space-y-2 pt-1">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-snug">
              {nextModule.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-lg leading-relaxed font-normal">
              {nextModule.micro_skill || 'Master natural German spoken phrasing with immediate AI feedback.'}
            </p>

            <div className="pt-3">
              <button
                onClick={() =>
                  navigate('/speak', {
                    state: { autoOpenModuleId: nextModule.id },
                  })
                }
                className="py-3 px-6 rounded-xl bg-white hover:bg-blue-50 text-[#00215C] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer group"
              >
                <span>
                  {nextModule.is_checkpoint
                    ? 'Start Checkpoint Milestone (5 min)'
                    : "Start Today's Workout (5 min)"}
                </span>
                <ArrowRight className="w-4 h-4 text-[#255CC1] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {isNewUser ? "Start Your Spoken German Workout" : "Workplace Situational Practice"}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-lg leading-relaxed font-normal">
              {isNewUser
                ? "Interactive voice simulations tailored to your field — speak naturally with instant feedback."
                : "Practice specialized conversational German tailored for your professional domain."}
            </p>
            <div className="pt-3">
              <Link
                to={isC1C2 ? '/scenarios' : '/speak'}
                className="py-3 px-6 rounded-xl bg-white hover:bg-blue-50 text-[#00215C] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all group"
              >
                <span>Start Practice (5 min)</span>
                <ArrowRight className="w-4 h-4 text-[#255CC1] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 2. STREAK + STATS ROW (Clean 3-column metric cards) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Current Streak */}
        <div className="min-w-0 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            Daily Streak
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="font-heading font-extrabold text-lg sm:text-2xl text-[#00215C]">
              {streak?.current_streak ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">days</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Active streak
          </span>
        </div>

        {/* Modules Completed */}
        <div className="min-w-0 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            Completed
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="font-heading font-extrabold text-lg sm:text-2xl text-[#00215C]">
              {completedModulesCount}
            </span>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">modules</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Level {cefrLevel}</span>
        </div>

        {/* Last Session Date */}
        <div className="min-w-0 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            Last Active
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1 min-w-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#255CC1] shrink-0" />
            <span className="font-heading font-bold text-xs sm:text-base text-[#00215C] truncate">
              {formatRelativeDate(streak?.last_session_date || null)}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            {streak?.total_sessions || 0} sessions
          </span>
        </div>
      </div>

      {/* 3. QUICK SIMULATION ROW (Compact Roleplay Shortcut) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#255CC1] border border-blue-100">
              Instant Roleplay
            </span>
            <h3 className="font-heading font-bold text-sm sm:text-base text-[#00215C]">
              Quick Spoken Simulation
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Practice spontaneous conversation in a realistic scenario
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 shrink-0">
          {[5, 10, 15].map((mins) => (
            <button
              key={mins}
              onClick={() => handleQuickStart(mins)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-[#EBF2FF] text-[#00215C] hover:text-[#255CC1] border border-slate-200/70 hover:border-blue-200 transition-all font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
            >
              <span>{mins}m</span>
              <Play className="w-2.5 h-2.5 fill-current" />
            </button>
          ))}
        </div>
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

      {/* 6. GET APP BANNER (Shown when app is not installed - disappears on install) */}
      {!isInstalled && (
        <div className="bg-gradient-to-r from-[#00215C] via-[#052d75] to-[#0a3a96] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-blue-900/40 animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15 shadow-xs">
                <Smartphone className="w-5 h-5 text-blue-200" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-extrabold text-xs sm:text-sm text-white leading-tight">
                  Get SpeechAI App
                </h4>
                <p className="text-[11px] sm:text-xs text-blue-200/90 leading-tight mt-0.5 truncate font-normal">
                  Install on your computer or mobile device for 1-click voice practice
                </p>
              </div>
            </div>
            <button
              onClick={installApp}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#00215C] text-xs font-extrabold shrink-0 shadow-xs cursor-pointer active:scale-[0.97] transition-all flex items-center gap-1.5"
            >
              <span>Install App</span>
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Instructions Modal for mobile */}
      <PWAInstallInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </div>
  );
};
