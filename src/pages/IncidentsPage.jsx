import React, { useState, useMemo } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Printer,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

export default function IncidentsPage({
  onSelectIncident,
  onChangeStatus,
  onGenerateSummons,
  initialFilter = 'ALL',
}) {
  const { incidents, settings } = useIncidents();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter list
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = inc.student_name.toLowerCase().includes(q);
        const matchesCase = inc.case_number.toLowerCase().includes(q);
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesLRN = (inc.student_lrn || '').includes(q);
        if (!matchesName && !matchesCase && !matchesTitle && !matchesLRN) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Forwarded for Initial Intervention') {
          const isStage2 =
            inc.status === 'Forwarded for Initial Intervention' ||
            inc.stageNumber === 2 ||
            (inc.status || '').toLowerCase().includes('initial intervention');
          if (!isStage2) return false;
        } else if (statusFilter === 'Escalated to OSD and Principal') {
          const isStage3 =
            inc.status === 'Escalated to OSD and Principal' ||
            inc.stageNumber === 3 ||
            (inc.status || '').toLowerCase().includes('osd and principal');
          if (!isStage3) return false;
        } else if (inc.status !== statusFilter) {
          return false;
        }
      }
      if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;

      return true;
    });
  }, [incidents, searchQuery, statusFilter, categoryFilter, severityFilter]);

  // Sort list
  const sortedIncidents = useMemo(() => {
    return [...filteredIncidents].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'created_at' || sortField === 'incident_date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredIncidents, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedIncidents.length / itemsPerPage) || 1;
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedIncidents.slice(start, start + itemsPerPage);
  }, [sortedIncidents, currentPage, itemsPerPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const statusChips = [
    { label: 'All Records', value: 'ALL' },
    { label: 'Stage 2: Joint Intervention', value: 'Forwarded for Initial Intervention' },
    { label: 'Stage 3: OSD & Principal', value: 'Escalated to OSD and Principal' },
    { label: 'Recent Reports', value: 'Recent Report' },
    { label: 'Ongoing Reports', value: 'Ongoing Report' },
    { label: 'Appealed Cases', value: 'Appealed' },
    { label: 'Community Service', value: 'Community Service' },
    { label: 'Expelled Records', value: 'Expelled' },
    { label: 'Resolved Cases', value: 'Resolved' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-blue-900 dark:text-blue-400" />
            <span>Incident Reports Directory</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Browse, investigate, and review confidential student disciplinary records (DepEd D.O. 40, s. 2012)
          </p>
        </div>
      </div>

      {/* Filter Chips at the Top (Gen X Familiarity) */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Filter by Status:
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {statusChips.map((chip) => {
            const isSelected = statusFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => {
                  setStatusFilter(chip.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Table Search */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Search Within Table
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Case number, student, or title..."
                className="w-full pl-10 pr-3.5 py-2.5 text-base bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>
          </div>

          {/* Offense Category Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Offense Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-base bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Offense Categories</option>
              {settings.categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Severity Level
            </label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-base bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Severities</option>
              <option value="Low">Low Severity</option>
              <option value="Moderate">Moderate Severity</option>
              <option value="High">High Severity</option>
              <option value="Critical">Critical Severity</option>
            </select>
          </div>

          {/* Reset Filters Action */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setSeverityFilter('ALL');
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-4 text-base font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table: Sticky Header, Zebra Rows, Text >= 15px */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 select-none z-10">
              <tr>
                <th
                  onClick={() => toggleSort('case_number')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Case #</span>
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('student_name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student / Section</span>
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('category')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Offense & Severity</span>
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('incident_date')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date Filed</span>
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Current Status</span>
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Zebra-Striped Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="odd:bg-white even:bg-slate-50/80 hover:bg-blue-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-850 dark:hover:bg-slate-800 transition"
                  >
                    {/* Case Number */}
                    <td className="py-4 px-4 font-mono font-bold text-blue-900 dark:text-blue-300">
                      {inc.case_number}
                    </td>

                    {/* Student Info */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-white text-base">
                        {inc.student_name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {inc.section} • LRN: {inc.student_lrn}
                      </p>
                    </td>

                    {/* Offense Category & Severity */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {inc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-medium text-slate-800 dark:text-slate-200">
                          {inc.category}
                        </span>
                        <SeverityBadge severity={inc.severity} />
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(inc.incident_date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status Badge (Icon + Text) */}
                    <td className="py-4 px-4">
                      <StatusBadge status={inc.status} size="md" />
                    </td>

                    {/* Large Action Buttons with Clear Verb Labels */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectIncident(inc)}
                          className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5"
                          title="Open Case Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Record</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onChangeStatus(inc)}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 rounded-lg text-sm font-semibold transition"
                          title="Change Case Status"
                        >
                          Update Status
                        </button>

                        <button
                          type="button"
                          onClick={() => onGenerateSummons(inc)}
                          className="p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-lg text-sm font-semibold transition"
                          title="Print Guardian Summons Notice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                      No incident records found
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Try clearing filters or adjusting your search term.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Familiar Pagination Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{sortedIncidents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, sortedIncidents.length)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white">{sortedIncidents.length}</strong> cases
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Page
            </button>

            <span className="px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1.5"
            >
              Next Page <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
