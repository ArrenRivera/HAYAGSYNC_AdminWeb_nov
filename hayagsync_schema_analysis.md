# HayagSYNC schema analysis

## Scope inspected

The workspace is a React + Vite application (`package.json`, `vite.config.js`, `src/`). No Laravel backend, Flutter application, database migration framework, or other backend/mobile project was present in the workspace inventory. The only existing SQL file found was `supabase/schema.sql`.

Inspected source areas included:

- Supabase client configuration, Auth and incident contexts
- incident/report forms, case detail/status workflow, appeals, service-hour and expulsion forms
- ETL management, audit log and settings pages
- seed data and localStorage initialization
- package/build configuration and existing Supabase SQL

No source files or live Supabase database were changed by this analysis.

## Existing persistence model

### Supabase reads/writes currently made

| Table | Existing operations | Source |
|---|---|---|
| `users` | Supabase Auth password sign-in followed by an active profile lookup; the profile table contains role/name data, never passwords. Roster administrators can read active account profiles. | `src/context/AuthContext.jsx` |
| `reports` | Select all and subscribe to realtime changes; insert normal/anonymous report; update status, notes, escalation, Board, and discipline fields. | `src/context/IncidentContext.jsx` |
| `students` | Select roster rows; append new records only through the service-side ETL transaction. The importer has no update/delete path. | `src/context/IncidentContext.jsx`, `supabase/migrations/20261107202000_append_only_roster_etl.sql` |
| `timeline_events` | Insert title, description, actor name/role for report creation and case actions. It does not provide actor UUID or an explicit timestamp. | `src/context/IncidentContext.jsx` |
| `etl_runs`, `etl_rejected_records` | Read append-only run/rejection history. The Edge Function calls a service-only transactional RPC; no browser-side table writes are used. | `src/pages/EtlManagementPage.jsx`, `supabase/functions/append-roster/index.ts` |
| `etl_pending_guardians`, `etl_pending_staff` | Read pending verification/provisioning records under roster-administrator RLS. | `src/pages/EtlManagementPage.jsx` |
| `activity_logs`, `login_history`, `security_events` | Read audit/security history only; this page does not write those database logs. | `src/pages/AuditLogPage.jsx` |

The existing `supabase/schema.sql` enables RLS but creates no policies; it grants broad authenticated CRUD and includes no stage-specific authorization. It also lacks a unique constraint on `parent_profiles.user_id`, which can make the nested user relationship ambiguous. Do not run that earlier schema and the new installer over one another.

### Report fields sent by the current client

`createIncident` inserts `student_name`, `student_grade`, `student_section`, `title`, `category`, `description`, `incident_date`, `incident_location`, `status`, and `parent_name`.

`createAnonymousReport` inserts those report details plus `urgency_level`, `bully_name`, `bully_grade_section`, `witnesses`, `evidence_url`, `report_source`, and the literal `parent_name = 'Anonymous Reporter'`.

Neither insert sends `student_id` or `reporter_user_id`. This prevents reliable guardian authorization and assigned-section RLS. The new schema adds these foreign keys and intentionally requires source-code changes before authenticated parent reporting will work.

Case updates use `status`, `discipline_notes`, `escalated_to`, `discipline_action`, `escalation_reason`, `escalation_notes`, `board_referred`, `hearing_notes`, `board_decision`, `board_recommendations`, and `updated_at`. Timeline inserts use `report_id`, `title`, `description`, `actor_name`, and `actor_role`.

## Actual entities and persistence boundaries

### Present in the UI and currently/cloud intended

- **Authentication/profile:** Sign-in now uses Supabase Auth and verifies an active `public.users` profile. The local demo-password fallback has been removed. The source has OSD, Ministrong Tagasubaybay, adviser, principal, Board of Discipline, and school president roles. No assistant-principal or dedicated system-admin role was found.
- **Parent/guardian and student roster:** seed data and ETL columns describe students and guardians; a guardian profile and guardian/student relation are read by ETL. There is no verified OCR registration path in the inspected code. The roster currently has current grade/section/year values, not enrollment history.
- **Bullying reports/cases:** reports are cloud-read/written and realtime subscribed. Current report fields include student snapshot, category, description, location/date, urgency, alleged bully, witnesses, evidence URL/state, status, escalation and discipline decisions.
- **Case timeline:** case actions are inserted in `timeline_events`. Local `status_history` is also synthesized and stored separately in localStorage; it is not a complete cloud status history.
- **ETL:** workbook sheets `Students` and `Staff` are parsed in the browser and sent to a JWT-verified Edge Function. Its service-only database RPC performs serialized duplicate checks, atomic insert-only roster writes, pending staff/guardian staging, and run/rejection logging. The additive migration and function must be applied/deployed to the target Supabase project before Sync works.
- **Audit:** the UI reads three audit tables, but local audit entries are stored in localStorage. Synthetic client IP values are not trusted audit evidence.

### LocalStorage-only workflows included as schema targets

`IncidentContext` initializes and persists students, incidents, appeals, community services, expulsions, audit logs, notifications, and settings under `hayagsync_*` keys. Current local records include:

- **Appeals:** report/case/student, appellant, reason, supporting document names/sizes, status, ruling justification, reviewer, review date, and deadline. Appeal review supports Upheld, Reduced, and Overturned. No caller for the appeal submission method was identified.
- **Community service:** report/student, required/completed hours, supervisor, task, assigned date, deadline, status, and a list of dated hour/activity/supervisor/remark logs. The new SQL normalizes hour logs and calculates completed hours from them.
- **Expulsion:** report/student, resolution/effective date, DepEd endorsement, signatory, grounds, transfer-clearance status, and confidential notes.
- **Notifications:** target role, title/message/type, read state, timestamp, and link.
- **Settings:** school/division/year/policy, escalation-day setting, and guardian countersign flag. Category and section editing is referenced by the settings page but missing from the initial settings seed; this inconsistency is not resolved by inventing a starting list.

These are real UI/local models, not evidence that the current app persists them to Supabase. The new SQL provides normalized tables for the implemented local workflows; source changes are still required.

## Workflow and authorization findings

The UI presents a five-stage workflow:

1. OSD initial assessment
2. Adviser / Ministrong Tagasubaybay joint intervention
3. OSD / principal intervention
4. Board of Discipline
5. School President final review

The detail modal conditionally renders controls by role and the generic status modal has some local checks. However, the context methods themselves do not enforce roles, and the generic update method accepts a caller-selected status. These checks are presentation behavior only. The new installer adds database role/scope checks and a report-update trigger that constrains stage transitions; the generic status UI must be updated to handle denied transitions.

Parent access to full `reports` rows would expose internal notes and disciplinary/Board fields because row-level policies cannot hide selected columns within a permitted row. Therefore the new schema denies parent SELECT on `reports` and provides `parent_report_status`, a safe read-only projection.

Anonymous report creation currently attempts a direct unauthenticated `reports` insert. The new schema gives `anon` no table access; anonymous intake must use a rate-limited, validated Edge Function.

## Normalization decisions

- Supabase Auth is the credential store; no application password column exists.
- `users` and `parent_profiles` are separate one-to-one profile entities; the guardian link is unique and has the explicit FK name expected by the existing nested query.
- Students can have multiple guardians through `parent_student_guardianships`.
- Staff section assignments are a separate relationship and reference a school-section record. No `assigned_section` string is placed on `users`.
- Roster student FK and report reporter FK are added while retaining report-time name/grade/section snapshots needed by the present report API and for historical accuracy.
- Appeal supporting files are modeled as metadata rows (the current UI does not upload their contents). Service logs are child rows, avoiding a multi-value `logs` field or duplicate completed-hours counter.
- Settings categories and sections are modeled as references, but the current UI's category/section state is local and its initial state is inconsistent.
- Free-text report category/status values are retained for compatibility; normalized reference tables do not silently constrain current values.
- A separate meeting scheduler, AI analysis history, enrollment history, storage attachment model, and disciplinary-action history are omitted because no corresponding persisted workflow was found.

## Assumptions and unresolved details

1. The installer targets a fresh/empty `public` schema. The preflight stops if any managed table/view already exists. The live Supabase schema was not inspected.
2. New Supabase Auth users are treated as parents until a trusted administrator assigns a school role. The app has no secure staff-provisioning workflow yet.
3. Parent access is established through a trusted guardian/student relationship; self-registration alone grants no child access.
4. Adviser, Ministrong Tagasubaybay, and principal scope requires explicit section assignments. Principal jurisdiction cannot be safely inferred from a client-supplied email/title.
5. OSD has system-wide case access. Board access is limited to Board-referred cases; the School President can read Board-referred cases forwarded for presidential review. Roster-administration operations are limited to OSD, principal, and school president. If school governance requires a different hierarchy, change it before deployment.
6. The current evidence URL is not assumed to be a private Storage object. No bucket or Storage policy can be safely inferred.
7. AI analysis is not actually generated by an AI service in the inspected code. The optional `reports.ai_summary` field is kept for compatibility; no model provenance, prompt, or generated-analysis history is invented.
8. No live database migration or execution was performed. PostgreSQL client tools were not installed in the workspace; validation was static and source-based.

## Security and production blockers

- Supabase Auth and active profile checks now protect sign-in. Role-based database permissions must still be tested against the target project's actual migration state.
- User identity is no longer trusted from localStorage; other application data and workflows remain partly localStorage-backed.
- Current reports omit database student/reporter IDs; secure parent and section scope requires those IDs and assigned relationships.
- Current browser-side anonymous inserts must be replaced by an Edge Function.
- ETL sync requires applying `supabase/migrations/20261107202000_append_only_roster_etl.sql` and `supabase/migrations/20261107211300_principal_only_roster_etl.sql`, deploying `supabase/functions/append-roster`, and provisioning a real Supabase Auth account with an active Principal profile. Only Principals can upload/import; existing ETL history readers retain their configured read access. No live project was changed as part of this source-code implementation.
- Real student data should not be placed in the new project until Auth, role provisioning, guardian links, section assignments, private evidence storage, and RLS behavior are tested with separate synthetic accounts.
