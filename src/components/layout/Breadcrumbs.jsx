import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ activeTab, onNavigate }) {
  const getTabLabel = (tab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'incidents':
        return 'Incident Reports Directory';
      case 'students':
        return 'Students & Incident History';
      case 'appeals':
        return 'Appeals Management (Mga Apela)';
      case 'community-service':
        return 'Community Service Tracker';
      case 'expulsions':
        return 'Expelled Records Registry';
      case 'export-reports':
        return 'Reports & Summons Letters';
      case 'audit-logs':
        return 'Audit Log (Talaan ng Pagsusuri)';
      case 'settings':
        return 'System Configuration & Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
      <button
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="flex items-center gap-1.5 hover:text-blue-900 dark:hover:text-blue-300 transition"
      >
        <Home className="w-4 h-4 text-slate-500" />
        <span>Disciplinary Console</span>
      </button>

      {activeTab !== 'dashboard' && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-bold">
            {getTabLabel(activeTab)}
          </span>
        </>
      )}
    </nav>
  );
}
