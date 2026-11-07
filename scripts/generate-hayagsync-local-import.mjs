import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/generate-hayagsync-local-import.mjs <backup.json> <output.sql>');
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (snapshot.format !== 'hayagsync-localstorage-v1' || !snapshot.storage) {
  throw new Error('Unsupported backup format. Export data with scripts/export-hayagsync-localstorage.js.');
}

const storage = snapshot.storage;
const parseArray = (key) => {
  const value = storage[key];
  if (value == null) return [];
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) throw new Error(`${key} must contain an array.`);
  return parsed;
};
const studentsInput = parseArray('hayagsync_students');
const reportsInput = parseArray('hayagsync_incidents');
const appealsInput = parseArray('hayagsync_appeals');
const servicesInput = parseArray('hayagsync_services');
const expulsionsInput = parseArray('hayagsync_expulsions');
const settings = storage.hayagsync_settings || {};

const positiveInt = (value) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};
const numberFromId = (value, prefix) => {
  if (typeof value === 'number') return positiveInt(value);
  if (typeof value !== 'string') return null;
  const match = value.match(new RegExp(`^(?:${prefix})?(\\d+)$`, 'i'));
  return match ? positiveInt(match[1]) : null;
};
const allocateIds = (rows, prefix, label) => {
  const ids = new Map();
  const sourceIds = new Set();
  let max = 0;
  for (const row of rows) {
    if (row.id === undefined || row.id === null || String(row.id) === '') {
      throw new Error(`${label} contains a record without a stable source ID.`);
    }
    if (sourceIds.has(String(row.id))) {
      throw new Error(`${label} contains duplicate source ID "${row.id}". Resolve duplicates before importing.`);
    }
    sourceIds.add(String(row.id));
    const candidate = positiveInt(row.numeric_id) || numberFromId(row.id, prefix);
    if (candidate) {
      if ([...ids.values()].includes(candidate)) {
        throw new Error(`${label} contains duplicate numeric ID ${candidate}. Resolve duplicates before importing.`);
      }
      ids.set(String(row.id), candidate);
      max = Math.max(max, candidate);
    }
  }
  for (const row of rows) {
    if (!ids.has(String(row.id))) {
      max += 1;
      ids.set(String(row.id), max);
    }
  }
  return ids;
};
const studentsIds = allocateIds(studentsInput, 'stu_', 'students');
const reportsIds = allocateIds(reportsInput, '(?:inc_|rep_)', 'incidents');
const studentsByAlias = new Map();
const studentsByLrn = new Map();
const studentRows = studentsInput.map((student) => {
  const id = studentsIds.get(String(student.id));
  const lrn = String(student.lrn || '').trim();
  if (!/^\d{11,12}$/.test(lrn)) throw new Error(`Student "${student.name || student.id}" has a missing or invalid LRN.`);
  if (studentsByLrn.has(lrn)) throw new Error(`Duplicate student LRN ${lrn}; import stopped to avoid linking cases to the wrong student.`);
  const row = {
    id,
    lrn,
    name: student.name,
    grade: student.grade,
    section: student.section,
    academic_year: student.academic_year || settings.academic_year || '',
  };
  for (const alias of [student.id, student.numeric_id, id]) {
    if (alias !== undefined && alias !== null) studentsByAlias.set(String(alias), row);
  }
  studentsByLrn.set(lrn, row);
  if (!row.name || !row.grade || !row.section || !row.academic_year) {
    throw new Error(`Student ${lrn} is missing name, grade, section, or academic year.`);
  }
  return row;
});

const reportsByAlias = new Map();
const reportRows = reportsInput.map((report) => {
  const id = reportsIds.get(String(report.id));
  const student = (report.student_lrn && studentsByLrn.get(String(report.student_lrn).trim()))
    || studentsByAlias.get(String(report.student_id));
  const studentId = student?.id ?? null;
  const studentName = report.student_name || student?.name;
  const studentGrade = report.student_grade || report.grade || student?.grade || '';
  const studentSection = report.student_section || report.section || student?.section || '';
  if (!studentName || !report.title || !report.category) {
    throw new Error(`Incident "${report.id}" is missing a required student name, title, or category.`);
  }
  for (const alias of [report.id, report.numeric_id, id, report.case_number]) {
    if (alias !== undefined && alias !== null) reportsByAlias.set(String(alias), id);
  }
  const source = String(report.report_source || '').toLowerCase();
  const role = String(report.reporter_role || '').toLowerCase();
  const reportSource = source.includes('anonymous')
    ? 'Anonymous'
    : (source.includes('parent') || role.includes('parent') ? 'Registered Parent' : 'Staff');
  return {
    id,
    student_id: studentId,
    student_name: studentName,
    student_grade: studentGrade,
    student_section: studentSection,
    student_academic_year: student?.academic_year || null,
    title: report.title,
    category: report.category,
    description: report.description || '',
    incident_date: report.incident_date || report.created_at || new Date().toISOString(),
    incident_location: report.incident_location || 'Campus',
    urgency_level: report.urgency_level || report.severity || 'Moderate',
    bully_name: report.bully_name || report.alleged_offender || null,
    bully_grade_section: report.bully_grade_section || null,
    witnesses: Array.isArray(report.witnesses) ? JSON.stringify(report.witnesses) : (report.witnesses || null),
    evidence_url: report.evidence_url || null,
    evidence_verification_state: report.evidence_verification_state || 'Unverified',
    ai_summary: report.ai_summary || null,
    status: report.status || 'Pending',
    report_source: reportSource,
    parent_name: report.reporter_name || report.parent_name || null,
    discipline_action: report.discipline_action || report.punishment_imposed || null,
    discipline_notes: report.discipline_notes || report.president_notes || null,
    appealed_reason: report.appealed_reason || null,
    appeal_count: Number(report.appeal_count || 0),
    escalation_reason: report.escalation_reason || null,
    escalation_notes: report.escalation_notes || null,
    escalated_to: report.escalated_to || null,
    board_referred: Boolean(report.board_referred || /board of discipline/i.test(report.status || '')),
    hearing_notes: report.hearing_notes || report.board_findings || null,
    board_decision: report.board_decision || null,
    board_recommendations: report.board_recommendations || null,
    created_at: report.created_at || report.incident_date || new Date().toISOString(),
    updated_at: report.updated_at || report.created_at || new Date().toISOString(),
  };
});

const reportIdFromRef = (reference, caseNumber) => {
  const value = reference ?? caseNumber;
  if (value === undefined || value === null) return null;
  const key = String(value);
  if (reportsByAlias.has(key)) return reportsByAlias.get(key);
  const match = key.match(/^(?:inc_|rep_)?(\d+)$/i);
  return match ? positiveInt(match[1]) : null;
};
const studentFromRecord = (record) => {
  if (record.student_lrn && studentsByLrn.has(String(record.student_lrn).trim())) {
    return studentsByLrn.get(String(record.student_lrn).trim());
  }
  const rawId = String(record.student_id ?? '');
  return studentsByAlias.get(rawId) || null;
};

const timelineRows = [];
for (const report of reportsInput) {
  const reportId = reportsIds.get(String(report.id));
  const timeline = Array.isArray(report.timeline) ? report.timeline : [];
  const history = Array.isArray(report.status_history) ? report.status_history : [];
  for (const event of timeline) {
    timelineRows.push({
      report_id: reportId,
      title: event.title || 'Case update',
      description: event.description || '',
      actor_name: event.actor_name || 'System',
      actor_role: event.actor_role || 'System',
      created_at: event.created_at || event.timestamp || report.created_at || new Date().toISOString(),
    });
  }
  for (const event of history) {
    timelineRows.push({
      report_id: reportId,
      title: `Status: ${event.to_status || 'Updated'}`,
      description: event.remark || '',
      actor_name: event.changed_by || 'System',
      actor_role: event.role || 'System',
      created_at: event.timestamp || report.updated_at || report.created_at || new Date().toISOString(),
    });
  }
}

const appeals = [];
const appealDocuments = [];
for (const [index, appeal] of appealsInput.entries()) {
  const reportId = reportIdFromRef(appeal.incident_id, appeal.case_number);
  if (!reportId) throw new Error(`Appeal "${appeal.id}" does not link to an incident in the snapshot.`);
  const sourceId = String(appeal.id || `appeal_${index + 1}`);
  appeals.push({
    source_id: sourceId,
    report_id: reportId,
    appellant_name: appeal.appellant || appeal.appellant_name || null,
    reason: appeal.reason || '',
    status: appeal.status || 'Pending',
    outcome_justification: appeal.outcome_justification || null,
    reviewed_by_name: appeal.reviewed_by || null,
    reviewed_at: appeal.reviewed_at || null,
    deadline_date: appeal.deadline_date ? String(appeal.deadline_date).slice(0, 10) : null,
    created_at: appeal.appeal_date || appeal.created_at || new Date().toISOString(),
    updated_at: appeal.reviewed_at || appeal.updated_at || appeal.appeal_date || new Date().toISOString(),
  });
  for (const [docIndex, doc] of (appeal.supporting_docs || []).entries()) {
    const size = String(doc.size || '0').trim().match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
    if (!size) throw new Error(`Appeal document "${doc.name || doc.file_name}" has an unsupported size value.`);
    const factor = { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 }[(size[2] || 'b').toLowerCase()];
    appealDocuments.push({
      source_id: sourceId,
      ordinal: docIndex + 1,
      file_name: doc.name || doc.file_name || 'Supporting document',
      size_bytes: Math.round(Number(size[1]) * factor),
      created_at: appeal.appeal_date || appeal.created_at || new Date().toISOString(),
    });
  }
}

const services = [];
const serviceLogs = [];
for (const [index, service] of servicesInput.entries()) {
  const reportId = reportIdFromRef(service.incident_id, service.case_number);
  if (!reportId) throw new Error(`Community-service record "${service.id}" does not link to an incident in the snapshot.`);
  const student = studentFromRecord(service);
  const sourceId = String(service.id || `service_${index + 1}`);
  services.push({
    source_id: sourceId,
    report_id: reportId,
    student_id: student?.id ?? null,
    required_hours: Number(service.required_hours || 0),
    supervisor_name: service.supervisor_name || null,
    task_description: service.task_description || '',
    assigned_date: String(service.assigned_date || new Date().toISOString()).slice(0, 10),
    completion_deadline: service.completion_deadline ? String(service.completion_deadline).slice(0, 10) : null,
    status: service.status || 'Assigned',
    created_at: service.assigned_date || new Date().toISOString(),
    updated_at: service.updated_at || service.assigned_date || new Date().toISOString(),
  });
  const loggedHours = (service.logs || []).reduce((sum, log) => sum + Number(log.hours || 0), 0);
  if (service.completed_hours !== undefined && Number(service.completed_hours) !== loggedHours) {
    console.warn(`Notice: ${service.id} has completed_hours=${service.completed_hours}, but its saved logs total ${loggedHours}; the normalized import uses the logs.`);
  }
  for (const [logIndex, log] of (service.logs || []).entries()) {
    serviceLogs.push({
      source_id: sourceId,
      ordinal: logIndex + 1,
      service_date: String(log.date || log.service_date || new Date().toISOString()).slice(0, 10),
      hours: Number(log.hours || 0),
      activity: log.activity || 'Imported service activity',
      supervisor: log.supervisor || null,
      remark: log.remark || null,
      created_at: `${String(log.date || log.service_date || new Date().toISOString()).slice(0, 10)}T12:00:00Z`,
    });
  }
}

const expulsions = expulsionsInput.map((record, index) => {
  const reportId = reportIdFromRef(record.incident_id, record.case_number);
  if (!reportId) throw new Error(`Expulsion record "${record.id}" does not link to an incident in the snapshot.`);
  const student = studentFromRecord(record);
  return {
    source_id: String(record.id || `expulsion_${index + 1}`),
    report_id: reportId,
    student_id: student?.id ?? null,
    resolution_number: record.resolution_number || null,
    effective_date: record.effective_date || null,
    deped_endorsement_no: record.deped_endorsement_no || null,
    signatory: record.signatory || null,
    grounds: record.grounds || '',
    transfer_clearance_status: record.transfer_clearance_status || null,
    confidential_notes: record.confidential_notes || null,
  };
});

const categories = [...new Map(reportRows.map((report) => [report.category, report])).values()].map((report) => ({
  name: report.category,
  description: 'Imported from the HayagSYNC local data snapshot.',
  severity_default: report.urgency_level,
}));
const sections = [...new Map(studentRows.map((student) => [
  `${student.grade}|${student.section}|${student.academic_year}`,
  { grade: student.grade, section_name: student.section, academic_year: student.academic_year },
])).values()];
const sqlText = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const jsonb = (value) => `${sqlText(JSON.stringify(value))}::jsonb`;

const sql = `-- One-time import generated from a local HayagSYNC browser snapshot.
-- Contains potentially sensitive student and case data; keep this SQL private.
-- This does not create Auth users or import guardian links, role assignments,
-- per-user notifications, audit logs, or file contents.
-- Target tables must be empty. This script aborts before changing data otherwise.

begin;

do $preflight$
declare blockers text;
begin
  select string_agg(table_name || ' (' || row_count || ' rows)', ', ' order by table_name)
    into blockers
  from (
    select 'students'::text as table_name, count(*)::bigint as row_count from public.students
    union all select 'reports', count(*) from public.reports
    union all select 'timeline_events', count(*) from public.timeline_events
    union all select 'case_appeals', count(*) from public.case_appeals
    union all select 'appeal_supporting_documents', count(*) from public.appeal_supporting_documents
    union all select 'community_service_assignments', count(*) from public.community_service_assignments
    union all select 'community_service_hour_logs', count(*) from public.community_service_hour_logs
    union all select 'expulsion_records', count(*) from public.expulsion_records
  ) as targets
  where row_count > 0;

  if blockers is not null then
    raise exception 'Local import stopped because target tables are not empty: %. No snapshot rows were inserted.', blockers;
  end if;
end
$preflight$;

insert into public.school_sections (grade, section_name, academic_year)
select x.grade, x.section_name, x.academic_year
from jsonb_to_recordset(${jsonb(sections)}) as x(grade text, section_name text, academic_year text)
on conflict (grade, section_name, academic_year) do nothing;

insert into public.incident_categories (name, description, severity_default)
select x.name, x.description, x.severity_default
from jsonb_to_recordset(${jsonb(categories)}) as x(name text, description text, severity_default text)
on conflict (name) do nothing;

${settings.school_name && settings.academic_year ? `insert into public.school_settings (singleton_id, school_name, division, academic_year, policy_framework, auto_escalate_days, require_guardian_countersign)
values (1, ${sqlText(settings.school_name)}, ${sqlText(settings.division || '')}, ${sqlText(settings.academic_year)}, ${sqlText(settings.policy_framework || '')}, ${Math.max(0, Number(settings.auto_escalate_days) || 0)}, ${settings.require_guardian_countersign === true})
on conflict (singleton_id) do nothing;
` : '-- No school settings were present in the browser snapshot.\n'}
insert into public.students (id, lrn, name, grade, section, academic_year)
select x.id, x.lrn, x.name, x.grade, x.section, x.academic_year
from jsonb_to_recordset(${jsonb(studentRows)}) as x(id bigint, lrn varchar, name text, grade text, section text, academic_year text);

insert into public.reports (
  id, student_id, student_name, student_grade, student_section, student_academic_year,
  title, category, description, incident_date, incident_location, urgency_level,
  bully_name, bully_grade_section, witnesses, evidence_url, evidence_verification_state,
  ai_summary, status, report_source, parent_name, discipline_action, discipline_notes,
  appealed_reason, appeal_count, escalation_reason, escalation_notes, escalated_to,
  board_referred, hearing_notes, board_decision, board_recommendations, created_at, updated_at
)
select
  x.id, x.student_id, x.student_name, x.student_grade, x.student_section, x.student_academic_year,
  x.title, x.category, x.description, x.incident_date, x.incident_location, x.urgency_level,
  x.bully_name, x.bully_grade_section, x.witnesses, x.evidence_url, x.evidence_verification_state,
  x.ai_summary, x.status, x.report_source, x.parent_name, x.discipline_action, x.discipline_notes,
  x.appealed_reason, x.appeal_count, x.escalation_reason, x.escalation_notes, x.escalated_to,
  x.board_referred, x.hearing_notes, x.board_decision, x.board_recommendations, x.created_at, x.updated_at
from jsonb_to_recordset(${jsonb(reportRows)}) as x(
  id bigint, student_id bigint, student_name text, student_grade text, student_section text,
  student_academic_year text, title text, category text, description text,
  incident_date timestamptz, incident_location text, urgency_level text, bully_name text,
  bully_grade_section text, witnesses text, evidence_url text, evidence_verification_state text,
  ai_summary text, status text, report_source text, parent_name text, discipline_action text,
  discipline_notes text, appealed_reason text, appeal_count integer, escalation_reason text,
  escalation_notes text, escalated_to text, board_referred boolean, hearing_notes text,
  board_decision text, board_recommendations text, created_at timestamptz, updated_at timestamptz
);

insert into public.timeline_events (report_id, title, description, actor_name, actor_role, created_at)
select x.report_id, x.title, x.description, x.actor_name, x.actor_role, x.created_at
from jsonb_to_recordset(${jsonb(timelineRows)}) as x(
  report_id bigint, title text, description text, actor_name text, actor_role text, created_at timestamptz
);

insert into public.case_appeals (
  id, report_id, appellant_name, reason, status, outcome_justification,
  reviewed_by_name, reviewed_at, deadline_date, created_at, updated_at
)
select md5('hayagsync-local-appeal:' || x.source_id)::uuid, x.report_id, x.appellant_name,
  x.reason, x.status, x.outcome_justification, x.reviewed_by_name, x.reviewed_at,
  x.deadline_date, x.created_at, x.updated_at
from jsonb_to_recordset(${jsonb(appeals)}) as x(
  source_id text, report_id bigint, appellant_name text, reason text, status text,
  outcome_justification text, reviewed_by_name text, reviewed_at timestamptz,
  deadline_date date, created_at timestamptz, updated_at timestamptz
);

insert into public.appeal_supporting_documents (id, appeal_id, file_name, size_bytes, created_at)
select md5('hayagsync-local-appeal-document:' || x.source_id || ':' || x.ordinal)::uuid,
  md5('hayagsync-local-appeal:' || x.source_id)::uuid, x.file_name, x.size_bytes, x.created_at
from jsonb_to_recordset(${jsonb(appealDocuments)}) as x(
  source_id text, ordinal integer, file_name text, size_bytes bigint, created_at timestamptz
);

insert into public.community_service_assignments (
  id, report_id, student_id, required_hours, supervisor_name, task_description,
  assigned_date, completion_deadline, status, created_at, updated_at
)
select md5('hayagsync-local-service:' || x.source_id)::uuid, x.report_id, x.student_id,
  x.required_hours, x.supervisor_name, x.task_description, x.assigned_date,
  x.completion_deadline, x.status, x.created_at, x.updated_at
from jsonb_to_recordset(${jsonb(services)}) as x(
  source_id text, report_id bigint, student_id bigint, required_hours numeric,
  supervisor_name text, task_description text, assigned_date date,
  completion_deadline date, status text, created_at timestamptz, updated_at timestamptz
);

insert into public.community_service_hour_logs (
  id, assignment_id, service_date, hours, activity, supervisor, remark, created_at
)
select md5('hayagsync-local-service-log:' || x.source_id || ':' || x.ordinal)::uuid,
  md5('hayagsync-local-service:' || x.source_id)::uuid,
  x.service_date, x.hours, x.activity, x.supervisor, x.remark, x.created_at
from jsonb_to_recordset(${jsonb(serviceLogs)}) as x(
  source_id text, ordinal integer, service_date date, hours numeric,
  activity text, supervisor text, remark text, created_at timestamptz
);

insert into public.expulsion_records (
  id, report_id, student_id, resolution_number, effective_date, deped_endorsement_no,
  signatory, grounds, transfer_clearance_status, confidential_notes
)
select md5('hayagsync-local-expulsion:' || x.source_id)::uuid, x.report_id, x.student_id,
  x.resolution_number, x.effective_date, x.deped_endorsement_no, x.signatory,
  x.grounds, x.transfer_clearance_status, x.confidential_notes
from jsonb_to_recordset(${jsonb(expulsions)}) as x(
  source_id text, report_id bigint, student_id bigint, resolution_number text,
  effective_date date, deped_endorsement_no text, signatory text, grounds text,
  transfer_clearance_status text, confidential_notes text
);

${studentRows.length ? `select setval(pg_get_serial_sequence('public.students', 'id'), (select max(id) from public.students), true);` : ''}
${reportRows.length ? `select setval(pg_get_serial_sequence('public.reports', 'id'), (select max(id) from public.reports), true);` : ''}
${timelineRows.length ? `select setval(pg_get_serial_sequence('public.timeline_events', 'id'), (select max(id) from public.timeline_events), true);` : ''}

commit;
`;

fs.writeFileSync(outputPath, sql, { encoding: 'utf8', flag: 'wx' });
console.log(`Created ${outputPath}`);
console.log(`Imported candidates: ${studentRows.length} students, ${reportRows.length} reports, ${timelineRows.length} timeline/history events, ${appeals.length} appeals, ${appealDocuments.length} appeal-document metadata rows, ${services.length} service assignments, ${serviceLogs.length} service logs, ${expulsions.length} expulsion records.`);
console.log('Excluded: demo users/auth accounts, guardian links, notifications, audit/security logs, and file contents.');
