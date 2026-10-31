import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Domain, CefrLevel, ParentDomain } from '../../lib/database.types';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Stethoscope, 
  Wrench, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2,
  Info
} from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

interface CefrOption {
  level: CefrLevel;
  title: string;
  description: string;
}

const CEFR_OPTIONS: CefrOption[] = [
  { level: 'A1', title: 'A1 Beginner', description: 'Basic greetings and simple everyday vocabulary' },
  { level: 'A2', title: 'A2 Elementary', description: 'Simple daily interactions in familiar contexts' },
  { level: 'B1', title: 'B1 Intermediate', description: 'Everyday conversations; standard for visas & Ausbildung' },
  { level: 'B2', title: 'B2 Upper Int.', description: 'Fluent in professional work & medical terminology' },
  { level: 'C1', title: 'C1 Advanced', description: 'Advanced academic and clinical consultations' },
  { level: 'C2', title: 'C2 Mastery', description: 'Near-native fluency with complex linguistic nuances' },
];

const DOMAIN_METADATA: Record<ParentDomain, { icon: React.ComponentType<{ className?: string }>; description: string }> = {
  Healthcare: {
    icon: Stethoscope,
    description: 'Nursing, elderly care, therapy & medical tech roles',
  },
  Ausbildung: {
    icon: Wrench,
    description: 'Vocational training in mechanics, trades & logistics',
  },
  'Study/University': {
    icon: GraduationCap,
    description: 'Degree applications, lectures & campus life',
  },
  'Workplace Integration': {
    icon: Briefcase,
    description: 'Corporate offices, operations & German work culture',
  },
  Settlement: {
    icon: Building2,
    description: 'Anmeldung (registration), housing, banking & daily civic life',
  },
};

export const OnboardingFlow: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect if user already completed onboarding
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  // Flow State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>(profile?.name || '');
  const [cefrLevel, setCefrLevel] = useState<CefrLevel | ''>((profile?.cefr_level as CefrLevel) || '');
  const [parentDomain, setParentDomain] = useState<ParentDomain | ''>((profile?.primary_domain as ParentDomain) || '');
  const [subBranch, setSubBranch] = useState<string>(profile?.primary_subbranch || '');
  const [urgencyDate, setUrgencyDate] = useState<string>(profile?.urgency_date || '');

  // Reference Domains State
  const [domainsList, setDomainsList] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);

  // Fetch domains from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDomains = async () => {
      try {
        setLoadingDomains(true);
        const { data, error } = await supabase
          .from('domains')
          .select('*')
          .eq('is_active', true)
          .order('sub_branch', { ascending: true });

        if (error) {
          console.error('Error fetching domains:', error);
          return;
        }

        if (isMounted && data) {
          setDomainsList(data as Domain[]);
        }
      } catch (err) {
        console.error('Failed to load domains:', err);
      } finally {
        if (isMounted) setLoadingDomains(false);
      }
    };

    fetchDomains();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update name if profile loads with one
  useEffect(() => {
    if (profile?.name && !name) {
      setName(profile.name);
    }
  }, [profile]);

  // Derived available parent domains (unique list from domains table)
  const availableParentDomains: ParentDomain[] = React.useMemo(() => {
    if (!domainsList.length) {
      return ['Healthcare', 'Ausbildung', 'Study/University', 'Workplace Integration', 'Settlement'];
    }
    const unique = Array.from(new Set(domainsList.map((d) => d.parent_domain)));
    return unique as ParentDomain[];
  }, [domainsList]);

  // Filtered sub-branches for the chosen parent domain
  const filteredSubBranches = React.useMemo(() => {
    if (!parentDomain) return [];
    return domainsList.filter((d) => d.parent_domain === parentDomain);
  }, [domainsList, parentDomain]);

  // Step Validation Helpers
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return name.trim().length > 0;
      case 3:
        return cefrLevel !== '';
      case 4:
        return parentDomain !== '';
      case 5:
        return subBranch.trim().length > 0;
      case 6:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) return;
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete(urgencyDate || null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrorMsg(null);
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Completion Handler
  const handleComplete = async (finalDate: string | null) => {
    if (!user) {
      setErrorMsg('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          cefr_level: cefrLevel as CefrLevel,
          primary_domain: parentDomain,
          primary_subbranch: subBranch,
          urgency_date: finalDate || null,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // 2. Ensure streaks table record exists
      const { error: streakError } = await supabase
        .from('streaks')
        .upsert(
          {
            user_id: user.id,
            current_streak: 0,
            total_sessions: 0,
            total_modules_completed: 0,
            last_session_date: null,
          },
          { onConflict: 'user_id' }
        );

      if (streakError) {
        console.warn('Streak initialization note:', streakError);
      }

      // 3. Refresh profile state in AuthContext
      await refreshProfile();

      // 4. Navigate to Home
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
      setSubmitting(false);
    }
  };

  // Preset date helper for Step 6
  const setPresetMonths = (monthsAhead: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setUrgencyDate(`${yyyy}-${mm}-${dd}`);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#FAFBFF] text-[#111111] flex flex-col justify-between overflow-hidden selection:bg-[#255CC1]/20 selection:text-[#00215C]">
      {/* Top Header & Progress Indicator */}
      <header className="shrink-0 bg-[#FAFBFF]/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 sm:px-6 z-20">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Back button */}
          <div className="w-10 flex items-center">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="p-1.5 -ml-1 rounded-xl text-[#00215C] hover:bg-slate-100 transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper Dots & Label */}
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#00215C] uppercase tracking-wider mb-1">
              Step {currentStep} of 6
            </span>
            <div className="flex items-center gap-1.5 w-full max-w-[200px]">
              {[1, 2, 3, 4, 5, 6].map((i) => {
                const isPassed = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#255CC1] shadow-xs'
                        : isPassed
                        ? 'bg-[#00215C]'
                        : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Right branding */}
          <div className="w-10 flex justify-end">
            <AppLogo size="xs" className="opacity-90" />
          </div>
        </div>
      </header>

      {/* Main Step Content Container (Fits exactly on one screen across desktop, laptop & mobile) */}
      <main className="flex-1 min-h-0 w-full max-w-xl mx-auto px-4 py-3 sm:py-5 flex flex-col justify-center overflow-y-auto">
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-center gap-2 shrink-0">
            <Info className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: WELCOME & EXECUTIVE BRANDING ================= */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center text-center animate-fadeIn py-1">
            <div className="mb-3.5 flex justify-center">
              <AppLogo size="lg" className="drop-shadow-sm" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SpeechAI • German Voice Coach</span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight max-w-md leading-tight">
              Let&apos;s get you ready for Germany
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-md">
              Whether you&apos;re preparing for healthcare, vocational Ausbildung, or university — SpeechAI coaches your spoken German with authentic workplace dialogues.
            </p>

            <div className="mt-4 w-full max-w-md p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-left space-y-2">
              <p className="text-xs font-bold text-[#00215C] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#255CC1]" />
                What we&apos;ll set up in the next 60 seconds:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <span className="text-sm">🎯</span>
                  <span className="font-medium">Workplace Field</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <span className="text-sm">📊</span>
                  <span className="font-medium">CEFR Baseline</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <span className="text-sm">🗣️</span>
                  <span className="font-medium">Live Voice Practice</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: NAME ================= */}
        {currentStep === 2 && (
          <div className="animate-fadeIn py-1 space-y-4 max-w-md mx-auto w-full">
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider">
                Personalization
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] mt-0.5 tracking-tight">
                What should we call you?
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                Your name will be used during German voice simulations, patient handovers, and mock interviews.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label htmlFor="user-name-input" className="block text-xs font-bold text-[#00215C]">
                Your Full Name or Preferred Name
              </label>
              <input
                id="user-name-input"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) handleNext();
                }}
                placeholder="e.g. Priya Sharma or Rahul Verma"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm sm:text-base text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#255CC1]/30 focus:border-[#255CC1] transition-all"
              />
              <p className="text-[11px] text-slate-400 font-normal">
                You can change this anytime from your profile settings.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CEFR LEVEL ================= */}
        {currentStep === 3 && (
          <div className="animate-fadeIn py-1 space-y-3 w-full">
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider">
                Language Baseline
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] mt-0.5 tracking-tight">
                What&apos;s your current German level?
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Select your approximate CEFR standard. We&apos;ll calibrate speech pace and vocabulary.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {CEFR_OPTIONS.map((item) => {
                const isSelected = cefrLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setCefrLevel(item.level)}
                    className={`p-2.5 sm:p-3 rounded-xl text-left border-2 transition-all flex items-start gap-2.5 select-none active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'border-[#255CC1] bg-[#EBF2FF] shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-heading font-extrabold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#255CC1] text-white shadow-2xs'
                          : 'bg-[#FAFBFF] text-[#00215C] border border-slate-200'
                      }`}
                    >
                      {item.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#00215C]' : 'text-[#111111]'}`}>
                          {item.title}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#255CC1] shrink-0" />}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px]">
              <Info className="w-3.5 h-3.5 text-[#255CC1] shrink-0" />
              <span>
                <strong>Not sure?</strong> Most learners start at <strong>A1</strong> or <strong>A2</strong> — easily changed later in Profile.
              </span>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PARENT DOMAIN ================= */}
        {currentStep === 4 && (
          <div className="animate-fadeIn py-1 space-y-3 w-full">
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider">
                Career Track
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] mt-0.5 tracking-tight">
                What are you working towards?
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                SpeechAI customizes your dialogue scenarios, roleplay prompts, and technical phrases.
              </p>
            </div>

            {loadingDomains ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#255CC1]" />
                <span className="text-xs mt-2 font-medium">Loading career domains...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableParentDomains.map((dom, idx) => {
                  const meta = DOMAIN_METADATA[dom] || {
                    icon: Briefcase,
                    description: 'Professional vocational training track',
                  };
                  const Icon = meta.icon;
                  const isSelected = parentDomain === dom;
                  const isLastOdd = availableParentDomains.length % 2 !== 0 && idx === availableParentDomains.length - 1;

                  return (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => {
                        if (parentDomain !== dom) {
                          setParentDomain(dom);
                          setSubBranch('');
                        }
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl text-left border-2 transition-all flex items-center gap-3 select-none active:scale-[0.99] cursor-pointer ${
                        isLastOdd ? 'sm:col-span-2' : ''
                      } ${
                        isSelected
                          ? 'border-[#255CC1] bg-[#EBF2FF] shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#255CC1] text-white shadow-2xs'
                            : 'bg-[#FAFBFF] text-[#00215C] border border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-heading font-bold text-xs sm:text-sm text-[#00215C] block truncate">
                          {dom}
                        </span>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 leading-snug">
                          {meta.description}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-[#255CC1] bg-[#255CC1] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 5: SUB-BRANCH ================= */}
        {currentStep === 5 && (
          <div className="animate-fadeIn py-1 space-y-3 w-full">
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider">
                Specialization in {parentDomain}
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] mt-0.5 tracking-tight">
                Which area specifically?
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Choose your field. You can also add more domains anytime in Profile.
              </p>
            </div>

            <div className="max-h-[260px] sm:max-h-[290px] overflow-y-auto pr-1 space-y-1.5 select-none">
              {filteredSubBranches.map((item) => {
                const isSelected = subBranch === item.sub_branch;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubBranch(item.sub_branch)}
                    className={`w-full p-2.5 sm:p-3 rounded-xl text-left border-2 transition-all flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'border-[#255CC1] bg-[#EBF2FF] shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-xs sm:text-sm ${isSelected ? 'font-bold text-[#00215C]' : 'font-medium text-[#111111]'}`}>
                      {item.sub_branch}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#255CC1] bg-[#255CC1] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium">
              Showing {filteredSubBranches.length} specialized tracks for {parentDomain}
            </p>
          </div>
        )}

        {/* ================= STEP 6: URGENCY / TARGET DATE (OPTIONAL) ================= */}
        {currentStep === 6 && (
          <div className="animate-fadeIn py-1 space-y-3.5 max-w-md mx-auto w-full">
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#255CC1] uppercase tracking-wider">
                Learning Pace (Optional)
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00215C] mt-0.5 tracking-tight">
                Do you have a target date?
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
                Helps pace your workouts — but totally fine to skip if you&apos;re not sure yet.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div>
                <label htmlFor="urgency-date-input" className="block text-xs font-bold text-[#00215C] mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#255CC1]" />
                  <span>Departure or Exam Target Date</span>
                </label>
                <input
                  id="urgency-date-input"
                  type="date"
                  min={todayStr}
                  value={urgencyDate}
                  onChange={(e) => setUrgencyDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#255CC1]/30 focus:border-[#255CC1] transition-all"
                />
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 mb-1.5">Quick timeline options:</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '3 Months', months: 3 },
                    { label: '6 Months', months: 6 },
                    { label: '1 Year', months: 12 },
                  ].map((opt) => (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setPresetMonths(opt.months)}
                      className="py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#255CC1] hover:text-[#255CC1] transition-colors cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {urgencyDate && (
                <div className="p-2 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-semibold flex items-center justify-between">
                  <span>Target: <strong>{new Date(urgencyDate).toLocaleDateString()}</strong></span>
                  <button
                    type="button"
                    onClick={() => setUrgencyDate('')}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline ml-2 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleComplete(null)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00215C] py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>I&apos;m just starting, no deadline yet</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Primary Action Bar */}
      <footer className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2.5 sm:py-3.5 z-20">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid() || submitting}
            className="w-full py-3 px-5 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#255CC1]" />
                <span>Finalizing your German path...</span>
              </>
            ) : currentStep === 1 ? (
              <>
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#255CC1]" />
              </>
            ) : currentStep === 6 ? (
              <>
                <span>{urgencyDate ? 'Confirm Date & Finish' : 'Skip for now'}</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-[#255CC1]" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
