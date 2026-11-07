import React from 'react';

export default function MonthlyTrendChart({ incidents, year, selectedMonth, onSelectMonth }) {
  const months = Array.from({ length: 12 }, (_, index) => ({
    date: new Date(Number(year), index, 1),
    key: `${year}-${String(index + 1).padStart(2, '0')}`,
  }));
  const monthlyCounts = Object.fromEntries(months.map(({ key }) => [key, 0]));

  incidents.forEach((inc) => {
    if (!inc.incident_date) return;
    const dateKey = String(inc.incident_date).slice(0, 7);
    if (Object.hasOwn(monthlyCounts, dateKey)) monthlyCounts[dateKey] += 1;
  });

  const maxVal = Math.max(...Object.values(monthlyCounts), 1);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Incident Trend</h4>
          <p className="text-xs text-slate-500">Recorded cases by month in {year}</p>
        </div>
      </div>

      <div className="h-48 flex items-end justify-between gap-1 sm:gap-3 pt-6 pb-2 px-1 sm:px-2">
        {months.map(({ date, key }) => {
          const count = monthlyCounts[key];
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const isSelected = selectedMonth === month;
          const heightPercent = Math.min(100, Math.round((count / maxVal) * 100));
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectMonth(month)}
              aria-pressed={isSelected}
              aria-label={`Filter cases to ${date.toLocaleDateString('en-US', { month: 'long' })} ${year}: ${count} cases`}
              className={`min-w-0 flex-1 flex flex-col items-center gap-2 group rounded-lg px-0.5 pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isSelected ? 'bg-teal-50 dark:bg-teal-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400">{count}</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end p-0.5 sm:p-1">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-md transition-all duration-300 shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-t from-blue-700 to-cyan-500'
                      : 'bg-gradient-to-t from-teal-600 to-emerald-500 group-hover:from-teal-500 group-hover:to-emerald-400'
                  }`}
                />
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold ${
                isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
