import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Module, Session } from '../lib/database.types';
import { ActiveSession } from './speak/ActiveSession';
import { 
  Mic, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Compass, 
  Briefcase, 
  Loader2, 
  BookOpen
} from 'lucide-react';

import { useKillSwitch } from '../hooks/useKillSwitch';
import { TabUnavailableBanner } from '../components/layout/TabUnavailableBanner';

type SpeakView = 'list' | 'session';

export const Speak: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const { disabledTabs } = useKillSwitch();

  if (disabledTabs.includes('speak')) {
    return <TabUnavailableBanner title="Speak Module Temporarily Unavailable" />;
  }
  const cefrLevel = profile?.cefr_level || 'B1';

  // Navigation State
  const [view, setView] = useState<SpeakView>('list');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const selectedDuration: number | 'open' = 5;

  // Modules & Sessions Data
  const [modules, setModules] = useState<Module[]>([]);
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  // Incomplete session for selected module
  const [incompleteSession, setIncompleteSession] = useState<Session | null>(null);

  // Fetch modules & completed sessions for current level
  const loadModuleData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // 1. Fetch modules for current user's CEFR level
      const { data: modData, error: modErr } = await supabase
        .from('modules')
        .select('*')
        .eq('level', cefrLevel)
        .order('module_number', { ascending: true });

      if (modErr) throw modErr;
      const modList = (modData as Module[]) || [];
      setModules(modList);

      // Check for autoOpenModuleId from Home tab: open session directly
      if (location.state?.autoOpenModuleId && modList.length > 0) {
        const targetMod = modList.find((m) => m.id === location.state.autoOpenModuleId);
        if (targetMod) {
          setSelectedModule(targetMod);
          checkIncompleteSession(targetMod);
          setView('session');
        }
      }

      // 2. Fetch completed sessions
      const { data: sessData, error: sessErr } = await supabase
        .from('sessions')
        .select('module_id')
        .eq('user_id', user.id)
        .eq('tab', 'speak')
        .eq('status', 'completed');

      if (sessErr) throw sessErr;

      const completedIds = new Set<string>();
      (sessData || []).forEach((s) => {
        if (s.module_id) completedIds.add(s.module_id);
      });
      setCompletedModuleIds(completedIds);
    } catch (err) {
      console.error('Error loading speak module data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData();
  }, [user, cefrLevel]);

  // Check for incomplete session when selecting a module
  const checkIncompleteSession = async (mod: Module) => {
    if (!user) return;
    setIncompleteSession(null);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', mod.id)
        .eq('status', 'incomplete')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setIncompleteSession(data as Session);
      }
    } catch (err) {
      console.error('Error checking incomplete session:', err);
    }
  };

  // Open Module directly into Learn Mode Speaking session
  const handleSelectModule = (mod: Module, isAccessible: boolean) => {
    if (!isAccessible) return;
    setSelectedModule(mod);
    checkIncompleteSession(mod);
    setView('session');
  };

  // Module Status Calculator
  const getModuleStatus = (index: number, mod: Module): 'completed' | 'available' | 'locked' => {
    if (completedModuleIds.has(mod.id)) {
      return 'completed';
    }
    if (index === 0) {
      return 'available';
    }
    const prevModule = modules[index - 1];
    if (prevModule && completedModuleIds.has(prevModule.id)) {
      return 'available';
    }
    return 'locked';
  };

  // ==========================================
  // C1/C2 USER ROUTING NOTICE
  // ==========================================
  if (cefrLevel === 'C1' || cefrLevel === 'C2') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <GraduationCap className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold mb-2">
            Level {cefrLevel} • Advanced Fluency
          </span>

          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            Conversational Practice at {cefrLevel}
          </h2>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto font-normal">
            Advanced practice at {cefrLevel} is conversation-based. Use Scenarios or Interview for open practice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-md mx-auto">
            <Link
              to="/scenarios"
              className="p-4 rounded-xl bg-[#00215C] text-white hover:bg-[#143471] transition-all flex items-center justify-between shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-blue-200" />
                <span className="font-semibold text-sm">Workplace Scenarios</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/interview"
              className="p-4 rounded-xl bg-[#EBF2FF] text-[#00215C] hover:bg-blue-100 transition-all flex items-center justify-between shadow-xs group border border-blue-100"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-[#255CC1]" />
                <span className="font-semibold text-sm">Mock Interviews</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#255CC1] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE SESSION VIEW (DIRECT TO LEARN MODE)
  // ==========================================
  if (view === 'session' && selectedModule) {
    return (
      <ActiveSession
        module={selectedModule}
        mode="learn"
        durationMinutes={selectedDuration}
        initialSessionId={incompleteSession?.id || null}
        initialTranscript={(incompleteSession?.transcript as any) || []}
        onBack={() => {
          setView('list');
          setSelectedModule(null);
          setIncompleteSession(null);
        }}
        onCompleted={() => {
          setView('list');
          setSelectedModule(null);
          setIncompleteSession(null);
          loadModuleData();
        }}
      />
    );
  }

  // ==========================================
  // MODULE LIST VIEW (DEFAULT)
  // ==========================================
  const completedCount = completedModuleIds.size;
  const totalCount = modules.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-[#111111] animate-fadeIn">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center border border-blue-100 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] tracking-tight">
                Speak Curriculum
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Structured voice lessons calibrated for CEFR {cefrLevel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#255CC1] border border-blue-100">
              Level {cefrLevel}
            </span>
          </div>
        </div>

        {/* Progress Bar Row */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Progress: <strong className="text-[#00215C]">{completedCount}</strong> of {totalCount} completed
            </span>
            <span className="font-bold text-[#255CC1]">{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div 
              className="h-full bg-[#255CC1] rounded-full transition-all duration-300" 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
          <p className="text-xs font-medium">Loading {cefrLevel} speech modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="py-14 px-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#00215C]">
            Module content for {cefrLevel} is in development
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Module lessons for level {cefrLevel} are in development.
          </p>
        </div>
      ) : (
        /* Module Cards List */
        <div className="space-y-3">
          {modules.map((mod, index) => {
            const status = getModuleStatus(index, mod);
            const isCompleted = status === 'completed';
            const isAvailable = status === 'available';
            const isLocked = status === 'locked';

            return (
              <div
                key={mod.id}
                onClick={() => handleSelectModule(mod, !isLocked)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all select-none ${
                  isLocked
                    ? 'bg-slate-50/70 border-slate-200/60 opacity-60 cursor-not-allowed'
                    : isCompleted
                    ? 'bg-white border-slate-200/90 shadow-xs hover:border-[#255CC1]/50 cursor-pointer'
                    : 'bg-white border-slate-200/90 shadow-xs hover:border-[#255CC1] cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Status Circle Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isAvailable
                          ? 'bg-[#00215C] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                      ) : (
                        <span>{mod.module_number}</span>
                      )}
                    </div>

                    {/* Module Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Module {mod.module_number}
                        </span>

                        {mod.is_checkpoint && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#255CC1] border border-blue-200">
                            Checkpoint
                          </span>
                        )}

                        {isCompleted && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Completed
                          </span>
                        )}

                        {profile?.primary_domain && (mod.content as any)?.domain_variants?.[profile.primary_domain] && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                            {profile.primary_domain} ({mod.domain_weight_pct}%)
                          </span>
                        )}
                      </div>

                      <h3
                        className={`font-heading font-bold text-base sm:text-lg leading-snug ${
                          isLocked ? 'text-slate-400' : 'text-[#00215C]'
                        }`}
                      >
                        {mod.title}
                      </h3>

                      <p
                        className={`text-xs mt-1 leading-relaxed font-normal ${
                          isLocked ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {mod.micro_skill}
                      </p>
                    </div>
                  </div>

                  {/* Right Action Chevron */}
                  <div className="shrink-0 self-center">
                    {isLocked ? (
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-[#255CC1] hover:text-white hover:border-[#255CC1] transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
