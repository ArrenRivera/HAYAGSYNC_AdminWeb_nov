import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { searchStudents } from '../utils/searchUtils';
import ProfileAvatar from '../components/common/ProfileAvatar';
import { Users, Search, AlertTriangle, Phone, Eye, ArrowRight, UserCheck, ChevronLeft, ChevronRight, School } from 'lucide-react';

export default function StudentsPage({ onSelectStudent }) {
  const { isMinistro } = useAuth();
  const { students, getStudentIncidents, isRepeatOffender } = useIncidents();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const allSectionsList = [
    'Grade 7 - Mahogany',
    'Grade 7 - Narra',
    'Grade 8 - Uranus',
    'Grade 8 - Venus',
    'Grade 9 - Eagle',
    'Grade 9 - Falcon',
    'Grade 10 - Rizal',
    'Grade 10 - Bonifacio',
    'Grade 10 - Jupiter',
    'Grade 11 - STEM A',
    'Grade 11 - ABM A',
    'Grade 12 - STEM A',
    'Grade 12 - ABM A'
  ];

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.lrn || '').includes(q) ||
        (s.section || '').toLowerCase().includes(q) ||
        (s.guardian_name || '').toLowerCase().includes(q)
      );
    }

    if (gradeFilter !== 'ALL') {
      result = result.filter((s) => s.grade === gradeFilter);
    }

    if (sectionFilter !== 'ALL') {
      result = result.filter((s) => s.section === sectionFilter);
    }

    return result;
  }, [students, searchQuery, gradeFilter, sectionFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-900 dark:text-blue-400" />
            <span>Student Directory & User Management</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Official confidential student archive across all 13 grade levels and sections. Includes guardian records and disciplinary history.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-bold text-sm border border-blue-300 dark:border-blue-800">
          {students.length} Total Enrolled Students
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Search Student / Guardian / LRN
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
              placeholder="Search by name, 12-digit LRN, guardian..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Filter Grade Level
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium focus:ring-2 focus:ring-blue-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="ALL">All Grade Levels</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Filter Section
            </label>
            <select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium focus:ring-2 focus:ring-blue-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="ALL">All Sections (13 Active)</option>
              {allSectionsList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedStudents.length > 0 ? (
          paginatedStudents.map((st) => {
            const studentIncidents = getStudentIncidents(st.id);
            const isRepeat = isRepeatOffender(st.id);
            return (
              <div
                key={st.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-900 dark:hover:border-blue-400 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <ProfileAvatar
                      src={st.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`}
                      name={st.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 block">
                        LRN: {st.lrn}
                      </span>
                      {isRepeat && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-300 mt-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Repeat Offender
                        </span>
                      )}
                      {st.status === 'Expelled' && (
                        <span className="text-xs font-bold bg-rose-700 text-white px-2 py-0.5 rounded-md mt-1 inline-block">
                          Expelled
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {st.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {st.grade}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {st.section}
                    </span>
                  </div>

                  {st.adviser && (
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                      <School className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Adviser: <strong>{st.adviser}</strong></span>
                    </p>
                  )}

                  {isMinistro ? (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-500 italic">
                      <p>Guardian & Contact info:</p>
                      <p className="font-semibold text-slate-400 dark:text-slate-500">[Confidential - OSD & Board Only]</p>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <p>
                        Guardian: <strong>{st.guardian_name}</strong>
                      </p>
                      <p className="font-mono">
                        Contact: {st.guardian_phone}
                      </p>
                      <p className="truncate text-slate-500">
                        Email: {st.guardian_email}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {studentIncidents.length} recorded incident(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectStudent(st)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>{isMinistro ? 'View Incident History' : 'View Profile'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-200">
              No students found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or grade/section filters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400">
        <div>
          Showing <strong>{paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</strong> of{' '}
          <strong>{filteredStudents.length}</strong> students ({students.length} total across school)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="font-bold px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
