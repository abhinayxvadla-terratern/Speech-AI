import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Sliders, 
  LogOut, 
  ExternalLink,
  Database,
  Radio,
  Lock,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminRole } from '../../lib/database.types';

interface AdminNavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  allowedRoles: AdminRole[];
}

const navItems: AdminNavItem[] = [
  {
    label: 'Overview',
    to: '/admin/overview',
    icon: LayoutDashboard,
    description: 'Platform metrics, health & activity summary',
    allowedRoles: ['admin', 'support', 'content_editor'],
  },
  {
    label: 'Users',
    to: '/admin/users',
    icon: Users,
    description: 'Learners, CEFR levels, streaks & user management',
    allowedRoles: ['admin', 'support'],
  },
  {
    label: 'Content',
    to: '/admin/content',
    icon: Layers,
    description: 'Curriculum modules, scenarios, interview sets & pressure modes',
    allowedRoles: ['admin', 'content_editor'],
  },
  {
    label: 'System Controls',
    to: '/admin/system',
    icon: Sliders,
    description: 'Pipeline telemetry, session browser, kill-switches & team',
    allowedRoles: ['admin'],
  },
];

export const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { role, isSuperAdmin } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Alert banner for route access restrictions
  const [deniedBanner, setDeniedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.deniedMessage) {
      setDeniedBanner(location.state.deniedMessage);
    }
  }, [location.state]);

  const currentTab = navItems.find((item) => 
    location.pathname === item.to || 
    (item.to === '/admin/overview' && location.pathname === '/admin')
  ) || navItems[0];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const currentRole = role || 'admin';

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#111111] flex flex-col md:flex-row w-full font-body select-none">
      {/* Desktop Admin Sidebar (Hidden on mobile < md, visible on md+) */}
      <aside className="hidden md:flex w-68 bg-white border-r border-slate-200/90 flex-col shrink-0 min-h-screen sticky top-0 h-screen z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden">
              <img src="/terratern-emblem.png" alt="TerraTern Mascot" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg text-[#00215C] tracking-tight leading-none">
                  Terra<span className="text-[#255CC1]">Tern</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-[#00215C] text-white">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Platform Control Center</p>
            </div>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Database className="w-3.5 h-3.5 text-[#255CC1]" />
              Project DB
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
              Connected
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Main Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isPermitted = isSuperAdmin || (role && item.allowedRoles.includes(role));
            const isActive =
              location.pathname === item.to ||
              (item.to === '/admin/overview' && location.pathname === '/admin');

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#EBF2FF] text-[#00215C] shadow-xs'
                    : isPermitted
                    ? 'text-slate-600 hover:text-[#00215C] hover:bg-slate-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/60 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#255CC1] text-white'
                        : isPermitted
                        ? 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-[#00215C]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading">{item.label}</span>
                  </div>
                </div>

                {!isPermitted && (
                  <span
                    className="p-1 text-slate-400 hover:text-amber-600"
                    title={`Restricted: Requires ${item.allowedRoles.join(' or ')} role`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Admin User Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 mt-auto">
          <div className="mb-3 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Logged in Admin
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  currentRole === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : currentRole === 'support'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {currentRole.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#00215C] truncate" title={user?.email || ''}>
              {user?.email}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold text-[#00215C] bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#255CC1]" />
              Return to SpeechAI
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden min-w-0">
        {/* Mobile Top Header (Visible < md) */}
        <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden">
              <img src="/terratern-emblem.png" alt="TerraTern Mascot" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-base text-[#00215C] tracking-tight leading-none">
                  Terra<span className="text-[#255CC1]">Tern</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#00215C] text-white">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium capitalize">
                {currentTab.label} • {currentRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#00215C] hover:bg-slate-100 transition-colors"
              title="Return to SpeechAI"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop Top Header Bar (Hidden < md, visible md+) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/90 px-8 items-center justify-between shrink-0 sticky top-0 z-10">
          <div>
            <h1 className="font-heading font-extrabold text-lg text-[#00215C] tracking-tight">
              {currentTab.label}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentTab.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              Direct Admin Route: <code className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-[#00215C]">/admin</code>
            </span>
          </div>
        </header>

        {/* View Content (Generous bottom padding pb-28 sm:pb-32 on mobile to clear floating bottom nav) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-28 sm:pb-32 md:pb-8 bg-[#FAFBFF]">
          {/* Role Access Restriction Banner */}
          {deniedBanner && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between shadow-xs animate-fadeIn">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-amber-800">
                    Access Restricted
                  </h4>
                  <p className="text-xs font-medium text-amber-700 mt-0.5">
                    {deniedBanner}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeniedBanner(null)}
                className="text-amber-500 hover:text-amber-800 transition-colors p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation Bar (Visible < md) */}
      <nav
        aria-label="Admin Mobile Navigation"
        className="md:hidden fixed z-40 left-4 right-4 max-w-lg mx-auto bg-white border border-slate-200/90 rounded-2xl shadow-[0_10px_28px_rgba(0,33,92,0.12),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden select-none"
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-4 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.to ||
              (item.to === '/admin/overview' && location.pathname === '/admin');
            const isPermitted = isSuperAdmin || (role && item.allowedRoles.includes(role));

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`relative flex flex-col items-center justify-center py-1 select-none transition-colors duration-150 ${
                  active
                    ? 'text-[#255CC1]'
                    : isPermitted
                    ? 'text-slate-600 hover:text-[#00215C]'
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                <div
                  className={`relative p-1.5 rounded-xl transition-all ${
                    active ? 'bg-[#EBF2FF]' : ''
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active
                        ? 'text-[#255CC1] stroke-[2.3]'
                        : isPermitted
                        ? 'text-slate-500 stroke-[1.8]'
                        : 'text-slate-400 stroke-[1.5]'
                    }`}
                  />
                  {!isPermitted && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-[8px] font-bold border border-amber-300">
                      <Lock className="w-2 h-2" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] mt-0.5 leading-tight truncate max-w-[70px] ${
                    active
                      ? 'font-bold text-[#255CC1]'
                      : 'font-medium text-slate-600'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
