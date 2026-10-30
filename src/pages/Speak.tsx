import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Module, Session } from '../lib/database.types';
import { SESSION_DURATIONS } from '../constants/interview';
import { ActiveSession } from './speak/ActiveSession';
import { 
  Mic, 
  Lock, 
  CheckCircle2, 
  Play, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  GraduationCap, 
  Compass, 
  Briefcase, 
  Loader2, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';

import { useKillSwitch } from '../hooks/useKillSwitch';
import { TabUnavailableBanner } from '../components/layout/TabUnavailableBanner';

type SpeakView = 'list' | 'detail' | 'session';

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
  const [selectedMode, setSelectedMode] = useState<'learn' | 'practice'>('learn');
  const [selectedDuration, setSelectedDuration] = useState<number | 'open'>(5);
  const [showTooltip, setShowTooltip] = useState<'learn' | 'practice' | null>(null);

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

      // Check for autoOpenModuleId from Home tab
      if (location.state?.autoOpenModuleId && modList.length > 0) {
        const targetMod = modList.find((m) => m.id === location.state.autoOpenModuleId);
        if (targetMod) {
          setSelectedModule(targetMod);
          checkIncompleteSession(targetMod);
          setView('detail');
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

  // Open Module Detail
  const handleSelectModule = (mod: Module, isAccessible: boolean) => {
    if (!isAccessible) return;
    setSelectedModule(mod);
    checkIncompleteSession(mod);
    setView('detail');
  };

  // Start fresh session (or abandon old incomplete session)
  const handleStartFresh = async (mode: 'learn' | 'practice') => {
    if (incompleteSession && user) {
      await supabase
        .from('sessions')
        .update({ status: 'abandoned' })
        .eq('id', incompleteSession.id);
      setIncompleteSession(null);
    }
    setSelectedMode(mode);
    setView('session');
  };

  // Resume unfinished session
  const handleResumeSession = () => {
    if (!incompleteSession) return;
    setSelectedMode(incompleteSession.mode as 'learn' | 'practice');
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
  // ACTIVE SESSION VIEW
  // ==========================================
  if (view === 'session' && selectedModule) {
    return (
      <ActiveSession
        module={selectedModule}
        mode={selectedMode}
        durationMinutes={selectedDuration}
        initialSessionId={incompleteSession?.id || null}
        initialTranscript={(incompleteSession?.transcript as any) || []}
        onBack={() => {
          setView('detail');
          checkIncompleteSession(selectedModule);
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
  // MODULE DETAIL VIEW
  // ==========================================
  if (view === 'detail' && selectedModule) {
    const isCompleted = completedModuleIds.has(selectedModule.id);
    const content = (selectedModule.content as any) || {};
    const userDomain = profile?.primary_domain;
    const domainVariant = userDomain && content.domain_variants?.[userDomain] ? content.domain_variants[userDomain] : null;
    const effectiveContent = domainVariant || content;
    const targetPhrases: Array<{ german: string; english: string }> = 
      effectiveContent.target_phrases || 
      (effectiveContent.target_phrase ? [{ german: effectiveContent.target_phrase, english: effectiveContent.english_meaning || '' }] : []);
    const exampleSentences: string[] = effectiveContent.example_sentences || [];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
        {/* Detail Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setView('list');
              setSelectedModule(null);
              setIncompleteSession(null);
            }}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Curriculum</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{selectedModule.is_checkpoint ? `${userDomain} · Checkpoint Milestone` : `${selectedModule.level} · Module ${selectedModule.module_number}`}</span>
          </span>
        </div>

        {/* Module Detail Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Micro-Skill Focus
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                  </span>
                )}
                {selectedModule.is_checkpoint && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200">
                    Checkpoint
                  </span>
                )}
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
                {selectedModule.title}
              </h2>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Objective
            </span>
            <p className="text-sm text-slate-700 font-normal leading-relaxed">
              {selectedModule.micro_skill}
            </p>
          </div>

          {/* Target Phrases Section */}
          {targetPhrases.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00215C] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
                  Key Target Phrases
                </span>
                {domainVariant ? (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200">
                    {userDomain} Track ({selectedModule.domain_weight_pct}% focus)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/60">
                    Standard Track
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {targetPhrases.map((phrase, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <p className="font-heading font-bold text-sm sm:text-base text-[#00215C]">
                      {phrase.german}
                    </p>
                    {phrase.english && (
                      <p className="text-xs text-slate-500 font-normal mt-0.5 italic">
                        "{phrase.english}"
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {exampleSentences.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Example Context:
                  </span>
                  <div className="space-y-1.5">
                    {exampleSentences.map((sentence, idx) => (
                      <p key={idx} className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed font-normal">
                        • {sentence}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INCOMPLETE SESSION ALERT PROMPT */}
          {incompleteSession && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-amber-950">
                    Unfinished Session Detected
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-normal">
                    You have an unfinished session from earlier — resume where you left off or start fresh?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResumeSession}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Resume Session ({incompleteSession.mode.toUpperCase()})
                </button>
                <button
                  onClick={() => handleStartFresh('learn')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Mode Selection / Action Buttons (Unified Setup Pattern) */}
          <div className="space-y-4 pt-1">
            {/* Mode Selector Pills */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  MODE
                </span>
                <span className="sr-only">Select Mode:</span>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('learn')}
                    onMouseEnter={() => setShowTooltip('learn')}
                    onMouseLeave={() => setShowTooltip(null)}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      selectedMode === 'learn'
                        ? 'bg-[#00215C] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>Learn</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTooltip(showTooltip === 'learn' ? null : 'learn');
                      }}
                      className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 opacity-70" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('practice')}
                    onMouseEnter={() => setShowTooltip('practice')}
                    onMouseLeave={() => setShowTooltip(null)}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      selectedMode === 'practice'
                        ? 'bg-[#00215C] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>Practice</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTooltip(showTooltip === 'practice' ? null : 'practice');
                      }}
                      className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 opacity-70" />
                    </span>
                  </button>
                </div>

                {/* Tooltip */}
                {showTooltip && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-800 text-white text-xs leading-relaxed text-center animate-fadeIn shadow-md">
                    {showTooltip === 'learn'
                      ? 'Guided practice with instant feedback after each spoken turn.'
                      : 'Unscaffolded dialogue simulation with full diagnostic review at completion.'}
                  </div>
                )}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  SESSION LENGTH
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  {selectedDuration === 'open' ? 'Open-ended' : `${selectedDuration} minutes`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {SESSION_DURATIONS.map((opt) => {
                  const isSelected = selectedDuration === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedDuration(opt.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all select-none text-center ${
                        isSelected
                          ? 'bg-[#00215C] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRIMARY CTA BUTTON (TERRATERN BRAND ACCENT BUTTON) */}
            <div className="flex flex-col items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => handleStartFresh(selectedMode)}
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-[#f1c819] hover:bg-[#e6bd0d] text-[#00215C] font-bold text-sm shadow-card hover:shadow-brand transition-all flex items-center justify-center gap-2.5 group active:scale-[0.99]"
              >
                <span>Start voice session</span>
                <Play className="w-4 h-4 fill-current text-[#00215C] group-hover:scale-110 transition-transform" />
              </button>
              <span className="sr-only">Start Session</span>
            </div>
          </div>
        </div>
      </div>
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
