import React from 'react';

export default function GradeBreakdownChart({ incidents }) {
  const gradeCounts = {
    'Grade 7': 0,
    'Grade 8': 0,
    'Grade 9': 0,
    'Grade 10': 0,
    'Grade 11': 0,
    'Grade 12': 0,
  };

  incidents.forEach((i) => {
    if (gradeCounts[i.grade] !== undefined) {
      gradeCounts[i.grade] += 1;
    }
  });

  const maxCount = Math.max(...Object.values(gradeCounts), 4);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cases by Grade Level</h4>
        <p className="text-xs text-slate-500">Junior High School vs Senior High School levels</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
        {Object.entries(gradeCounts).map(([grade, count]) => {
          const isHigh = count >= 2;
          return (
            <div
              key={grade}
              className={`p-3 rounded-xl border text-center transition ${
                isHigh
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{grade}</span>
              <span className={`text-xl font-extrabold mt-1 block ${isHigh ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {count}
              </span>
              <span className="text-[10px] text-slate-400">cases</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
