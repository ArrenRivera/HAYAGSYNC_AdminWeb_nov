import React, { useState, useMemo } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import OffenseDistributionChart from '../components/charts/OffenseDistributionChart';
import CaseAnalysisPanel from '../components/charts/CaseAnalysisPanel';
import {
  Clock,
  AlertTriangle,
  Scale,
  UserX,
  Hammer,
  ArrowRight,
  Shield,
  Eye,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  ExternalLink,
  GraduationCap,
  Building2,
  Send,
  Gavel
} from 'lucide-react';

export default function DashboardPage({
  onSelectIncident,
  onViewStudent,
  onNavigateTab,
}) {
  const { incidents, students, appeals, communityServices, isRepeatOffender } = useIncidents();
  const { currentUser, isOSD, isMinistro, isPrincipal, isJhsPrincipal, isShsPrincipal, isAdviser, isBoard, isPresident } = useAuth();
  const [analyticsYear, setAnalyticsYear] = useState(() => String(new Date().getFullYear()));
  const [analyticsMonth, setAnalyticsMonth] = useState('ALL');

  const userSection = currentUser?.assigned_section || '';
  const analyticsYears = useMemo(() => {
    const years = new Set([analyticsYear]);
    incidents.forEach((incident) => {
      const match = String(incident.incident_date || '').match(/^(\d{4})-\d{2}/);
      if (match) years.add(match[1]);
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [incidents, analyticsYear]);
  const analyticsIncidents = useMemo(
    () => incidents.filter((incident) => {
      const date = String(incident.incident_date || '');
      return date.startsWith(`${analyticsYear}-`) &&
        (analyticsMonth === 'ALL' || date.slice(5, 7) === analyticsMonth);
    }),
    [incidents, analyticsMonth, analyticsYear]
  );
  const isJHS = isJhsPrincipal || (isPrincipal && ((currentUser?.email || '').includes('jhs') || userSection.includes('7-10')));
  const isSHS = isShsPrincipal || (isPrincipal && ((currentUser?.email || '').includes('shs') || userSection.includes('11-12')));

  // Role-specific case queues
  const osdPriorityCases = useMemo(() => {
    return incidents.filter(
      (i) =>
        i.severity === 'High' ||
        i.severity === 'Critical' ||
        i.is_high_priority ||
        i.status === 'Escalated to OSD'
    );
  }, [incidents]);

  const ministroEscalatedCases = useMemo(() => {
    return incidents.filter(
      (i) =>
        i.stageNumber === 2 ||
        (i.status || '').toLowerCase().includes('initial intervention') ||
        i.status === 'Forwarded for Initial Intervention' ||
        i.status === 'Escalated to Ministrong Tagasubaybay' ||
        (i.escalated_to && i.escalated_to.toLowerCase().includes('ministro'))
    );
  }, [incidents]);

  const boardReferredCases = useMemo(() => {
    return incidents.filter(
      (i) =>
        i.stageNumber === 4 ||
        i.board_referred ||
        i.status === 'Escalated to Board of Discipline' ||
        i.status === 'Referred to Board of Discipline' ||
        Boolean(i.hearing_notes)
    );
  }, [incidents]);

  // All Stage 2 Joint Intervention cases campus-wide forwarded by OSD
  const allStage2InterventionCases = useMemo(() => {
    return incidents.filter(
      (i) =>
        i.stageNumber === 2 ||
        (i.status || '').toLowerCase().includes('initial intervention') ||
        i.status === 'Forwarded for Initial Intervention' ||
        (i.currentHandlingOffice || '').toLowerCase().includes('adviser')
    );
  }, [incidents]);

  // Section Adviser case queues
  const adviserSectionCases = useMemo(() => {
    if (!isAdviser) return [];
    if (!userSection) return incidents;
    const target = userSection.toLowerCase();
    const gradeMatch = userSection.match(/grade\s*(\d+)/i);
    const userGrade = gradeMatch ? gradeMatch[0].toLowerCase() : '';

    return incidents.filter((i) => {
      const sec = (i.student_section || i.section || '').toLowerCase();
      const bullySec = (i.bully_grade_section || '').toLowerCase();
      const incGrade = (i.student_grade || i.grade || '').toLowerCase();

      const exactSecMatch = sec.includes(target) || target.includes(sec) || bullySec.includes(target);
      const isUnassignedGradeMatch = userGrade && (incGrade.includes(userGrade) || sec.includes(userGrade)) && (
        sec.includes('to be determined') || sec.includes('unassigned') || sec.includes('unknown') || !sec
      );

      return exactSecMatch || isUnassignedGradeMatch;
    });
  }, [incidents, isAdviser, userSection]);

  const adviserStage2Cases = useMemo(() => {
    // Show all Stage 2 cases forwarded by OSD, prioritizing the adviser's own section first
    const mySectionList = adviserSectionCases.filter(
      (i) => i.stageNumber === 2 || (i.status || '').toLowerCase().includes('initial intervention')
    );
    const otherList = allStage2InterventionCases.filter(
      (i) => !mySectionList.some((m) => m.id === i.id)
    );
    return [...mySectionList, ...otherList];
  }, [adviserSectionCases, allStage2InterventionCases]);

  // Principal jurisdiction case queues (JHS: Grades 7-10, SHS: Grades 11-12)
  const principalJurisdictionCases = useMemo(() => {
    if (!isPrincipal) return [];
    return incidents.filter((i) => {
      const grade = (i.student_grade || i.grade || '').toLowerCase();
      const sec = (i.student_section || i.section || '').toLowerCase();
      if (isJHS) {
        return /grade\s*(7|8|9|10)\b/i.test(grade) || /grade\s*(7|8|9|10)\b/i.test(sec);
      }
      if (isSHS) {
        return /grade\s*(11|12)\b/i.test(grade) || /grade\s*(11|12)\b/i.test(sec);
      }
      return true;
    });
  }, [incidents, isPrincipal, isJHS, isSHS]);

  const principalStage3Cases = useMemo(() => {
    return principalJurisdictionCases.filter(
      (i) => i.stageNumber === 3 || (i.status || '').toLowerCase().includes('osd and principal')
    );
  }, [principalJurisdictionCases]);

  // Status counts for the 5-Stage multi-level workflow + Resolved
  const stage1Count = incidents.filter((i) => i.stageNumber === 1 && (i.status || '').toLowerCase() !== 'resolved').length;
  const stage2Count = incidents.filter((i) => i.stageNumber === 2 && (i.status || '').toLowerCase() !== 'resolved').length;
  const stage3Count = incidents.filter((i) => i.stageNumber === 3 && (i.status || '').toLowerCase() !== 'resolved').length;
  const stage4Count = incidents.filter((i) => i.stageNumber === 4 && (i.status || '').toLowerCase() !== 'resolved').length;
  const stage5Count = incidents.filter((i) => i.stageNumber === 5 && (i.status || '').toLowerCase() !== 'resolved').length;
  const resolvedCount = incidents.filter((i) => (i.status || '').toLowerCase() === 'resolved').length;
  const anonymousCount = incidents.filter((i) => i.is_anonymous).length;

  // Other Cases Section State
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('ALL');
  const [caseGradeFilter, setCaseGradeFilter] = useState('ALL');
  const [caseSeverityFilter, setCaseSeverityFilter] = useState('ALL');
  const [caseAnonymousFilter, setCaseAnonymousFilter] = useState('ALL');
  const [caseCurrentPage, setCaseCurrentPage] = useState(1);
  const caseItemsPerPage = 10;

  // The 6 Stage & Status Progress Cards:
  const statusCards = [
    {
      id: 'Stage 1',
      label: 'Stage 1: OSD Assessment',
      count: stage1Count,
      description: 'Awaiting OSD initial assessment and referral',
      borderClass: 'border-blue-600',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100',
      badgeClass: 'bg-blue-600 text-white',
      icon: Clock,
      statusKey: 'Recent Report',
    },
    {
      id: 'Stage 2',
      label: 'Stage 2: Joint Intervention',
      count: stage2Count,
      description: 'Handled by Ministrong Tagasubaybay & Section Adviser',
      borderClass: 'border-teal-600',
      bgClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100',
      badgeClass: 'bg-teal-600 text-white',
      icon: Shield,
      statusKey: 'Forwarded for Initial Intervention',
    },
    {
      id: 'Stage 3',
      label: 'Stage 3: OSD & Principal',
      count: stage3Count,
      description: 'Second-level intervention & discipline review',
      borderClass: 'border-amber-600',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100',
      badgeClass: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      statusKey: 'Escalated to OSD and Principal',
    },
    {
      id: 'Stage 4',
      label: 'Stage 4: Board Deliberation',
      count: stage4Count,
      description: 'Institutional Board of Discipline hearing & sanction',
      borderClass: 'border-purple-600',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100',
      badgeClass: 'bg-purple-600 text-white',
      icon: Scale,
      statusKey: 'Escalated to Board of Discipline',
    },
    {
      id: 'Stage 5',
      label: 'Stage 5: President Review',
      count: stage5Count,
      description: 'Sanction determined, awaiting President affirmation',
      borderClass: 'border-indigo-600',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100',
      badgeClass: 'bg-indigo-600 text-white',
      icon: CheckCircle2,
      statusKey: 'Forwarded to School President',
    },
    {
      id: 'Resolved',
      label: 'Resolved & Finalized',
      count: resolvedCount,
      description: 'Disciplinary proceedings completed & finalized',
      borderClass: 'border-emerald-600',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100',
      badgeClass: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
      statusKey: 'Resolved',
    },
  ];

  // Needs Attention items:
  const needsAttentionList = [
    ...appeals
      .filter((a) => a.status === 'Pending' || a.status === 'Under Review')
      .map((a) => ({
        id: a.id,
        type: 'Appeal Review',
        title: `Appeal filed for Case #${a.case_number}`,
        subtitle: `Reason: "${a.reason || a.reason_for_appeal}"`,
        urgency: 'High Priority',
        urgencyClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
        actionLabel: 'Review Appeal',
        tabTarget: 'appeals',
      })),
    ...students
      .filter((s) => isRepeatOffender(s.id))
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        type: 'Repeat Offender',
        title: `Student Flag: ${s.name} (${s.section})`,
        subtitle: `Multiple recorded disciplinary incidents. Escalated counseling required.`,
        urgency: 'Action Needed',
        urgencyClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
        actionLabel: 'View Record',
        studentId: s.id,
      })),
    ...incidents
      .filter((i) => i.status === 'Recent Report' && (i.severity === 'High' || i.severity === 'Critical'))
      .slice(0, 3)
      .map((i) => ({
        id: i.id,
        type: 'Severe Incident',
        title: `High Severity: ${i.title}`,
        subtitle: `Student: ${i.student_name} (${i.section || i.student_section}) • Filed on ${new Date(i.incident_date).toLocaleDateString()}`,
        urgency: 'Urgent Intake',
        urgencyClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
        actionLabel: 'Open Case',
        incidentObj: i,
      })),
  ];

  // Filtered Other Cases for Table
  const filteredOtherCases = useMemo(() => {
    return incidents.filter((inc) => {
      if (caseSearch.trim()) {
        const q = caseSearch.toLowerCase();
        const matchesName = (inc.student_name || '').toLowerCase().includes(q);
        const matchesCase = (inc.case_number || '').toLowerCase().includes(q);
        const matchesTitle = (inc.title || '').toLowerCase().includes(q);
        const matchesLRN = (inc.student_lrn || '').includes(q);
        const matchesSection = (inc.section || inc.student_section || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCase && !matchesTitle && !matchesLRN && !matchesSection) return false;
      }

      if (caseStatusFilter !== 'ALL' && inc.status !== caseStatusFilter) return false;
      if (caseGradeFilter !== 'ALL' && (inc.grade || inc.student_grade) !== caseGradeFilter) return false;
      if (caseSeverityFilter !== 'ALL' && inc.severity !== caseSeverityFilter) return false;
      if (caseAnonymousFilter === 'ANONYMOUS' && !inc.is_anonymous) return false;
      if (caseAnonymousFilter === 'REGISTERED' && inc.is_anonymous) return false;

      return true;
    });
  }, [incidents, caseSearch, caseStatusFilter, caseGradeFilter, caseSeverityFilter, caseAnonymousFilter]);

  // Paginated Other Cases
  const totalCasePages = Math.ceil(filteredOtherCases.length / caseItemsPerPage) || 1;
  const paginatedOtherCases = useMemo(() => {
    const start = (caseCurrentPage - 1) * caseItemsPerPage;
    return filteredOtherCases.slice(start, start + caseItemsPerPage);
  }, [filteredOtherCases, caseCurrentPage, caseItemsPerPage]);

  return (
    <div className="space-y-8 pb-10">
      {/* Institutional Welcome Card */}
      <div className="p-6 sm:p-7 rounded-xl bg-[#0f2444] text-white border border-[#1b365d] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-blue-900 text-blue-200 border border-blue-700">
            Official Disciplinary Console • School Year 2026–2027
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2.5 text-white">
            Overview Dashboard
          </h1>
          <p className="text-base text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
            Welcome, <strong>{currentUser?.name}</strong>. Access is restricted under the Philippine Data Privacy Act (RA 10173) and DepEd Child Protection Policy (D.O. 40, s. 2012). Total system incidents tracked: <strong>{incidents.length}</strong> cases across all 13 active sections.
          </p>
        </div>
      </div>

      {/* OSD: High-Priority Cases Section */}
      {isOSD && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-rose-900 to-[#0f2444] text-white shadow-md border border-rose-700/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  High-Priority Disciplinary Cases (Agad na Aksyon / Priority Review)
                </h3>
                <p className="text-sm text-rose-200">
                  Critical, severe, or escalated reports requiring immediate OSD intervention and investigation
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/30 border border-rose-400 text-rose-100">
              {osdPriorityCases.length} Critical Action(s)
            </span>
          </div>

          {osdPriorityCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {osdPriorityCases.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/30 hover:border-rose-400 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold bg-rose-950 px-2 py-0.5 rounded text-rose-300 border border-rose-800">
                        {c.case_number}
                      </span>
                      <SeverityBadge severity={c.severity} />
                    </div>
                    <h4 className="font-bold text-white text-base line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Student: <strong>{c.student_name}</strong> ({c.section || c.student_section})
                    </p>
                    <p className="text-xs text-rose-200 mt-1 line-clamp-2">
                      {(c.status || '').includes('Escalat') ? `Status: ${c.status}` : c.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.incident_date).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectIncident(c)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Immediate Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-rose-200/80 italic">No pending severe or escalated cases requiring immediate action.</p>
          )}
        </div>
      )}

      {/* Ministrong Tagasubaybay: Stage 2 Joint Intervention Cases */}
      {isMinistro && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-teal-900 to-[#0f2444] text-white shadow-md border border-teal-700/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-teal-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  Stage 2: Joint Intervention Cases (Ministrong Tagasubaybay & Section Adviser)
                </h3>
                <p className="text-sm text-teal-200">
                  Cases referred by OSD for initial joint investigation, student counseling, and collaborative intervention
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/30 border border-teal-400 text-teal-100">
              {ministroEscalatedCases.length} Active in Stage 2
            </span>
          </div>

          {ministroEscalatedCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ministroEscalatedCases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-teal-500/30 hover:border-teal-400 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold bg-teal-950 px-2 py-0.5 rounded text-teal-300 border border-teal-800">
                        {c.case_number}
                      </span>
                      <span className="text-xs font-bold text-teal-300">
                        {c.status || 'Stage 2 Joint Intervention'}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-base line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Student: <strong>{c.student_name}</strong> ({c.section || c.student_section})
                    </p>
                    {c.discipline_notes && (
                      <p className="text-xs text-teal-200 mt-1 line-clamp-2">
                        OSD Notes: {c.discipline_notes}
                      </p>
                    )}
                    {c.escalation_reason && (
                      <p className="text-xs text-amber-200 mt-1 line-clamp-2">
                        Reason: {c.escalation_reason}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-teal-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.incident_date).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectIncident(c)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Handle Joint Intervention</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-teal-200/80 italic">No new cases in Stage 2 joint intervention at this time.</p>
          )}
        </div>
      )}

      {/* Section Adviser: Dedicated Advisory Class Docket & Stage 2 Joint Interventions */}
      {isAdviser && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-teal-950 via-slate-900 to-[#0f2444] text-white shadow-md border border-teal-600/50 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-500/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    Advisory Class Disciplinary Docket
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-teal-500/30 border border-teal-400 text-teal-200">
                    {userSection || 'Assigned Advisory Section'}
                  </span>
                </div>
                <p className="text-sm text-teal-200">
                  Adviser: <strong>{currentUser?.name}</strong> • Stage 2 joint investigation & restorative intervention with Ministrong Tagasubaybay
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/30 border border-teal-400 text-teal-100">
                {adviserStage2Cases.length} Stage 2 Joint Case(s)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                {adviserSectionCases.length} Total Section Incidents
              </span>
            </div>
          </div>

          {adviserStage2Cases.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2.5">
                Active Cases Awaiting Joint Intervention (Stage 2)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {adviserStage2Cases.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-teal-500/40 hover:border-teal-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold bg-teal-950 px-2 py-0.5 rounded text-teal-300 border border-teal-800">
                          {c.case_number}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mb-2">
                        {(c.section || c.student_section || '').toLowerCase().includes(userSection.toLowerCase()) ? (
                          <span className="inline-block text-[10px] font-black bg-emerald-500/30 text-emerald-200 border border-emerald-400 px-2 py-0.5 rounded">
                            YOUR ADVISORY SECTION • ACTION REQUIRED
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold bg-teal-900/80 text-teal-200 border border-teal-700 px-2 py-0.5 rounded">
                            CAMPUS FORWARDED INTERVENTION
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Student: <strong>{c.student_name}</strong> ({c.section || c.student_section})
                      </p>
                      {c.bully_name && (
                        <p className="text-xs text-rose-300 mt-0.5">
                          Alleged Offender: <strong>{c.bully_name}</strong> ({c.bully_grade_section || 'N/A'})
                        </p>
                      )}
                      <p className="text-xs text-teal-200 mt-1.5 line-clamp-2">
                        {c.discipline_notes || c.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-teal-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {new Date(c.incident_date).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectIncident(c)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Handle Intervention</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-teal-500/20 text-center">
              <p className="text-sm text-teal-200 font-medium">
                No pending Stage 2 joint intervention cases for {userSection}. All advisory cases are resolved or at other workflow stages.
              </p>
            </div>
          )}
        </div>
      )}

      {/* School Principal: Dedicated Jurisdictional Oversight Docket & Stage 3 Joint Interventions */}
      {isPrincipal && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-[#0f2444] text-white shadow-md border border-indigo-600/50 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-500/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    Principal's Disciplinary Oversight Docket
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-indigo-500/30 border border-indigo-400 text-indigo-200">
                    {isJHS ? 'Junior High School (Grades 7–10)' : isSHS ? 'Senior High School (Grades 11–12)' : 'All Departments'}
                  </span>
                </div>
                <p className="text-sm text-indigo-200">
                  Principal: <strong>{currentUser?.name}</strong> • Stage 3 joint disciplinary action and sanction determination with OSD
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/30 border border-indigo-400 text-indigo-100">
                {principalStage3Cases.length} Stage 3 Joint Review(s)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                {principalJurisdictionCases.length} Total Incidents in Jurisdiction
              </span>
            </div>
          </div>

          {principalStage3Cases.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2.5">
                Escalated Cases Awaiting Joint Principal & OSD Resolution (Stage 3)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {principalStage3Cases.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/40 hover:border-indigo-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 border border-indigo-800">
                          {c.case_number}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <h4 className="font-bold text-white text-base line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Student: <strong>{c.student_name}</strong> ({c.section || c.student_section})
                      </p>
                      {c.escalation_reason && (
                        <p className="text-xs text-amber-300 mt-1 font-medium line-clamp-2">
                          Escalation: {c.escalation_reason}
                        </p>
                      )}
                      <p className="text-xs text-indigo-200 mt-1.5 line-clamp-2">
                        {c.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-indigo-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {new Date(c.incident_date).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectIncident(c)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Review & Decide Sanction</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-indigo-500/20 text-center">
              <p className="text-sm text-indigo-200 font-medium">
                No pending Stage 3 cases requiring joint Principal & OSD review within your grade jurisdiction at this time.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Board of Discipline: Cases Referred for Deliberation & Hearings */}
      {isBoard && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-purple-950 to-[#0f2444] text-white shadow-md border border-purple-700/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                <Scale className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  Cases Referred for Board Deliberation & Formal Hearings
                </h3>
                <p className="text-sm text-purple-200">
                  Cases referred by OSD for institutional hearings, witness deliberations, and formal sanction decisions
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/30 border border-purple-400 text-purple-100">
              {boardReferredCases.length} Deliberation Docket(s)
            </span>
          </div>

          {boardReferredCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {boardReferredCases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/30 hover:border-purple-400 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold bg-purple-950 px-2 py-0.5 rounded text-purple-300 border border-purple-800">
                        {c.case_number}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <h4 className="font-bold text-white text-base line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Student: <strong>{c.student_name}</strong> ({c.section || c.student_section})
                    </p>
                    {c.hearing_notes && (
                      <p className="text-xs text-purple-200 mt-1 line-clamp-2">
                        Notes: {c.hearing_notes}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.incident_date).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectIncident(c)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Deliberate & Record</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-purple-200/80 italic">No disciplinary cases currently referred for Board hearing.</p>
          )}
        </div>
      )}

      {/* Five Large Status Cards (Recent, Ongoing, Appealed, Expelled, Community Service) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Incident Records by Current Status
          </h2>
          <span className="text-sm font-semibold text-slate-500">
            Click any card to view records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigateTab('incidents', card.statusKey)}
                className={`p-5 rounded-xl border-t-4 ${card.borderClass} ${card.bgClass} border-x border-b border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer focus:outline-none`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {card.label}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-900/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <CardIcon className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>

                  <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    {card.count}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300 group-hover:underline">
                  <span>View Filtered List</span>
                  <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Simple Bar Chart & Needs Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simple Analytics Chart (7 Columns) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Case Analytics
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Trend shows the selected year; category counts follow the selected month
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Year
                <select
                  value={analyticsYear}
                  onChange={(event) => setAnalyticsYear(event.target.value)}
                  className="block mt-1 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {analyticsYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Month
                <select
                  value={analyticsMonth}
                  onChange={(event) => setAnalyticsMonth(event.target.value)}
                  className="block mt-1 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ALL">All months</option>
                  {Array.from({ length: 12 }, (_, index) => {
                    const month = String(index + 1).padStart(2, '0');
                    const label = new Date(2000, index, 1).toLocaleDateString('en-US', { month: 'long' });
                    return <option key={month} value={month}>{label}</option>;
                  })}
                </select>
              </label>
              <span className="text-xs font-bold px-2.5 py-2 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                {analyticsIncidents.length} cases in period
              </span>
            </div>
          </div>

          <MonthlyTrendChart
            incidents={incidents.filter((incident) => String(incident.incident_date || '').startsWith(`${analyticsYear}-`))}
            year={analyticsYear}
            selectedMonth={analyticsMonth}
            onSelectMonth={setAnalyticsMonth}
          />
          <OffenseDistributionChart incidents={analyticsIncidents} month={analyticsMonth} />
          <CaseAnalysisPanel incidents={analyticsIncidents} year={analyticsYear} month={analyticsMonth} />
        </div>

        {/* Needs Attention List (5 Columns) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-700" />
                <span>Needs Attention</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Critical items requiring administrative action
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-rose-100 text-rose-800 rounded-md">
              {needsAttentionList.length} Items
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {needsAttentionList.length > 0 ? (
              needsAttentionList.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded border uppercase ${item.urgencyClass}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (item.tabTarget) onNavigateTab(item.tabTarget);
                      else if (item.studentId) onViewStudent(item.studentId);
                      else if (item.incidentObj) onSelectIncident(item.incidentObj);
                    }}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  All items are up to date
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  No overdue appeals or unreviewed severe incidents at this time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN DASHBOARD — OTHER CASES SECTION (100+ REALISTIC FAKE INCIDENT CASES) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Other Cases (Lahat ng Iba Pang Kaso / Comprehensive Case Log)
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Official institutional repository of all recorded student incident cases across all grade levels & sections. Click any case row to inspect full case details, witnesses, evidence, and timeline.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-200 rounded-lg border border-blue-300 dark:border-blue-700">
              {filteredOtherCases.length} Cases Available
            </span>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Go to Full Reports Tab <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={caseSearch}
              onChange={(e) => {
                setCaseSearch(e.target.value);
                setCaseCurrentPage(1);
              }}
              placeholder="Search case #, student name, LRN, section..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={caseStatusFilter}
              onChange={(e) => {
                setCaseStatusFilter(e.target.value);
                setCaseCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="Recent Report">Recent Reports</option>
              <option value="Forwarded for Initial Intervention">Stage 2: Initial Intervention</option>
              <option value="Escalated to OSD and Principal">Stage 3: OSD & Principal</option>
              <option value="Escalated to Board of Discipline">Stage 4: Board Deliberation</option>
              <option value="Forwarded to School President">Stage 5: President Review</option>
              <option value="Resolved">Resolved Cases</option>
              <option value="Ongoing Report">Ongoing Reports</option>
              <option value="Appealed">Appealed Cases</option>
            </select>
          </div>

          {/* Grade Level Filter */}
          <div>
            <select
              value={caseGradeFilter}
              onChange={(e) => {
                setCaseGradeFilter(e.target.value);
                setCaseCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Grade Levels</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={caseSeverityFilter}
              onChange={(e) => {
                setCaseSeverityFilter(e.target.value);
                setCaseCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Severities</option>
              <option value="Low">Low Severity</option>
              <option value="Moderate">Moderate Severity</option>
              <option value="High">High Severity</option>
              <option value="Critical">Critical Severity</option>
            </select>
          </div>

          {/* Source / Anonymous Filter */}
          <div>
            <select
              value={caseAnonymousFilter}
              onChange={(e) => {
                setCaseAnonymousFilter(e.target.value);
                setCaseCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Sources</option>
              <option value="ANONYMOUS">Anonymous Reports</option>
              <option value="REGISTERED">Registered Reports</option>
            </select>
          </div>
        </div>

        {/* Other Cases Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Case ID & Source</th>
                <th className="py-3 px-4">Reported Student</th>
                <th className="py-3 px-4">Incident Title & Location</th>
                <th className="py-3 px-4">Alleged Offender</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Case Stage & Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedOtherCases.length > 0 ? (
                paginatedOtherCases.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    {/* Case ID & Source */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-900 dark:text-blue-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{inc.case_number}</span>
                        {inc.is_anonymous && (
                          <span className="bg-slate-800 text-amber-300 text-[9px] font-sans font-bold px-1.5 py-0.5 rounded tracking-wide">
                            ANON
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                        {inc.category}
                      </span>
                    </td>

                    {/* Reported Student */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inc.student_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {inc.section || inc.student_section} • LRN: {inc.student_lrn || 'N/A'}
                      </div>
                    </td>

                    {/* Title & Location */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={inc.title}>
                        {inc.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{inc.incident_location || 'Campus'}</span>
                        <span>•</span>
                        <span>{new Date(inc.incident_date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Offender */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {inc.alleged_offender || inc.bully_name || 'Under Investigation'}
                    </td>

                    {/* Urgency */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity || 'Moderate'} />
                    </td>

                    {/* Status & Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                      <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                        Stage {inc.stageNumber || 1}: {inc.stageName ? inc.stageName.split(':')[0] : 'OSD Assessment'}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident(inc);
                        }}
                        className="px-3 py-1 bg-[#0f2444] hover:bg-[#1a365d] text-white text-xs font-bold rounded-md transition shadow-2xs group-hover:scale-105"
                      >
                        Inspect Case
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No cases found matching your criteria.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing search terms or selecting "All Statuses" / "All Grade Levels".
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <strong>{paginatedOtherCases.length > 0 ? (caseCurrentPage - 1) * caseItemsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min(caseCurrentPage * caseItemsPerPage, filteredOtherCases.length)}</strong> of{' '}
            <strong>{filteredOtherCases.length}</strong> filtered cases (<strong>{incidents.length}</strong> total in database)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCaseCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={caseCurrentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="font-bold px-2">
              Page {caseCurrentPage} of {totalCasePages}
            </span>
            <button
              onClick={() => setCaseCurrentPage((p) => Math.min(p + 1, totalCasePages))}
              disabled={caseCurrentPage === totalCasePages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
