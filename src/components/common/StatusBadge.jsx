import React from 'react';
import {
  Clock,
  AlertTriangle,
  Scale,
  UserX,
  Hammer,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const getBadgeConfig = (st) => {
    switch (st) {
      case 'Recent Report':
        return {
          icon: Clock,
          classes: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700 font-semibold',
        };
      case 'Ongoing Report':
        return {
          icon: AlertTriangle,
          classes: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 font-semibold',
        };
      case 'Appealed':
        return {
          icon: Scale,
          classes: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700 font-semibold',
        };
      case 'Expelled':
        return {
          icon: UserX,
          classes: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 font-semibold',
        };
      case 'Community Service':
        return {
          icon: Hammer,
          classes: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-700 font-semibold',
        };
      case 'Resolved':
        return {
          icon: CheckCircle2,
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 font-semibold',
        };
      default:
        return {
          icon: FileText,
          classes: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-medium',
        };
    }
  };

  const config = getBadgeConfig(status);
  const IconComponent = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[13px] gap-1.5'
      : 'px-3 py-1.5 text-[14px] gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${sizeClasses} ${config.classes} whitespace-nowrap shadow-xs select-none`}
    >
      <IconComponent className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
