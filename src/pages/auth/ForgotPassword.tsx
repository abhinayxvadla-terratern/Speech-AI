import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowRight, AlertCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });

      if (error) {
        // Surface rate limits or configuration errors, but suppress user-not-found to prevent account enumeration
        if (error.status === 429) {
          setErrorMsg('Too many password reset requests. Please wait a few minutes before trying again.');
          return;
        }
        if (error.message && error.message.toLowerCase().includes('rate limit')) {
          setErrorMsg(error.message);
          return;
        }
      }

      // Always show confirmation screen regardless of whether the email exists
      setIsSubmitted(true);
    } catch (err: any) {
      // In case of any unhandled network error, show confirmation or fallback
      setIsSubmitted(true);
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
          {!isSubmitted ? (
            <div>
              <div className="mb-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00215C] transition-colors mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
                <h2 className="font-heading font-extrabold text-xl text-[#00215C] mb-1">
                  Forgot Password?
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-semibold text-[#00215C] mb-1">
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@teratern.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#255CC1] focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#255CC1]" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4 text-[#255CC1]" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-[#255CC1] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF2FF] text-[#255CC1] border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Mail className="w-7 h-7" />
              </div>

              <h2 className="font-heading font-extrabold text-xl text-[#00215C] mb-2">
                Check Your Email
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-3">
                If an account exists for <strong className="text-[#00215C] font-semibold">{email.trim()}</strong>, a reset link has been sent.
              </p>

              <p className="text-xs text-slate-400 leading-relaxed font-normal mb-6">
                Please check your inbox and click the link to reset your password. If you don't see the email within a couple minutes, please check your spam or junk folder.
              </p>

              <div className="space-y-2.5">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99]"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#255CC1]" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setErrorMsg(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#00215C] hover:bg-slate-50 transition-colors"
                >
                  Didn't receive it? Try another email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
