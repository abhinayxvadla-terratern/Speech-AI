import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BookOpen, 
  Compass, 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  Sliders, 
  AlertCircle
} from 'lucide-react';
import { Module, Scenario, InterviewType, PressureModeRecord } from '../../lib/database.types';
import { 
  fetchAdminModules, 
  fetchAdminScenarios, 
  fetchAdminInterviewTypes, 
  fetchAdminPressureModes 
} from '../../services/adminContentService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminModuleEditModal } from '../../components/admin/AdminModuleEditModal';
import { AdminScenarioEditModal } from '../../components/admin/AdminScenarioEditModal';
import { AdminInterviewEditModal } from '../../components/admin/AdminInterviewEditModal';
import { AdminPressureModeEditModal } from '../../components/admin/AdminPressureModeEditModal';

type ContentSubTab = 'modules' | 'scenarios' | 'interviews';

const DOMAIN_OPTIONS = [
  'All Domains',
  'Healthcare',
  'Ausbildung',
  'Study/University',
  'Workplace Integration',
  'Settlement'
];

const LEVEL_OPTIONS = ['All Levels', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const AdminContent: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ContentSubTab>('modules');

  // Data States
  const [modules, setModules] = useState<Module[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [pressureModes, setPressureModes] = useState<PressureModeRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All Levels');
  const [selectedDomain, setSelectedDomain] = useState<string>('All Domains');

  // Modal Editing States
  const [editingModule, setEditingModule] = useState<Module | null | 'new'>(null);
  const [editingScenario, setEditingScenario] = useState<Scenario | null | 'new'>(null);
  const [editingInterview, setEditingInterview] = useState<InterviewType | null | 'new'>(null);
  const [editingPressureMode, setEditingPressureMode] = useState<PressureModeRecord | null | 'new'>(null);

  // Load All Content
  const loadAllContent = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      setError(null);
      const [m, s, it, pm] = await Promise.all([
        fetchAdminModules(),
        fetchAdminScenarios(),
        fetchAdminInterviewTypes(),
        fetchAdminPressureModes(),
      ]);
      setModules(m);
      setScenarios(s);
      setInterviewTypes(it);
      setPressureModes(pm);
    } catch (err: any) {
      console.error('Failed to load curriculum content:', err);
      setError(err?.message || 'Failed to load content');
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllContent();
  }, [loadAllContent]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      if (selectedLevel !== 'All Levels' && mod.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = mod.title.toLowerCase().includes(q);
        const matchSkill = mod.micro_skill.toLowerCase().includes(q);
        if (!matchTitle && !matchSkill) return false;
      }
      return true;
    });
  }, [modules, selectedLevel, searchQuery]);

  // Filtered Scenarios
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((sc) => {
      if (selectedLevel !== 'All Levels' && sc.min_level !== selectedLevel) return false;
      if (selectedDomain !== 'All Domains' && sc.parent_domain !== selectedDomain) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = sc.title.toLowerCase().includes(q);
        const matchDesc = sc.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [scenarios, selectedLevel, selectedDomain, searchQuery]);

  // Filtered Interview Types
  const filteredInterviewTypes = useMemo(() => {
    return interviewTypes.filter((it) => {
      if (selectedDomain !== 'All Domains' && it.parent_domain !== selectedDomain) return false;
      if (selectedLevel !== 'All Levels' && it.min_level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = it.type_name.toLowerCase().includes(q);
        const matchSub = it.sub_branch.toLowerCase().includes(q);
        if (!matchName && !matchSub) return false;
      }
      return true;
    });
  }, [interviewTypes, selectedDomain, selectedLevel, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[#00215C] tracking-tight">
            Curriculum & Content Management
          </h2>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            Structured form-based CRUD for Modules, Scenarios, Interview Types, and Pressure Modes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAllContent(false)}
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
          <button onClick={() => loadAllContent()} className="font-bold underline hover:text-red-900 ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Main Content Tabs & Add Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('modules');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'modules'
                ? 'bg-[#00215C] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Modules ({modules.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('scenarios');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'scenarios'
                ? 'bg-[#00215C] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            Scenarios ({scenarios.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('interviews');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'interviews'
                ? 'bg-[#00215C] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Interviews & Pressure Modes ({interviewTypes.length + pressureModes.length})
          </button>
        </div>

        {/* Create CTA Button for active category */}
        <div>
          {activeTab === 'modules' && (
            <button
              onClick={() => setEditingModule('new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#255CC1] text-white text-xs font-bold hover:bg-[#00215C] transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              New Module
            </button>
          )}

          {activeTab === 'scenarios' && (
            <button
              onClick={() => setEditingScenario('new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#255CC1] text-white text-xs font-bold hover:bg-[#00215C] transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              New Scenario
            </button>
          )}

          {activeTab === 'interviews' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingPressureMode('new')}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-[#00215C] text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Pressure Mode
              </button>
              <button
                onClick={() => setEditingInterview('new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#255CC1] text-white text-xs font-bold hover:bg-[#00215C] transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                New Interview Type
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#255CC1]/20 focus:border-[#255CC1]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C]"
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {(activeTab === 'scenarios' || activeTab === 'interviews') && (
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C]"
            >
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {(searchQuery || selectedLevel !== 'All Levels' || selectedDomain !== 'All Domains') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('All Levels');
                setSelectedDomain('All Domains');
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: MODULES LIST */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                  <th className="py-3 px-4">Level & Num</th>
                  <th className="py-3 px-4">Module Title</th>
                  <th className="py-3 px-4">Micro-Skill Focus</th>
                  <th className="py-3 px-4 text-center">Weight (%)</th>
                  <th className="py-3 px-4 text-center">Checkpoint</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#255CC1] mb-2" />
                      <span>Loading curriculum modules...</span>
                    </td>
                  </tr>
                ) : filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <p className="text-xs font-semibold text-slate-600">No modules match filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredModules.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setEditingModule(m)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-[#00215C]">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#EBF2FF] text-[#255CC1] border border-blue-100">
                            {m.level}
                          </span>
                          <span>#{m.module_number}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-heading font-bold text-[#00215C] group-hover:text-[#255CC1] transition-colors">
                        {m.title}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">
                        {m.micro_skill}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {m.domain_weight_pct}%
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {m.is_checkpoint ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Checkpoint
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#255CC1] group-hover:translate-x-0.5 transition-transform">
                          <span>Edit Form</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: SCENARIOS LIST */}
      {activeTab === 'scenarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Scenario Title</th>
                  <th className="py-3 px-4">Domain & Subbranch</th>
                  <th className="py-3 px-4">Description Brief</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#255CC1] mb-2" />
                      <span>Loading scenarios...</span>
                    </td>
                  </tr>
                ) : filteredScenarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <p className="text-xs font-semibold text-slate-600">No scenarios match filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredScenarios.map((sc) => (
                    <tr
                      key={sc.id}
                      onClick={() => setEditingScenario(sc)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          sc.track === 'domain'
                            ? 'bg-[#EBF2FF] text-[#255CC1] border border-blue-100'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sc.track}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#00215C] bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {sc.min_level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-heading font-bold text-[#00215C] group-hover:text-[#255CC1] transition-colors">
                        {sc.title}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {sc.parent_domain ? `${sc.parent_domain}${sc.sub_branch ? ` • ${sc.sub_branch}` : ''}` : 'General / Daily'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                        {sc.description}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#255CC1] group-hover:translate-x-0.5 transition-transform">
                          <span>Edit</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: INTERVIEW TYPES & PRESSURE MODES */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          {/* Section: Pressure Modes (Seeded 3 Modes) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-heading font-bold text-sm text-[#00215C] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#255CC1]" />
                  Pressure Modes ({pressureModes.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Global pacing, interruption simulation, and intensity settings.
                </p>
              </div>
              <button
                onClick={() => setEditingPressureMode('new')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EBF2FF] text-[#255CC1] text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Mode
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pressureModes.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => setEditingPressureMode(pm)}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#255CC1] cursor-pointer transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pm.badge_color || 'bg-white text-[#00215C]'}`}>
                        {pm.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {pm.id}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-body">
                      {pm.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end text-[11px] font-semibold text-[#255CC1]">
                    <span>Edit Mode →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Interview Types Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-[#00215C] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#255CC1]" />
                  Domain-Specific Interview Types ({interviewTypes.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Technical, situational, and behavioral simulations with sample question guides.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                    <th className="py-3 px-4">Type Format</th>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Subbranch</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Description Brief</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-body">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#255CC1] mb-2" />
                        <span>Loading interview types...</span>
                      </td>
                    </tr>
                  ) : filteredInterviewTypes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <p className="text-xs font-semibold text-slate-600">No interview types match filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInterviewTypes.map((it) => (
                      <tr
                        key={it.id}
                        onClick={() => setEditingInterview(it)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-heading font-bold text-[#00215C] group-hover:text-[#255CC1] transition-colors">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#EBF2FF] text-[#255CC1] border border-blue-100 mr-2">
                            {it.type_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {it.parent_domain}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {it.sub_branch}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#00215C]">
                          {it.min_level}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                          {it.description}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#255CC1] group-hover:translate-x-0.5 transition-transform">
                            <span>Edit</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: MODULE FORM */}
      {editingModule && (
        <AdminModuleEditModal
          module={editingModule === 'new' ? null : editingModule}
          adminUserId={adminUser?.id || ''}
          onClose={() => setEditingModule(null)}
          onSaved={loadAllContent}
        />
      )}

      {/* MODAL 2: SCENARIO FORM */}
      {editingScenario && (
        <AdminScenarioEditModal
          scenario={editingScenario === 'new' ? null : editingScenario}
          adminUserId={adminUser?.id || ''}
          onClose={() => setEditingScenario(null)}
          onSaved={loadAllContent}
        />
      )}

      {/* MODAL 3: INTERVIEW TYPE FORM */}
      {editingInterview && (
        <AdminInterviewEditModal
          item={editingInterview === 'new' ? null : editingInterview}
          adminUserId={adminUser?.id || ''}
          onClose={() => setEditingInterview(null)}
          onSaved={loadAllContent}
        />
      )}

      {/* MODAL 4: PRESSURE MODE FORM */}
      {editingPressureMode && (
        <AdminPressureModeEditModal
          item={editingPressureMode === 'new' ? null : editingPressureMode}
          adminUserId={adminUser?.id || ''}
          onClose={() => setEditingPressureMode(null)}
          onSaved={loadAllContent}
        />
      )}
    </div>
  );
};
