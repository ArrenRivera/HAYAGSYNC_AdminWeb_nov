import React, { useState } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { exportIncidentsToCSV, downloadFile } from '../utils/exportUtils';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import {
  ScrollText,
  Download,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Filter
} from 'lucide-react';

export default function ReportsExportPage({ onGenerateSummons }) {
  const { incidents, settings, logAudit } = useIncidents();
  const { isOSD, isAdmin } = useAuth();

  const [maskData, setMaskData] = useState(!isOSD); // Mask sensitive fields unless OSD Admin
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const filteredIncidents = incidents.filter((i) => {
    if (selectedCategory !== 'ALL' && i.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && i.status !== selectedStatus) return false;
    return true;
  });

  const handleExportCSV = () => {
    const csv = exportIncidentsToCSV(filteredIncidents, maskData);
    const fileName = `HayagSync_Discipline_Report_${new Date().toISOString().slice(0, 10)}${
      maskData ? '_Masked_DPA' : '_Unmasked'
    }.csv`;
    downloadFile(csv, fileName);
    logAudit('EXPORT', 'Disciplinary Summary Report', fileName, `Exported ${filteredIncidents.length} incident records (Masked: ${maskData})`);
  };

  const handlePrintSummary = () => {
    logAudit('PRINT', 'Disciplinary Summary Report', 'Print View', `Printed summary report for ${filteredIncidents.length} records`);
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ScrollText className="w-7 h-7 text-[#0f2444] dark:text-blue-400" /> Disciplinary Reports & Official Exports
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Generate printable DepEd compliance records and export confidential spreadsheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrintSummary}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-base font-bold flex items-center gap-2 border border-slate-300 dark:border-slate-700 transition"
          >
            <Printer className="w-5 h-5 text-slate-700 dark:text-slate-200" /> Print Disciplinary Summary
          </button>
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-base font-bold shadow-sm flex items-center gap-2 transition"
          >
            <Download className="w-5 h-5" /> Export Records to CSV File
          </button>
        </div>
      </div>

      {/* DPA Privacy Control Card */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <ShieldCheck className="w-6 h-6 text-[#15803d] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Philippine Data Privacy Act (RA 10173) Compliance Protection
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
              When checked, student Learner Reference Numbers (LRN), parent contact numbers, and home addresses are automatically masked with asterisks in exported spreadsheet files.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 transition">
          <input
            type="checkbox"
            checked={maskData}
            onChange={(e) => setMaskData(e.target.checked)}
            className="w-5 h-5 text-[#15803d] rounded border-slate-300 focus:ring-[#15803d]"
          />
          <span className="text-sm font-bold text-slate-900 dark:text-white">Mask Sensitive Minor Data in Export</span>
        </label>
      </div>

      {/* Filter Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4 text-base">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
          <Filter className="w-5 h-5 text-slate-500" />
          <span>Filter Records for Export:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Offense Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm md:text-base focus:ring-2 focus:ring-[#0f2444]"
            >
              <option value="ALL">All Offense Categories</option>
              {settings.categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Status Category</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm md:text-base focus:ring-2 focus:ring-[#0f2444]"
            >
              <option value="ALL">All Status Categories</option>
              <option value="Recent Report">Recent Report</option>
              <option value="Ongoing Report">Ongoing Report</option>
              <option value="Appealed">Appealed</option>
              <option value="Community Service">Community Service</option>
              <option value="Expelled">Expelled</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <span className="text-slate-600 dark:text-slate-300 font-medium ml-auto text-base">
          Dataset: <strong className="text-slate-900 dark:text-white font-bold">{filteredIncidents.length}</strong> record(s) matching filter
        </span>
      </div>

      {/* Printable Report Preview Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print-shadow-none">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Export Dataset Preview (First 10 Records)</h3>
            <p className="text-sm text-slate-500">Official incident overview configured for printing or CSV download</p>
          </div>
          <span className="text-sm font-semibold text-slate-500">
            Showing {Math.min(10, filteredIncidents.length)} of {filteredIncidents.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#0f2444] text-white font-bold sticky top-0">
              <tr>
                <th className="px-4 py-3.5">Case #</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Grade / Section</th>
                <th className="px-4 py-3.5">Offense Category</th>
                <th className="px-4 py-3.5">Severity</th>
                <th className="px-4 py-3.5">Status Badge</th>
                <th className="px-4 py-3.5">Incident Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 text-base">
                    No incident records match the selected export filters.
                  </td>
                </tr>
              ) : (
                filteredIncidents.slice(0, 10).map((inc) => (
                  <tr
                    key={inc.id}
                    className="odd:bg-white even:bg-slate-50/80 dark:odd:bg-slate-900 dark:even:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-[#0f2444] dark:text-blue-400">{inc.case_number}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{inc.student_name}</td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{inc.section}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{inc.category}</td>
                    <td className="px-4 py-3.5">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {new Date(inc.incident_date).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
