import React, { useState } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { Scale, FileText, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import AppealReviewModal from '../components/appeals/AppealReviewModal';

export default function AppealsPage() {
  const { appeals } = useIncidents();
  const { isOSD } = useAuth();
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleOpenReview = (app) => {
    setSelectedAppeal(app);
    setIsReviewOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Under Review':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      case 'Upheld':
        return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200';
      case 'Reduced':
        return 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950 dark:text-teal-200';
      case 'Overturned':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200';
      default:
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Scale className="w-7 h-7 text-blue-900 dark:text-blue-400" />
          <span>Appeals Management (Mga Apela)</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Formal guardian petitions contesting disciplinary decisions. The Office of Student Discipline (OSD) holds final administrative ruling authority.
        </p>
      </div>

      {/* Appeals Registry Cards */}
      <div className="grid grid-cols-1 gap-5">
        {appeals.length > 0 ? (
          appeals.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
                    Case #{app.case_number}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${getStatusBadge(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Filed: {new Date(app.appeal_date).toLocaleDateString('en-PH', { dateStyle: 'long' })}
                  </span>
                </div>

                {isOSD && (
                  <button
                    type="button"
                    onClick={() => handleOpenReview(app)}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Conduct Hearing & Decision Ruling</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Student Subject:</span>
                  <p className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{app.student_name}</p>
                  <p className="text-slate-500 text-xs font-mono">LRN: {app.student_lrn}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Appellant (Guardian):</span>
                  <p className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{app.appellant}</p>
                  <p className="text-slate-500 text-xs">Parent / Legal Guardian</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Supporting Documents:</span>
                  <div className="mt-1 space-y-1">
                    {app.supporting_docs && app.supporting_docs.length > 0 ? (
                      app.supporting_docs.map((doc, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs text-blue-900 dark:text-blue-300 font-semibold mr-2">
                          <FileText className="w-3.5 h-3.5" /> {doc.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Appeal Reason */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl text-base text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Formal Appeal Argument / Ground:
                </p>
                <p className="italic leading-relaxed">"{app.reason}"</p>
              </div>

              {/* Ruling Justification if decided */}
              {app.outcome_justification && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl text-base text-emerald-950 dark:text-emerald-200">
                  <p className="font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300 mb-1 text-sm uppercase">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Official Ruling Decision ({app.status})</span>
                  </p>
                  <p className="leading-relaxed">{app.outcome_justification}</p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-2 font-bold">
                    Presided by: {app.reviewed_by} • {new Date(app.reviewed_at).toLocaleDateString('en-PH')}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-base text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            No active contested appeals filed at this time.
          </div>
        )}
      </div>

      <AppealReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        appeal={selectedAppeal}
      />
    </div>
  );
}
