import React, { useState } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import ProfileAvatar from '../common/ProfileAvatar';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import {
  User,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Printer,
  Shield,
  FileText,
  Clock,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function StudentProfileModal({
  isOpen,
  onClose,
  student,
  onSelectIncident,
}) {
  const { isMinistro } = useAuth();
  const { getStudentIncidents, isRepeatOffender } = useIncidents();
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!student) return null;

  const allIncidents = getStudentIncidents(student.id);
  const isRepeat = isRepeatOffender(student.id);

  // Filter history
  const filteredIncidents = allIncidents.filter((inc) => {
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    return true;
  });

  const filterTabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Recent', value: 'Recent Report' },
    { label: 'Ongoing', value: 'Ongoing Report' },
    { label: 'Appealed', value: 'Appealed' },
    { label: 'Community Service', value: 'Community Service' },
    { label: 'Expelled', value: 'Expelled' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isMinistro ? `Incident History Archive: ${student.name}` : `Confidential Student Disciplinary Record: ${student.name}`}
      maxWidth="max-w-5xl"
    >
      {/* DepEd Child Protection Privacy Notice for Ministrong Tagasubaybay */}
      {isMinistro && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            <strong>DepEd Child Protection Policy (D.O. 40, s. 2012):</strong> Full personal profiles, enrollment records, and parent/guardian contact details are restricted to OSD and Board of Discipline. You are viewing authorized student incident histories only.
          </span>
        </div>
      )}

      {/* 2-Column Layout: Left = Student Details, Right = Chronological Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-slate-800 dark:text-slate-200">
        {/* Left Column (5 of 12 cols): Student Photo and Details */}
        <div className="md:col-span-5 space-y-4 p-5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <ProfileAvatar
              src={student.avatar}
              name={student.name}
              className="w-28 h-28 rounded-xl object-cover mx-auto border-2 border-blue-900 dark:border-blue-400 shadow-sm"
            />
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3 leading-tight">
              {student.name}
            </h3>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mt-1">
              {student.grade} • {student.section}
            </p>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              LRN: {isMinistro ? '•••••••••••• (Protected)' : student.lrn}
            </p>

            {/* Repeat Offender Badge */}
            {isRepeat && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                <span>Repeat Offender Flagged</span>
              </div>
            )}
          </div>

          {/* Demographic & Contact Details */}
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Adviser:</span>
              <p className="font-semibold text-slate-900 dark:text-white">{student.adviser_name || student.adviser || 'Assigned Faculty'}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Guardian Name:</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {isMinistro ? <span className="text-slate-400 italic font-normal">[Confidential - Restricted to OSD]</span> : student.guardian_name}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Guardian Contact:</span>
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{isMinistro ? <span className="text-slate-400 italic font-normal">[Restricted]</span> : student.guardian_phone}</span>
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Email:</span>
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{isMinistro ? <span className="text-slate-400 italic font-normal">[Restricted]</span> : student.guardian_email}</span>
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Home Address:</span>
              <p className="font-semibold text-slate-900 dark:text-white flex items-start gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{isMinistro ? <span className="text-slate-400 italic font-normal">[Restricted]</span> : student.address}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Incidents:</span>
              <span className="text-base font-black text-blue-900 dark:text-blue-300">
                {allIncidents.length} on file
              </span>
            </div>
          </div>

          {/* Print Action Button */}
          {!isMinistro && (
            <div className="pt-3">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Disciplinary Transcript</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column (7 of 12 cols): Vertical Timeline with Filter Tabs */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Chronological Case Timeline
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                {filteredIncidents.length} record(s)
              </span>
            </div>

            {/* Filter Tabs (All, Recent, Ongoing, Appealed, Expelled, Community Service) */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {filterTabs.map((tab) => {
                const isActive = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Timeline */}
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
            {filteredIncidents.length > 0 ? (
              <div className="relative pl-6 space-y-5 border-l-2 border-slate-300 dark:border-slate-700">
                {filteredIncidents.map((inc) => (
                  <div key={inc.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-900 border-2 border-white dark:border-slate-900 ring-2 ring-blue-300" />

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-900 dark:hover:border-blue-500 transition space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {inc.case_number}
                        </span>
                        <StatusBadge status={inc.status} size="sm" />
                      </div>

                      <h5 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {inc.title}
                      </h5>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Date: <strong>{new Date(inc.incident_date).toLocaleDateString()}</strong> • Location: <strong>{inc.location}</strong>
                      </p>

                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {inc.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Reported by: <strong>{inc.reporter_name}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectIncident(inc);
                          }}
                          className="text-xs font-bold text-blue-900 dark:text-blue-300 hover:underline flex items-center gap-1"
                        >
                          <span>Open Full Case</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                  No incidents under "{statusFilter}"
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Select "All" above to view complete case history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
