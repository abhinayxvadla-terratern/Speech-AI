import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireOnboarding = true }) => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#255CC1]" />
        <p className="mt-3 text-xs font-semibold text-[#00215C] tracking-wide">
          Loading SpeechAI...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is suspended, block access immediately
  if (profile?.is_suspended) {
    signOut();
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-sm">
          <Loader2 className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-[#00215C]">
          Account Suspended
        </h2>
        <p className="mt-2 text-xs text-slate-600 max-w-sm leading-relaxed font-body">
          Your account has been suspended by a platform administrator. Please contact support for assistance.
        </p>
        <button
          onClick={() => {
            signOut();
            window.location.href = '/login';
          }}
          className="mt-6 px-5 py-2.5 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // If user has not completed onboarding and the route requires it, redirect to /onboarding
  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};
