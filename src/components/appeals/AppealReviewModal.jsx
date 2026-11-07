import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import { FileText, AlertCircle } from 'lucide-react';

export default function AppealReviewModal({ isOpen, onClose, appeal }) {
  const { isOSD } = useAuth();
  const { reviewAppeal } = useIncidents();

  const [decision, setDecision] = useState('Upheld'); // Upheld, Reduced, Overturned
  const [justification, setJustification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!appeal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!justification.trim()) {
      setErrorMsg('A detailed written justification is required for the official appeal record.');
      return;
    }

    if (!isOSD) {
      setErrorMsg('Final decision authority on contested appeals belongs strictly to the OSD Head.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await reviewAppeal(appeal.id, decision, justification.trim());
      setJustification('');
      onClose();
    } catch (error) {
      setErrorMsg(error.message || 'The appeal decision could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Appeal Hearing Review: ${appeal.case_number}`} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Appeal Overview */}
        <div className="p-5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 px-2.5 py-0.5 rounded">
              {appeal.case_number}
            </span>
            <span className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
              Filed: {new Date(appeal.appeal_date).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Student: {appeal.student_name}
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Appellant (Naghain): <strong>{appeal.appellant}</strong>
          </p>
          <div className="mt-2 p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 text-sm text-slate-800 dark:text-slate-200">
            <p className="font-bold text-purple-950 dark:text-purple-200 mb-1">Grounds / Appeal Reason Filed by Guardian:</p>
            <p className="italic leading-relaxed">"{appeal.reason}"</p>
          </div>
        </div>

        {/* Supporting Docs */}
        {appeal.supporting_docs && appeal.supporting_docs.length > 0 && (
          <div>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
              Supporting Evidence & Affidavits
            </label>
            <div className="space-y-2">
              {appeal.supporting_docs.map((doc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-850"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-purple-600" /> {doc.name}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0 font-mono">{doc.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision Authority Outcome */}
        <div>
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-2">
            Formal OSD Decision Outcome <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'Upheld', label: 'Upheld Sanction', desc: 'Maintain initial disciplinary verdict', color: 'border-rose-400 bg-rose-50 text-rose-950' },
              { id: 'Reduced', label: 'Reduced Sanction', desc: 'Lessen sanction to Community Service', color: 'border-teal-400 bg-teal-50 text-teal-950' },
              { id: 'Overturned', label: 'Overturned (Cleared)', desc: 'Dismiss case due to lack of evidence', color: 'border-emerald-400 bg-emerald-50 text-emerald-950' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setDecision(opt.id)}
                className={`p-3.5 rounded-xl border-2 text-left transition ${
                  decision === opt.id
                    ? `${opt.color} ring-2 ring-purple-600 font-bold shadow-sm`
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-sm font-bold">{opt.label}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Written Justification */}
        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Written Decision Justification <span className="text-red-500">*</span> (Pormal na Paliwanag ng OSD)
          </label>
          <textarea
            rows={4}
            required
            value={justification}
            onChange={(e) => {
              setJustification(e.target.value);
              setErrorMsg('');
            }}
            placeholder="State the procedural review findings, credibility of submitted counter-evidence, and legal rationale..."
            className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-lg text-sm font-bold border border-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
            className="px-6 py-2.5 text-base font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-sm transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Submit Official Appeal Ruling'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
