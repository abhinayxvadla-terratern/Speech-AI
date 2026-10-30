import React, { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  Mic, 
  Compass, 
  Briefcase, 
  User, 
  LogOut,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveSession } from '../../contexts/ActiveSessionContext';
import { realVoiceAdapter } from '../../services/voice/voiceAdapter.real';
import { AppLogo } from '../common/AppLogo';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { PWAInstallInstructionsModal } from '../pwa/PWAInstallInstructionsModal';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Speak', to: '/speak', icon: Mic },
  { label: 'Scenarios', to: '/scenarios', icon: Compass },
  { label: 'Interview', to: '/interview', icon: Briefcase },
  { label: 'Profile', to: '/profile', icon: User },
];

export const AppShell: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { isSessionActive } = useActiveSession();
  const { isInstalled, installApp, showInstructionsModal, setShowInstructionsModal } = usePwaInstall();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Crucial: Whenever the user navigates to a new tab/route, halt any active TTS audio & scroll to top
  useEffect(() => {
    realVoiceAdapter.stopSpeaking?.();
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const isExactActive = (to: string) => {
    if (to === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] md:h-screen md:h-[100dvh] md:overflow-hidden bg-[#FAFBFF] text-[#111111] flex flex-col md:flex-row w-full max-w-full">
      {/* Desktop Sidebar (hidden on mobile, visible md+) - Permanently fixed & stationary */}
      <aside className="hidden md:flex flex-col md:w-60 lg:w-64 bg-white border-r border-slate-200/90 fixed inset-y-0 left-0 h-screen z-30 select-none overflow-hidden">
        {/* App Brand Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <AppLogo size="md" className="drop-shadow-xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-heading font-extrabold text-xl text-[#00215C] tracking-tight leading-none">
                  Speech<span className="text-[#255CC1]">AI</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">German Voice Training</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex-1 px-3 py-5 lg:py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isExactActive(item.to);
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  active
                    ? 'bg-[#EBF2FF] text-[#255CC1] font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#00215C]'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-[#255CC1]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Separate "Get App" Card in Desktop Sidebar (Only shown if app is not installed) */}
        {!isInstalled && (
          <div className="mx-3.5 mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#EBF2FF] via-blue-50/50 to-white border border-blue-200/80 shadow-2xs space-y-2.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00215C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Download className="w-4 h-4 text-blue-200" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-extrabold text-xs text-[#00215C] leading-tight">
                  Get Desktop App
                </h4>
                <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 font-normal">
                  Fast 1-click voice training
                </p>
              </div>
            </div>
            <button
              onClick={installApp}
              className="w-full py-2 px-3 rounded-xl bg-[#00215C] hover:bg-[#143471] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        )}

        {/* User Card & Logout (Desktop Bottom) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#00215C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111111] truncate">
                  {profile?.name || 'Speech Learner'}
                </p>
                {profile?.primary_domain && (
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {profile.primary_domain}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors border border-slate-200/60 bg-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top App Header (Hidden during active voice sessions to avoid redundant double-headers) */}
      {!isSessionActive && (
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" className="drop-shadow-xs" />
            <h1 className="font-heading font-extrabold text-lg text-[#00215C] tracking-tight leading-none">
              Speech<span className="text-[#255CC1]">AI</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {profile?.primary_domain && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full truncate max-w-[130px]">
                {profile.primary_domain}
              </span>
            )}
            <NavLink
              to="/profile"
              className="w-8 h-8 rounded-full bg-[#00215C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs active:scale-95 transition-transform"
              title="Profile & Settings"
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </NavLink>
          </div>
        </header>
      )}

      {/* Main Content Area (Offset by fixed desktop sidebar on md+) */}
      <main
        ref={mainRef}
        className={`flex-1 min-w-0 md:ml-60 lg:ml-64 md:h-full md:overflow-y-auto ${
          isSessionActive 
            ? 'pb-4 pt-1 md:pt-4' 
            : 'pb-28 sm:pb-32 md:pb-8 pt-2 md:pt-6'
        } px-3 sm:px-6 md:px-6 lg:px-8 max-w-7xl mx-auto w-full`}
      >
        <Outlet />
      </main>

      {/* Mobile Floating Bottom Navigation Bar (Visible < md, hidden during active voice sessions for full immersion) */}
      {!isSessionActive && (
        <nav 
          aria-label="Mobile Navigation"
          className="md:hidden fixed z-40 left-3 right-3 sm:left-4 sm:right-4 max-w-md mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_10px_28px_rgba(0,33,92,0.12),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
          style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="grid grid-cols-5 h-16 items-center px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isExactActive(item.to);
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`flex flex-col items-center justify-center py-1 select-none transition-colors duration-150 min-w-0 ${
                    active
                      ? 'text-[#255CC1]'
                      : 'text-slate-600 hover:text-[#00215C]'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-[#EBF2FF]' : ''}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${active ? 'text-[#255CC1] stroke-[2.3]' : 'text-slate-500 stroke-[1.8]'}`} />
                  </div>
                  <span className={`text-[10px] sm:text-[11px] mt-0.5 leading-tight truncate px-0.5 ${active ? 'font-bold text-[#255CC1]' : 'font-medium text-slate-600'}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
      {/* PWA Install Instructions Modal */}
      <PWAInstallInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </div>
  );
};
