import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const successNotice = (location.state as any)?.successMessage || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || (error as any).status === 429) {
          setErrorMsg('Authentication rate limit reached. Please wait a few moments before trying again.');
        } else if (msg.includes('email not confirmed')) {
          setErrorMsg('Your email is not confirmed. In Supabase Dashboard, disable "Confirm email" (Authentication > Providers > Email) to allow immediate access.');
        } else if (msg.includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password. If you recently attempted to sign up while the email rate limit was exceeded, please sign up again.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (data.user) {
        // Fetch profile to determine redirect and suspension check
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, is_suspended')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.is_suspended) {
          await supabase.auth.signOut();
          setErrorMsg('Your account has been suspended by an administrator. Please contact support for assistance.');
          return;
        }

        if (profile?.onboarding_completed) {
          navigate('/', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-[#111111]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="flex justify-center mb-1">
          <AppLogo size="xl" className="drop-shadow-md" />
        </div>

        <h1 className="mt-4 font-heading font-extrabold text-3xl text-[#00215C] tracking-tight">
          Speech<span className="text-[#255CC1]">AI</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-normal">
          Voice-based German training for Indian healthcare & skilled professionals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-sm rounded-2xl border border-slate-200">
          <h2 className="font-heading font-extrabold text-xl text-[#00215C] mb-1">
            Sign In to your account
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter your email and password to continue practice
          </p>

          {successNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#00215C] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@teratern.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#255CC1] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#00215C] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#255CC1] focus:border-transparent transition-all"
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#255CC1] hover:underline hover:text-[#00215C] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#255CC1]" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#255CC1]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link
                to="/signup"
                className="font-semibold text-[#255CC1] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
