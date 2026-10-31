import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Scenario, Session, CefrLevel } from '../lib/database.types';
import { SESSION_DURATIONS } from '../constants/interview';
import { ActiveScenarioSession } from './scenarios/ActiveScenarioSession';
import { 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Loader2, 
  Briefcase, 
  Coffee,
  Info,
  Sparkles,
  AlertCircle
} from 'lucide-react';

import { useKillSwitch } from '../hooks/useKillSwitch';
import { TabUnavailableBanner } from '../components/layout/TabUnavailableBanner';
import { getFallbackScenarioPhrases, getFallbackScenarioSentences } from '../constants/scenarioFallbacks';

type ScenariosTrackTab = 'all' | 'domain' | 'daily_life';
type ScenariosView = 'list' | 'detail' | 'session';

const CEFR_ORDER: Record<CefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function getScenarioPhrases(sc: Scenario): Array<{ german: string; english: string }> {
  let raw: any[] = [];
  if (typeof sc?.content === 'string') {
    try {
      const parsed = JSON.parse(sc.content);
      if (Array.isArray(parsed?.target_phrases)) raw = parsed.target_phrases;
    } catch {}
  } else if (Array.isArray((sc?.content as any)?.target_phrases)) {
    raw = (sc.content as any).target_phrases;
  }

  if (!raw || raw.length === 0) {
    raw = getFallbackScenarioPhrases(sc?.title || '');
  }

  return (raw || [])
    .map((p: any) => {
      if (typeof p === 'string') return { german: p, english: '' };
      return { german: p?.german || '', english: p?.english || '' };
    })
    .filter((p: any) => Boolean(p.german));
}

function getScenarioSentences(sc: Scenario): string[] {
  let raw: any[] = [];
  if (typeof sc?.content === 'string') {
    try {
      const parsed = JSON.parse(sc.content);
      if (Array.isArray(parsed?.example_sentences)) raw = parsed.example_sentences;
    } catch {}
  } else if (Array.isArray((sc?.content as any)?.example_sentences)) {
    raw = (sc.content as any).example_sentences;
  }

  if (!raw || raw.length === 0) {
    raw = getFallbackScenarioSentences(sc?.title || '');
  }

  return (raw || []).filter((s: any) => typeof s === 'string' && s.trim().length > 0);
}

export const Scenarios: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { disabledTabs } = useKillSwitch();

  if (Array.isArray(disabledTabs) && disabledTabs.includes('scenarios')) {
    return <TabUnavailableBanner title="Scenarios Module Temporarily Unavailable" />;
  }
  const userLevel = (profile?.cefr_level as CefrLevel) || 'B1';
  const primaryDomain = profile?.primary_domain;
  const primarySubbranch = profile?.primary_subbranch;
  const addedDomains = Array.isArray(profile?.added_domains) ? profile.added_domains : [];

  // Tab & View State
  const [activeTab, setActiveTab] = useState<ScenariosTrackTab>('all');
  const [view, setView] = useState<ScenariosView>(id ? 'detail' : 'list');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | 'open'>(5);
  const [selectedMode, setSelectedMode] = useState<'learn' | 'practice'>('learn');
  const [showTooltip, setShowTooltip] = useState<'learn' | 'practice' | null>(null);

  // Scenarios Data
  const [domainScenarios, setDomainScenarios] = useState<Scenario[]>([]);
  const [allDomainScenarios, setAllDomainScenarios] = useState<Scenario[]>([]);
  const [dailyScenarios, setDailyScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Incomplete session for selected scenario
  const [incompleteSession, setIncompleteSession] = useState<Session | null>(null);

  // Dynamic route scenario fetch state
  const [scenarioRouteLoading, setScenarioRouteLoading] = useState<boolean>(Boolean(id));
  const [scenarioRouteError, setScenarioRouteError] = useState<string | null>(null);

  // Load scenarios from Supabase
  const loadScenarios = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setCatalogError(null);

      // 1. Fetch Daily Life Scenarios
      const { data: dailyData, error: dailyErr } = await supabase
        .from('scenarios')
        .select('*')
        .eq('track', 'daily_life')
        .order('min_level', { ascending: true });

      if (dailyErr) throw dailyErr;
      const dailyList = (dailyData as Scenario[]) || [];
      setDailyScenarios(dailyList);

      // Check for direct Quick Start shortcut from Home tab
      if (location.state?.autoStart && dailyList.length > 0) {
        const scToLaunch = dailyList[0];
        setSelectedScenario(scToLaunch);
        setSelectedDuration(location.state.duration || 5);
        setSelectedMode('practice');
        setActiveTab('daily_life');
        setView('session');
      }

      // 2. Fetch Domain Scenarios matching primary domain + added domains
      const { data: allDomainData, error: domainErr } = await supabase
        .from('scenarios')
        .select('*')
        .eq('track', 'domain')
        .order('min_level', { ascending: true });

      if (domainErr) throw domainErr;
      const allDomainList = (allDomainData as Scenario[]) || [];
      setAllDomainScenarios(allDomainList);

      // Match domain scenarios: include all scenarios matching the primary domain or added domains
      let matchedDomainScenarios = allDomainList;
      if (primaryDomain) {
        const activeDomains = new Set<string>([primaryDomain]);
        if (Array.isArray(addedDomains)) {
          addedDomains.forEach((ad) => {
            if (ad && typeof ad === 'object' && ad.domain) {
              activeDomains.add(ad.domain);
            }
          });
        }

        matchedDomainScenarios = (allDomainList || []).filter((sc) => {
          if (!sc || !sc.parent_domain) return false;
          return activeDomains.has(sc.parent_domain);
        });

        // Prioritize exact subbranch match first, then level
        if (primarySubbranch) {
          matchedDomainScenarios.sort((a, b) => {
            const aMatch = a.sub_branch === primarySubbranch ? 0 : 1;
            const bMatch = b.sub_branch === primarySubbranch ? 0 : 1;
            if (aMatch !== bMatch) return aMatch - bMatch;
            return ((a.min_level && CEFR_ORDER[a.min_level]) || 1) - ((b.min_level && CEFR_ORDER[b.min_level]) || 1);
          });
        }
      }

      setDomainScenarios(matchedDomainScenarios);
    } catch (err: any) {
      console.error('Error loading scenarios:', err);
      setCatalogError(err?.message || 'Unable to load situational scenarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [user, primaryDomain, primarySubbranch]);

  // Sync route param :id with scenario details on direct navigation or initial mount
  useEffect(() => {
    if (!id) return;

    // Already have this scenario loaded in state
    if (selectedScenario && selectedScenario.id === id) {
      if (view !== 'session') {
        setView('detail');
      }
      setScenarioRouteLoading(false);
      return;
    }

    // Check if in already loaded memory lists
    const inMemory = 
      allDomainScenarios.find((s) => s.id === id) ||
      domainScenarios.find((s) => s.id === id) ||
      dailyScenarios.find((s) => s.id === id);

    if (inMemory) {
      setSelectedScenario(inMemory);
      checkIncompleteSession(inMemory);
      setScenarioRouteError(null);
      setScenarioRouteLoading(false);
      if (view !== 'session') {
        setView('detail');
      }
      return;
    }

    // Otherwise query Supabase specifically for this scenario ID
    let isCancelled = false;
    const fetchScenarioById = async () => {
      try {
        setScenarioRouteLoading(true);
        setScenarioRouteError(null);

        const { data, error } = await supabase
          .from('scenarios')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (isCancelled) return;

        if (error) {
          console.error('[Scenarios] Query failed for scenario ID:', id, error);
          setScenarioRouteError(error.message || 'Failed to load scenario details.');
        } else if (!data) {
          console.warn('[Scenarios] Query returned no row for scenario ID:', id);
          setScenarioRouteError(`Scenario "${id}" could not be found.`);
        } else {
          const sc = data as Scenario;
          setSelectedScenario(sc);
          checkIncompleteSession(sc);
          if (view !== 'session') {
            setView('detail');
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[Scenarios] Unexpected error loading scenario:', err);
          setScenarioRouteError(err?.message || 'Unexpected error loading scenario.');
        }
      } finally {
        if (!isCancelled) {
          setScenarioRouteLoading(false);
        }
      }
    };

    fetchScenarioById();

    return () => {
      isCancelled = true;
    };
  }, [id, allDomainScenarios, domainScenarios, dailyScenarios]);

  // Check for incomplete session when selecting a scenario
  const checkIncompleteSession = async (sc: Scenario) => {
    if (!user) return;
    setIncompleteSession(null);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tab', 'scenarios')
        .eq('scenario_type', sc.title)
        .eq('status', 'incomplete')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setIncompleteSession(data as Session);
      }
    } catch (err) {
      console.error('Error checking incomplete scenario session:', err);
    }
  };

  const handleSelectScenario = (sc: Scenario) => {
    setSelectedScenario(sc);
    checkIncompleteSession(sc);
    setView('detail');
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `/scenarios/${sc.id}`);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedScenario(null);
    setIncompleteSession(null);
    setScenarioRouteError(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', '/scenarios');
    }
  };

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

  const handleStartSelectedMode = () => {
    if (selectedMode === 'learn') {
      handleStartFresh('learn');
    } else {
      handleStartFresh('practice');
    }
  };

  const handleResumeSession = () => {
    if (!incompleteSession) return;
    setSelectedMode(incompleteSession.mode as 'learn' | 'practice');
    setView('session');
  };

  const isHigherThanUser = (minLevel?: CefrLevel): boolean => {
    if (!minLevel) return false;
    return (CEFR_ORDER[minLevel] || 1) > (CEFR_ORDER[userLevel] || 1);
  };

  // ==========================================
  // ACTIVE SCENARIO SESSION VIEW
  // ==========================================
  if (view === 'session' && selectedScenario) {
    return (
      <ActiveScenarioSession
        scenario={selectedScenario}
        mode={selectedMode}
        durationMinutes={selectedDuration}
        initialSessionId={incompleteSession?.id || null}
        initialTranscript={(incompleteSession?.transcript as any) || []}
        onBack={() => {
          setView('detail');
          checkIncompleteSession(selectedScenario);
          navigate(`/scenarios/${selectedScenario.id}`);
        }}
        onCompleted={() => {
          setView('list');
          setSelectedScenario(null);
          setIncompleteSession(null);
          navigate('/scenarios');
          loadScenarios();
        }}
      />
    );
  }

  // Dynamic Route Loading Guard
  if (id && scenarioRouteLoading && !selectedScenario) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
        <p className="text-xs font-medium">Loading German scenario details...</p>
      </div>
    );
  }

  // Dynamic Route Error / Empty State Guard
  if (id && (scenarioRouteError || (!selectedScenario && !scenarioRouteLoading))) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 animate-fadeIn text-[#111111]">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-[#00215C]">
          Scenario Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-normal">
          {scenarioRouteError || `The requested scenario "${id}" was not found or could not be loaded.`}
        </p>
        <div className="pt-2">
          <button
            onClick={handleBackToList}
            className="px-5 py-2.5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Scenarios</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCENARIO DETAIL VIEW
  // ==========================================
  if (view === 'detail' && selectedScenario) {
    const isLevelHigh = isHigherThanUser(selectedScenario.min_level);
    const domainBadgeText = selectedScenario.parent_domain
      ? `${selectedScenario.parent_domain} · ${selectedScenario.sub_branch || 'General'}`
      : primaryDomain
      ? `${primaryDomain} · ${primarySubbranch || 'General'}`
      : 'Daily Life & Civic';

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn text-[#111111]">
        {/* Back Button & Continuity Domain Badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-[#00215C] hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Scenarios</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{domainBadgeText}</span>
          </span>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF2FF] border border-blue-100">
                Level {selectedScenario.min_level}
              </span>
              {selectedScenario.is_baseline && (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#255CC1]" />
                  Civic Essential
                </span>
              )}
              {isLevelHigh && (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Recommended for Level {selectedScenario.min_level}+
                </span>
              )}
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
              {selectedScenario.title}
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-normal leading-relaxed">
              {selectedScenario.description}
            </p>
          </div>

          {/* Target Key Phrases */}
          {(() => {
            const phrases = getScenarioPhrases(selectedScenario);
            if (!phrases || phrases.length === 0) return null;

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-[#00215C] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#255CC1]" />
                  <span>Essential Real-World Phrases ({phrases.length})</span>
                </h4>
                <div className="space-y-2">
                  {phrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 shadow-2xs"
                    >
                      <span className="font-bold text-xs sm:text-sm text-[#00215C]">
                        {phrase.german}
                      </span>
                      {phrase.english && (
                        <span className="text-xs text-slate-500 font-normal italic">
                          "{phrase.english}"
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Real-World Conversation Example / Interlocutor Dialogue */}
          {(() => {
            const sentences = getScenarioSentences(selectedScenario);
            if (!sentences || sentences.length === 0) return null;

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <h4 className="text-xs font-bold text-[#00215C] uppercase tracking-wider flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-[#255CC1]" />
                  <span>Real-World Dialogue Context & Exchange ({sentences.length})</span>
                </h4>
                <div className="space-y-2">
                  {sentences.map((sent, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl bg-white border border-blue-200/60 text-xs text-slate-700 leading-relaxed font-normal flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#255CC1] shrink-0 mt-1.5" />
                      <span className="font-medium text-[#00215C]">{sent}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* MODE SELECTOR */}
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
                    ? 'Target phrases visible upfront with instant coaching on recurring errors.'
                    : 'Realistic simulation with target phrases hidden and full diagnostic recap at the end.'}
                </div>
              )}
            </div>
          </div>

          {/* SESSION LENGTH SELECTOR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SESSION LENGTH
              </span>
              <span className="sr-only">Select Simulation Duration:</span>
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

          {/* INCOMPLETE SESSION ALERT PROMPT */}
          {incompleteSession && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading font-bold text-sm text-amber-950">
                    Unfinished Scenario Detected
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-normal">
                    You have an unfinished scenario session — resume where you left off or start fresh?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResumeSession}
                  className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Resume Session ({(incompleteSession.mode || 'learn').toUpperCase()})
                </button>
                <button
                  onClick={() => handleStartFresh('learn')}
                  className="px-3.5 py-2 rounded-full bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* PRIMARY CTA BUTTON (CENTERED & TERRATERN BRAND BUTTON) */}
          <div className="flex flex-col items-center justify-center pt-2">
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
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCENARIOS LIST VIEW (DEFAULT)
  // ==========================================
  const combinedAllScenarios = React.useMemo(() => {
    const map = new Map<string, Scenario>();
    const pool = (allDomainScenarios && allDomainScenarios.length > 0) ? allDomainScenarios : domainScenarios;
    (pool || []).forEach((sc) => {
      if (sc && sc.id) map.set(sc.id, sc);
    });
    (dailyScenarios || []).forEach((sc) => {
      if (sc && sc.id) map.set(sc.id, sc);
    });
    return Array.from(map.values()).sort(
      (a, b) => ((a?.min_level && CEFR_ORDER[a.min_level]) || 1) - ((b?.min_level && CEFR_ORDER[b.min_level]) || 1)
    );
  }, [domainScenarios, allDomainScenarios, dailyScenarios]);

  const currentList =
    activeTab === 'all'
      ? combinedAllScenarios
      : activeTab === 'domain'
      ? (domainScenarios && domainScenarios.length > 0 ? domainScenarios : allDomainScenarios)
      : (dailyScenarios || []);

  const baselineScenarios = (dailyScenarios || []).filter((sc) => Boolean(sc?.is_baseline));
  const regularDailyScenarios = (dailyScenarios || []).filter((sc) => sc && !sc.is_baseline);

  const renderScenarioCard = (sc: Scenario, isEssential: boolean = false) => {
    if (!sc || !sc.id) return null;
    const isDomain = sc.track === 'domain';
    const scLevel = sc.min_level || 'B1';
    const isTailoredSubbranch = Boolean(primarySubbranch && sc.sub_branch === primarySubbranch);
    const phrases = getScenarioPhrases(sc);
    const previewPhrase = phrases[0] || null;

    return (
      <div
        key={sc.id}
        onClick={() => handleSelectScenario(sc)}
        className="p-5 rounded-2xl border border-slate-200/80 hover:border-[#255CC1]/60 bg-white shadow-xs hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.99] flex flex-col justify-between group"
      >
        <div className="space-y-3">
          {/* Top Level & Domain/Subbranch Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100">
                Level {scLevel}
              </span>

              {isDomain ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#00215C] border border-blue-200/60 flex items-center gap-1">
                  <Briefcase className="w-2.5 h-2.5 text-[#255CC1]" />
                  <span>
                    {sc.parent_domain || 'Career'}{sc.sub_branch ? ` · ${sc.sub_branch}` : ''}
                  </span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center gap-1">
                  <Coffee className="w-2.5 h-2.5 text-slate-500" />
                  <span>{sc.is_baseline ? 'Civic Essential' : 'Daily Life'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isTailoredSubbranch && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                  Your Field
                </span>
              )}
              {isEssential && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#255CC1] border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#255CC1]" />
                  Essential
                </span>
              )}
            </div>
          </div>

          {/* Scenario Title & Description */}
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-[#00215C] group-hover:text-[#255CC1] transition-colors leading-snug">
              {sc.title || 'Scenario'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed font-normal line-clamp-2">
              {sc.description || ''}
            </p>
          </div>

          {/* Key Spoken Phrase Content Preview */}
          {previewPhrase && (
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#255CC1]">
                  <Sparkles className="w-3 h-3" />
                  <span>Key Spoken Phrase</span>
                </span>
                <span className="text-slate-400 font-semibold lowercase">
                  {phrases.length} phrases in scenario
                </span>
              </div>
              <p className="text-xs font-bold text-[#00215C] leading-snug line-clamp-1">
                &ldquo;{previewPhrase.german}&rdquo;
              </p>
              {previewPhrase.english && (
                <p className="text-[11px] text-slate-500 font-normal italic line-clamp-1">
                  &ldquo;{previewPhrase.english}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
              Learn & Practice
            </span>
          </div>

          <div className="flex items-center text-slate-400 group-hover:text-[#255CC1] transition-colors font-semibold gap-1">
            <span>Start scenario</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto text-[#111111] animate-fadeIn pb-6">
      {/* Header & Domain Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight">
              Roleplay Scenarios
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 sm:mt-1">
              Authentic workplace dialogues and practical daily simulations
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>
                {primaryDomain ? `${primaryDomain} · ${primarySubbranch || 'General'}` : 'General Track'}
              </span>
            </span>
          </div>
        </div>

        {/* THREE-OPTION TOGGLE SWITCHER (All, Career, Daily Life) */}
        <div className="grid grid-cols-3 rounded-full bg-slate-100/90 p-1 border border-slate-200/70 max-w-lg mx-auto sm:mx-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2 px-2 sm:px-3 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-[#00215C] shadow-xs'
                : 'text-slate-600 hover:text-[#00215C]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full hidden sm:inline-block ${
              activeTab === 'all' ? 'bg-[#EBF2FF] text-[#255CC1]' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {combinedAllScenarios.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('domain')}
            className={`py-2 px-2 sm:px-3 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'domain'
                ? 'bg-white text-[#00215C] shadow-xs'
                : 'text-slate-600 hover:text-[#00215C]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">My Career</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full hidden sm:inline-block ${
              activeTab === 'domain' ? 'bg-[#EBF2FF] text-[#255CC1]' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {domainScenarios.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily_life')}
            className={`py-2 px-2 sm:px-3 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'daily_life'
                ? 'bg-white text-[#00215C] shadow-xs'
                : 'text-slate-600 hover:text-[#00215C]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Daily Life</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full hidden sm:inline-block ${
              activeTab === 'daily_life' ? 'bg-[#EBF2FF] text-[#255CC1]' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {dailyScenarios.length}
            </span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto mb-2" />
          <p className="text-xs font-medium">Loading German situational scenarios...</p>
        </div>
      ) : catalogError && currentList.length === 0 ? (
        <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3 animate-fadeIn">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h4 className="font-heading font-bold text-sm text-amber-900">
            Unable to load scenarios
          </h4>
          <p className="text-xs text-amber-700 max-w-sm mx-auto leading-relaxed">
            {catalogError}
          </p>
          <button
            onClick={loadScenarios}
            className="px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-semibold hover:bg-[#143471] transition-all cursor-pointer shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : activeTab === 'domain' && !primaryDomain ? (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0 border border-blue-100">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[#00215C]">
                  All Career Specializations ({allDomainScenarios.length})
                </h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Select your primary domain in Profile to highlight scenarios tailored to your specific profession.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
            {allDomainScenarios.map((sc) => renderScenarioCard(sc, false))}
          </div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
            <h4 className="font-heading font-bold text-sm text-[#00215C]">
              Exploring Career Scenarios ({allDomainScenarios.length})
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Explore professional dialogues across all vocational fields:
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
            {allDomainScenarios.map((sc) => renderScenarioCard(sc, false))}
          </div>
        </div>
      ) : (
        /* Scenarios View: All, Career, or Daily Life */
        activeTab === 'all' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
            {combinedAllScenarios.map((sc) => renderScenarioCard(sc, sc.is_baseline))}
          </div>
        ) : activeTab === 'domain' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
            {domainScenarios.map((sc) => renderScenarioCard(sc, false))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Essentials Section */}
            {baselineScenarios.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-[#255CC1]" />
                  <h3 className="font-heading font-semibold text-sm text-[#00215C]">
                    Civic Essentials
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-200">
                    {baselineScenarios.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
                  {baselineScenarios.map((sc) => renderScenarioCard(sc, true))}
                </div>
              </div>
            )}

            {/* Regular Daily Life Section */}
            {regularDailyScenarios.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="px-1">
                  <h3 className="font-heading font-semibold text-sm text-slate-700">
                    Daily Encounters
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
                  {regularDailyScenarios.map((sc) => renderScenarioCard(sc, false))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default Scenarios;
