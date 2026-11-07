import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import { ShieldAlert, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const DEMO_MODE = import.meta.env.VITE_HAYAGSYNC_DEMO_MODE === 'true';

export default function IncidentStatusModal({ isOpen, onClose, incident }) {
  const { isOSD } = useAuth();
  const { updateIncidentStatus } = useIncidents();

  const [targetStatus, setTargetStatus] = useState(incident?.status || 'Ongoing Report');
  const [remark, setRemark] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Community service extra fields
  const [serviceHours, setServiceHours] = useState(15);
  const [serviceTask, setServiceTask] = useState('Campus Library & Botanical Garden Assistance');
  const [serviceSupervisor, setServiceSupervisor] = useState('Property Custodian / Guidance Office');

  // Expulsion extra fields
  const [resolutionNo, setResolutionNo] = useState(() => `HHS-OSD-RES-${new Date().getFullYear()}-015`);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!incident) return null;

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!remark.trim()) {
      setErrorMsg('Please write a justification remark before proceeding. This is required for official documentation.');
      return;
    }

    if (targetStatus === 'Expelled' && !isOSD) {
      setErrorMsg('The final sanction of Expulsion requires OSD (Office of Student Discipline) final decision authority.');
      return;
    }

    setErrorMsg('');
    setShowConfirmDialog(true);
  };

  const handleExecuteUpdate = async () => {
    let additionalPayload = {};

    if (targetStatus === 'Community Service') {
      additionalPayload.serviceData = {
        required_hours: Number(serviceHours),
        task_description: serviceTask,
        supervisor_name: serviceSupervisor,
      };
    } else if (targetStatus === 'Expelled') {
      additionalPayload.expulsionData = {
        resolution_number: resolutionNo,
        effective_date: effectiveDate,
        grounds: incident.description,
      };
    } else if (targetStatus.startsWith('Escalated to ')) {
      additionalPayload.escalation_reason = remark.trim();
      additionalPayload.escalated_to = targetStatus.replace('Escalated to ', '');
    } else if (targetStatus === 'Referred to Board of Discipline') {
      additionalPayload.board_referred = true;
      additionalPayload.hearing_notes = remark.trim();
    }

    setIsSaving(true);
    try {
      const saved = await updateIncidentStatus(incident.id, targetStatus, remark.trim(), additionalPayload);
      if (saved) {
        setRemark('');
        setErrorMsg('');
        setShowConfirmDialog(false);
        onClose();
      }
    } catch (error) {
      setErrorMsg(error.message || 'The case update could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: 'Recent Report', label: 'Recent Report', disabled: false },
    { value: 'Ongoing Report', label: 'Ongoing Report (Investigation/Hearing in Progress)', disabled: false },
    { value: 'Escalated to Principal', label: 'Escalate to Principal', disabled: false },
    { value: 'Escalated to Ministrong Tagasubaybay', label: 'Escalate to Ministrong Tagasubaybay', disabled: false },
    { value: 'Escalated to OSD', label: 'Escalate to OSD', disabled: false },
    { value: 'Referred to Board of Discipline', label: 'Refer to Board of Discipline (Hearing)', disabled: !isOSD },
    { value: 'Appealed', label: 'Appealed (Contested by Guardian)', disabled: false },
    {
      value: 'Community Service',
      label: 'Community Service (Restitution Assigned)',
      disabled: !DEMO_MODE,
      disabledMessage: 'Supabase tracking is not configured',
    },
    {
      value: 'Expelled',
      label: 'Expelled (Final Formal Board Sanction - OSD Only)',
      disabled: !isOSD || !DEMO_MODE,
      disabledMessage: !isOSD ? 'Restricted to OSD Head' : 'Supabase tracking is not configured',
    },
    { value: 'Resolved', label: 'Resolved (Undertaking Completed)', disabled: false },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowConfirmDialog(false);
        onClose();
      }}
      title={`Update Status: Case #${incident.case_number}`}
      maxWidth="max-w-2xl"
    >
      {!showConfirmDialog ? (
        <form onSubmit={handlePreSubmit} className="space-y-5 text-slate-800 dark:text-slate-200">
          {/* Current Case Context */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              Student: {incident.student_name} ({incident.section})
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Current Status: <strong>{incident.status}</strong> • Offense: <strong>{incident.title}</strong>
            </p>
          </div>

          {/* New Status Category Field */}
          <div>
            <label className="text-sm font-bold text-slate-900 dark:text-white block mb-1.5">
              Select New Case Status Category *
            </label>
            <select
              value={targetStatus}
              onChange={(e) => {
                setTargetStatus(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-900"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label} {opt.disabled ? `(${opt.disabledMessage || 'Restricted to OSD Head'})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Community Service Extra Fields */}
          {targetStatus === 'Community Service' && (
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
              <h5 className="text-sm font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wider">
                Community Service Terms
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Required Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={serviceHours}
                    onChange={(e) => setServiceHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Supervisor
                  </label>
                  <input
                    type="text"
                    value={serviceSupervisor}
                    onChange={(e) => setServiceSupervisor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Specific Campus Task Description
                </label>
                <input
                  type="text"
                  value={serviceTask}
                  onChange={(e) => setServiceTask(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* Expulsion Extra Fields */}
          {targetStatus === 'Expelled' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 text-sm font-bold uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5" />
                <span>Formal Board Expulsion Documentation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Board Resolution Reference Number
                  </label>
                  <input
                    type="text"
                    value={resolutionNo}
                    onChange={(e) => setResolutionNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Effective Sanction Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Written Justification / Escalation Remark (Mandatory) */}
          <div>
            <label className="text-sm font-bold text-slate-900 dark:text-white block mb-1.5">
              {targetStatus.includes('Escalat') || targetStatus.includes('Board')
                ? 'Reason for Escalation / Referral *'
                : 'Written Justification / Hearing Remarks *'}
            </label>
            <textarea
              rows={4}
              required
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                setErrorMsg('');
              }}
              placeholder={
                targetStatus.includes('Escalat') || targetStatus.includes('Board')
                  ? 'Provide a clear, detailed reason and notes for escalating or referring this case...'
                  : 'Provide a clear, factual explanation of this status change, actions taken during the hearing, and agreements reached...'
              }
              className="w-full p-3.5 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-900 leading-relaxed"
            />
            <p className="text-xs text-slate-500 mt-1">
              This remark will be permanently logged in the official audit record with your signature.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-base font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-base font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition flex items-center gap-2"
            >
              <span>Continue to Confirmation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        /* Plain Language Confirmation Step */
        <div className="space-y-5 text-slate-800 dark:text-slate-200 py-2">
          {errorMsg && (
            <div role="alert" className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                targetStatus === 'Expelled'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {targetStatus === 'Expelled'
                  ? `Are you sure you want to mark this student as Expelled?`
                  : `Are you sure you want to mark this case as "${targetStatus}"?`}
              </h4>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {targetStatus === 'Expelled'
                  ? `This action will permanently record an official expulsion under DepEd Child Protection Policy (D.O. 40, s. 2012) for student ${incident.student_name}. The student's enrollment status will transition to Expelled.`
                  : `This will update Case #${incident.case_number} to "${targetStatus}" and record your written remark in the confidential case audit log.`}
              </p>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 mt-2">
                <strong>Recorded Remark:</strong> "{remark}"
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfirmDialog(false)}
              className="px-5 py-2.5 rounded-xl text-base font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Go Back and Edit
            </button>

            <button
              type="button"
              onClick={handleExecuteUpdate}
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl text-base font-bold text-white shadow-xs transition flex items-center gap-2 ${
                targetStatus === 'Expelled'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              } disabled:opacity-50`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSaving ? 'Saving...' : 'Confirm and Save Status'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
