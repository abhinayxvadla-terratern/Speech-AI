import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowRight, AlertCircle, Loader2, RotateCcw, Lock, Eye, EyeOff } from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

type TokenStatus = 'verifying' | 'valid' | 'invalid';

export const ResetPassword: React.FC = () => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('verifying');
  const [tokenErrorMsg, setTokenErrorMsg] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // 1. Inspect URL parameters for explicit errors (hash fragment or search query)
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    const searchParams = new URLSearchParams(search);

    const urlError = hashParams.get('error') || searchParams.get('error');
    const urlErrorCode = hashParams.get('error_code') || searchParams.get('error_code');
    const urlErrorDesc = hashParams.get('error_description') || searchParams.get('error_description');

    if (urlError || urlErrorCode) {
      if (isMounted) {
        setTokenStatus('invalid');
        const formattedDesc = urlErrorDesc
          ? decodeURIComponent(urlErrorDesc.replace(/\+/g, ' '))
          : 'This password reset link is invalid or has expired. Please request a new one.';
        setTokenErrorMsg(formattedDesc);
      }
      return;
    }

    // 2. Listen to Supabase Auth State Change for PASSWORD_RECOVERY or SIGNED_IN event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setTokenStatus('valid');
      }
    });

    // 3. Check existing or active recovery session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;

      if (error) {
        setTokenStatus('invalid');
        setTokenErrorMsg(error.message || 'Unable to verify reset token.');
        return;
      }

      if (session) {
        setTokenStatus('valid');
        return;
      }

      // If session is not immediately ready, wait briefly for Supabase to parse URL hash tokens
      const checkTimer = setTimeout(async () => {
        if (!isMounted) return;
        const { data: { session: delayedSession } } = await supabase.auth.getSession();
        if (delayedSession) {
          setTokenStatus('valid');
        } else {
          // Check if URL contained recovery tokens
          const hasTokens = hash.includes('access_token') || hash.includes('type=recovery') || search.includes('code=');
          if (!hasTokens) {
            setTokenStatus('invalid');
            setTokenErrorMsg('No active password reset session found. Please request a new link.');
          } else {
            // Had tokens but failed to exchange
            setTokenStatus('invalid');
            setTokenErrorMsg('This password reset link is invalid or has expired. Please request a new one.');
          }
        }
      }, 1200);

      return () => clearTimeout(checkTimer);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFormErrorMsg('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setFormErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setFormErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setFormErrorMsg(error.message);
        return;
      }

      // Sign out from the temporary recovery session so user logs in cleanly with new credentials
      await supabase.auth.signOut();

      // Redirect to login with success message
      navigate('/login', {
        replace: true,
        state: {
          successMessage: 'Your password has been successfully reset! Please sign in with your new password.',
        },
      });
    } catch (err: any) {
      setFormErrorMsg(err.message || 'An unexpected error occurred updating your password.');
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
          {tokenStatus === 'verifying' && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#255CC1] mx-auto" />
              <h2 className="font-heading font-bold text-base text-[#00215C]">
                Verifying your reset link...
              </h2>
              <p className="text-xs text-slate-400 font-normal">
                Please wait a moment while we validate your credentials.
              </p>
            </div>
          )}

          {tokenStatus === 'invalid' && (
            <div className="text-center py-2 animate-fadeIn space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h2 className="font-heading font-extrabold text-xl text-[#00215C] mb-1.5">
                  Reset Link Expired or Invalid
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {tokenErrorMsg || 'This password reset link is invalid or has expired. Password reset links are single-use and time-sensitive for your security.'}
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <Link
                  to="/forgot-password"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99]"
                >
                  <RotateCcw className="w-4 h-4 text-[#255CC1]" />
                  <span>Request New Reset Link</span>
                </Link>

                <Link
                  to="/login"
                  className="block text-center text-xs font-semibold text-slate-500 hover:text-[#00215C] transition-colors py-2"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {tokenStatus === 'valid' && (
            <div className="animate-fadeIn">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] text-xs font-semibold mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure Password Reset</span>
                </div>
                <h2 className="font-heading font-extrabold text-xl text-[#00215C] mb-1">
                  Set New Password
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Choose a new password for your account (minimum 6 characters).
                </p>
              </div>

              {formErrorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-xs font-semibold text-[#00215C] mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#255CC1] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-[#00215C] mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#255CC1] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4 text-[#255CC1]" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-[#00215C] transition-colors"
                >
                  Cancel and return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
