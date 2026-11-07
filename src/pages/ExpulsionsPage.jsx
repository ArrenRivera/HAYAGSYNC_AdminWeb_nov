import React from 'react';
import { useIncidents } from '../context/IncidentContext';
import { UserX, ShieldAlert, FileText, CheckCircle2, Lock } from 'lucide-react';

export default function ExpulsionsPage() {
  const { expulsions } = useIncidents();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <UserX className="w-7 h-7 text-rose-700 dark:text-rose-400" />
          <span>Formal Expulsion Registry (Pormal na Pagtitiwalag)</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Official expulsion orders executed under DepEd Child Protection Policy (D.O. 40, s. 2012)
        </p>
      </div>

      {/* Legal & Privacy Compliance Card */}
      <div className="p-5 rounded-xl bg-[#0f2444] text-white border border-[#1b365d] flex items-start gap-3.5 shadow-sm">
        <Lock className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs">
            Confidential Legal Records Under Philippine Law (RA 10173)
          </h4>
          <p className="text-slate-300 mt-1 leading-relaxed text-sm">
            Expulsion orders require concurrence from the Schools Division Superintendent. Records of expelled minors are strictly confidential under the Philippine Data Privacy Act. Transcripts are sealed and available only to accredited educational transfer authorities.
          </p>
        </div>
      </div>

      {/* Expulsions List */}
      <div className="grid grid-cols-1 gap-5">
        {expulsions.length > 0 ? (
          expulsions.map((exp) => (
            <div
              key={exp.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded border border-rose-300 dark:border-rose-800">
                    Resolution #{exp.resolution_number}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {exp.student_name} ({exp.grade} - {exp.section})
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-700 text-white">
                    Final Sanction: Expelled
                  </span>
                </div>
                <span className="text-sm text-slate-500 font-semibold">
                  Effective Date: {exp.effective_date}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">DepEd Endorsement:</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-200 mt-0.5">{exp.deped_endorsement_no}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Presiding Authority:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-200 mt-0.5">{exp.signatory}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Transfer Status:</span>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Endorsed to Division
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Administrative Legal Grounds:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-850 text-base">
                    {exp.grounds}
                  </p>
                </div>
                {exp.confidential_notes && (
                  <p className="text-xs text-slate-500 italic pt-1">
                    Confidential Custody Note: {exp.confidential_notes}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-base text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            No formal expulsion records registered.
          </div>
        )}
      </div>
    </div>
  );
}
