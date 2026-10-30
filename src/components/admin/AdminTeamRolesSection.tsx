import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Ban, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AdminTeamMember, AdminRole } from '../../lib/database.types';
import { 
  fetchAdminTeamMembers, 
  inviteAdminMember, 
  updateAdminMemberRole, 
  updateAdminMemberStatus,
  deleteAdminInvite
} from '../../services/adminTeamService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const ROLE_DEFINITIONS: Record<AdminRole, { title: string; badge: string; desc: string; access: string }> = {
  admin: {
    title: 'Administrator',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Full administrative control over all 4 tabs, pipeline telemetry, feature kill-switches, and team management.',
    access: 'Overview (Full), Users (Small & Big Actions), Content (CRUD), System Controls & Team Management'
  },
  support: {
    title: 'Customer Support',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Learner support focus. Can inspect profiles and execute routine adjustments (CEFR overrides, domains, notification prefs).',
    access: 'Overview (Read-Only) and Users Tab (Small actions only; High-impact actions restricted)'
  },
  content_editor: {
    title: 'Content Editor',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Curriculum & exam authoring. Full CRUD over modules, scenarios, interview types, and pressure modes.',
    access: 'Overview (Read-Only) and Content Tab (Full curriculum authoring and editing)'
  }
};

export const AdminTeamRolesSection: React.FC = () => {
  const { adminUser } = useAdminAuth();

  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('support');
  const [inviting, setInviting] = useState(false);

  // Generated Link Modal after invite
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [lastInvitedMember, setLastInvitedMember] = useState<{ id: string; email: string; role: AdminRole } | null>(null);
  const [copied, setCopied] = useState(false);

  // Role Change Modal
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<AdminRole>('support');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Revoke Confirm Modal
  const [revokingMember, setRevokingMember] = useState<AdminTeamMember | null>(null);
  const [processingStatus, setProcessingStatus] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Load Team Members
  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminTeamMembers();
      setMembers(data);
    } catch (err: any) {
      console.error('Error loading team members:', err);
      setError(err?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        m.email.toLowerCase().includes(q) ||
        (m.name && m.name.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'active').length;
    const pending = members.filter((m) => m.status === 'pending').length;
    const revoked = members.filter((m) => m.status === 'revoked').length;
    return { total, active, pending, revoked };
  }, [members]);

  // Handle Submit Invite
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setInviting(true);
      const createdId = await inviteAdminMember(
        inviteEmail,
        inviteRole,
        adminUser?.id || ''
      );

      setLastInvitedMember({
        id: createdId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      setShowInviteModal(false);
      setInviteEmail('');
      setShowLinkModal(true);
      showToast(`Invitation created for ${inviteEmail}`);
      await loadTeam();
    } catch (err: any) {
      alert(err?.message || 'Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  // Handle Save Role Change
  const handleSaveRoleChange = async () => {
    if (!editingMember) return;

    try {
      setUpdatingRole(true);
      await updateAdminMemberRole(
        editingMember.id,
        newSelectedRole,
        adminUser?.id || '',
        editingMember.email,
        editingMember.role
      );

      showToast(`Updated role for ${editingMember.email} to ${newSelectedRole}`);
      setEditingMember(null);
      await loadTeam();
    } catch (err: any) {
      alert(err?.message || 'Failed to change member role');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Handle Revoke Access
  const handleConfirmRevoke = async () => {
    if (!revokingMember) return;

    try {
      setProcessingStatus(true);
      await updateAdminMemberStatus(
        revokingMember.id,
        'revoked',
        adminUser?.id || '',
        revokingMember.email,
        revokingMember.status
      );

      showToast(`Access revoked for ${revokingMember.email}`);
      setRevokingMember(null);
      await loadTeam();
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke access');
    } finally {
      setProcessingStatus(false);
    }
  };

  // Handle Quick Activate (for pending or revoked)
  const handleActivateMember = async (member: AdminTeamMember) => {
    try {
      await updateAdminMemberStatus(
        member.id,
        'active',
        adminUser?.id || '',
        member.email,
        member.status
      );

      showToast(`Activated access for ${member.email}`);
      await loadTeam();
    } catch (err: any) {
      alert(err?.message || 'Failed to activate member');
    }
  };

  // Handle Delete / Cancel Invite
  const handleDeleteInvite = async (member: AdminTeamMember) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${member.email}?`)) {
      return;
    }

    try {
      await deleteAdminInvite(member.id, adminUser?.id || '', member.email);
      showToast(`Invitation cancelled for ${member.email}`);
      await loadTeam();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete invitation');
    }
  };

  // Generate Invite URL
  const inviteUrl = lastInvitedMember
    ? `${window.location.origin}/login?invited=admin&role=${lastInvitedMember.role}&email=${encodeURIComponent(lastInvitedMember.email)}`
    : `${window.location.origin}/login`;

  const copyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-5 h-5" />
            </span>
            <h3 className="font-heading font-extrabold text-lg text-[#00215C] tracking-tight">
              Team & Role-Based Access Control (RBAC)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage administrative personnel, assign granular roles (<code className="font-mono text-[11px] text-[#00215C]">admin</code>, <code className="font-mono text-[11px] text-[#00215C]">support</code>, <code className="font-mono text-[11px] text-[#00215C]">content_editor</code>), and issue invitations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {feedback && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fadeIn">
              {feedback}
            </span>
          )}

          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] transition-all shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-200" />
            Invite Team Member
          </button>

          <button
            onClick={() => loadTeam()}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Team List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#255CC1]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role Access Matrix Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((r) => {
          const def = ROLE_DEFINITIONS[r];
          return (
            <div key={r} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${def.badge}`}>
                  {r.replace('_', ' ')}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {members.filter((m) => m.role === r && m.status === 'active').length} Active
                </span>
              </div>
              <h4 className="font-heading font-bold text-xs text-[#00215C]">{def.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-body">
                {def.desc}
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                <span className="font-bold text-[#00215C]">Permissions: </span>
                {def.access}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
          <span className="font-heading font-extrabold text-xl text-[#00215C]">{stats.total}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Admins</span>
          <span className="font-heading font-extrabold text-xl text-emerald-700">{stats.active}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Invites</span>
          <span className="font-heading font-extrabold text-xl text-amber-700">{stats.pending}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Revoked Access</span>
          <span className="font-heading font-extrabold text-xl text-rose-700">{stats.revoked}</span>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadTeam()} className="font-bold underline hover:text-red-900 ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search team member by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#255CC1]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
            <option value="content_editor">Content Editor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#255CC1] mx-auto mb-2" />
            Loading team roster...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No team members matched the search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Team Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Invited By</th>
                  <th className="py-3 px-4">Invited At</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMembers.map((member) => {
                  const roleDef = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.support;
                  const isCurrentLoggedIn = adminUser?.id === member.id || adminUser?.user_id === member.user_id;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#00215C] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                            {member.email.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-slate-900">
                                {member.name || member.email.split('@')[0]}
                              </span>
                              {isCurrentLoggedIn && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-[#00215C]">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${roleDef.badge}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : member.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {member.status === 'active' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {member.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                          {member.status === 'revoked' && <Ban className="w-3 h-3 text-rose-600" />}
                          <span className="capitalize">{member.status}</span>
                        </span>
                      </td>

                      {/* Invited By */}
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {member.invited_by_email || member.invited_by_name ? (
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {member.invited_by_name || 'Admin'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px] block">
                              {member.invited_by_email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Direct / Root</span>
                        )}
                      </td>

                      {/* Invited At */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setNewSelectedRole(member.role);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors shadow-2xs"
                            title="Change Role"
                          >
                            <Edit3 className="w-3 h-3 text-[#255CC1]" />
                            Role
                          </button>

                          {/* Pending Actions */}
                          {member.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleActivateMember(member)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors shadow-2xs"
                                title="Activate Invitation Immediately"
                              >
                                Activate
                              </button>
                              <button
                                onClick={() => {
                                  setLastInvitedMember({
                                    id: member.id,
                                    email: member.email,
                                    role: member.role,
                                  });
                                  setShowLinkModal(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold"
                                title="Copy Invite Link"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvite(member)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                                title="Cancel Invite"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Active Actions */}
                          {member.status === 'active' && (
                            <button
                              onClick={() => setRevokingMember(member)}
                              disabled={isCurrentLoggedIn}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors disabled:opacity-30 shadow-2xs"
                              title={isCurrentLoggedIn ? 'You cannot revoke your own admin account' : 'Revoke administrative access'}
                            >
                              Revoke
                            </button>
                          )}

                          {/* Revoked Actions */}
                          {member.status === 'revoked' && (
                            <button
                              onClick={() => handleActivateMember(member)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors shadow-2xs"
                              title="Re-activate Access"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Invite Team Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#00215C]">
                    Invite Team Member
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant administrative portal access with a designated permission role.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Team Member's Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. colleague@terratern.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#255CC1]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Administrative Role & Permissions <span className="text-rose-600">*</span>
                </label>
                <div className="space-y-2">
                  {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const isSelected = inviteRole === r;

                    return (
                      <label
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="inviteRole"
                          checked={isSelected}
                          onChange={() => setInviteRole(r)}
                          className="mt-1 text-[#00215C]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-heading font-bold text-xs text-[#00215C]">
                              {def.title}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[9px] font-extrabold uppercase border ${def.badge}`}>
                              {r}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {def.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#255CC1] shrink-0 mt-0.5" />
                <span>
                  Since automated email delivery is not configured, creating this invite will prepare a shareable sign-in link with their assigned role.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] disabled:opacity-50 transition-all shadow-xs"
                >
                  {inviting ? 'Creating Invite...' : 'Create Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Shareable Sign-in / Access Link */}
      {showLinkModal && lastInvitedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-[#00215C]">
                Invitation Created!
              </h3>
              <p className="text-xs text-slate-600 font-body">
                A pending record has been registered for <strong className="text-[#00215C]">{lastInvitedMember.email}</strong> as <span className="uppercase font-bold text-[#255CC1]">{lastInvitedMember.role}</span>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shareable Signup & Access Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 select-all"
                />
                <button
                  onClick={copyInviteUrl}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#255CC1] text-white text-xs font-bold hover:bg-[#00215C] transition-colors shadow-2xs shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Share this link directly with them. Once they sign in or register with their email, their admin record will automatically link.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={async () => {
                  const m = members.find((x) => x.id === lastInvitedMember.id);
                  if (m) {
                    await handleActivateMember(m);
                  }
                  setShowLinkModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                Activate Immediately
              </button>

              <button
                onClick={() => setShowLinkModal(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Change Member Role */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#00215C]">
                  Modify Team Role
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingMember.email}
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Select New Access Level
              </label>

              {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((r) => {
                const def = ROLE_DEFINITIONS[r];
                const isSelected = newSelectedRole === r;

                return (
                  <label
                    key={r}
                    onClick={() => setNewSelectedRole(r)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newRole"
                      checked={isSelected}
                      onChange={() => setNewSelectedRole(r)}
                      className="mt-1 text-[#00215C]"
                    />
                    <div>
                      <span className="font-heading font-bold text-xs text-[#00215C] block">
                        {def.title}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {def.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingRole || newSelectedRole === editingMember.role}
                onClick={handleSaveRoleChange}
                className="px-4 py-2 rounded-xl bg-[#00215C] text-white text-xs font-bold hover:bg-[#143471] disabled:opacity-50 transition-all shadow-xs"
              >
                {updatingRole ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Revoke Access Confirmation */}
      {revokingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-extrabold text-base text-[#00215C]">
                Revoke Administrative Access?
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to revoke access for <strong className="text-slate-900">{revokingMember.email}</strong>?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-[11px] text-rose-800 space-y-1">
              <span className="font-bold block">Immediate Lockout Effect:</span>
              <p>
                This sets their status to <code className="font-mono text-rose-900 bg-rose-100 px-1 py-0.2 rounded font-bold">revoked</code>. On their next request or navigation, they will be immediately blocked from all <code className="font-mono text-rose-900">/admin</code> routes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRevokingMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingStatus}
                onClick={handleConfirmRevoke}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xs"
              >
                {processingStatus ? 'Revoking...' : 'Confirm Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
