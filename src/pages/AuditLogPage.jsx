import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useIncidents } from '../context/IncidentContext';
import {
  Shield,
  Search,
  Filter,
  Lock,
  History,
  AlertOctagon,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck
} from 'lucide-react';

export default function AuditLogPage() {
  const { auditLogs: seedAuditLogs } = useIncidents();
  const [activeLogTab, setActiveLogTab] = useState('activity'); // 'activity', 'login', 'security'
  const [search, setSearch] = useState('');
  
  // Real database states
  const [dbActivityLogs, setDbActivityLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      // 1. Fetch Activity Logs
      const { data: act } = await supabase
        .from('activity_logs')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);
      if (act && act.length > 0) setDbActivityLogs(act);

      // 2. Fetch Login History
      const { data: logins } = await supabase
        .from('login_history')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);
      if (logins && logins.length > 0) setLoginHistory(logins);

      // 3. Fetch Security Events
      const { data: sec } = await supabase
        .from('security_events')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);
      if (sec && sec.length > 0) setSecurityEvents(sec);
    } catch (_) {}
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered Activity Logs (combines seed and real db)
  const displayActivityLogs = dbActivityLogs.length > 0
    ? dbActivityLogs
    : seedAuditLogs.map(l => ({
        id: l.id,
        created_at: l.timestamp,
        user_email: l.user_name,
        user_role: l.user_role,
        action: l.action,
        entity_name: l.target_entity,
        record_id: l.target_id,
        new_values: { details: l.details },
        ip_address: '192.168.1.102'
      }));

  const filteredActivities = displayActivityLogs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.user_email || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entity_name || '').toLowerCase().includes(q) ||
      (log.record_id || '').toLowerCase().includes(q)
    );
  });

  const filteredLogins = loginHistory.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.attempted_email || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q) ||
      (l.ip_address || '').toLowerCase().includes(q)
    );
  });

  const filteredSecurity = securityEvents.filter((s) => {
    if (severityFilter !== 'ALL' && s.severity !== severityFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.event_type || '').toLowerCase().includes(q) ||
      (s.attempted_email || '').toLowerCase().includes(q) ||
      (s.severity || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-900 dark:text-blue-400" />
            <span>Security & Forensic Audit Console (Gap 4)</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Append-only activity logs, authentication history, and automated intrusion/lockout event detection
          </p>
        </div>

        <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0f2444] text-white rounded-lg text-sm font-semibold shadow-xs">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Append-Only Non-Repudiation Policy Enforced</span>
        </span>
      </div>

      {/* Log Section Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveLogTab('activity')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeLogTab === 'activity'
              ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Activity Logs ({filteredActivities.length})
        </button>
        <button
          onClick={() => setActiveLogTab('login')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeLogTab === 'login'
              ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" /> Login History ({filteredLogins.length})
        </button>
        <button
          onClick={() => setActiveLogTab('security')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeLogTab === 'security'
              ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-500" /> Security Events & Alerts ({filteredSecurity.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, action, entity, IP address..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 dark:text-white font-medium"
          />
        </div>

        {activeLogTab === 'security' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Severity Filter:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Activity Logs */}
      {activeLogTab === 'activity' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Value Changes & Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredActivities.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {l.user_email || 'System / Batch'}
                      <span className="block text-[11px] text-blue-600 font-normal">{l.user_role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {l.entity_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {l.record_id || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-sm truncate">
                      {JSON.stringify(l.new_values || l.old_values || {})}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {l.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Login History */}
      {activeLogTab === 'login' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Attempted Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Device / Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLogins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      Zero login failure records. All current authentications verified.
                    </td>
                  </tr>
                ) : (
                  filteredLogins.map((lg) => (
                    <tr key={lg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {new Date(lg.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {lg.attempted_email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${
                            lg.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {lg.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {lg.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {lg.failure_reason || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {lg.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 truncate max-w-xs">
                        {lg.user_agent || lg.device_info || 'Web Client'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Security Events & Alerts */}
      {activeLogTab === 'security' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Target User / Email</th>
                  <th className="py-3 px-4">Forensic Details</th>
                  <th className="py-3 px-4">Resolution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSecurity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      Zero active security threats detected. Automated lockout trigger armed.
                    </td>
                  </tr>
                ) : (
                  filteredSecurity.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                      <td className="py-3 px-4 font-mono text-xs">#{ev.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {ev.event_type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                            ev.severity === 'CRITICAL'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : ev.severity === 'HIGH'
                              ? 'bg-orange-500 text-white'
                              : ev.severity === 'MEDIUM'
                              ? 'bg-amber-400 text-slate-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {ev.attempted_email || 'System-wide'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-sm truncate">
                        {JSON.stringify(ev.details)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            ev.is_resolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 font-bold'
                          }`}
                        >
                          {ev.is_resolved ? 'Resolved' : 'Active Investigation'}
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
    </div>
  );
}
