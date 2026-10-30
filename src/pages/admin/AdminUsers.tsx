import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Flame, 
  Calendar, 
  ChevronRight, 
  AlertCircle
} from 'lucide-react';
import { AdminDirectoryUser } from '../../lib/database.types';
import { fetchAdminUsersDirectory } from '../../services/adminUserService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminUserDetailModal } from '../../components/admin/AdminUserDetailModal';

const DOMAIN_OPTIONS = [
  'All Domains',
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];

const LEVEL_OPTIONS = ['All Levels', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SOURCE_OPTIONS = [
  'All Sources',
  'organic',
  'paid_search',
  'paid_social',
  'referral',
  'partner',
  'direct',
  'admin_created',
  'other',
];

const SOURCE_BADGES: Record<string, string> = {
  paid_social: 'bg-purple-100 text-purple-800 border-purple-200',
  paid_search: 'bg-blue-100 text-blue-800 border-blue-200',
  organic: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  partner: 'bg-amber-100 text-amber-800 border-amber-200',
  referral: 'bg-teal-100 text-teal-800 border-teal-200',
  direct: 'bg-slate-100 text-slate-700 border-slate-200',
  admin_created: 'bg-sky-100 text-sky-800 border-sky-200',
  other: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export const AdminUsers: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [users, setUsers] = useState<AdminDirectoryUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All Domains');
  const [selectedLevel, setSelectedLevel] = useState<string>('All Levels');
  const [selectedSource, setSelectedSource] = useState<string>('All Sources');

  // Selected User for Detail View
  const [selectedUser, setSelectedUser] = useState<AdminDirectoryUser | null>(null);

  const loadDirectory = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      setError(null);
      const data = await fetchAdminUsersDirectory();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load user directory:', err);
      setError(err?.message || 'Failed to load user directory');
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory(false);

    // Live auto-polling every 25 seconds for new signups
    const timer = setInterval(() => {
      loadDirectory(true);
    }, 25000);

    return () => clearInterval(timer);
  }, [loadDirectory]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Search Query (name or email)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = u.name ? u.name.toLowerCase().includes(query) : false;
        const emailMatch = u.email ? u.email.toLowerCase().includes(query) : false;
        if (!nameMatch && !emailMatch) return false;
      }

      // 2. Domain Filter
      if (selectedDomain !== 'All Domains') {
        if (u.primary_domain !== selectedDomain) return false;
      }

      // 3. Level Filter
      if (selectedLevel !== 'All Levels') {
        if (u.cefr_level !== selectedLevel) return false;
      }

      // 4. Source Filter
      if (selectedSource !== 'All Sources') {
        const userSource = u.source || 'direct';
        if (userSource !== selectedSource) return false;
      }

      return true;
    });
  }, [users, searchQuery, selectedDomain, selectedLevel, selectedSource]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            User Directory & Progress
          </h2>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            Searchable directory of all registered learners with CEFR levels, domains, and streak activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync (25s)
          </div>
          <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            Total Users: <strong className="text-[#00215C] font-heading">{users.length}</strong>
          </span>
          <button
            onClick={() => loadDirectory(false)}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#00215C] hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#255CC1] ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadDirectory()} className="font-bold underline hover:text-red-900 ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by learner name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#255CC1]/20 focus:border-[#255CC1] transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C] focus:outline-none focus:border-[#255CC1]"
            >
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C] focus:outline-none focus:border-[#255CC1]"
          >
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C] focus:outline-none focus:border-[#255CC1]"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All Sources' ? s : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          {(searchQuery || selectedDomain !== 'All Domains' || selectedLevel !== 'All Levels' || selectedSource !== 'All Sources') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('All Domains');
                setSelectedLevel('All Levels');
                setSelectedSource('All Sources');
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">CEFR Level</th>
                <th className="py-3 px-4">Primary Track</th>
                <th className="py-3 px-4">Subbranch</th>
                <th className="py-3 px-4 text-center">Streak</th>
                <th className="py-3 px-4">Last Session</th>
                <th className="py-3 px-4 text-center">Sessions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#255CC1] mb-2" />
                    <span>Loading learner directory...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">No users found</p>
                    <p className="text-[11px] mt-1">Try adjusting your search criteria or domain filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#00215C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="truncate max-w-[200px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-xs text-[#00215C] group-hover:text-[#255CC1] transition-colors truncate">
                                {u.name || 'Unnamed Learner'}
                              </span>
                              {u.is_suspended && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                                  SUSPENDED
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${SOURCE_BADGES[u.source || 'direct'] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {u.source || 'direct'}
                        </span>
                      </td>

                      {/* CEFR Level */}
                      <td className="py-3.5 px-4">
                        {u.cefr_level ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-[#EBF2FF] text-[#00215C] border border-blue-100">
                            {u.cefr_level}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">None</span>
                        )}
                      </td>

                      {/* Primary Domain */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {u.primary_domain || '—'}
                      </td>

                      {/* Primary Subbranch */}
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[150px]">
                        {u.primary_subbranch || '—'}
                      </td>

                      {/* Streak */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[#00215C]">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          {u.current_streak}
                        </span>
                      </td>

                      {/* Last Session Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {u.last_session_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(u.last_session_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      {/* Total Sessions */}
                      <td className="py-3.5 px-4 text-center font-bold text-[#00215C]">
                        {u.total_sessions}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#255CC1] group-hover:translate-x-0.5 transition-transform">
                          <span>Detail</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <AdminUserDetailModal
          user={selectedUser}
          adminUserId={adminUser?.id || ''}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={() => {
            loadDirectory();
            // Also refresh selectedUser if still open
            fetchAdminUsersDirectory().then((refreshed) => {
              const updated = refreshed.find((u) => u.id === selectedUser.id);
              if (updated) setSelectedUser(updated);
            });
          }}
        />
      )}
    </div>
  );
};
