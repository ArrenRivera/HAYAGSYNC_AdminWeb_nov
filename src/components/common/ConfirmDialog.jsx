import React from 'react';
import Modal from './Modal';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation Required',
  message,
  confirmLabel = 'Yes, Confirm Action',
  cancelLabel = 'No, Keep as Is',
  isDestructive = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h4>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons with Clear Verbs */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-base font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-base font-bold text-white shadow-sm transition flex items-center justify-center gap-2 ${
              isDestructive
                ? 'bg-rose-700 hover:bg-rose-800'
                : 'bg-blue-900 hover:bg-blue-800'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
