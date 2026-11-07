# HayagSYNC Supabase database documentation

## Scope and installation

The accompanying `hayagsync_supabase_schema.sql` is a one-time installer for a **new, empty Supabase project**. It creates application tables, indexes, functions, triggers, grants, RLS policies, and a guardian-safe read-only report view. It does not import seed data, migrate an existing project, configure Storage, or modify any live Supabase project automatically.

The script has a preflight guard: if any managed HayagSYNC table or view already exists in `public`, it aborts before creating anything. This is intentional. Do not remove that guard or run the script over the earlier `supabase/schema.sql` schema; first compare the existing database and prepare a deliberate migration.

Run the script once in **Supabase Dashboard → SQL Editor → New query**. Afterward:

1. Make sure the `private` schema is not included in Supabase's exposed API schemas.
2. Create guardian-to-student links and staff section assignments using a trusted administrator process.
3. Promote authorized staff profiles through a trusted administrative process. New Supabase Auth users are assigned the non-privileged `parent` role by default.
4. Update the application as described below before relying on cloud persistence.
5. Test RLS with separate parent, adviser, OSD, Board, and President accounts using non-production test records.

The schema deliberately grants no access to `anon`. Never put a Supabase `service_role` or secret key in the Vite frontend.

### Deploying current-roster Excel sync

The application includes an additive current-roster migration and Supabase Edge Function. These are not applied automatically and do not replace the base schema:

1. Confirm the existing project has the `users`, `students`, `school_sections`, `staff_section_assignments`, `etl_runs`, and `etl_rejected_records` tables with the columns in `hayagsync_supabase_schema.sql`. The migration also requires a unique `school_sections(grade, section_name, academic_year)` key. It aborts safely if existing data prevents that key.
2. Apply `supabase/migrations/20261107211300_principal_only_roster_etl.sql` and then `supabase/migrations/20261108001000_current_roster_etl.sql` in the Supabase SQL Editor. The current-roster migration adds `students.is_active`, ETL result counts, a restricted staff-review table, RLS policies, and a service-only atomic RPC. It revokes direct browser writes to student and ETL log tables. It does not delete student rows or case history.
3. Use a complete official current-enrollment roster, not a partial list. Each workbook must contain at least one valid student, and all student rows must use one academic year. A matching LRN updates the student's current name, grade, section, year, and active state; new LRNs are inserted. Active students omitted from the complete roster are marked inactive. Their records and linked case history are retained. Any invalid or duplicate row rejects the entire workbook before any student changes are committed.
4. Staff rows are staged only for manual review. Existing Supabase Auth users, roles, and section assignments are never created or changed by import. Guardian contact fields are not imported or staged.
5. Configure the Supabase CLI for the same project and deploy `supabase/functions/append-roster` with `supabase functions deploy append-roster`. Function JWT verification is enabled in `supabase/config.toml`. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions; never add the service-role key to `.env.local` or the frontend. The account must have a matching active `public.users` profile. The former demo/localStorage login is no longer accepted.
6. Test with synthetic data first, including existing LRN updates, new students, omitted students becoming inactive, duplicate rows, invalid rows, and staff staging. Confirm that rejected imports change no roster rows and that student/case records are never deleted.

### Reports and case workflow persistence

After confirming the base schema and role/section assignments are installed, apply `supabase/migrations/20261108010000_atomic_case_workflow_actions.sql` in the Supabase SQL Editor. The migration adds `public.apply_case_workflow_action`, which updates an authorized report and appends its timeline event in one transaction. It requires the base `reports` and `timeline_events` tables plus the private report-access and workflow-trigger functions; it intentionally fails if those prerequisites are missing.

The report forms now select an active student from the Supabase roster. Staff submissions write the numeric student ID and academic-year snapshot; parent submissions use `submit_parent_report`, and parent reads use the restricted `parent_report_status` view. Case-stage changes wait for the RPC result before changing the UI; errors are shown rather than reported as success. In non-demo mode, reports/students are not loaded from or persisted to browser localStorage. Existing browser-only records are not imported or deleted. Secure evidence upload remains unavailable and is identified as such in the forms.

This does not complete all application persistence. Anonymous intake still needs a rate-limited trusted backend endpoint, and appeals, community service, expulsion records, notifications, settings, and audit events remain outside this milestone. Do not treat them as shared Supabase records until their dedicated integrations are completed and tested.

### Staff profile photos

Run `supabase/migrations/20261107213500_staff_profile_photos.sql` in the Supabase SQL Editor to create the private `staff-profile-photos` bucket, authenticated-staff read/own-folder write policies, and the self-only avatar update function. To enable removing previously uploaded photos, also run `supabase/migrations/20261107225000_remove_staff_profile_photos.sql`; it permits an active staff member to unlink and delete only their own photo. Staff can select a JPG, PNG, or WebP image up to 5 MB in profile settings and commit it with **Save Changes**; the browser resizes it to WebP before upload. They can also remove their photo and sign out from Profile Settings. Password changes can be saved from the same button and update Supabase Auth after current-password verification. The database stores only the Storage object path, and the app generates seven-day signed URLs for display. In demo mode, the photo and password are stored in that browser's localStorage only and are not synced between devices; real cross-device persistence requires demo mode to be disabled and staff to sign in through Supabase Auth.

### Staff recovery contacts

Apply `supabase/migrations/20261107234000_staff_recovery_contacts.sql` to keep `public.users.email` synchronized after a staff member confirms a new Supabase Auth email. Staff can link a real email and/or phone in Profile Settings. Contact changes require the current password. Email changes are confirmed through the new inbox; after confirmation, the verified email replaces the seeded `@hayag.edu.ph` sign-in email. Phone changes require an SMS OTP; the verified phone can also be used to sign in. The login form accepts a username/email or an E.164 phone number (for example `+639171234567`). Forgot Password sends a reset link to verified email, or an SMS OTP to a verified phone; after SMS verification, the user sets a new password in the app.

Before enabling these flows, configure Supabase Auth:

- Set the project **Site URL** and add the local development URL and production origin to allowed redirect URLs.
- Configure email delivery/SMTP and the password-recovery email template.
- These provisioned usernames have no old inbox. In Auth email settings, disable **Secure email change** so the change confirmation goes to the new inbox only. The app requires the current password before requesting an email change, and the new address still must be confirmed.
- Configure an SMS provider and enable phone confirmations. Phone numbers must be entered in international E.164 format.

Do not treat an unconfirmed email or phone as a recovery method. Until at least one reachable contact has been verified, password recovery still requires a trusted administrator.

### Provisioning the demo staff directory as Supabase accounts

The current directory contains 32 seed staff profiles with address-shaped usernames. These are not verified mailboxes. To create real Supabase Auth accounts with unique one-time credentials:

1. Apply `supabase/migrations/20261107215000_secure_staff_auth_onboarding.sql`, `supabase/migrations/20261107213500_staff_profile_photos.sql`, and `supabase/migrations/20261107234000_staff_recovery_contacts.sql` in the Supabase SQL Editor.
2. Open a PowerShell terminal in the project and run:

   ```powershell
   .\scripts\provision-demo-staff-to-supabase.ps1
   ```

   The helper reads the project URL from `.env.local` and securely prompts for the service-role key without echoing it or saving it there. It runs a dry run and requires typing `CREATE` before writing to Supabase.
3. The provisioner aborts if a seed username already exists in Auth or `public.users`; it never overwrites existing accounts. If the project's Auth trigger automatically creates a matching `public.users` row for a newly-created Auth user, the provisioner fills in that newly-created row instead of inserting a duplicate. On success, it writes unique temporary passwords to the git-ignored `supabase/onboarding-credentials.local.json`, creates active profiles, marks them to change password at first sign-in, assigns matching existing `school_sections`, and changes `.env.local` to disable demo mode. Restart Vite afterward. If the provisioner reports sections without a match, create/review the correct section assignments before relying on section-scoped access.
4. Privately give each staff member only their own username and one-time password, ask them to set a strong personal password at first sign-in, and securely delete the credentials file after distribution. Do not send the file or service-role key in chat.

Because these seed usernames are not verified mailboxes, Supabase cannot deliver invites or password-reset emails to them. Each staff member must first link and verify a reachable email and/or phone in Profile Settings; until then, password recovery must be handled by a trusted administrator.

To reset the existing OSD account `osd@hayag.edu.ph` after its password has been forgotten, run `.\scripts\reset-osd-account-password.ps1` in a trusted local PowerShell terminal. The helper verifies the existing active OSD profile and matching Auth user, asks for the service-role key without echoing it, and requires typing `RESET`. It sets a unique temporary password and requires a password change at next sign-in. Give the one-time password to the account owner privately; it is printed only once in the local terminal. This does not create another account.

The upload requires `Students` and `Staff` sheets. Required columns are `LRN`, `Name`, `Grade`, `Section`, and `Academic Year` for students and `Name`, `Email`, and `Role` for staff. All students in a workbook must be in the same academic year; optional staff column is `Assigned Section`. The browser accepts `.xlsx` files up to 10 MB; the JSON request is limited to 4 MB and 5,000 rows. Keep LRN as text in Excel. The current roster sync serializes imports transactionally, updates existing student enrollment fields by LRN, adds new students, and marks omitted active students inactive without deleting records. Staff entries are staged for review only; guardian contacts are outside this ETL workflow.

### Importing the browser's current data

The browser's `hayagsync_*` localStorage arrays are initialized from `src/data/initialSeedData.js` and then updated by the app. Use the current localStorage snapshot as the single source of truth; importing the static seed and the snapshot separately can duplicate records. The helper scripts `scripts/export-hayagsync-localstorage.js` and `scripts/generate-hayagsync-local-import.mjs` export the data locally and generate a one-time SQL import. The SQL includes an empty-target preflight and must not be run if any of its case/student target tables already contain rows.

To export, open the app in the same browser profile that contains the data, open Developer Tools → Console, paste the contents of `scripts/export-hayagsync-localstorage.js`, and press Enter. This downloads `hayagsync-local-backup.json` locally. Do not send that file to anyone; it can contain student and case details. Generate the SQL on the same computer from PowerShell:

```powershell
node scripts\generate-hayagsync-local-import.mjs "$env:USERPROFILE\Downloads\hayagsync-local-backup.json" "$env:USERPROFILE\Downloads\hayagsync-local-import.sql"
```

Open the generated SQL in Supabase SQL Editor and run it once, only after confirming the preflight tables remain empty. The import preserves students, reports, nested report timelines and status histories, appeals, community-service assignments/logs, expulsion records, and settings. It intentionally excludes local demo identities, guardian contact/link records, notifications, and audit/security logs: these require trusted Supabase Auth/user relationships or server-generated audit data. It imports evidence and appeal-document metadata only, not the underlying files. The converter warns when a service record's saved `completed_hours` differs from the sum of its saved logs; the normalized database uses the logs as the authoritative total. The generated SQL has been run against the installer in an isolated PostgreSQL-compatible test database; it has not been run against the live Supabase project.

## Entity relationships

```text
auth.users 1──1 users
users 1──0..1 parent_profiles
parent_profiles *──* students        (parent_student_guardianships)
users *──* school_sections           (staff_section_assignments)
students 1──* reports
users 1──* reports                   (reporter_user_id, optional)
reports 1──* timeline_events
reports 1──* case_appeals 1──* appeal_supporting_documents
reports 1──* community_service_assignments 1──* community_service_hour_logs
reports 1──* expulsion_records
users/roles 1──* notifications
etl_runs 1──* etl_rejected_records
```

`students.grade`, `section`, and `academic_year` describe the roster values currently read by the application. The schema does not invent enrollment history because no enrollment-history workflow or query exists in the source.

## Tables and purpose

| Table | Purpose and important columns |
|---|---|
| `users` | Application profile for one `auth.users` account. `id` is the Auth UUID; `email`, `name`, and checked `role` are profile data. There is no password column. `title`, `department`, and `avatar` preserve fields used by the current UI. Section assignments are not stored on this row. |
| `parent_profiles` | One guardian contact profile per application user. `user_id` is unique and the FK is explicitly named `parent_profiles_user_id_fkey` for the existing nested query. |
| `students` | Roster record with unique 11–12 digit `lrn`, `name`, `grade`, `section`, `academic_year`, and current-roster `is_active` flag (added by the ETL migration). Inactive rows are retained so linked case history remains valid. `parent_id` remains only as a compatibility pointer to a primary guardian; the many-to-many link table is authoritative. |
| `parent_student_guardianships` | Many-to-many guardian/student relationship, with relationship type and primary-contact flag. A partial unique index allows at most one primary contact per student. |
| `school_sections` | Reference row keyed by grade, section name, and academic year. Used to scope staff assignments. |
| `staff_section_assignments` | Many-to-many mapping from a staff profile to a section. Adviser, Ministrong Tagasubaybay, and principal access is limited to matching assigned sections; principals must be assigned all sections within their jurisdiction. |
| `school_settings` | Optional single-school configuration matching the seeded settings: school, division, academic year, policy framework, escalation days, and guardian countersign flag. |
| `incident_categories` | Configurable category name, description, and default severity. Category labels remain text on `reports` for existing API compatibility. |
| `reports` | Existing cloud case record and API name. Keeps fields used by inserts, workflow updates, dashboard reads, and case screens: student snapshots, title/category/description, date/location, urgency, witness/evidence metadata, status, escalation, discipline, appeal count, Board findings/decision, and timestamps. `student_id` and `reporter_user_id` are nullable for legacy compatibility but should be supplied for new authenticated reports. `updated_by_user_id` is set by the database workflow trigger. |
| `timeline_events` | Case action/event stream with report FK, actor UUID, and actor name/role snapshots. Authenticated actor identity is set by a trigger, not trusted from the browser. RLS makes this staff-only; parent-facing case data is intentionally sanitized. |
| `case_appeals` | Normalized appeal object: report, appellant, reason, status, reviewer, ruling/justification, and dates. The UI currently keeps appeals in localStorage. |
| `appeal_supporting_documents` | Metadata-only child rows for the current `{name, size}` appeal-document objects. This table does not upload or store file contents. |
| `community_service_assignments` | Normalized service assignment related to a report/student: required hours, supervisor, task, assignment/deadline, and status. Completed hours are calculated from the child log rows rather than duplicated. |
| `community_service_hour_logs` | One dated service activity with hours, activity, supervisor, and remark. |
| `expulsion_records` | Expulsion-related resolution number, effective date, endorsement, signatory, grounds, clearance status, and confidential notes, linked to report/student. |
| `notifications` | Per-user notification row with role/audience snapshot, title/message/type/read state/timestamp/link. A trusted backend must fan out current role-targeted messages into one row per recipient so one user's read state cannot affect others. |
| `etl_runs` | ETL batch identity, start/end/status, source file, inserted/updated/deactivated student counts, staged staff count, rejection count, and details (including authenticated importer ID). Browser access is read-only. |
| `etl_rejected_records` | Rejected sheet/row, identifier, and validation reason linked to a batch. Raw student row contents are deliberately not copied into the log. |
| `etl_pending_staff` | Staff workbook entries awaiting trusted Auth provisioning and role/section assignment. Import never creates accounts or grants roles. Visible only to OSD, principals, and school presidents. |
| `activity_logs` | Audit activity fields shown by the audit page. No browser insert policy is granted. |
| `login_history` | Login event history shown by the audit page. Must be written by a trusted Auth hook/Edge Function, not a browser-supplied identity. |
| `security_events` | Security event history shown by the audit page. Must be written by a trusted server-side process. |

### Views

`parent_report_status` is a read-only safe projection for a parent/guardian. It returns only the report identifier, title, category, student display/grade/section, incident date/location, status, source, and timestamps. The original signed-in reporter can also see their own description; a guardian viewing a child-linked report submitted by someone else gets a null description. Evidence URL, discipline notes/actions, Board findings, and escalation notes are never included. The base `reports` table has no parent SELECT policy.

The `submit_parent_report(...)` RPC accepts only parent-facing report fields, verifies the authenticated parent/guardian and roster relationship, creates the pending report, and returns a small safe result containing its ID/title/status/time. This lets a client obtain the new report ID without granting parent access to `reports.*`.

## Compatibility choices and normalization

- `auth.users` is the only credential store. A trigger creates a public profile with role `parent`; a privileged administrator must promote personnel accounts. Users cannot edit their own role through the client.
- Staff section scope is a relationship (`staff_section_assignments`), not `users.assigned_section`.
- Guardian links are many-to-many. The legacy `students.parent_id` remains nullable for the current cloud shape, but should not be used as the authoritative relationship.
- `reports` retains legacy snapshot columns such as student/parent display names and text category/status values because the current Vite app selects `*` and writes those names. Student FK/reporting-user IDs are the authoritative links for new records. Snapshot columns preserve what was reported even if roster information later changes.
- The source does not implement academic enrollment history; the student roster table stores the current roster grade/section/year. A history model should be added only with a corresponding UI/import workflow.
- Case decisions are currently stored on `reports`; `timeline_events` records workflow actions. Separate persisted appeals, service, and expulsion tables represent local-only records the UI already models. New code should write those normalized tables instead of duplicating those records into arbitrary JSON.
- Category/status names remain text because the UI uses string values and maps several legacy statuses. `incident_categories` is a settings/reference table; the current UI does not yet resolve `reports.category` through a foreign key.
- No meeting table is included: the source has a `scheduled_meeting` status literal but no appointment date, attendees, or meeting scheduler.
- No AI/risk tables are included: `reports.ai_summary` is an optional legacy field, while current summaries/risk recommendations are calculated locally. No actual AI generation or analysis-history persistence was found.
- No evidence file table or Storage bucket is created: the current form uses evidence metadata/static URL rather than a real upload. Do not put private evidence in a public bucket. A private Storage bucket and signed-access design are required before storing real evidence.

## Roles and RLS behavior

The checked profile roles match the implementation: `parent`, `adviser`, `ministrong_tagasubaybay`, `osd`, `principal`, `board_of_discipline`, and `school_president`. No assistant-principal or separate system-admin role was found in the app.

| Role | Database access model |
|---|---|
| Parent/guardian | May read only linked student rows; cannot read `reports` directly; receives the safe `parent_report_status` view; may submit through `submit_parent_report(...)` only when the authenticated profile is linked to that exact child. A database trigger replaces student snapshots from the roster and clears internal case/decision fields. No anonymous client insert. |
| Adviser / Ministrong Tagasubaybay | May read and work only reports/students in an explicit `staff_section_assignments` row. The workflow trigger restricts status transitions to stage-2 actions. |
| Principal | Same section-assignment scoping; must be assigned the grade/sections in their jurisdiction. The workflow trigger restricts principal actions to the OSD/principal stage. |
| OSD | Global case access and roster-administration access. Workflow trigger limits actions by the case's current stage. |
| Board of Discipline | May read cases referred to the Board and may enter Board findings/decision at the Board stage; cannot rewrite prior escalation fields. |
| School President | May read Board-referred cases forwarded for presidential review and may affirm at the final stage; cannot rewrite prior Board findings/disciplinary action through the workflow trigger. |

All managed tables have RLS enabled. There are no `USING (true)` policies and no `anon` grants. Tables without an explicit policy remain inaccessible to clients. The report trigger rejects changes to intake identity/content and validates status transitions against the current role/stage. User role/profile changes, guardian links, audit inserts, ETL writes, role-targeted notification fan-out, and anonymous reporting require a trusted admin/backend path. The ETL RPC is executable only by `service_role`; the Edge Function validates the caller's Supabase JWT and active Principal profile before invoking it, and the database trigger enforces the same role check.

The `private` helper functions are `SECURITY DEFINER`, use fixed search paths, and must remain in a schema not exposed through PostgREST. The `reports` update trigger validates workflow actor role and status transition because ordinary row-level policies alone cannot distinguish which columns/stage a client may change.

## Remaining application updates required before full production use

The SQL is a secure target schema, **not a drop-in fully connected replacement**. The app has an initial Supabase reports/case workflow integration, but some features still use local/demo data or need a trusted backend:

1. **Authentication and authorization — `src/context/AuthContext.jsx`, `src/pages/LoginPage.jsx`:** verify role provisioning and RLS for each real account type in the target project. Never put a service-role key in the frontend.
2. **Parent reports — `src/context/IncidentContext.jsx`:** verify `supabase.rpc('submit_parent_report', ...)` and the `parent_report_status` view against real linked guardians; parents must not read `reports` directly.
3. **Anonymous reports — `src/context/IncidentContext.jsx`, `src/pages/LoginPage.jsx`:** anonymous intake intentionally does not write to the database yet and now fails explicitly outside demo mode. Implement a rate-limited Supabase Edge Function with abuse controls and a narrow, validated insert path. Do not grant `anon` access to reports or evidence.
4. **Workflow authorization — `src/context/IncidentContext.jsx`, `src/components/incidents/IncidentDetailModal.jsx`, `src/components/incidents/IncidentStatusModal.jsx`:** apply the atomic case migration and keep UI transitions aligned with the database role/stage trigger. Validate each role and status transition using synthetic records. The generic status modal still offers statuses that may be rejected by the database trigger.
5. **Personnel scope — `src/context/AuthContext.jsx`, `src/pages/EtlManagementPage.jsx`:** replace `assigned_section`/free-text imports with `school_sections` and `staff_section_assignments`; create section assignments for advisers, Ministrong Tagasubaybay, and principals. Principal JHS/SHS jurisdiction is currently a frontend/email/title inference and must be represented by real assignments.
6. **ETL — `src/pages/EtlManagementPage.jsx`, `src/utils/etlImport.js`, `supabase/functions/append-roster/index.ts`:** Excel sync uses a Principal-only Edge Function and transaction RPC in `supabase/migrations/20261108001000_current_roster_etl.sql`. Apply the Principal-only migration and current-roster migration, then deploy the function before using Sync. The upload must be a complete current-enrollment roster for one academic year: matching student LRNs are updated, new LRNs are added, and omitted active students are marked inactive while their records and case history are retained. Staff entries are staged for review only. Do not grant the browser direct write permissions to student or ETL tables.
7. **Appeals, service, expulsion, notifications, settings — `src/context/IncidentContext.jsx`, `src/pages/AppealsPage.jsx`, `src/components/appeals/AppealReviewModal.jsx`, `src/components/incidents/IncidentStatusModal.jsx`, `src/components/community_service/LogHoursModal.jsx`, `src/pages/SettingsPage.jsx`:** these remain localStorage workflows. Add authenticated read/write operations to the corresponding normalized tables and remove duplicate local-only state as the source of truth. Appeal submission should be restricted to the linked guardian; review is OSD-only. Notifications must be fanned out server-side into per-user rows.
8. **Audit — `src/pages/AuditLogPage.jsx`:** the UI reads audit tables but does not establish trusted audit writers. Add server-side Auth/audit event hooks; do not trust browser-supplied IP, role, or actor identity. The current local audit log synthesizes an IP address and is not a security audit trail.
9. **Evidence and analysis:** replace static evidence URLs with a private Storage bucket, validated metadata, and signed access; implement actual AI generation only through a trusted backend if desired. The current local heuristic panel is not stored AI analysis.

The SQL file does not create Storage policies, seed role assignments, migrate localStorage data, or validate the remote project's current state. Test with synthetic accounts/data before any real student information.
