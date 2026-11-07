import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react';

export default function AccessRestrictedPage({ onGoToSubmit }) {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div>
          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-950 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            HTTP 403 • ACCESS RESTRICTED
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            Confidential Disciplinary Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Incident history and student disciplinary profiles are strictly confidential. Under Philippine Data Privacy laws (RA 10173) and school rules, only the <strong>Ministro ng Tagasubaybay</strong> and <strong>Office of Student Discipline (OSD)</strong> are authorized to view past case archives.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-white">Your Current Logged-in Profile:</p>
          <p className="text-slate-600 dark:text-slate-300">
            User: <strong>{currentUser?.name || 'Anonymous User'}</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Role: <strong className="text-rose-600 dark:text-rose-400 capitalize">{currentUser?.role || 'Guest'}</strong> (Non-Administrative)
          </p>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-750">
            You are permitted only to submit incident reports.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onGoToSubmit}
            className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Submit Portal
          </button>
          <button
            onClick={logout}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-teal-600" /> Sign Out / Change Account
          </button>
        </div>
      </div>
    </div>
  );
}
