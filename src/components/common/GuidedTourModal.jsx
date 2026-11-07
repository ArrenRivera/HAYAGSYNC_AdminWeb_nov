import React, { useState } from 'react';
import Modal from './Modal';
import {
  Compass,
  Search,
  Shield,
  FileText,
  Printer,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function GuidedTourModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to HayagSync Disciplinary Console',
      icon: Compass,
      description:
        'This portal is designed specifically for school administrators and the Office of Student Discipline (OSD) to track and review student disciplinary cases with total confidentiality.',
      highlight:
        'All student disciplinary records are strictly protected under the Philippine Data Privacy Act (RA 10173).',
    },
    {
      title: 'Universal Student Search',
      icon: Search,
      description:
        'The large search bar at the top of every screen allows you to search by student name, 12-digit Learner Reference Number (LRN), grade level, or section.',
      highlight:
        'Search works instantly with typo-tolerance, so small spelling mistakes will still locate the correct student.',
    },
    {
      title: 'Confidential Incident Lifecycle',
      icon: Shield,
      description:
        'Cases follow a clear review process: Recent Report → Ongoing Investigation → Appealed (if guardian contested) → Expelled, Community Service, or Resolved.',
      highlight:
        'Every status change requires a written justification remark, ensuring a permanent legal paper trail.',
    },
    {
      title: 'Official Printing & Summons Letters',
      icon: Printer,
      description:
        'Generate and print official Department of Education (DepEd) Parent Summons letters and complete student disciplinary transcripts with a single click.',
      highlight:
        'All documents format automatically for standard A4 paper with official school letterhead.',
    },
  ];

  if (!isOpen) return null;

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
      setStep(0);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrator User Guide & Quick Tour" maxWidth="max-w-2xl">
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Progress indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <span className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
            Step {step + 1} of {steps.length}
          </span>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all ${
                  i === step
                    ? 'w-8 bg-blue-900 dark:bg-blue-500'
                    : 'w-2.5 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-900 dark:text-blue-300 shrink-0">
              <StepIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentStep.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Help & Instructional Overview
              </p>
            </div>
          </div>

          <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-800 dark:border-blue-400 text-sm font-medium text-blue-950 dark:text-blue-200">
            <strong>Important Tip:</strong> {currentStep.highlight}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition ${
              step === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-sm flex items-center gap-2 transition"
          >
            <span>{step === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            {step === steps.length - 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
