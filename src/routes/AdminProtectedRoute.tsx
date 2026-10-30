import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ShieldAlert, Loader2, ArrowLeft, RefreshCw, LogOut, Copy, Check, Ban, Clock } from 'lucide-react';

export const AdminProtectedRoute: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isRevoked, isPending, loading, refetchAdmin } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#00215C] flex items-center justify-center text-white shadow-md mb-4 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin text-blue-200" />
        </div>
        <h2 className="font-heading font-bold text-lg text-[#00215C] tracking-tight">
          SpeechAI Admin Panel
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium font-body">
          Verifying administrative credentials & privileges...
        </p>
      </div>
    );
  }

  // Not authenticated at all -> Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated, but no active row in admin_users -> Access Denied Screen
  if (!isAdmin) {
    const copyUserId = () => {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/60 p-8 text-center">
          {isRevoked ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <Ban className="w-7 h-7" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
                Admin Access Revoked
              </span>

              <h1 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
                Administrative Permissions Revoked
              </h1>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-body">
                Your administrative access for <strong className="text-[#00215C]">{user.email}</strong> has been revoked by a platform administrator. You can no longer access the admin panel.
              </p>
            </>
          ) : isPending ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                <Clock className="w-7 h-7" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
                Invitation Pending
              </span>

              <h1 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
                Account Invitation Pending
              </h1>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-body">
                Your account (<strong className="text-[#00215C]">{user.email}</strong>) has been invited, but your status is currently pending. Please ask an active administrator to activate your access.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 mb-3">
                Admin Access Restricted
              </span>

              <h1 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
                Administrative Privileges Required
              </h1>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-body">
                You are signed in as <strong className="text-[#00215C]">{user.email}</strong>, but your account does not have an active record in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">admin_users</code>.
              </p>

              {/* User ID helper box for seeding */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Your Supabase User ID
                  </span>
                  <button
                    onClick={copyUserId}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#255CC1] hover:text-[#00215C] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy ID'}
                  </button>
                </div>
                <code className="text-xs font-mono text-[#00215C] break-all select-all">
                  {user.id}
                </code>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              onClick={() => refetchAdmin()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#255CC1] text-white text-xs font-bold hover:bg-[#00215C] transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-check Privileges
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to SpeechAI
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active admin confirmed!
  return <Outlet />;
};
