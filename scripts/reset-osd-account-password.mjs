import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const email = 'osd@hayag.edu.ph';
const expectedRole = 'osd';
const applyChanges = process.argv.includes('--apply');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stop = (message) => {
  console.error(message);
  process.exitCode = 1;
};

if (!supabaseUrl || !serviceRoleKey) {
  stop('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the process environment.');
} else {
  let url;
  try {
    url = new URL(supabaseUrl);
  } catch {
    stop('SUPABASE_URL is invalid.');
  }

  if (!process.exitCode && (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co'))) {
    stop('SUPABASE_URL must be an HTTPS Supabase project URL.');
  }

  if (!process.exitCode) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      const { data: profiles, error: profileError } = await admin
        .from('users')
        .select('id, email, role, is_active, must_change_password')
        .eq('email', email);

      if (profileError) {
        stop(`Could not verify the staff profile: ${profileError.message}`);
      } else if (profiles.length !== 1 || profiles[0].role !== expectedRole || !profiles[0].is_active) {
        stop('No unique active OSD profile matched this account. No changes were made.');
      } else {
        const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (authError) {
          stop(`Could not verify the Supabase Auth account: ${authError.message}`);
        } else {
          const matches = authUsers.users.filter((user) => user.email?.toLowerCase() === email);
          if (matches.length !== 1 || matches[0].id !== profiles[0].id) {
            stop('No unique matching Supabase Auth account was found. No changes were made.');
          } else if (!applyChanges) {
            console.log(`Verified existing account ${email} and its active OSD profile.`);
            console.log('Dry run only. Re-run through the PowerShell helper and confirm RESET to continue.');
          } else {
            const temporaryPassword = `${randomBytes(24).toString('base64url')}Aa1!`;
            const profile = profiles[0];
            const { error: flagError } = await admin
              .from('users')
              .update({ must_change_password: true })
              .eq('id', profile.id)
              .eq('role', expectedRole)
              .eq('is_active', true);

            if (flagError) {
              stop(`Could not require a password change. The existing password was not changed: ${flagError.message}`);
            } else {
              const { error: passwordError } = await admin.auth.admin.updateUserById(profile.id, {
                password: temporaryPassword,
              });

              if (passwordError) {
                const { error: rollbackError } = await admin
                  .from('users')
                  .update({ must_change_password: profile.must_change_password })
                  .eq('id', profile.id)
                  .eq('role', expectedRole)
                  .eq('is_active', true);
                stop(`Could not reset the Auth password: ${passwordError.message}${rollbackError ? ` Also could not restore the password-change flag: ${rollbackError.message}` : ''}`);
              } else {
                console.log(`Password reset completed for ${email}.`);
                console.log('Give this temporary password directly to the account owner. It will be shown only once:');
                console.log(temporaryPassword);
                console.log('They must set a new password at their next sign-in.');
              }
            }
          }
        }
      }
    } catch (error) {
      stop(`Password reset failed: ${error.message || 'Unexpected error.'}`);
    }
  }
}
