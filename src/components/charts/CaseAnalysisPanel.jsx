import React from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getRecommendation = (category) => {
  const normalized = category.toLowerCase();

  if (normalized.includes('physical')) {
    return 'The case handler may wish to check in on the student’s safety and support needs, and consider additional adult presence in the reported area during the times mentioned.';
  }
  if (normalized.includes('threat') || normalized.includes('extortion') || normalized.includes('coercion')) {
    return 'The case handler may wish to consider whether there are ongoing safety concerns, hear separately and fairly from those involved, and consult designated child-protection personnel if appropriate.';
  }
  if (normalized.includes('verbal')) {
    return 'It may be helpful to speak privately and separately with those involved and any witnesses, document the reported words and context, and follow up if further incidents are reported.';
  }
  if (normalized.includes('harassment') || normalized.includes('discrimination')) {
    return 'A confidential check-in with the student, careful documentation of the reported context, and guidance from designated child-protection personnel may be helpful.';
  }
  if (normalized.includes('cyber')) {
    return 'If available, original messages or screenshots may be kept secure and private rather than circulated. The case handler may review them confidentially and consider whether the concern is continuing at school.';
  }
  if (normalized.includes('social') || normalized.includes('relational')) {
    return 'A private check-in with the student and thoughtful observation of peer interactions and inclusion over the coming weeks may be helpful.';
  }
  if (normalized.includes('property') || normalized.includes('vandal')) {
    return 'It may be helpful to document the reported damage and location, check for related reports, and consider whether additional supervision in the area would be appropriate.';
  }
  return 'A careful review of the report, consideration of related incidents, and an appropriate follow-up date may be helpful.';
};

export default function CaseAnalysisPanel({ incidents, year, month }) {
  const categories = {};
  const locations = {};
  let urgentCount = 0;

  incidents.forEach((incident) => {
    const category = incident.category?.trim() || 'Uncategorized';
    const categoryKey = category.toLowerCase();
    if (!categories[categoryKey]) categories[categoryKey] = { name: category, count: 0 };
    categories[categoryKey].count += 1;

    const location = incident.incident_location?.trim();
    if (location) {
      const locationKey = location.toLowerCase();
      if (!locations[locationKey]) locations[locationKey] = { name: location, count: 0 };
      locations[locationKey].count += 1;
    }

    const severity = (incident.severity || incident.urgency_level || '').toLowerCase();
    if (severity === 'high' || severity === 'critical') urgentCount += 1;
  });

  const sortedCategories = Object.values(categories).sort((a, b) => b.count - a.count);
  const topCategory = sortedCategories[0];
  const sortedLocations = Object.values(locations).sort((a, b) => b.count - a.count);
  const topLocation = sortedLocations[0];
  const repeatedLocations = sortedLocations.filter((location) => location.count >= 2);
  const period = month === 'ALL'
    ? `All months in ${year}`
    : `${MONTH_NAMES[Number(month) - 1]} ${year}`;

  return (
    <section className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Automated Case Analysis & Recommendations</h4>
        <p className="text-xs text-slate-500">Based on {period} reports ({incidents.length} total)</p>
      </div>

      {incidents.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No reports are available for this period, so there are no patterns or recommendations to show.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {topCategory && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Most reported category</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {topCategory.name} — {topCategory.count} {topCategory.count === 1 ? 'case' : 'cases'}
                </p>
              </div>
            )}
            {topLocation && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Most reported location</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {topLocation.name} — {topLocation.count} {topLocation.count === 1 ? 'report' : 'reports'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {topLocation.count > 1
                    ? 'Consider reviewing supervision or support in this area. Report frequency is a signal to monitor, not proof of cause.'
                    : 'Only one report is recorded here; continue monitoring before treating it as a recurring hotspot.'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recommended actions to review</p>
            {urgentCount > 0 && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Priority review: {urgentCount} high/critical {urgentCount === 1 ? 'report' : 'reports'}
                </p>
                <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">
                  The case handler may wish to prioritize a careful review of these reports, consider any immediate safety needs, and document follow-up. A severity label alone does not mean an allegation has been verified.
                </p>
              </div>
            )}
            {sortedCategories.slice(0, 3).map((category) => (
              <div key={category.name} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {category.name}: {category.count} {category.count === 1 ? 'report' : 'reports'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {getRecommendation(category.name)}
                </p>
              </div>
            ))}
            {repeatedLocations.length > 0 ? repeatedLocations.slice(0, 2).map((location) => (
              <div key={location.name} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Recurring location: {location.name} ({location.count} reports)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  The reported times and activities may be reviewed to consider whether additional adult presence would be helpful. Repeated reports are a monitoring signal, not proof of cause.
                </p>
              </div>
            )) : topLocation && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No location has repeat reports in this period. {topLocation.name} has one report, so monitor it without labeling it a hotspot.
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-3">
        This is a local, rule-based summary of report data—not an AI finding. Recommendations are prompts for authorized staff review and do not determine whether an allegation is true.
      </p>
    </section>
  );
}
