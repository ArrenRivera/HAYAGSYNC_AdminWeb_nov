import React, { useState } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import SeverityBadge from '../common/SeverityBadge';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import {
  User,
  Shield,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  ExternalLink,
  Printer,
  Scale,
  Archive,
  Download,
  Send,
  Gavel,
  EyeOff,
  Award,
} from 'lucide-react';

export default function IncidentDetailModal({
  isOpen,
  onClose,
  incident,
  onChangeStatus,
  onViewStudent,
  onGenerateSummons,
}) {
  const {
    currentUser,
    isOSD,
    isAdmin,
    isMinistro,
    isPrincipal,
    isJhsPrincipal,
    isShsPrincipal,
    isAdviser,
    isBoard,
    isPresident,
    usersList,
  } = useAuth();

  const {
    assignHandler,
    forwardForInitialIntervention,
    resolveInitialIntervention,
    escalateToOsdAndPrincipal,
    resolveOsdAndPrincipal,
    escalateToBoard,
    finalizeBoardDecision,
    completePresidentReview,
    determineGradeAssignments,
  } = useIncidents();

  const [showArchivePacket, setShowArchivePacket] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [isWorkflowSaving, setIsWorkflowSaving] = useState(false);

  // 5-Stage dialog states
  const [showStage1Dialog, setShowStage1Dialog] = useState(false);
  const [stage1Notes, setStage1Notes] = useState('');

  const [showStage2ResolveDialog, setShowStage2ResolveDialog] = useState(false);
  const [stage2RestorativeAction, setStage2RestorativeAction] = useState('Counseling & Peer Mediation Completed');
  const [stage2ResolveNotes, setStage2ResolveNotes] = useState('');

  const [showStage2EscalateDialog, setShowStage2EscalateDialog] = useState(false);
  const [stage2EscalateReason, setStage2EscalateReason] = useState('');
  const [stage2EscalateNotes, setStage2EscalateNotes] = useState('');

  const [showStage3ResolveDialog, setShowStage3ResolveDialog] = useState(false);
  const [stage3DisciplineAction, setStage3DisciplineAction] = useState('Suspension (3 School Days) & Conduct Probation');
  const [stage3ResolveNotes, setStage3ResolveNotes] = useState('');

  const [showStage3EscalateBoardDialog, setShowStage3EscalateBoardDialog] = useState(false);
  const [stage3BoardReason, setStage3BoardReason] = useState('');
  const [stage3BoardNotes, setStage3BoardNotes] = useState('');

  const [showStage4BoardDialog, setShowStage4BoardDialog] = useState(false);
  const [stage4Findings, setStage4Findings] = useState('');
  const [stage4Decision, setStage4Decision] = useState('Institutional Hearing Concluded - Sanction Imposed');
  const [stage4Punishment, setStage4Punishment] = useState('Suspension (5 School Days) & Behavioral Contract');

  const [showStage5PresidentDialog, setShowStage5PresidentDialog] = useState(false);
  const [stage5Remarks, setStage5Remarks] = useState('');

  const [showPresidentFinalModal, setShowPresidentFinalModal] = useState(false);

  if (!incident) return null;

  const handleHandlerChange = (e) => {
    const selectedUserId = e.target.value;
    const user = usersList.find((u) => u.id === selectedUserId);
    if (user) {
      assignHandler(incident.id, user.id, user.name);
    }
  };

  const isResolvedOrClosed =
    incident.status?.toLowerCase() === 'resolved' ||
    incident.status?.toLowerCase() === 'closed';

  const runWorkflowAction = async (action, onSuccess) => {
    if (isWorkflowSaving) return;
    setWorkflowError('');
    setIsWorkflowSaving(true);
    try {
      const saved = await action();
      if (!saved) throw new Error('The case update was not saved.');
      onSuccess();
    } catch (error) {
      setWorkflowError(error.message || 'The case update could not be saved.');
    } finally {
      setIsWorkflowSaving(false);
    }
  };

  // Handlers for the 5-Stage multi-level workflow
  const handleStage1Forward = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await runWorkflowAction(
      () => forwardForInitialIntervention(incident.id, stage1Notes.trim()),
      () => {
        setShowStage1Dialog(false);
        setStage1Notes('');
      }
    );
  };

  const handleStage2Resolve = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await runWorkflowAction(
      () => resolveInitialIntervention(incident.id, stage2RestorativeAction, stage2ResolveNotes.trim()),
      () => {
        setShowStage2ResolveDialog(false);
        setStage2ResolveNotes('');
      }
    );
  };

  const handleStage2Escalate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!stage2EscalateReason.trim()) return;
    await runWorkflowAction(
      () => escalateToOsdAndPrincipal(incident.id, stage2EscalateReason.trim(), stage2EscalateNotes.trim()),
      () => {
        setShowStage2EscalateDialog(false);
        setStage2EscalateReason('');
        setStage2EscalateNotes('');
      }
    );
  };

  const handleStage3Resolve = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await runWorkflowAction(
      () => resolveOsdAndPrincipal(incident.id, stage3DisciplineAction, stage3ResolveNotes.trim()),
      () => {
        setShowStage3ResolveDialog(false);
        setStage3ResolveNotes('');
      }
    );
  };

  const handleStage3EscalateBoard = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!stage3BoardReason.trim()) return;
    await runWorkflowAction(
      () => escalateToBoard(incident.id, stage3BoardReason.trim(), stage3BoardNotes.trim()),
      () => {
        setShowStage3EscalateBoardDialog(false);
        setStage3BoardReason('');
        setStage3BoardNotes('');
      }
    );
  };

  const handleStage4BoardSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await runWorkflowAction(
      () => finalizeBoardDecision(
        incident.id,
        stage4Findings.trim() || 'Formal board hearing completed.',
        stage4Decision,
        stage4Punishment
      ),
      () => setShowStage4BoardDialog(false)
    );
  };

  const handleStage5PresidentSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const remarks = stage5Remarks.trim() || 'Executive affirmation completed and ratified.';
    await runWorkflowAction(
      () => completePresidentReview(incident.id, remarks),
      () => {
        setShowStage5PresidentDialog(false);
        setShowPresidentFinalModal(true);
      }
    );
  };

  const currentStage = incident.stageNumber || 1;
  const isResolved = (incident.status || '').toLowerCase() === 'resolved';

  const isPresidentFinalized = Boolean(
    incident.president_finalized ||
    incident.president_reviewed ||
    (incident.discipline_notes && incident.discipline_notes.toLowerCase().includes('president')) ||
    incident.president_notes
  );

  const presidentNotesClean = incident.president_notes || (
    incident.discipline_notes && incident.discipline_notes.includes('President Final Affirmation:')
      ? incident.discipline_notes.split('President Final Affirmation:')[1]?.trim()
      : (incident.discipline_notes || 'Executive affirmation completed and ratified.')
  );

  const presidentSanction = (
    incident.punishment_imposed ||
    incident.discipline_action ||
    incident.board_decision ||
    'Institutional Suspension & Behavioral Contract'
  );

  // Section and grade matching for role-based action controls
  const userSection = (currentUser?.assigned_section || '').toLowerCase();
  const incSection = (incident.student_section || incident.section || '').toLowerCase();
  const incGrade = (incident.student_grade || incident.grade || '').toLowerCase();
  const bullySec = (incident.bully_grade_section || '').toLowerCase();

  // Principal jurisdiction check: JHS covers Grades 7-10, SHS covers Grades 11-12
  const isJhsCase = /grade\s*(7|8|9|10)\b/i.test(incGrade) || /grade\s*(7|8|9|10)\b/i.test(incSection);
  const isShsCase = /grade\s*(11|12)\b/i.test(incGrade) || /grade\s*(11|12)\b/i.test(incSection);
  const isPrincipalWithJurisdiction = isPrincipal && (
    (isJhsPrincipal && (isJhsCase || !isShsCase)) ||
    (isShsPrincipal && isShsCase)
  );

  const assignments = determineGradeAssignments
    ? determineGradeAssignments(
        incident.student_grade || incident.grade,
        incident.student_section || incident.section,
        incident.bully_grade_section
      )
    : {
        grades: ['Grade 7'],
        ministroName: 'Gng. Corazon Alcantara',
        osdName: 'G. Renato Dalisay',
        principalName: 'Dr. Alicia Magalong - JHS Principal',
      };

  const render5StageStepper = () => {
    const stages = [
      { num: 1, title: 'OSD Assessment' },
      { num: 2, title: 'Ministro & Adviser' },
      { num: 3, title: 'OSD & Principal' },
      { num: 4, title: 'Board of Discipline' },
      { num: 5, title: 'School President' },
    ];

    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            5-Stage Disciplinary Escalation & Resolution Workflow
          </span>
          <span className="text-xs font-bold text-blue-900 dark:text-blue-400">
            {isResolved ? 'Case Resolved' : 'Current: Stage ' + currentStage + ' (' + (incident.currentHandlingOffice || 'Handling') + ')'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 pt-1">
          {stages.map((st) => {
            const isCompleted = isResolved || currentStage > st.num;
            const isCurrent = !isResolved && currentStage === st.num;
            return (
              <div
                key={st.num}
                className={'p-2.5 rounded-lg border text-center transition ' + (
                  isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : isCurrent
                    ? 'bg-blue-100 dark:bg-blue-950 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className={'w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ' + (
                      isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}>
                      {st.num}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold truncate leading-tight">{st.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGradeAssignmentsCard = () => (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Assigned Grade-Level Disciplinary Personnel
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          Coverage: {assignments.grades.join(', ')}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Ministrong Tagasubaybay</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{assignments.ministroName}</span>
        </div>
        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">OSD Discipline Officer</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{assignments.osdName}</span>
        </div>
        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">School Principal</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{assignments.principalName}</span>
        </div>
      </div>
    </div>
  );

  const renderAnonymousNotice = () => (
    <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start gap-3">
      <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="text-xs space-y-0.5">
        <span className="font-bold text-amber-300 uppercase tracking-wide block">
          Confidential Anonymous Report: Protected Minor Record (RA 10173)
        </span>
        <span className="text-slate-300">
          This incident was submitted without account login. In accordance with DepEd Child Protection Policy, no personal metadata, IP address, or parent account is linked to this case.
        </span>
      </div>
    </div>
  );

  return (
    <>
      {workflowError && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-[60] max-w-lg rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span>{workflowError}</span>
            <button type="button" onClick={() => setWorkflowError('')} aria-label="Dismiss error">
              ×
            </button>
          </div>
        </div>
      )}
      <Modal isOpen={isOpen} onClose={onClose} title={`Official Case Record: ${incident.case_number}`} maxWidth="max-w-4xl">
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-[#0f2444] dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                  {incident.case_number}
                </span>
                <StatusBadge status={incident.status} />
                <SeverityBadge severity={incident.severity} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{incident.title}</h2>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => onChangeStatus(incident)}
                  className="px-4 py-2.5 bg-[#0f2444] hover:bg-[#1a365d] text-white rounded-lg text-sm md:text-base font-bold shadow-sm transition"
                >
                  Update Case Status / Sanction
                </button>
              )}
              {isResolvedOrClosed && (
                <button
                  onClick={() => setShowArchivePacket(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm md:text-base font-bold transition flex items-center gap-2 shadow-sm"
                  title="View Sealed Case Archive Packet"
                >
                  <Archive className="w-4 h-4" /> Case Archive Packet
                </button>
              )}
              <button
                onClick={() => onGenerateSummons(incident)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg text-sm md:text-base font-bold transition flex items-center gap-2 border border-slate-300 dark:border-slate-600"
                title="Print Guardian Summons Notice"
              >
                <Printer className="w-4 h-4" /> Print Summons Letter
              </button>
            </div>
          </div>

          {/* 5-Stage Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isResolved ? (
              <>
                {/* STAGE 1: OSD Initial Assessment */}
                {currentStage === 1 && (
                  isOSD ? (
                    <button
                      onClick={() => setShowStage1Dialog(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Forward for Initial Intervention
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                      Stage 1: Awaiting OSD Initial Assessment & Referral
                    </span>
                  )
                )}

                {/* STAGE 2: Ministrong Tagasubaybay & Section Adviser */}
                {currentStage === 2 && (
                  (isMinistro || isAdviser) ? (
                    <>
                      <button
                        onClick={() => setShowStage2ResolveDialog(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Resolve Case (Intervention Successful)
                      </button>
                      <button
                        onClick={() => setShowStage2EscalateDialog(true)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-4 h-4" /> Escalate to OSD & Principal
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
                      Stage 2: Actively handled by Ministrong Tagasubaybay & Section Adviser
                    </span>
                  )
                )}

                {/* STAGE 3: OSD & Principal */}
                {currentStage === 3 && (
                  (isOSD || isPrincipalWithJurisdiction) ? (
                    <>
                      <button
                        onClick={() => setShowStage3ResolveDialog(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Resolve & Impose Disciplinary Sanction
                      </button>
                      <button
                        onClick={() => setShowStage3EscalateBoardDialog(true)}
                        className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Scale className="w-4 h-4" /> Escalate to Board of Discipline
                      </button>
                    </>
                  ) : isPrincipal ? (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      Stage 3: Under Jurisdiction of {isJhsPrincipal ? 'Senior High Principal (Grades 11-12)' : 'Junior High Principal (Grades 7-10)'} & OSD (View Only)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      Stage 3: Actively handled by OSD & School Principal
                    </span>
                  )
                )}

                {/* STAGE 4: Board of Discipline */}
                {currentStage === 4 && (
                  isBoard ? (
                    <button
                      onClick={() => setShowStage4BoardDialog(true)}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Gavel className="w-4 h-4" /> Finalize Board Decision & Punishment
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800">
                      Stage 4: Institutional deliberation by Board of Discipline
                    </span>
                  )
                )}

                {/* STAGE 5: School President */}
                {currentStage === 5 && (
                  isPresident ? (
                    <button
                      onClick={() => setShowStage5PresidentDialog(true)}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete President Final Review
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                      Stage 5: Board decision finalized. Awaiting School President executive review
                    </span>
                  )
                )}
              </>
            ) : (
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Proceedings Complete & Resolved
              </span>
            )}

            {isPresidentFinalized && (
              <button
                type="button"
                onClick={() => setShowPresidentFinalModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                title="View Official Presidential Decree Pop-up"
              >
                <Award className="w-4 h-4 text-amber-200" /> President's Final Decision (Pop-up)
              </button>
            )}
          </div>

          {/* OFFICE OF THE SCHOOL PRESIDENT - FINAL EXECUTIVE DECISION BANNER */}
          {isPresidentFinalized && (
            <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-2 border-amber-400/80 shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      <Award className="w-5 h-5 text-amber-400" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block font-mono">
                        Republic of the Philippines • Office of the School President
                      </span>
                      <h3 className="text-lg font-extrabold text-white tracking-wide">
                        Official Executive Decision & Disciplinary Directive
                      </h3>
                    </div>
                  </div>

                  <div className="mt-2 p-3 bg-white/10 rounded-lg border border-white/15 backdrop-blur-xs">
                    <div className="text-xs text-amber-200 font-semibold uppercase tracking-wider mb-0.5">
                      Presidential Final Affirmation / Directive:
                    </div>
                    <p className="text-sm font-medium text-slate-100 italic">
                      "{presidentNotesClean}"
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-400">Sanction Enforced: </span>
                      <strong className="text-amber-300">{presidentSanction}</strong>
                    </div>
                    <div className="hidden sm:block text-slate-500">•</div>
                    <div>
                      <span className="text-slate-400">Reviewing Official: </span>
                      <strong className="text-white">Dr. Vicente Agoncillo, School President</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPresidentFinalModal(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-slate-950" /> View Presidential Decree (Pop-up)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5-STAGE PROGRESS STEPPER */}
          {render5StageStepper()}

          {/* AUTOMATIC GRADE-LEVEL PERSONNEL ASSIGNMENTS */}
          {renderGradeAssignmentsCard()}

          {/* ANONYMOUS REPORT NOTICE */}
          {incident.is_anonymous && renderAnonymousNotice()}

          {/* Escalation Context Banner */}
          {(incident.escalated_to || incident.escalation_reason || (incident.status || '').includes('Escalated')) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-sm font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Official Case Escalation Record ({incident.status || 'Escalated'})</span>
              </div>
              {incident.escalated_to && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Escalated to:</strong> {incident.escalated_to}
                </p>
              )}
              {incident.escalation_reason && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Reason:</strong> {incident.escalation_reason}
                </p>
              )}
              {incident.escalation_notes && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Supporting Notes:</strong> {incident.escalation_notes}
                </p>
              )}
            </div>
          )}

          {/* Board of Discipline Deliberation Record */}
          {(incident.board_referred || incident.board_decision || incident.hearing_notes) && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 text-sm font-bold">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>Board of Discipline Formal Hearing Record</span>
              </div>
              {incident.hearing_notes && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Hearing Notes:</strong> {incident.hearing_notes}
                </p>
              )}
              {incident.board_recommendations && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Board Recommendations:</strong> {incident.board_recommendations}
                </p>
              )}
              {incident.board_decision && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Official Decision / Sanction:</strong> {incident.board_decision}
                </p>
              )}
            </div>
          )}

          {/* STAGE 1 DIALOG */}
          {showStage1Dialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 dark:border-blue-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" /> Forward for Initial Intervention
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage1Dialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The case will be officially referred to both the assigned <strong>Ministrong Tagasubaybay</strong> and <strong>Section Adviser</strong> for collaborative investigation, student interviews, and conflict intervention.
                </p>
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    OSD Initial Assessment Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    value={stage1Notes}
                    onChange={(e) => setStage1Notes(e.target.value)}
                    placeholder="Initial assessment directives or counseling observations for the handlers..."
                    className="w-full p-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowStage1Dialog(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStage1Forward}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Confirm & Forward to Handlers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2 DIALOG: Resolve */}
          {showStage2ResolveDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 dark:border-emerald-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Stage 2: Resolve Case (Intervention Successful)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage2ResolveDialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Record restorative counseling, mediation agreement, and parental coordination conducted by the <strong>Ministrong Tagasubaybay</strong> and <strong>Section Adviser</strong>.
                </p>
                <form onSubmit={handleStage2Resolve} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Restorative Action / Agreement *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={stage2RestorativeAction}
                      onChange={(e) => setStage2RestorativeAction(e.target.value)}
                      placeholder="e.g. Peer mediation conducted, written apology, counseling agreement..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Intervention Notes & Details
                    </label>
                    <textarea
                      rows={3}
                      value={stage2ResolveNotes}
                      onChange={(e) => setStage2ResolveNotes(e.target.value)}
                      placeholder="Notes on the counseling session, parent response, and mutual behavioral commitments..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowStage2ResolveDialog(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm & Resolve Case
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STAGE 2 DIALOG: Escalate */}
          {showStage2EscalateDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 dark:border-amber-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-5 h-5 text-amber-600" /> Stage 2: Escalate to OSD & School Principal
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage2EscalateDialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  When initial advisory intervention cannot resolve the conflict or the infraction exceeds advisory resolution, forward the case to both <strong>OSD</strong> and the <strong>School Principal</strong> for administrative disciplinary handling (Stage 3).
                </p>
                <form onSubmit={handleStage2Escalate} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Reason for Escalation *
                    </label>
                    <textarea
                      required
                      autoFocus
                      rows={2}
                      value={stage2EscalateReason}
                      onChange={(e) => setStage2EscalateReason(e.target.value)}
                      placeholder="State why intervention failed or why formal disciplinary sanction is required..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Supporting Investigation Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={stage2EscalateNotes}
                      onChange={(e) => setStage2EscalateNotes(e.target.value)}
                      placeholder="Interview findings, student behavior, uncooperative parent response..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowStage2EscalateDialog(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" /> Confirm & Escalate to Stage 3
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STAGE 3 DIALOG: Resolve */}
          {showStage3ResolveDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 dark:border-emerald-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Stage 3: Resolve & Impose Disciplinary Sanction
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage3ResolveDialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Record administrative disciplinary action and conduct sanctions under the joint authority of <strong>OSD</strong> and the <strong>School Principal</strong>.
                </p>
                <form onSubmit={handleStage3Resolve} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Disciplinary Sanction Imposed *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={stage3DisciplineAction}
                      onChange={(e) => setStage3DisciplineAction(e.target.value)}
                      placeholder="e.g. 3-day suspension, mandatory community service, conduct probation..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Sanction Notes & Guardian Commitment
                    </label>
                    <textarea
                      rows={3}
                      value={stage3ResolveNotes}
                      onChange={(e) => setStage3ResolveNotes(e.target.value)}
                      placeholder="Conference outcome, guardian agreement notes..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowStage3ResolveDialog(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Apply Sanction & Resolve
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STAGE 3 DIALOG: Escalate to Board */}
          {showStage3EscalateBoardDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-300 dark:border-purple-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" /> Stage 3: Refer to Board of Discipline
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage3EscalateBoardDialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  When OSD & Principal determine the case involves severe misconduct, major violence, or repeated violations requiring institutional Board hearing, escalate to the <strong>Board of Discipline</strong> (Stage 4).
                </p>
                <form onSubmit={handleStage3EscalateBoard} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Reason for Board Referral *
                    </label>
                    <textarea
                      required
                      autoFocus
                      rows={2}
                      value={stage3BoardReason}
                      onChange={(e) => setStage3BoardReason(e.target.value)}
                      placeholder="State why institutional Board of Discipline hearing and sanction is warranted..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Supporting Dossier Summary (Optional)
                    </label>
                    <input
                      type="text"
                      value={stage3BoardNotes}
                      onChange={(e) => setStage3BoardNotes(e.target.value)}
                      placeholder="Previous infraction records, witness statements summary..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowStage3EscalateBoardDialog(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Scale className="w-4 h-4" /> Confirm & Escalate to Board (Stage 4)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STAGE 4 DIALOG: Board Decision */}
          {showStage4BoardDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-300 dark:border-purple-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-purple-600" /> Stage 4: Finalize Board Decision & Punishment
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage4BoardDialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Record formal hearing findings and determine institutional punishment. This will forward the case directly to the <strong>School President</strong> for executive review and final decree (Stage 5).
                </p>
                <form onSubmit={handleStage4BoardSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Formal Board Findings & Hearing Summary *
                    </label>
                    <textarea
                      required
                      autoFocus
                      rows={2}
                      value={stage4Findings}
                      onChange={(e) => setStage4Findings(e.target.value)}
                      placeholder="Summary of testimonies, established facts, and mitigating/aggravating circumstances..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Board Deliberation Decision *
                    </label>
                    <input
                      type="text"
                      required
                      value={stage4Decision}
                      onChange={(e) => setStage4Decision(e.target.value)}
                      placeholder="e.g. Respondent found liable for gross bullying under Section 6..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Punishment Imposed *
                    </label>
                    <input
                      type="text"
                      required
                      value={stage4Punishment}
                      onChange={(e) => setStage4Punishment(e.target.value)}
                      placeholder="e.g. 5-day suspension, non-readmission recommendation, conduct probation..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowStage4BoardDialog(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Gavel className="w-4 h-4" /> Finalize & Forward to School President
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STAGE 5 DIALOG: President Final Review */}
          {showStage5PresidentDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-300 dark:border-blue-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-bold text-blue-950 dark:text-blue-100 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Stage 5: School President Executive Affirmation
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowStage5PresidentDialog(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Executive final affirmation of the Board of Discipline findings and punishment. Completing this concludes all institutional proceedings and enacts the presidential directive.
                </p>
                <form onSubmit={handleStage5PresidentSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      President Executive Remarks / Official Directive *
                    </label>
                    <textarea
                      required
                      autoFocus
                      rows={3}
                      value={stage5Remarks}
                      onChange={(e) => setStage5Remarks(e.target.value)}
                      placeholder="Official presidential affirmation of punishment and final guidance directives..."
                      className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowStage5PresidentDialog(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Affirm & Finalize Case
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PRESIDENT'S FINAL EXECUTIVE DECISION POP-UP */}
          {showPresidentFinalModal && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-400 dark:border-amber-500 space-y-6 relative max-h-[92vh] overflow-y-auto">
                <div className="text-center space-y-1 pb-4 border-b-2 border-amber-500/40 relative">
                  <button
                    type="button"
                    onClick={() => setShowPresidentFinalModal(false)}
                    className="absolute right-0 top-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                  <div className="inline-flex p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1 border border-amber-400/30">
                    <Award className="w-7 h-7" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">
                    Republic of the Philippines • Department of Education
                  </p>
                  <h3 className="text-xl font-extrabold text-[#0f2444] dark:text-white uppercase tracking-wider">
                    Office of the School President
                  </h3>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                    Executive Final Disciplinary Order & Decree
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Case Number</span>
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-300 text-sm">{incident.case_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Student / Subject</span>
                    <span className="font-bold text-slate-900 dark:text-white">{incident.student_name}</span>
                    <span className="text-[10px] text-slate-500 block">{incident.student_grade || incident.grade} - {incident.student_section || incident.section}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Incident Offense</span>
                    <span className="font-bold text-slate-900 dark:text-white">{incident.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Disciplinary Status</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Stage 5: Finalized</span>
                  </div>
                </div>

                {(incident.board_decision || incident.hearing_notes) && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                    <span className="font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 block">
                      Board of Discipline Adjudication
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{incident.board_decision || 'Deliberation completed.'}</p>
                  </div>
                )}

                <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950 to-slate-900 text-white border border-amber-400/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Executive Decree & Final Affirmation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      RATIFIED BY PRESIDENT
                    </span>
                  </div>
                  <blockquote className="text-base font-medium text-slate-100 italic border-l-4 border-amber-400 pl-4 py-1">
                    "{presidentNotesClean}"
                  </blockquote>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Sanction Enacted:</span>
                    <span className="font-bold text-amber-300 text-sm">{presidentSanction}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-slate-400">Decree Reference:</div>
                    <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      EXEC-PRES-{incident.id}-{new Date().getFullYear()}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Legally Enforceable DepEd Disciplinary Order
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="w-36 h-0.5 bg-slate-400 dark:bg-slate-600 ml-auto mb-1" />
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">Dr. Vicente Agoncillo</p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">School President</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPresidentFinalModal(false);
                      onGenerateSummons(incident);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print Decree / Summons
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPresidentFinalModal(false)}
                    className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-md cursor-pointer"
                  >
                    Close Pop-up
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student & Involved Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0f2444] dark:text-blue-400" /> Student Subject (Biktima / Involved)
              </h4>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{incident.student_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {incident.student_section || incident.section} • LRN: {incident.student_lrn}
                  </p>
                </div>
                <button
                  onClick={() => onViewStudent(incident.student_id)}
                  className="text-sm text-[#0f2444] dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                >
                  {isMinistro ? 'View Incident History' : 'View Profile History'} <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Alleged Bully / Offender
              </h4>
              <p className="text-base font-bold text-slate-900 dark:text-white">{incident.alleged_offender || 'Not specified'}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Witnesses: {incident.witnesses || 'None logged'}</p>
            </div>
          </div>

          {/* Incident Particulars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs uppercase">Offense Category:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1 block">{incident.category}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs uppercase">Date & Time:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-1 block">
                {new Date(incident.incident_date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs uppercase">Location:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-1 block">{incident.incident_location}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs uppercase">Reported By:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-1 block">
                {incident.reporter_name} <span className="text-xs text-slate-500">({incident.reporter_role})</span>
              </span>
            </div>
          </div>

          {/* Incident Description */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Detailed Observation / Incident Summary</h4>
            <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
          </div>

          {/* Assigned Handler Selection */}
          {isAdmin && (
            <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#0f2444] dark:text-blue-400" />
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Assigned Disciplinary Handler</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Designated school official presiding over hearing & counseling</p>
                </div>
              </div>
              <select
                value={incident.handler_id || ''}
                onChange={handleHandlerChange}
                className="px-4 py-2 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
              >
                <option value="">-- Assign Case Handler --</option>
                {usersList
                  .filter((u) => u.role === 'osd' || u.role === 'ministrong_tagasubaybay')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'osd' ? 'OSD Head' : 'Ministro ng Tagasubaybay'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Evidence Attachments */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0f2444] dark:text-blue-400" /> Attached Incident Evidence & Provenance Screening ({incident.evidence?.length || 0})
            </h4>
            {incident.evidence && incident.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {incident.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{ev.title}</p>
                      <p className="text-xs text-slate-500 uppercase font-mono mt-0.5">{ev.type} • {ev.file_size}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ✓ Screening: Metadata Provenance Preserved
                      </p>
                    </div>
                    {ev.type === 'photo' && ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-lg text-[#0f2444] dark:text-blue-400 border border-slate-300 dark:border-slate-700 shrink-0"
                      >
                        View Photo
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No external photographic or document evidence attached to this case.</p>
            )}
          </div>

          {/* Status History & Remarks Timeline */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0f2444] dark:text-blue-400" /> Case Status Workflow History & Audit Trail
            </h4>
            <div className="space-y-3">
              {incident.status_history && incident.status_history.length > 0 ? (
                incident.status_history.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0f2444] dark:bg-blue-400 mt-2 shrink-0" />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {hist.from_status} → <span className="text-[#0f2444] dark:text-blue-400 underline">{hist.to_status}</span>
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(hist.timestamp).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 mt-1.5 leading-relaxed font-medium">{hist.remark}</p>
                      <p className="text-xs text-slate-500 mt-1">Logged by: <strong>{hist.changed_by}</strong> ({hist.role})</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Initial filing status recorded.</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Case Archive Packet Modal */}
      {showArchivePacket && (
        <Modal
          isOpen={showArchivePacket}
          onClose={() => setShowArchivePacket(false)}
          title={`Institutional Case Archive Packet: ${incident.case_number}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white">Case Number:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{incident.case_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Subject Student:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{incident.student_name} ({incident.student_section || incident.section})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Incident Category:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{incident.category} Bullying</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Disciplinary Sanction:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{incident.sanction || 'Restorative Mediation / Warning'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#0f2444] dark:text-blue-400 mb-2">
                Post-Resolution Case Abstract (Layer 3)
              </h5>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {`=== ARCHIVE CASE ABSTRACT ===
Case ID: ${incident.case_number} | Status: ${incident.status?.toUpperCase()}
Subject Student: ${incident.student_name} (${incident.student_section || incident.section})
Category: ${incident.category} Bullying
Location: ${incident.incident_location}
Occurrence: ${new Date(incident.incident_date).toLocaleString()}

Summary of Incident:
"${incident.description}"

Disciplinary Disposition:
• Action: ${incident.sanction || 'Counseling & Restorative Agreement'}
• Procedural Trail: 100% verified across Homeroom, Guidance, and OSD records.

Archival Compliance: Sealed in compliance with DepEd Child Protection Policy (DO 40, s. 2012).`}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowArchivePacket(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Case Archive Packet exported for permanent institutional records.');
                  setShowArchivePacket(false);
                }}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-[#0f2444] hover:bg-[#1a365d] text-white flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export Archive Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}