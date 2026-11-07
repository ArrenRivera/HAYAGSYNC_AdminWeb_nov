import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useIncidents } from '../../context/IncidentContext';
import { AlertCircle } from 'lucide-react';

export default function LogHoursModal({ isOpen, onClose, service }) {
  const { logCommunityServiceHours } = useIncidents();

  const [hours, setHours] = useState(3);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');
  const [supervisor, setSupervisor] = useState(service?.supervisor_name || 'Property Custodian');
  const [remark, setRemark] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!service) return null;

  const currentCompleted = service.completed_hours;
  const targetRequired = service.required_hours;
  const remainingHours = Math.max(0, targetRequired - currentCompleted);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activity.trim() || Number(hours) <= 0) return;

    setIsSaving(true);
    setErrorMessage('');
    try {
      await logCommunityServiceHours(service.id, {
        hours: Number(hours),
        date,
        activity: activity.trim(),
        supervisor: supervisor.trim(),
        remark: remark.trim() || 'Verified service hours.',
      });

      setActivity('');
      setRemark('');
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Service hours could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const percentage = Math.min(100, Math.round((currentCompleted / targetRequired) * 100));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Completed Hours: ${service.student_name}`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {/* Progress Summary Card */}
        <div className="p-5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-200 dark:border-teal-800">
          <div className="flex justify-between items-center text-sm font-bold text-teal-950 dark:text-teal-200 mb-2">
            <span>Overall Service Progress</span>
            <span>
              {currentCompleted} / {targetRequired} Hours ({percentage}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-teal-200 dark:bg-teal-900 overflow-hidden">
            <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-sm text-teal-800 dark:text-teal-300 mt-2.5 font-medium">
            Hours remaining to fulfill sanction: <strong className="font-bold">{remainingHours} hour(s)</strong>
          </p>
        </div>

        {/* Hours input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
              Hours Served <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              max={remainingHours || 12}
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#0f2444]"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
              Date Rendered <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
            />
          </div>
        </div>

        {/* Activity Description */}
        <div>
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
            Service Task or Activity Assigned <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g. Campus grounds cleaning, library book inventory"
            className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
          />
        </div>

        {/* Supervisor */}
        <div>
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
            Supervising School Official / Faculty
          </label>
          <input
            type="text"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
          />
        </div>

        {/* Supervisor Remark */}
        <div>
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
            Supervisor Observation & Conduct Remarks
          </label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="e.g. Diligent, cooperative, arrived promptly on time"
            className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-base font-bold rounded-lg bg-[#0f2444] hover:bg-[#1a365d] text-white shadow-sm transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Credit Hours'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
