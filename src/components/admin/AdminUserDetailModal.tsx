import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Flame, 
  Award, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  Bell, 
  BellOff, 
  ChevronRight, 
  Plus, 
  Minus,
  Loader2,
  Lock,
  Globe
} from 'lucide-react';
import { 
  AdminDirectoryUser, 
  CefrLevel, 
  Session, 
  DiagnosticRecap, 
  UserOverrides 
} from '../../lib/database.types';
import { 
  fetchUserSessions, 
  fetchUserDiagnosticRecaps,
  updateAdminUserCefrLevel,
  updateAdminUserAddedDomains,
  toggleAdminUserNotifications,
  triggerAdminResetOnboarding,
  toggleAdminUserSuspension,
  updateAdminUserOverrides,
  deleteAdminUserAccount
} from '../../services/adminUserService';
import { AdminTranscriptModal } from './AdminTranscriptModal';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface AdminUserDetailModalProps {
  user: AdminDirectoryUser | null;
  adminUserId: string;
  onClose: () => void;
  onUserUpdated: () => void;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PLATFORM_TABS = ['speak', 'scenarios', 'interview'];
const PLATFORM_MODES = ['learn', 'practice'];
const PLATFORM_DOMAINS = [
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  user,
  adminUserId,
  onClose,
  onUserUpdated,
}) => {
  if (!user) return null;

  const { isSuperAdmin, role } = useAdminAuth();

  // Active Sub-Tab: 'profile' | 'sessions' | 'recaps' | 'actions'
  const [activeTab, setActiveTab] = useState<'profile' | 'sessions' | 'recaps' | 'actions'>('profile');

  // Sessions and Recaps
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recaps, setRecaps] = useState<DiagnosticRecap[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Transcript viewer
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Filters for sessions
  const [sessionTabFilter, setSessionTabFilter] = useState<string>('all');
  const [sessionModeFilter, setSessionModeFilter] = useState<string>('all');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('all');

  // Action states
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(user.cefr_level || 'B1');
  const [isUpdatingCefr, setIsUpdatingCefr] = useState(false);

  // Added domains editor
  const [addedDomains, setAddedDomains] = useState<Array<{ domain: string; subbranch: string }>>(
    user.added_domains || []
  );
  const [newDomain, setNewDomain] = useState<string>(PLATFORM_DOMAINS[0]);
  const [newSubbranch, setNewSubbranch] = useState<string>('');
  const [isUpdatingDomains, setIsUpdatingDomains] = useState(false);

  // Overrides editor
  const [userOverrides, setUserOverrides] = useState<UserOverrides>(user.user_overrides || {});
  const [isUpdatingOverrides, setIsUpdatingOverrides] = useState(false);

  // Big Action Modals/Confirmations
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadUserData = async () => {
      try {
        setDataLoading(true);
        const [userSessions, userRecaps] = await Promise.all([
          fetchUserSessions(user.id),
          fetchUserDiagnosticRecaps(user.id),
        ]);
        if (isMounted) {
          setSessions(userSessions);
          setRecaps(userRecaps);
        }
      } catch (err) {
        console.error('Error fetching user sessions/recaps:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Handle CEFR level change
  const handleSaveCefr = async () => {
    try {
      setIsUpdatingCefr(true);
      await updateAdminUserCefrLevel(adminUserId, user.id, cefrLevel, user.cefr_level);
      showNotification('success', `CEFR level updated to ${cefrLevel}`);
      onUserUpdated();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update CEFR level');
    } finally {
      setIsUpdatingCefr(false);
    }
  };

  // 2. Handle Added Domains
  const handleAddDomain = () => {
    if (!newSubbranch.trim()) return;
    const updated = [...addedDomains, { domain: newDomain, subbranch: newSubbranch.trim() }];
    setAddedDomains(updated);
    setNewSubbranch('');
  };

  const handleRemoveDomain = (index: number) => {
    const updated = addedDomains.filter((_, i) => i !== index);
    setAddedDomains(updated);
  };

  const handleSaveDomains = async () => {
    try {
      setIsUpdatingDomains(true);
      await updateAdminUserAddedDomains(adminUserId, user.id, addedDomains, user.added_domains);
      showNotification('success', 'Added domains successfully updated');
      onUserUpdated();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update added domains');
    } finally {
      setIsUpdatingDomains(false);
    }
  };

  // 3. Handle Notification Toggle
  const handleToggleNotifications = async () => {
    try {
      const nextState = !user.notifications_enabled;
      await toggleAdminUserNotifications(adminUserId, user.id, nextState);
      showNotification('success', `Notifications ${nextState ? 'enabled' : 'disabled'}`);
      onUserUpdated();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to toggle notifications');
    }
  };

  // 4. Handle Reset Onboarding
  const handleConfirmResetOnboarding = async () => {
    if (!isSuperAdmin) {
      showNotification('error', 'Only administrators can reset onboarding.');
      return;
    }
    try {
      setActionLoading(true);
      await triggerAdminResetOnboarding(adminUserId, user.id);
      setShowResetConfirm(false);
      showNotification('success', 'User onboarding and session progress wiped successfully');
      onUserUpdated();
      // Reload sessions & recaps
      setSessions([]);
      setRecaps([]);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to reset onboarding');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Handle Suspension
  const handleConfirmSuspension = async () => {
    if (!isSuperAdmin) {
      showNotification('error', 'Only administrators can suspend or reactivate accounts.');
      return;
    }
    try {
      setActionLoading(true);
      const nextStatus = !user.is_suspended;
      await toggleAdminUserSuspension(adminUserId, user.id, nextStatus);
      setShowSuspendConfirm(false);
      showNotification('success', `Account ${nextStatus ? 'suspended' : 'reactivated'}`);
      onUserUpdated();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update suspension status');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Handle Overrides Save
  const handleSaveOverrides = async () => {
    if (!isSuperAdmin) {
      showNotification('error', 'Only administrators can configure per-user overrides.');
      return;
    }
    try {
      setIsUpdatingOverrides(true);
      await updateAdminUserOverrides(adminUserId, user.id, userOverrides);
      showNotification('success', 'Per-user overrides saved successfully');
      onUserUpdated();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update overrides');
    } finally {
      setIsUpdatingOverrides(false);
    }
  };

  // 7. Handle Hard Delete
  const handleConfirmDelete = async () => {
    if (!isSuperAdmin) {
      showNotification('error', 'Only administrators can delete user accounts.');
      return;
    }
    if (deleteInputText.trim().toUpperCase() !== 'DELETE') return;
    try {
      setActionLoading(true);
      await deleteAdminUserAccount(adminUserId, user.id, user.email);
      setShowDeleteConfirm(false);
      onUserUpdated();
      onClose();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete user');
      setActionLoading(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    if (sessionTabFilter !== 'all' && s.tab !== sessionTabFilter) return false;
    if (sessionModeFilter !== 'all' && s.mode !== sessionModeFilter) return false;
    if (sessionStatusFilter !== 'all' && s.status !== sessionStatusFilter) return false;
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col my-auto text-[#111111] animate-fadeIn">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-start justify-between shrink-0 bg-slate-50/60 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00215C] text-white flex items-center justify-center font-heading font-extrabold text-lg shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-lg text-[#00215C]">
                    {user.name || 'Unnamed Learner'}
                  </h3>
                  {user.is_suspended && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      SUSPENDED
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.onboarding_completed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {user.onboarding_completed ? 'Onboarded' : 'Pending Onboarding'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email}
                  </span>
                  <span>•</span>
                  <span>ID: <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">{user.id.slice(0, 8)}...</code></span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification Banner */}
          {feedbackMsg && (
            <div
              className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-b border-rose-200'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button onClick={() => setFeedbackMsg(null)}>
                <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </button>
            </div>
          )}

          {/* Navigation Bar inside modal */}
          <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 border-b-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-[#255CC1] text-[#00215C]'
                  : 'border-transparent text-slate-500 hover:text-[#00215C]'
              }`}
            >
              Full Profile
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'sessions'
                  ? 'border-[#255CC1] text-[#00215C]'
                  : 'border-transparent text-slate-500 hover:text-[#00215C]'
              }`}
            >
              Session History
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {sessions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('recaps')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'recaps'
                  ? 'border-[#255CC1] text-[#00215C]'
                  : 'border-transparent text-slate-500 hover:text-[#00215C]'
              }`}
            >
              Diagnostic Recaps
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {recaps.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'actions'
                  ? 'border-[#255CC1] text-[#00215C]'
                  : 'border-transparent text-slate-500 hover:text-[#00215C]'
              }`}
            >
              Admin Actions
              <span className="w-2 h-2 rounded-full bg-[#255CC1]" />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFBFF]">
            {/* TAB 1: FULL PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Highlights Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      CEFR Level
                    </span>
                    <span className="text-xl font-heading font-extrabold text-[#00215C]">
                      {user.cefr_level || 'Not set'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Current Streak
                    </span>
                    <span className="text-xl font-heading font-extrabold text-[#00215C] flex items-center gap-1">
                      <Flame className="w-5 h-5 text-amber-500" />
                      {user.current_streak} days
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Total Sessions
                    </span>
                    <span className="text-xl font-heading font-extrabold text-[#00215C]">
                      {user.total_sessions}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Modules Completed
                    </span>
                    <span className="text-xl font-heading font-extrabold text-[#00215C]">
                      {user.total_modules_completed}
                    </span>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <h4 className="font-heading font-bold text-sm text-[#00215C] border-b border-slate-100 pb-2">
                    Profile Data Fields
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Primary Domain:</span>
                      <span className="font-semibold text-slate-800">
                        {user.primary_domain || 'None'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Primary Subbranch:</span>
                      <span className="font-semibold text-slate-800">
                        {user.primary_subbranch || 'None'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Urgency / Target Date:</span>
                      <span className="font-semibold text-slate-800">
                        {user.urgency_date ? new Date(user.urgency_date).toLocaleDateString() : 'None set'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Notifications Enabled:</span>
                      <span className="font-semibold text-slate-800">
                        {user.notifications_enabled ? 'Yes (Active)' : 'No (Disabled)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Account Created:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(user.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Last Session Date:</span>
                      <span className="font-semibold text-slate-800">
                        {user.last_session_date ? new Date(user.last_session_date).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {/* Added Domains List */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 text-xs font-medium block mb-2">
                      Added Tracks & Secondary Domains ({user.added_domains?.length || 0}):
                    </span>
                    {user.added_domains && user.added_domains.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.added_domains.map((ad, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-[#EBF2FF] text-[#00215C] border border-blue-100 font-medium"
                          >
                            {ad.domain} • <span className="text-[#255CC1] ml-1">{ad.subbranch}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No secondary domains added.</p>
                    )}
                  </div>

                  {/* Active Overrides indicator */}
                  {user.user_overrides && Object.keys(user.user_overrides).length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 text-xs font-medium block mb-1.5">
                        Active Custom Restrictions & Grants:
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto">
                        {JSON.stringify(user.user_overrides, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Signup Attribution & UTM Source */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#255CC1]" />
                        <span className="text-slate-600 text-xs font-bold font-heading">
                          Acquisition Attribution (UTM Tracking):
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold border bg-[#EBF2FF] text-[#00215C] border-blue-100">
                        {user.source || 'direct'}
                      </span>
                    </div>

                    {(() => {
                      const detail = (user.source_detail && typeof user.source_detail === 'object' && !Array.isArray(user.source_detail))
                        ? (user.source_detail as Record<string, any>)
                        : null;

                      if (!detail || Object.keys(detail).length === 0) {
                        return <p className="text-xs text-slate-400 italic">No external campaign parameters or referrer recorded (direct visit).</p>;
                      }

                      return (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                          {detail.utm_source && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">utm_source:</span>
                              <span className="font-mono text-slate-800 font-semibold">{String(detail.utm_source)}</span>
                            </div>
                          )}
                          {detail.utm_medium && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">utm_medium:</span>
                              <span className="font-mono text-slate-800 font-semibold">{String(detail.utm_medium)}</span>
                            </div>
                          )}
                          {detail.utm_campaign && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">utm_campaign:</span>
                              <span className="font-mono text-slate-800 font-semibold">{String(detail.utm_campaign)}</span>
                            </div>
                          )}
                          {detail.referrer && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">referrer:</span>
                              <span className="font-mono text-slate-800 truncate max-w-[260px]">{String(detail.referrer)}</span>
                            </div>
                          )}
                          {detail.captured_via && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">captured_via:</span>
                              <span className="font-mono text-slate-800">{String(detail.captured_via)}</span>
                            </div>
                          )}
                          {detail.landing_page && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">landing_page:</span>
                              <span className="font-mono text-slate-800 truncate max-w-[260px]">{String(detail.landing_page)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SESSION HISTORY */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                {/* Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">TAB</label>
                      <select
                        value={sessionTabFilter}
                        onChange={(e) => setSessionTabFilter(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value="all">All Tabs</option>
                        <option value="speak">Speak</option>
                        <option value="scenarios">Scenarios</option>
                        <option value="interview">Interview</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">MODE</label>
                      <select
                        value={sessionModeFilter}
                        onChange={(e) => setSessionModeFilter(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value="all">All Modes</option>
                        <option value="learn">Learn</option>
                        <option value="practice">Practice</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">STATUS</label>
                      <select
                        value={sessionStatusFilter}
                        onChange={(e) => setSessionStatusFilter(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="incomplete">Incomplete</option>
                        <option value="abandoned">Abandoned</option>
                      </select>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    Showing {filteredSessions.length} of {sessions.length} sessions
                  </span>
                </div>

                {/* Sessions Table */}
                {dataLoading ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#255CC1] mb-2" />
                    <span>Loading session history...</span>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No sessions match the selected filters.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map((s) => {
                      const turnsCount = Array.isArray(s.transcript) ? s.transcript.length : 0;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSession(s);
                          }}
                          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#255CC1] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#EBF2FF] text-[#255CC1] flex items-center justify-center font-bold text-xs uppercase">
                              {s.tab.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-bold text-xs text-[#00215C] uppercase">
                                  {s.tab} • {s.mode}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold capitalize ${
                                    s.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {new Date(s.started_at).toLocaleString()} • {turnsCount} turns
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-semibold text-[#255CC1]">
                            <span>View Transcript</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DIAGNOSTIC RECAPS */}
            {activeTab === 'recaps' && (
              <div className="space-y-4">
                {recaps.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No diagnostic recaps generated for this user yet.
                  </div>
                ) : (
                  recaps.map((r) => {
                    const mistakesList = Array.isArray(r.mistakes) ? r.mistakes : [];
                    return (
                      <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-[#00215C] flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#255CC1]" />
                            Recap ID: <code className="font-mono text-[11px]">{r.id.slice(0, 8)}</code>
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>

                        {r.summary_text_de && (
                          <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                            <span className="font-bold text-[#00215C] block mb-1">🇩🇪 German Summary</span>
                            <p>{r.summary_text_de}</p>
                          </div>
                        )}

                        {(r.summary_text_en || r.summary_text) && (
                          <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                            <span className="font-bold text-[#00215C] block mb-1">English Feedback</span>
                            <p>{r.summary_text_en || r.summary_text}</p>
                          </div>
                        )}

                        {mistakesList.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Mistakes ({mistakesList.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mistakesList.map((m: any, idx: number) => (
                                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50">
                                  <span className="font-bold text-[#00215C] block text-[11px]">{m.category}</span>
                                  <p className="text-slate-600 mt-0.5">
                                    <span className="text-rose-600 font-medium">Spoken: </span>
                                    {m.example_de || m.example_en || m.example || '—'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 4: ADMIN ACTIONS (Small + Big) */}
            {activeTab === 'actions' && (
              <div className="space-y-6">
                {/* 1. Small Actions: CEFR Level Override & Notifications */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <h4 className="font-heading font-bold text-sm text-[#00215C]">
                    Routine User Adjustments
                  </h4>

                  {/* CEFR Level Override */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-[#00215C] block">
                        Override CEFR Level
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Current: <strong className="text-slate-700">{user.cefr_level || 'None'}</strong>. Modifies curriculum placement directly.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={cefrLevel}
                        onChange={(e) => setCefrLevel(e.target.value as CefrLevel)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#00215C]"
                      >
                        {CEFR_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveCefr}
                        disabled={isUpdatingCefr || cefrLevel === user.cefr_level}
                        className="px-3 py-1.5 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] disabled:opacity-40 transition-colors shadow-2xs"
                      >
                        {isUpdatingCefr ? 'Saving...' : 'Apply Level'}
                      </button>
                    </div>
                  </div>

                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-[#00215C] block">
                        Notification Preference
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Status: <strong className="text-slate-700">{user.notifications_enabled ? 'Enabled' : 'Disabled'}</strong>
                      </p>
                    </div>
                    <button
                      onClick={handleToggleNotifications}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        user.notifications_enabled
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      }`}
                    >
                      {user.notifications_enabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      {user.notifications_enabled ? 'Disable Notifications' : 'Enable Notifications'}
                    </button>
                  </div>

                  {/* Added Domains Editor */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00215C]">
                        Manage Added Domains
                      </span>
                      <button
                        onClick={handleSaveDomains}
                        disabled={isUpdatingDomains}
                        className="px-3 py-1 rounded-xl bg-[#255CC1] text-white text-[11px] font-bold hover:bg-[#00215C] transition-colors"
                      >
                        {isUpdatingDomains ? 'Saving...' : 'Save Domain Changes'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {addedDomains.map((ad, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                          <span><strong>{ad.domain}</strong>: {ad.subbranch}</span>
                          <button
                            onClick={() => handleRemoveDomain(idx)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                      <select
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="w-full sm:w-auto px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      >
                        {PLATFORM_DOMAINS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Subbranch (e.g. ICU Nursing)"
                        value={newSubbranch}
                        onChange={(e) => setNewSubbranch(e.target.value)}
                        className="w-full sm:flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <button
                        onClick={handleAddDomain}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Per-User Overrides: Restrict / Grant Tabs & Modes */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#00215C] flex items-center gap-1.5">
                        {!isSuperAdmin && <Lock className="w-4 h-4 text-amber-600" />}
                        Per-User Feature & Access Overrides
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Applies only to this specific user. Does not affect any other learner.
                      </p>
                    </div>
                    {isSuperAdmin ? (
                      <button
                        onClick={handleSaveOverrides}
                        disabled={isUpdatingOverrides}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] transition-colors"
                      >
                        {isUpdatingOverrides ? 'Saving...' : 'Save Overrides'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                        <Lock className="w-3 h-3" /> Admin Only
                      </span>
                    )}
                  </div>

                  {!isSuperAdmin && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Support Role Note: Per-user feature overrides can be inspected but only modified by administrators.</span>
                    </div>
                  )}

                  <div className="space-y-3 pt-2 text-xs">
                    {/* Restrict Tabs */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                        Restricted Tabs (Block user from accessing)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORM_TABS.map((tab) => {
                          const isRestricted = (userOverrides.restricted_tabs || []).includes(tab);
                          return (
                            <button
                              key={tab}
                              disabled={!isSuperAdmin}
                              onClick={() => {
                                const current = userOverrides.restricted_tabs || [];
                                const updated = isRestricted
                                  ? current.filter((t) => t !== tab)
                                  : [...current, tab];
                                setUserOverrides({ ...userOverrides, restricted_tabs: updated });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all disabled:cursor-not-allowed ${
                                isRestricted
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${!isSuperAdmin ? 'opacity-70' : ''}`}
                            >
                              {isRestricted ? `✕ Restricted: ${tab}` : `✓ Allowed: ${tab}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Restrict Modes */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                        Restricted Session Modes
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORM_MODES.map((mode) => {
                          const isRestricted = (userOverrides.restricted_modes || []).includes(mode);
                          return (
                            <button
                              key={mode}
                              disabled={!isSuperAdmin}
                              onClick={() => {
                                const current = userOverrides.restricted_modes || [];
                                const updated = isRestricted
                                  ? current.filter((m) => m !== mode)
                                  : [...current, mode];
                                setUserOverrides({ ...userOverrides, restricted_modes: updated });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all disabled:cursor-not-allowed ${
                                isRestricted
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${!isSuperAdmin ? 'opacity-70' : ''}`}
                            >
                              {isRestricted ? `✕ Blocked: ${mode}` : `✓ Allowed: ${mode}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Big Actions: Reset, Suspend, Delete */}
                {!isSuperAdmin ? (
                  <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="font-heading font-bold text-xs text-amber-900">
                      High-Impact Administrative Actions Restricted
                    </h4>
                    <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                      Your current role is <strong className="capitalize">{role || 'support'}</strong>. Resetting onboarding, suspending/reactivating accounts, and hard deleting users are high-impact actions restricted to full <strong className="text-[#00215C]">Administrators</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white border border-rose-100 space-y-4">
                    <h4 className="font-heading font-extrabold text-sm text-rose-700 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      High-Impact Administrative Actions
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Reset Onboarding */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="font-heading font-bold text-xs text-[#00215C] block mb-1">
                            Reset Onboarding
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Wipes completed onboarding, zeroes streak, and clears module progression.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="mt-4 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-2xs"
                        >
                          Reset Onboarding
                        </button>
                      </div>

                      {/* Suspend Account */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="font-heading font-bold text-xs text-[#00215C] block mb-1">
                            {user.is_suspended ? 'Reactivate Account' : 'Suspend Account'}
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {user.is_suspended
                              ? 'Lifts account suspension, allowing immediate login.'
                              : 'Blocks login with a clear administrative suspension notice.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSuspendConfirm(true)}
                          className={`mt-4 px-3 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-2xs ${
                            user.is_suspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {user.is_suspended ? 'Reactivate Account' : 'Suspend Account'}
                        </button>
                      </div>

                      {/* Hard Delete */}
                      <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between">
                        <div>
                          <span className="font-heading font-bold text-xs text-rose-700 block mb-1">
                            Delete Account Forever
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Irreversible hard delete. Purges user profile, streak data, and all audio history.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="mt-4 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-2xs"
                        >
                          Hard Delete User
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Audit log automatically updated on every action
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: RESET ONBOARDING */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-base text-[#00215C]">
                Reset Onboarding for {user.name || 'Learner'}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This will wipe their domain choices, reset streaks to 0, and clear all past practice sessions.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetOnboarding}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-40"
              >
                {actionLoading ? 'Resetting...' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: SUSPEND / REACTIVATE */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-base text-[#00215C]">
                {user.is_suspended ? 'Reactivate Account?' : 'Suspend Account?'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {user.is_suspended
                  ? 'The user will regain immediate access to SpeechAI.'
                  : 'The user will be immediately blocked from logging in with a suspension notice.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSuspendConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspension}
                disabled={actionLoading}
                className={`flex-1 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40 ${
                  user.is_suspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {actionLoading ? 'Processing...' : user.is_suspended ? 'Reactivate' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: HARD DELETE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-base text-rose-600">
                Permanently Delete User?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This action is <strong className="text-rose-700">irreversible</strong>. Type <strong>DELETE</strong> below to confirm.
              </p>
            </div>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteInputText}
              onChange={(e) => setDeleteInputText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-center font-bold uppercase text-xs focus:outline-rose-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInputText('');
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading || deleteInputText.trim().toUpperCase() !== 'DELETE'}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40"
              >
                {actionLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSCRIPT DETAIL VIEWER */}
      {selectedSession && (
        <AdminTranscriptModal
          session={selectedSession}
          recap={recaps.find((r) => r.session_id === selectedSession.id)}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </>
  );
};
