import React from 'react';

export default function OffenseDistributionChart({ incidents, month }) {
  const counts = {};
  incidents.forEach((i) => {
    const category = i.category?.trim() || 'Uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });

  const total = incidents.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const colorPalettes = [
    'bg-blue-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-indigo-500',
  ];

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Incidents by Offense Category</h4>
        <p className="text-xs text-slate-500">
          {month === 'ALL' ? 'Distribution across all months in the selected year' : 'Distribution for the selected month'}
        </p>
      </div>

      <div className="space-y-3">
        {sorted.length > 0 ? sorted.map(([cat, count], idx) => {
          const percent = Math.round((count / total) * 100);
          const colorClass = colorPalettes[idx % colorPalettes.length];
          return (
            <div key={cat} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold gap-3">
                <span className="text-slate-700 dark:text-slate-300 truncate">{cat}</span>
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{count} cases ({percent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-slate-500">No incident records available yet.</p>
        )}
      </div>
    </div>
  );
}
