import React, { useState } from 'react';
import { ShieldCheck, Info, X } from 'lucide-react';

export default function ConfidentialityBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-2 max-w-5xl mx-auto overflow-hidden">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] shrink-0">
          CONFIDENTIAL SYSTEM (RA 10173)
        </span>
        <span className="hidden sm:inline text-slate-400">|</span>
        <span className="truncate text-slate-300">
          Incident history is strictly restricted to authorized officials (Ministrong Tagasubaybay & OSD). Minors' information is legally protected under the Philippine Data Privacy Act.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-slate-400 hover:text-white rounded ml-2"
        title="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
