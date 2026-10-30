import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Sparkles, ArrowRight, CheckCircle2, LogOut } from 'lucide-react';

export const OnboardingPlaceholder: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  // Quick helper to mark onboarding as completed for testing the 5-tab app shell
  const handleCompleteTestOnboarding = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          cefr_level: 'B1',
          primary_domain: 'Healthcare',
          primary_subbranch: 'Nursing',
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error completing onboarding test:', error);
      } else {
        await refreshProfile();
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col justify-between p-4 sm:p-6 text-[#111111]">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-lg mx-auto w-full pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00215C] text-white flex items-center justify-center font-bold text-sm">
            DE
          </div>
          <span className="font-heading font-extrabold text-lg text-[#00215C]">
            Speech<span className="text-[#255CC1]">AI</span>
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Center Content Placeholder */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            Onboarding Screen
          </h2>

          <p className="mt-2 text-sm text-slate-600 font-normal leading-relaxed">
            Welcome, <span className="font-semibold text-[#00215C]">{profile?.name || user?.email}</span>! You have landed on the onboarding placeholder route (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-[#255CC1]">/onboarding</code>).
          </p>

          <div className="my-6 p-4 rounded-xl bg-[#FAFBFF] border border-slate-200 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Auth Session & Profile Verified</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Database schema & domains seeded</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="w-4 h-4 rounded-full border-2 border-[#255CC1] shrink-0" />
              <span>Full onboarding wizard will be built in the next step</span>
            </div>
          </div>

          <button
            onClick={handleCompleteTestOnboarding}
            disabled={updating}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <span>{updating ? 'Activating Profile...' : 'Complete Onboarding & Enter App Shell'}</span>
            <ArrowRight className="w-4 h-4 text-[#255CC1]" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 pb-2">
        SpeechAI German Training System • Mobile-first Platform
      </div>
    </div>
  );
};
