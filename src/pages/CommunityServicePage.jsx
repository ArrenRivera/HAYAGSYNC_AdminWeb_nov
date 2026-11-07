import React, { useState } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { Clock, CheckCircle2, AlertCircle, PlusCircle, Calendar, User, FileText, Hammer } from 'lucide-react';
import LogHoursModal from '../components/community_service/LogHoursModal';

export default function CommunityServicePage() {
  const { communityServices } = useIncidents();
  const [selectedService, setSelectedService] = useState(null);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const handleOpenLog = (cs) => {
    setSelectedService(cs);
    setIsLogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Hammer className="w-7 h-7 text-blue-900 dark:text-blue-400" />
          <span>Community Service Tracker (Pananagutan)</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Monitor assigned student restitution hours, campus tasks, and verified supervisor completion records.
        </p>
      </div>

      {/* Services List */}
      <div className="space-y-5">
        {communityServices.length > 0 ? (
          communityServices.map((cs) => {
            const percent = Math.min(100, Math.round((cs.completed_hours / cs.required_hours) * 100));
            const isCompleted = cs.completed_hours >= cs.required_hours;
            return (
              <div
                key={cs.id}
                className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
                      Case #{cs.case_number}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cs.student_name} ({cs.grade} - {cs.section})
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-teal-100 text-teal-900 border-teal-300'
                      }`}
                    >
                      {isCompleted ? 'Sanction Completed' : 'Hours In Progress'}
                    </span>
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleOpenLog(cs)}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Record Rendered Hours</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar Component */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      Progress: {cs.completed_hours} of {cs.required_hours} Hours Completed
                    </span>
                    <span className="text-blue-900 dark:text-blue-400 text-base">{percent}%</span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-blue-900'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Terms and Supervisor Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">Assigned Terms:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-200 mt-0.5">{cs.task_description}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">Supervising Official:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-200 mt-0.5">{cs.supervisor_name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block">Target Completion Date:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
                      {new Date(cs.completion_deadline).toLocaleDateString('en-PH', { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>

                {/* Service History Log Table: Zebra Stripped, Text >= 15px */}
                <div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Verified Hours Log ({cs.logs?.length || 0} entries)
                  </h5>
                  {cs.logs && cs.logs.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-[15px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                          <tr>
                            <th className="py-3 px-3.5">Date Rendered</th>
                            <th className="py-3 px-3.5">Hours Credited</th>
                            <th className="py-3 px-3.5">Activity Description</th>
                            <th className="py-3 px-3.5">Supervisor</th>
                            <th className="py-3 px-3.5">Observations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {cs.logs.map((log) => (
                            <tr key={log.id} className="odd:bg-white even:bg-slate-50/80 hover:bg-blue-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-850">
                              <td className="py-3 px-3.5 font-medium">{log.date}</td>
                              <td className="py-3 px-3.5 font-bold text-blue-900 dark:text-blue-300">{log.hours} hrs</td>
                              <td className="py-3 px-3.5 text-slate-800 dark:text-slate-200 font-medium">{log.activity}</td>
                              <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">{log.supervisor}</td>
                              <td className="py-3 px-3.5 text-slate-500 italic">{log.remark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic p-2">No hours logged yet for this assignment.</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-base text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            No active community service sanctions currently assigned.
          </div>
        )}
      </div>

      <LogHoursModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        service={selectedService}
      />
    </div>
  );
}
