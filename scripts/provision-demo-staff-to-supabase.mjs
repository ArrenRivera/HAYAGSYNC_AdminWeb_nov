import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_USERS } from '../src/data/initialSeedData.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const credentialsPath = path.join(root, 'supabase', 'onboarding-credentials.local.json');
const envPath = path.join(root, '.env.local');
const expectedRoles = new Set([
  'adviser',
  'board_of_discipline',
  'ministrong_tagasubaybay',
  'osd',
  'principal',
  'school_president',
]);

const stop = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const checkServiceRoleAccess = async (admin) => {
  try {
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error) return {};
    if (/invalid api key|jwt.*(invalid|malformed)|unauthorized/i.test(error.message)) {
      return {
        error: 'Supabase rejected the admin key. Use the project’s service_role secret from Project Settings → API Keys; do not use the anon/publishable key.',
      };
    }
    return {
      error: `Supabase Auth admin check failed: ${error.message}`,
    };
  } catch (error) {
    const cause = error.cause?.code || error.cause?.message;
    return {
      error: `Could not reach the Supabase Auth admin API${cause ? ` (${cause})` : ''}. Verify internet/VPN/proxy access, then try again.`,
    };
  }
};

const sectionMatchesAssignment = (section, user) => {
  const scope = (user.assigned_section || '').trim();
  if (!scope) return false;
  if (['all sections (campus-wide)', 'all departments', 'all grades', 'junior & senior high school']
    .includes(scope.toLowerCase())) return true;

  const gradeNumber = Number(section.grade.match(/\d+/)?.[0]);
  const gradeOnly = scope.match(/^Grade\s+(\d+)$/i);
  if (gradeOnly) return gradeNumber === Number(gradeOnly[1]);

  const gradeRange = scope.match(/^Grades\s+(\d+)\s*-\s*(\d+)$/i);
  if (gradeRange) return gradeNumber >= Number(gradeRange[1]) && gradeNumber <= Number(gradeRange[2]);

  const exactSection = scope.match(/^Grade\s+(\d+)\s*-\s*(.+)$/i);
  if (exactSection) {
    return gradeNumber === Number(exactSection[1])
      && section.section_name.trim().toLowerCase() === exactSection[2].trim().toLowerCase();
  }
  return false;
};

if (process.argv[2] !== '--apply') {
  console.log('Dry run only. Re-run with --apply to create Supabase Auth users and staff profiles.');
  console.log(`Seed staff accounts: ${INITIAL_USERS.length}`);
  console.log('Each new account receives a different random temporary password and must change it at first sign-in.');
  process.exit(0);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  stop('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the process environment. Never put the service-role key in the frontend or commit it.');
} else if (await readFile(credentialsPath).then(() => true).catch(() => false)) {
  stop(`Refusing to overwrite existing credentials file: ${credentialsPath}`);
} else {
  let urlHost = '';
  try {
    urlHost = new URL(supabaseUrl).host;
  } catch {
    stop('SUPABASE_URL is invalid. Use the project URL from Supabase Settings → API.');
  }

  if (!process.exitCode) {
  const invalidSeed = INITIAL_USERS.find((user) => (
    !user.id || !user.name || !user.email || !expectedRoles.has(user.role)
  ));
  const emails = INITIAL_USERS.map((user) => user.email.trim().toLowerCase());
  if (invalidSeed || new Set(emails).size !== emails.length) {
    stop('The seed account list contains an invalid role, missing account field, or duplicate email. No accounts were created.');
  } else {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminAccess = await checkServiceRoleAccess(admin);
    if (adminAccess.error) {
      stop(adminAccess.error);
    }

    if (!process.exitCode) {
    const assignmentColumnProbe = await admin.from('users').select('assigned_section').limit(0);
    const hasLegacyAssignmentColumn = !assignmentColumnProbe.error;
    if (
      assignmentColumnProbe.error
      && !(
        /assigned_section/i.test(assignmentColumnProbe.error.message)
        && /(does not exist|could not find|schema cache)/i.test(assignmentColumnProbe.error.message)
      )
    ) {
      stop(`Supabase Auth is reachable at ${urlHost}, but the users schema query failed: ${assignmentColumnProbe.error.message}`);
    }

    const profilesResult = await admin
      .from('users')
      .select('id, email, is_active, must_change_password')
      .in('email', emails);

    const sectionsResult = profilesResult.error
      ? null
      : await admin
        .from('school_sections')
        .select('id, grade, section_name, academic_year');

    if (profilesResult.error) {
      const schemaIssue = profilesResult.error.code === '42703'
        || profilesResult.error.code === 'PGRST204'
        || /must_change_password|column.*(not exist|schema cache)/i.test(profilesResult.error.message);
      stop(schemaIssue
        ? `Connected to Supabase, but the staff onboarding schema is missing or incompatible. Run 20261107215000_secure_staff_auth_onboarding.sql in the SQL Editor. Details: ${profilesResult.error.message}`
        : `Connected to Supabase Auth at ${urlHost}, but could not read public.users. Check the service_role key and table/schema permissions. Details: ${profilesResult.error.message}`);
    } else if (sectionsResult.error) {
      stop(`Could not inspect school_sections before provisioning: ${sectionsResult.error.message}`);
    } else {
      let existingAuthUsers = [];
      for (let page = 1; ; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
          stop(`Could not check existing Supabase Auth accounts: ${error.message}`);
          break;
        }
        existingAuthUsers = existingAuthUsers.concat(data.users);
        if (data.users.length < 1000) break;
      }

      if (!process.exitCode) {
        const existingAuthEmails = new Set(
          existingAuthUsers.map((user) => user.email?.toLowerCase()).filter(Boolean)
        );
        const existingProfileEmails = new Set(
          (profilesResult.data || []).map((profile) => profile.email.toLowerCase())
        );
        const collisions = emails.filter((email) => (
          existingAuthEmails.has(email) || existingProfileEmails.has(email)
        ));

        if (collisions.length) {
          stop(`No accounts were created. Existing Auth/profile records need manual review first: ${collisions.join(', ')}`);
        } else {
          const createdUserIds = [];
          const credentials = [];
          const assignmentWarnings = [];
          let assignmentsCreated = 0;
          let provisioningError = null;

          for (const profile of INITIAL_USERS) {
            const temporaryPassword = `${randomBytes(24).toString('base64url')}Aa1!`;
            const { data, error } = await admin.auth.admin.createUser({
              email: profile.email.trim().toLowerCase(),
              password: temporaryPassword,
              email_confirm: true,
              user_metadata: { name: profile.name },
            });

            if (error || !data.user) {
              provisioningError = `Could not create ${profile.email}: ${error?.message || 'Supabase returned no Auth user.'}`;
              break;
            }
            createdUserIds.push(data.user.id);

            const profileRow = {
              id: data.user.id,
              email: profile.email.trim().toLowerCase(),
              name: profile.name,
              role: profile.role,
              title: profile.title || null,
              department: profile.department || null,
              avatar: profile.avatar || null,
              is_active: true,
              must_change_password: true,
            };
            if (hasLegacyAssignmentColumn) {
              profileRow.assigned_section = profile.assigned_section || null;
            }
            const { data: createdProfile, error: profileLookupError } = await admin
              .from('users')
              .select('id')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profileLookupError) {
              provisioningError = `Could not check the new staff profile for ${profile.email}: ${profileLookupError.message}`;
              break;
            }

            const { error: profileWriteError } = createdProfile
              ? await admin.from('users').update(profileRow).eq('id', data.user.id)
              : await admin.from('users').insert(profileRow);

            if (profileWriteError) {
              provisioningError = `Could not save the staff profile for ${profile.email}: ${profileWriteError.message}`;
              break;
            }

            const matchingSections = (sectionsResult.data || [])
              .filter((section) => sectionMatchesAssignment(section, profile));
            if (['adviser', 'ministrong_tagasubaybay', 'principal'].includes(profile.role)) {
              if (!matchingSections.length) {
                assignmentWarnings.push(`${profile.email}: no existing school section matched "${profile.assigned_section}".`);
              } else {
                const { error: assignmentError } = await admin
                  .from('staff_section_assignments')
                  .insert(matchingSections.map((section) => ({
                    user_id: data.user.id,
                    section_id: section.id,
                  })));
                if (assignmentError) {
                  provisioningError = `Could not create section assignments for ${profile.email}: ${assignmentError.message}`;
                  break;
                }
                assignmentsCreated += matchingSections.length;
              }
            }

            credentials.push({
              username: profile.email.trim().toLowerCase(),
              name: profile.name,
              role: profile.role,
              temporary_password: temporaryPassword,
              change_password_on_first_login: true,
            });
          }

          if (provisioningError) {
            const rollbackErrors = [];
            for (const userId of createdUserIds.reverse()) {
              const { error } = await admin.auth.admin.deleteUser(userId);
              if (error) rollbackErrors.push(`${userId}: ${error.message}`);
            }
            stop(`${provisioningError} Newly created Auth users were rolled back.${rollbackErrors.length ? ` Rollback errors: ${rollbackErrors.join('; ')}` : ''}`);
          } else {
            const credentialDocument = {
              created_at: new Date().toISOString(),
              warning: 'Contains one-time passwords. Distribute each credential privately to its named staff member, then securely delete this file.',
              accounts: credentials,
            };
            try {
              await writeFile(credentialsPath, `${JSON.stringify(credentialDocument, null, 2)}\n`, {
                encoding: 'utf8',
                flag: 'wx',
                mode: 0o600,
              });

              let envContents = '';
              try {
                envContents = await readFile(envPath, 'utf8');
              } catch (error) {
                if (error.code !== 'ENOENT') throw error;
              }
              const demoModeLine = 'VITE_HAYAGSYNC_DEMO_MODE=false';
              const updatedEnv = /^VITE_HAYAGSYNC_DEMO_MODE=.*$/m.test(envContents)
                ? envContents.replace(/^VITE_HAYAGSYNC_DEMO_MODE=.*$/m, demoModeLine)
                : `${envContents}${envContents && !envContents.endsWith('\n') ? '\n' : ''}${demoModeLine}\n`;
              await writeFile(envPath, updatedEnv, 'utf8');
              console.log(`Created ${credentials.length} Supabase staff accounts with unique temporary passwords.`);
              console.log(`Created ${assignmentsCreated} normalized staff-section assignments.`);
              if (assignmentWarnings.length) {
                console.warn(`Some accounts have no matching current school sections:\n${assignmentWarnings.join('\n')}`);
                console.warn('After the roster sections exist, assign these users to sections in Supabase before relying on section-scoped case access.');
              }
              console.log(`Private onboarding credentials: ${credentialsPath}`);
              console.log('Demo mode is now disabled in .env.local. Restart Vite before signing in.');
              console.log('These seed usernames are not verified mailboxes; password recovery by email will not work. Keep an administrator-managed recovery process.');
            } catch (error) {
              stop(`Accounts were created, but the onboarding credentials or .env.local could not be saved: ${error.message}. Do not rerun this script; inspect Supabase and handle the generated accounts with the administrator.`);
            }
          }
          }
          }
        }
      }
    }
  }
}
