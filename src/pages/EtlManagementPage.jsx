import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { parseRosterWorkbook } from '../utils/etlImport';
import {
  UploadCloud,
  AlertTriangle,
  Database,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

export default function EtlManagementPage() {
  const { isPrincipal } = useAuth();
  const [etlRuns, setEtlRuns] = useState([]);
  const [rejectedRecords, setRejectedRecords] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('runs');
  const [isReadingWorkbook, setIsReadingWorkbook] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const fileInputRef = useRef(null);

  // Fetch ETL history
  const fetchEtlData = async () => {
    try {
      const [runsResult, rejectedResult, staffResult] = await Promise.all([
        supabase.from('etl_runs').select('*').order('id', { ascending: false }).limit(20),
        supabase.from('etl_rejected_records').select('*, etl_runs(batch_id, source_file)').order('id', { ascending: false }).limit(30),
        supabase.from('etl_pending_staff').select('*').eq('review_status', 'pending').order('id', { ascending: false }).limit(100),
      ]);

      const errors = [];
      if (runsResult.error) errors.push(`ETL runs: ${runsResult.error.message}`);
      else setEtlRuns(runsResult.data || []);
      if (rejectedResult.error) errors.push(`Rejected rows: ${rejectedResult.error.message}`);
      else setRejectedRecords(rejectedResult.data || []);
      if (staffResult.error) errors.push(`Pending staff: ${staffResult.error.message}`);
      else setPendingStaff(staffResult.data || []);
      setHistoryError(errors.length ? `Could not load some ETL history: ${errors.join(' | ')}` : '');
    } catch (error) {
      setHistoryError(`Could not load ETL history: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchEtlData();
  }, []);

  const handleFile = async (file) => {
    if (!isPrincipal || !file || isSyncing) return;
    setIsReadingWorkbook(true);
    setSyncFeedback(null);
    try {
      const preview = await parseRosterWorkbook(file);
      setImportPreview(preview);
      setSelectedFileName(file.name);
      setSyncFeedback({
        type: 'info',
        message: preview.rejected.length
          ? 'Review the validation errors. The all-or-nothing import will reject the entire workbook if you continue.'
          : 'Workbook passed local validation. Run the server-side duplicate checks before importing.',
      });
    } catch (e) {
      setImportPreview(null);
      setSelectedFileName(file.name);
      setSyncFeedback({ type: 'error', message: e.message || 'Could not read the selected workbook.' });
    } finally {
      setIsReadingWorkbook(false);
    }
  };

  const handleSync = async () => {
    if (!isPrincipal || !importPreview || importPreview.totalRows === 0) return;
    const confirmation = [
      'Use this workbook as the complete current-enrollment roster?',
      `Students: ${importPreview.students.length}; staff for review: ${importPreview.staff.length}; rows already rejected: ${importPreview.rejected.length}.`,
      'Existing students with the same LRN will be updated to the current name, grade, section, and academic year. Active students missing from this complete roster will be marked inactive; records and case history will not be deleted.',
      'Any invalid or duplicate row rejects the entire workbook. Staff entries are staged for review only; no Auth account, role, or section assignment will be created.',
    ].join('\n\n');
    if (!window.confirm(confirmation)) return;

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke('append-roster', {
        body: {
          sourceFile: selectedFileName,
          students: importPreview.students,
          staff: importPreview.staff,
          rejected: importPreview.rejected,
        },
      });
      if (error) throw new Error(error.message || 'The roster import request failed.');

      if (data?.success) {
        setSyncFeedback({
          type: 'success',
          message: `Roster sync complete: ${data.students_inserted} students added, ${data.students_updated} updated, ${data.students_deactivated} marked inactive, and ${data.staff_inserted} new staff entries staged for review. No records were deleted.`,
        });
        setImportPreview(null);
        window.dispatchEvent(new Event('hayagsync:roster-updated'));
        await fetchEtlData();
      } else {
        setSyncFeedback({
          type: 'error',
          message: data?.message || `The workbook was rejected. ${data?.rejected_count || 0} issue(s) were logged; no roster rows were changed.`,
        });
        await fetchEtlData();
      }
    } catch (error) {
      setSyncFeedback({
        type: 'error',
        message: error.message || 'Could not complete the roster sync. No partial data should be committed.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-blue-900 dark:text-blue-400" />
            <span>Staff &amp; Student Roster Sync</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Sync staff and currently enrolled students from the complete official roster. Existing records and case history are retained.
          </p>
        </div>

      </div>

      <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current enrollment roster sync</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select an .xlsx workbook with <strong>Students</strong> and <strong>Staff</strong> sheets. Use a complete current roster, not a partial list. Sync is atomic: any invalid or duplicate row rejects the entire workbook.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Required columns — Students: LRN, Name, Grade, Section, Academic Year (one academic year per workbook). Staff: Name, Email, Role. Optional: Assigned Section. Keep LRN values as text in Excel. Staff rows are for manual review only.
          </p>
        </div>
        {!isPrincipal ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Only an active Principal account can upload and sync roster workbooks. You can still view ETL history and review data.
          </div>
        ) : (
          <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={isReadingWorkbook || isSyncing}
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingFile(false);
            handleFile(event.dataTransfer.files?.[0]);
          }}
          disabled={isReadingWorkbook || isSyncing}
          className={`w-full rounded-2xl border-2 border-dashed p-5 text-left transition sm:p-6 ${
            isDraggingFile
              ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-950'
              : selectedFileName
                ? 'border-emerald-400 bg-emerald-50/70 hover:border-blue-500 dark:border-emerald-800 dark:bg-emerald-950/20'
                : 'border-slate-300 bg-slate-50/70 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950/30 dark:hover:bg-blue-950/20'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className="flex items-center gap-4">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
              selectedFileName
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            }`}>
              {isReadingWorkbook
                ? <Loader2 className="h-7 w-7 animate-spin" />
                : selectedFileName
                  ? <FileSpreadsheet className="h-7 w-7" />
                  : <UploadCloud className="h-7 w-7" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-slate-900 dark:text-white">
                {isReadingWorkbook
                  ? 'Reading workbook…'
                  : selectedFileName
                    ? 'Workbook selected'
                    : isDraggingFile
                      ? 'Drop the Excel workbook here'
                      : 'Drop your Excel workbook here'}
              </span>
              {selectedFileName ? (
                <>
                  <span className="mt-1 block truncate text-sm font-semibold text-emerald-800 dark:text-emerald-200" title={selectedFileName}>
                    {selectedFileName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                    Click here to choose a different file
                  </span>
                </>
              ) : (
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                  or <span className="font-bold text-blue-800 underline underline-offset-2 dark:text-blue-300">browse files</span>
                </span>
              )}
              <span className="mt-2 block text-xs text-slate-500">
                .xlsx up to 10 MB · synced payload up to 4 MB and 5,000 rows
              </span>
            </span>
            {selectedFileName && !isReadingWorkbook && (
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 sm:inline-flex">
                <CheckCircle2 className="h-4 w-4" />
                Loaded
              </span>
            )}
          </span>
        </button>
        {syncFeedback && (
          <div className={`rounded-lg border p-3 text-sm ${
            syncFeedback.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
              : syncFeedback.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
          }`}>
            {syncFeedback.message}
          </div>
        )}
        {importPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3"><span className="block text-xs text-slate-500">Rows read</span><strong>{importPreview.totalRows}</strong></div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3"><span className="block text-xs text-slate-500">Valid students</span><strong>{importPreview.students.length}</strong></div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3"><span className="block text-xs text-slate-500">Valid staff</span><strong>{importPreview.staff.length}</strong></div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3"><span className="block text-xs text-slate-500">Rejected rows</span><strong>{importPreview.rejected.length}</strong></div>
            </div>
            <p className="text-xs text-slate-500">
              A successful sync updates existing students by LRN, adds newly enrolled students, and marks omitted active students inactive. It never deletes student or case records. Staff rows are staged for manual review only.
            </p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="p-3 text-sm font-bold text-slate-800 dark:text-slate-200">Student preview (first 5)</h3>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr><th className="p-2">LRN</th><th className="p-2">Name</th><th className="p-2">Grade / Section</th><th className="p-2">Academic Year</th></tr>
                  </thead>
                  <tbody>
                    {importPreview.students.slice(0, 5).map((student) => (
                      <tr key={student.lrn} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2 font-mono">••••{student.lrn.slice(-4)}</td>
                        <td className="p-2">{student.name}</td>
                        <td className="p-2">{student.grade} / {student.section}</td>
                        <td className="p-2">{student.academic_year}</td>
                      </tr>
                    ))}
                    {importPreview.students.length === 0 && (
                      <tr><td colSpan={4} className="p-3 text-slate-500">No valid student rows.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="p-3 text-sm font-bold text-slate-800 dark:text-slate-200">Staff preview (first 5)</h3>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Assigned Section</th></tr>
                  </thead>
                  <tbody>
                    {importPreview.staff.slice(0, 5).map((staff) => (
                      <tr key={staff.email} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2">{staff.name}</td>
                        <td className="p-2">{staff.email}</td>
                        <td className="p-2">{staff.role}</td>
                        <td className="p-2">{staff.assigned_section || '—'}</td>
                      </tr>
                    ))}
                    {importPreview.staff.length === 0 && (
                      <tr><td colSpan={4} className="p-3 text-slate-500">No valid staff rows.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {importPreview.rejected.length > 0 && (
              <div className="max-h-56 overflow-auto rounded-lg border border-rose-200 dark:border-rose-900">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-rose-50 dark:bg-rose-950/70">
                    <tr><th className="p-2">Sheet / row</th><th className="p-2">Identifier</th><th className="p-2">Reason</th></tr>
                  </thead>
                  <tbody>
                    {importPreview.rejected.slice(0, 100).map((row) => (
                      <tr key={`${row.sheet}-${row.rowNumber}`} className="border-t border-rose-100 dark:border-rose-900">
                        <td className="p-2">{row.sheet} / {row.rowNumber}</td>
                        <td className="p-2 font-mono">{row.identifier}</td>
                        <td className="p-2">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.rejected.length > 100 && (
                  <p className="p-2 text-xs text-slate-500">Showing the first 100 rejected rows.</p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || isReadingWorkbook || importPreview.totalRows === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isSyncing ? 'Syncing current roster…' : 'Sync current roster'}
            </button>
          </div>
        )}
          </>
        )}
      </section>

      {historyError && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200 text-sm">
          <AlertTriangle className="inline w-4 h-4 mr-2" />{historyError}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Recent Pipeline Runs</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{etlRuns.length}</p>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Latest 20 runs</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Last Run Status</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {etlRuns[0]?.status || 'IDLE'}
          </p>
          <span className="text-xs text-slate-500">
            {etlRuns[0]?.started_at ? new Date(etlRuns[0].started_at).toLocaleTimeString() : 'Never'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Recent Rejected Rows</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{rejectedRecords.length}</p>
          <span className="text-xs text-amber-600 font-semibold">Latest 30 rows</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Pipeline Mode</span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">Current roster</p>
          <span className="text-xs text-slate-500">Atomic; inactive records are retained</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('runs')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
            activeTab === 'runs'
              ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ETL Run Logs ({etlRuns.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
            activeTab === 'rejected'
              ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rejected Records Report ({rejectedRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Staff Review ({pendingStaff.length})
        </button>
      </div>

      {/* Tab 1: ETL Runs Table */}
      {activeTab === 'runs' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Run ID / Batch</th>
                  <th className="py-3 px-4">Source file</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Processed</th>
                  <th className="py-3 px-4">Students added</th>
                  <th className="py-3 px-4">Students updated</th>
                  <th className="py-3 px-4">Students inactive</th>
                  <th className="py-3 px-4">Staff staged</th>
                  <th className="py-3 px-4">Rejected</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {etlRuns.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500 italic">
                      No ETL runs are available. Completed and rejected imports appear here.
                    </td>
                  </tr>
                ) : (
                  etlRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900 dark:text-blue-400">
                        #{r.id} <span className="text-xs text-slate-500 font-normal">({r.batch_id?.substring(0, 8)})</span>
                      </td>
                      <td className="py-3 px-4 font-medium">{r.source_file || 'Excel workbook'}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(r.started_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {r.ended_at ? `${Math.max(1, Math.round((new Date(r.ended_at) - new Date(r.started_at)) / 1000))}s` : 'In progress'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {r.details?.rows_received ??
                          ((r.details?.students_received ?? r.students_inserted) +
                            (r.details?.staff_received ?? r.staff_inserted))}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">+{r.students_inserted}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{r.students_updated || 0}</td>
                      <td className="py-3 px-4 font-semibold text-amber-600">{r.students_deactivated || 0}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{r.staff_inserted}</td>
                      <td className="py-3 px-4 font-semibold text-rose-600">{r.rejected_count}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            r.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : r.status === 'completed_with_errors'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rejected Records Inspector */}
      {activeTab === 'rejected' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Sheet / row</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Validation failure</th>
                  <th className="py-3 px-4">Source file</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rejectedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No rejected rows have been recorded.
                    </td>
                  </tr>
                ) : (
                  rejectedRecords.map((rej) => (
                    <tr key={rej.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                      <td className="py-3 px-4 font-mono text-xs">#{rej.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {rej.sheet} / {rej.row_number || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {rej.identifier || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-medium">
                        {rej.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {rej.etl_runs?.source_file || 'Unknown'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-6">
          <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white">Staff entries awaiting manual provisioning</h2>
              <p className="mt-1 text-xs text-slate-500">
                Import never creates Supabase Auth users, grants roles, or assigns sections.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Requested role</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {pendingStaff.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">No staff entries awaiting review.</td></tr>
                  ) : pendingStaff.map((staff) => (
                    <tr key={staff.id}>
                      <td className="py-3 px-4">{staff.full_name}</td>
                      <td className="py-3 px-4">{staff.email}</td>
                      <td className="py-3 px-4">{staff.requested_role}</td>
                      <td className="py-3 px-4">{staff.assigned_section || '—'}</td>
                      <td className="py-3 px-4">{staff.review_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
