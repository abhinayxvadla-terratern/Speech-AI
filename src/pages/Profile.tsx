import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Streak, Module, CefrLevel } from '../lib/database.types';
import { 
  Mail, 
  KeyRound, 
  Bell, 
  Download, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  Compass, 
  Flame, 
  Award,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Smartphone,
  MessageSquarePlus,
} from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { IosInstallModal } from '../components/pwa/IosInstallModal';
import { FeedbackModal } from '../components/feedback/FeedbackModal';

type LevelStatus = 'completed' | 'current' | 'not_tracked' | 'locked';

interface LevelNode {
  level: 'A1' | 'A2' | 'B1' | 'B2';
  status: LevelStatus;
  statusLabel: string;
}

const CEFR_INDEX: Record<string, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // Streak & Progress Data
  const [streak, setStreak] = useState<Streak | null>(null);
  const [completedModulesCount, setCompletedModulesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [levelNodes, setLevelNodes] = useState<LevelNode[]>([]);

  // Settings UI State
  const [settingsOpen, setSettingsOpen] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    profile?.notifications_enabled ?? true
  );

  // Email Change Modal State
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [passwordLoading, setEmailPasswordLoading] = useState<boolean>(false);

  // Export Data Toast State
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // PWA Install & Feedback State
  const { isStandalone, promptInstall, showIOSModal, setShowIOSModal } = usePwaInstall();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);

  // Delete Account Dialog State
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cefrLevel = (profile?.cefr_level as CefrLevel) || 'B1';

  // Load Streaks & Journey Level Completion
  useEffect(() => {
    let active = true;

    const loadProfileData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // 1. Fetch Streak
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (active && streakData) {
          setStreak(streakData as Streak);
        }

        // 2. Compute Level Completion across A1, A2, B1, B2
        const structuredLevels: ('A1' | 'A2' | 'B1' | 'B2')[] = ['A1', 'A2', 'B1', 'B2'];
        const levelCompletedMap: Record<string, boolean> = {};

        const { data: allModules } = await supabase
          .from('modules')
          .select('id, level');

        const { data: completedSessions } = await supabase
          .from('sessions')
          .select('module_id')
          .eq('user_id', user.id)
          .eq('tab', 'speak')
          .eq('status', 'completed');

        const completedSet = new Set<string>();
        (completedSessions || []).forEach((s) => {
          if (s.module_id) completedSet.add(s.module_id);
        });

        if (active) {
          setCompletedModulesCount(completedSet.size);
        }

        structuredLevels.forEach((lvl) => {
          const modsForLvl = (allModules as Module[] || []).filter((m) => m.level === lvl);
          if (modsForLvl.length > 0) {
            const allDone = modsForLvl.every((m) => completedSet.has(m.id));
            levelCompletedMap[lvl] = allDone;
          } else {
            levelCompletedMap[lvl] = false;
          }
        });

        const userIdx = CEFR_INDEX[cefrLevel] ?? 2;
        const nodes: LevelNode[] = structuredLevels.map((lvl) => {
          const lvlIdx = CEFR_INDEX[lvl];
          const isLvlCompleted = !!levelCompletedMap[lvl];

          if (isLvlCompleted) {
            return { level: lvl, status: 'completed', statusLabel: 'Completed' };
          }
          if (lvl === cefrLevel) {
            return { level: lvl, status: 'current', statusLabel: 'Current Level' };
          }
          if (lvlIdx < userIdx) {
            return { level: lvl, status: 'not_tracked', statusLabel: 'Not tracked' };
          }
          return { level: lvl, status: 'locked', statusLabel: 'Locked' };
        });

        if (active) {
          setLevelNodes(nodes);
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfileData();

    return () => {
      active = false;
    };
  }, [user, cefrLevel]);

  // Sync notifications toggle
  const handleToggleNotifications = async () => {
    if (!user) return;
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    try {
      await supabase
        .from('profiles')
        .update({ notifications_enabled: nextVal })
        .eq('id', user.id);
      refreshProfile();
    } catch (err) {
      console.error('Failed to update notifications:', err);
    }
  };

  // Email Update Handler
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setEmailStatus({ type: 'error', msg: 'Please provide a valid email address.' });
      return;
    }

    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setEmailStatus({
        type: 'success',
        msg: `Confirmation link sent to ${newEmail.trim()}. Please check your inbox to confirm.`,
      });
      setNewEmail('');
    } catch (err: any) {
      setEmailStatus({ type: 'error', msg: err.message || 'Failed to update email.' });
    } finally {
      setEmailLoading(false);
    }
  };

  // Password Update Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }

    setEmailPasswordLoading(true);
    setPasswordStatus(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err.message || 'Failed to update password.' });
    } finally {
      setEmailPasswordLoading(false);
    }
  };

  // Export Data Handler
  const handleExportData = () => {
    setExportNotice('Data export coming soon. Your speech transcripts will be downloadable as a PDF dossier.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      if (rpcError) throw rpcError;

      await signOut();
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Delete account failed:', err);
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  // Target Date Remaining Days Calculation
  let urgencyRemainingDays: number | null = null;
  if (profile?.urgency_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(profile.urgency_date);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    urgencyRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const formatRelativeDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No sessions yet';
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) return 'Yesterday';

    const dateObj = new Date(dateStr);
    const todayObj = new Date(todayStr);
    const diffDays = Math.round((todayObj.getTime() - dateObj.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 1) {
      return `${diffDays} days ago`;
    }
    return dateStr;
  };

  const getInitials = (nameStr: string | null): string => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  if (loading && !streak) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#255CC1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-[#111111] animate-fadeIn pb-12">
      {/* Export Notice Banner */}
      {exportNotice && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto p-3.5 rounded-xl bg-[#00215C] text-white text-xs font-medium shadow-xl flex items-center justify-between animate-fadeIn">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="p-1 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1 — IDENTITY HEADER */}
      <section aria-label="Identity Header" className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name || 'User Avatar'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#00215C] text-white flex items-center justify-center font-heading font-extrabold text-xl sm:text-2xl shadow-xs tracking-tight">
                {getInitials(profile?.name || user?.email || null)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Active Account" />
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00215C] tracking-tight truncate leading-tight">
              {profile?.name || 'Speech Learner'}
            </h1>
            <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
              {user?.email}
            </p>

            {/* Badges Container */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#EBF2FF] text-[#255CC1] border border-blue-100">
                <Award className="w-3.5 h-3.5" />
                <span>Level {cefrLevel}</span>
              </span>

              {profile?.primary_domain && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-[#00215C] border border-slate-200/60">
                  <Compass className="w-3.5 h-3.5 text-[#255CC1]" />
                  <span>
                    {profile.primary_domain} · {profile.primary_subbranch || 'General'}
                  </span>
                </span>
              )}
            </div>

            {profile?.added_domains && profile.added_domains.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-slate-400">Added:</span>
                {profile.added_domains.map((ad, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60"
                  >
                    {ad.domain} · {ad.subbranch}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Target Date Countdown */}
        {urgencyRemainingDays !== null && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-heading font-bold text-[#00215C] text-xs sm:text-sm">
                  {urgencyRemainingDays > 0
                    ? `${urgencyRemainingDays} days until target date`
                    : urgencyRemainingDays === 0
                    ? 'Target date is today!'
                    : 'Target date has passed'}
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  {urgencyRemainingDays >= 0
                    ? 'Target departure timeline'
                    : 'Next milestone'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200/60">
              {new Date(profile!.urgency_date!).toLocaleDateString()}
            </span>
          </div>
        )}
      </section>

      {/* SECTION 2 — JOURNEY SNAPSHOT */}
      <section aria-label="Journey Snapshot" className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-[#255CC1] uppercase tracking-wider block mb-1">
            Learning Pathway
          </span>
          <h2 className="font-heading font-extrabold text-xl text-[#00215C] tracking-tight">
            Journey Snapshot
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Progressive CEFR proficiency path.
          </p>
        </div>

        {/* Visual Horizontal Step Sequence */}
        <div className="pt-2 pb-1">
          <div className="relative flex items-center justify-between">
            <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200/80 z-0" />

            {levelNodes.map((node) => {
              const isCompleted = node.status === 'completed';
              const isCurrent = node.status === 'current';
              const isNotTracked = node.status === 'not_tracked';
              const isLocked = node.status === 'locked';

              return (
                <div key={node.level} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-extrabold text-xs sm:text-sm border-2 transition-all ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                        : isCurrent
                        ? 'border-[#255CC1] bg-[#00215C] text-white shadow-xs ring-4 ring-blue-100'
                        : isNotTracked
                        ? 'border-slate-300 bg-white text-slate-500'
                        : 'border-slate-200 bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : (
                      <span>{node.level}</span>
                    )}
                  </div>

                  <span
                    className={`text-xs mt-2 font-bold ${
                      isCurrent
                        ? 'text-[#255CC1]'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {node.level}
                  </span>

                  <span
                    className={`text-[10px] mt-0.5 font-medium ${
                      isCurrent
                        ? 'text-[#255CC1] font-bold'
                        : isCompleted
                        ? 'text-emerald-600'
                        : isNotTracked
                        ? 'text-slate-400 italic'
                        : 'text-slate-400'
                    }`}
                  >
                    {node.statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Card-Based Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Modules Completed */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Modules
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-heading font-extrabold text-xl text-[#00215C]">
                {completedModulesCount}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Completed</span>
          </div>

          {/* Current Streak */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Streak
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-heading font-extrabold text-xl text-[#00215C]">
                {streak?.current_streak || 0}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {streak?.current_streak === 1 ? '1 day' : `${streak?.current_streak || 0} days`}
            </span>
          </div>

          {/* Total Sessions */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sessions
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-4 h-4 text-[#255CC1] shrink-0" />
              <span className="font-heading font-extrabold text-xl text-[#00215C]">
                {streak?.total_sessions || 0}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Total Spoken</span>
          </div>

          {/* Last Active */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Last Session
            </span>
            <span className="font-heading font-bold text-sm sm:text-base text-[#00215C] mt-1.5 truncate">
              {formatRelativeDate(streak?.last_session_date || null)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">Activity Date</span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — SETTINGS */}
      <section aria-label="Account Settings" className="pt-1">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          {/* Header Toggle */}
          <div
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-100"
          >
            <div>
              <h3 className="font-heading font-bold text-sm text-[#00215C]">
                Account & Preferences
              </h3>
              <p className="text-[11px] text-slate-500">
                Notification and account preferences
              </p>
            </div>
            <button className="text-slate-400 p-1 hover:text-slate-600">
              {settingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {settingsOpen && (
            <div className="space-y-4 pt-1 text-xs">
              {/* Daily Reminders */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Daily Reminders</span>
                    <span className="text-[11px] text-slate-400">Daily practice alerts</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationsEnabled ? 'bg-[#255CC1]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Address */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block">Email Address</span>
                    <span className="text-[11px] text-slate-400 truncate block">{user?.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#255CC1] hover:text-[#255CC1] font-semibold text-[11px] transition-colors shrink-0 bg-white"
                >
                  Change
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Password</span>
                    <span className="text-[11px] text-slate-400">••••••••</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#255CC1] hover:text-[#255CC1] font-semibold text-[11px] transition-colors shrink-0 bg-white"
                >
                  Change Password
                </button>
              </div>

              {/* Export Data */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Export Learning Data</span>
                    <span className="text-[11px] text-slate-400">Download speech transcripts</span>
                  </div>
                </div>

                <button
                  onClick={handleExportData}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 font-semibold text-[11px] text-slate-600 transition-colors shrink-0 bg-white"
                >
                  Export
                </button>
              </div>

              {/* Install App (Hidden if already in standalone mode) */}
              {!isStandalone && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">Install SpeechAI App</span>
                      <span className="text-[11px] text-slate-400">Add to home screen or desktop for fast offline shell</span>
                    </div>
                  </div>

                  <button
                    onClick={() => promptInstall()}
                    className="px-3 py-1.5 rounded-lg border border-[#255CC1]/30 hover:border-[#255CC1] bg-[#EBF2FF] font-semibold text-[11px] text-[#255CC1] transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Install</span>
                  </button>
                </div>
              )}

              {/* Send Feedback Support Channel */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#255CC1] flex items-center justify-center shrink-0">
                    <MessageSquarePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Send Feedback</span>
                    <span className="text-[11px] text-slate-400">Report bugs, request features, or ask curriculum questions</span>
                  </div>
                </div>

                <button
                  onClick={() => setFeedbackModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#255CC1] hover:text-[#255CC1] font-semibold text-[11px] text-slate-600 transition-colors shrink-0 bg-white"
                >
                  Feedback
                </button>
              </div>

              {/* Bottom Actions: Delete Account & Logout */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>

                <button
                  onClick={() => signOut()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL: CHANGE EMAIL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200/80 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#00215C]">
                Update Email Address
              </h3>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailStatus(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {emailStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  emailStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{emailStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  New Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new.email@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#255CC1]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-semibold hover:bg-[#143471] disabled:opacity-50"
                >
                  {emailLoading ? 'Updating...' : 'Save Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200/80 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#00215C]">
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordStatus(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#255CC1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#255CC1]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-semibold hover:bg-[#143471] disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ACCOUNT CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200/80 animate-fadeIn space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/60">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-lg text-rose-600">
                Delete Account?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
                Permanently deletes your account and all learning progress.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs uppercase font-bold tracking-wider text-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USER FEEDBACK */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        defaultCategory="Bug"
      />

      {/* MODAL: IOS INSTALL INSTRUCTIONS */}
      <IosInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </div>
  );
};

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
