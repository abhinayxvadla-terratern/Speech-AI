import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { InterviewType, Session, PressureMode, CefrLevel } from '../lib/database.types';
import { PRESSURE_MODES, INTERVIEW_DURATIONS } from '../constants/interview';
import { ActiveInterviewSession } from './interview/ActiveInterviewSession';
import { ExamModeFlow } from './interview/ExamModeFlow';
import { 
  Briefcase, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Loader2, 
  Zap, 
  HelpCircle,
  Info
} from 'lucide-react';

import { useKillSwitch } from '../hooks/useKillSwitch';
import { TabUnavailableBanner } from '../components/layout/TabUnavailableBanner';
import { getFallbackInterviewQuestions } from '../constants/interviewFallbacks';

type InterviewView = 'list' | 'setup' | 'session' | 'exam';

export const Interview: React.FC = () => {
  const { user, profile } = useAuth();
  const { disabledTabs } = useKillSwitch();

  if (disabledTabs.includes('interview')) {
    return <TabUnavailableBanner title="Interview Module Temporarily Unavailable" />;
  }
  const cefrLevel = (profile?.cefr_level as CefrLevel) || 'B1';
  const primaryDomain = profile?.primary_domain;
  const primarySubbranch = profile?.primary_subbranch;

  // View & Setup State
  const [view, setView] = useState<InterviewView>('list');
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [isOpenInterviewSelected, setIsOpenInterviewSelected] = useState<boolean>(false);

  // Configuration options
  const [pressureMode, setPressureMode] = useState<PressureMode>('Standard');
  const [durationMinutes, setDurationMinutes] = useState<number | 'open'>(5);
  const [selectedMode, setSelectedMode] = useState<'learn' | 'practice'>('learn');
  const [showTooltip, setShowTooltip] = useState<'learn' | 'practice' | null>(null);

  // Interview types data
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Incomplete session detection
  const [incompleteSession, setIncompleteSession] = useState<Session | null>(null);

  // Check if user is below B1
  const isA1A2 = cefrLevel === 'A1' || cefrLevel === 'A2';
  const isB1B2 = cefrLevel === 'B1' || cefrLevel === 'B2';

  // Load interview types scoped to primary domain + subbranch
  const loadInterviewTypes = async () => {
    if (!user || isA1A2) return;
    try {
      setLoading(true);
      let query = supabase.from('interview_types').select('*');

      if (primaryDomain && primarySubbranch) {
        query = query
          .eq('parent_domain', primaryDomain)
          .eq('sub_branch', primarySubbranch);
      }

      const { data, error } = await query.order('min_level', { ascending: true });

      if (error) throw error;
      setInterviewTypes((data as InterviewType[]) || []);
    } catch (err) {
      console.error('Error loading interview types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviewTypes();
  }, [user, cefrLevel, primaryDomain, primarySubbranch]);

  // Check for incomplete session when opening setup
  const checkIncompleteSession = async (typeName: string) => {
    if (!user) return;
    setIncompleteSession(null);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tab', 'interview')
        .eq('interview_type', typeName)
        .eq('status', 'incomplete')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setIncompleteSession(data as Session);
      }
    } catch (err) {
      console.error('Error checking incomplete interview session:', err);
    }
  };

  const handleOpenTypeSetup = (type: InterviewType) => {
    setSelectedType(type);
    setIsOpenInterviewSelected(false);
    checkIncompleteSession(type.type_name);
    setView('setup');
  };

  const handleOpenInterviewSetup = () => {
    setSelectedType(null);
    setIsOpenInterviewSelected(true);
    setSelectedMode('practice');
    checkIncompleteSession('Open Interview');
    setView('setup');
  };

  const handleStartFresh = async (mode: 'learn' | 'practice') => {
    if (incompleteSession && user) {
      await supabase
        .from('sessions')
        .update({ status: 'abandoned' })
        .eq('id', incompleteSession.id);
      setIncompleteSession(null);
    }
    setSelectedMode(isOpenInterviewSelected ? 'practice' : mode);
    setView('session');
  };

  const handleStartSelectedMode = () => {
    if (isOpenInterviewSelected) {
      handleStartFresh('practice');
    } else if (selectedMode === 'learn') {
      handleStartFresh('learn');
    } else {
      handleStartFresh('practice');
    }
  };

  const handleResumeSession = () => {
    if (!incompleteSession) return;
    const modeToUse = isOpenInterviewSelected ? 'practice' : ((incompleteSession.mode as 'learn' | 'practice') || 'learn');
    setSelectedMode(modeToUse);
    if (incompleteSession.pressure_mode) {
      setPressureMode(incompleteSession.pressure_mode as PressureMode);
    }
    setView('session');
  };

  // ==========================================
  // LEVEL GATING FOR A1 / A2
  // ==========================================
  if (isA1A2) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/60">
            <Briefcase className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold uppercase tracking-wider">
            Current Level: {cefrLevel}
          </span>

          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            German Job & Visa Interview Training
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto font-normal">
            Interview practice unlocks at Level <strong>B1</strong>. Complete Speak modules to build foundational fluency.
          </p>

          <div className="pt-2">
            <Link
              to="/speak"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-[0.99]"
            >
              <span>Continue Learning in Speak</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EXAM MODE FLOW VIEW
  // ==========================================
  if (view === 'exam') {
    return (
      <ExamModeFlow
        cefrLevel={cefrLevel}
        onExit={() => setView('list')}
      />
    );
  }

  // ==========================================
  // ACTIVE SESSION VIEW
  // ==========================================
  if (view === 'session') {
    const activeTypeName = isOpenInterviewSelected ? 'Open Interview' : selectedType?.type_name || 'Interview';
    const activeDescription = isOpenInterviewSelected
      ? 'Unscaffolded full German job interview simulation.'
      : selectedType?.description || '';
    const activeMode = isOpenInterviewSelected ? 'practice' : selectedMode;

    const effectiveSampleQs = (selectedType?.content as any)?.sample_questions?.length > 0
      ? (selectedType?.content as any).sample_questions
      : getFallbackInterviewQuestions(activeTypeName);

    return (
      <ActiveInterviewSession
        interviewTypeName={activeTypeName}
        description={activeDescription}
        mode={activeMode}
        pressureMode={pressureMode}
        durationMinutes={durationMinutes}
        initialSessionId={incompleteSession?.id || null}
        initialTranscript={(incompleteSession?.transcript as any) || []}
        isOpenInterview={isOpenInterviewSelected}
        sampleQuestions={effectiveSampleQs}
        onBack={() => {
          setView('setup');
          checkIncompleteSession(activeTypeName);
        }}
        onCompleted={() => {
          setView('list');
          setSelectedType(null);
          setIsOpenInterviewSelected(false);
          setIncompleteSession(null);
          loadInterviewTypes();
        }}
      />
    );
  }

  // ==========================================
  // SETUP VIEW (Pressure Mode & Minutes Filter)
  // ==========================================
  if (view === 'setup') {
    const title = isOpenInterviewSelected ? 'Open Interview' : selectedType?.type_name;
    const desc = isOpenInterviewSelected
      ? 'Unscaffolded, full simulation — the closest thing to the real interview. No handholding provided.'
      : selectedType?.description;
    const domainBadgeText = primaryDomain
      ? `${primaryDomain} · ${primarySubbranch || 'General'}`
      : 'General Track';

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
        {/* Back Button & Continuity Domain Badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setView('list');
              setSelectedType(null);
              setIsOpenInterviewSelected(false);
              setIncompleteSession(null);
            }}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Interview Tracks</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{domainBadgeText}</span>
          </span>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF2FF] border border-blue-100">
                {isOpenInterviewSelected ? 'Open Format' : `Level ${selectedType?.min_level || 'B1+'}`}
              </span>
              <span className="text-xs font-medium text-slate-600 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/60">
                {domainBadgeText}
              </span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed font-normal">
              {desc}
            </p>
          </div>

          {/* PRESSURE MODE SELECTOR */}
          <div className="space-y-2.5">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> SELECT PRESSURE MODE
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESSURE_MODES.map((pm) => {
                const isSelected = pressureMode === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPressureMode(pm.id)}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#255CC1] bg-[#EBF2FF]/60 shadow-xs ring-1 ring-[#255CC1]/30'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${isSelected ? 'text-[#00215C]' : 'text-slate-800'}`}>
                          {pm.title}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#255CC1]" />}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {pm.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE SELECTOR */}
          {isOpenInterviewSelected ? (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-[#00215C] flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#255CC1] shrink-0 mt-0.5" />
              <span className="font-normal leading-relaxed">
                <strong>Realistic Simulation:</strong> Runs in Practice mode with no mid-session interruptions. Full evaluation provided at completion.
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  MODE
                </span>
                <span className="sr-only">Select Checkpoint Mode:</span>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('learn')}
                    onMouseEnter={() => setShowTooltip('learn')}
                    onMouseLeave={() => setShowTooltip(null)}
                    className={`py-3 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
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
                    className={`py-3 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
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
                      ? 'Guided interview with strategy brief and preparation guidance.'
                      : 'Authentic German interview conditions with diagnostic debrief at completion.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SESSION LENGTH SELECTOR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SESSION LENGTH
              </span>
              <span className="sr-only">Target Interview Duration:</span>
              <span className="text-xs text-slate-400 font-normal">
                {durationMinutes === 'open' ? 'Open-ended' : `${durationMinutes} minutes`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {INTERVIEW_DURATIONS.map((opt) => {
                const isSelected = durationMinutes === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDurationMinutes(opt.value)}
                    className={`py-2.5 px-3 rounded-full text-xs font-semibold transition-all select-none text-center ${
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

          {/* INCOMPLETE SESSION DETECTED PROMPT */}
          {incompleteSession && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-amber-950">
                    Unfinished Interview Session Detected
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-normal">
                    You have an unfinished interview session from earlier — resume where you left off or start fresh?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResumeSession}
                  className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Resume Session ({isOpenInterviewSelected ? 'PRACTICE' : incompleteSession.mode.toUpperCase()})
                </button>
                <button
                  onClick={() => handleStartFresh(isOpenInterviewSelected ? 'practice' : 'learn')}
                  className="px-3.5 py-2 rounded-full bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* SAMPLE QUESTIONS & GUIDANCE */}
          {!isOpenInterviewSelected && selectedType && (() => {
            const sampleQs = (selectedType.content as any)?.sample_questions?.length > 0
              ? (selectedType.content as any).sample_questions
              : getFallbackInterviewQuestions(selectedType.type_name);

            if (!sampleQs || sampleQs.length === 0) return null;

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00215C] uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#255CC1]" /> Sample Questions & Preparation
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {sampleQs.length} questions
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {sampleQs.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#EBF2FF] text-[#255CC1] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#00215C] leading-snug">{q.german}</p>
                          <p className="text-[11px] text-slate-500 italic mt-0.5">{q.english}</p>
                        </div>
                      </div>
                      {q.guidance && (
                        <div className="ml-7 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-950 font-normal">
                          <span className="font-semibold text-emerald-800">Key coverage points: </span>
                          {q.guidance}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* PRIMARY CTA BUTTON (CENTERED & SOLID PRIMARY COLOR) */}
          <div className="flex flex-col items-center justify-center pt-2">
            {isOpenInterviewSelected ? (
              <button
                type="button"
                onClick={() => handleStartFresh('practice')}
                className="w-full sm:w-auto min-w-[260px] px-8 py-3.5 rounded-full bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group active:scale-[0.99]"
              >
                <span>Start Open Interview Simulation</span>
                <Play className="w-4 h-4 fill-current text-blue-200 group-hover:scale-110 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartSelectedMode}
                  className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group active:scale-[0.99] cursor-pointer"
                >
                  <span>Start voice session</span>
                  <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                </button>
                <span className="sr-only">
                  {selectedMode === 'learn' ? 'Start Learn Mode' : 'Start Practice Mode'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN INTERVIEW HUB VIEW
  // ==========================================
  const b1Types = interviewTypes.filter((t) => t.min_level === 'B1');
  const b2Types = interviewTypes.filter((t) => t.min_level === 'B2');
  const domainBadgeText = primaryDomain
    ? `${primaryDomain} · ${primarySubbranch || 'General'}`
    : 'General Track';

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto text-[#111111] animate-fadeIn pb-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
              Job & Visa Interviews
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 sm:mt-1">
              Specialized German interview preparation for your career track
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{domainBadgeText}</span>
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Master behavioral, clinical, and panel questions with adaptive pressure modes.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
          <p className="text-xs font-medium">Loading domain interview tracks...</p>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {/* LEVEL B1 INTERVIEW TYPES (2-COLUMN GRID) */}
          {b1Types.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-[#255CC1]" />
                <h3 className="font-heading font-semibold text-sm text-[#00215C]">
                  Level B1 Foundational Interviews
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
                {b1Types.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTypeSetup(t)}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#255CC1]/50 shadow-xs hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.99] flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100">
                          {t.min_level}
                        </span>
                      </div>

                      <h4 className="font-heading font-semibold text-base sm:text-lg text-[#00215C] group-hover:text-[#255CC1] transition-colors leading-snug">
                        {t.type_name} Interview
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-normal line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 text-slate-400 group-hover:text-[#255CC1] transition-colors text-xs font-semibold gap-1">
                      <span>Open setup</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL B2 INTERVIEW TYPES (2-COLUMN GRID) */}
          {b2Types.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <h3 className="font-heading font-semibold text-sm text-[#00215C]">
                  Level B2 Professional & Panel Interviews
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
                {b2Types.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTypeSetup(t)}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#255CC1]/50 shadow-xs hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.99] flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {t.min_level}
                        </span>
                      </div>

                      <h4 className="font-heading font-semibold text-base sm:text-lg text-[#00215C] group-hover:text-[#255CC1] transition-colors leading-snug">
                        {t.type_name} Interview
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-normal line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 text-slate-400 group-hover:text-[#255CC1] transition-colors text-xs font-semibold gap-1">
                      <span>Open setup</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIMULATION FORMATS: OPEN INTERVIEW & EXAM MODE (2-COLUMN GRID) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <h3 className="font-heading font-semibold text-sm text-slate-700">
                Full Simulations & Exams
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* 1. OPEN INTERVIEW CARD */}
              <div
                onClick={handleOpenInterviewSetup}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#255CC1]/50 shadow-xs hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.99] flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100">
                      Practice Only
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Unscaffolded</span>
                  </div>

                  <h3 className="font-heading font-semibold text-base sm:text-lg text-[#00215C] group-hover:text-[#255CC1] transition-colors leading-snug">
                    Open Interview
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-normal line-clamp-2">
                    Realistic simulation with German recruiter pacing and post-session diagnostic recap.
                  </p>
                </div>

                <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 text-slate-400 group-hover:text-[#255CC1] transition-colors text-xs font-semibold gap-1">
                  <span>Open setup</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* 2. EXAM MODE (SHOWN FOR B1/B2 USERS) */}
              {isB1B2 && (
                <div
                  onClick={() => setView('exam')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#00215C] via-[#05296e] to-[#0f388a] text-white shadow-xs hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.99] flex flex-col justify-between group border border-[#00215C]/20"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                        Official Exam
                      </span>
                      <span className="text-xs text-blue-200 font-medium">telc / Goethe {cefrLevel}</span>
                    </div>

                    <h3 className="font-heading font-semibold text-base sm:text-lg text-white leading-snug">
                      Exam Mode
                    </h3>

                    <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 leading-relaxed font-normal line-clamp-2">
                      Real telc/Goethe exam format across Listening, Live AI Speaking, Reading, and Writing sections.
                    </p>
                  </div>

                  <div className="flex items-center justify-end mt-4 pt-3 border-t border-white/10 text-blue-200 group-hover:text-white transition-colors text-xs font-semibold gap-1">
                    <span>Enter exam</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
