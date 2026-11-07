import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 5000;
const STAFF_ROLES = new Set([
  'adviser',
  'board_of_discipline',
  'ministrong_tagasubaybay',
  'osd',
  'principal',
  'school_president',
]);
const IMPORT_ROLES = new Set(['principal']);

type StudentImportRow = {
  lrn: string;
  name: string;
  grade: string;
  section: string;
  academic_year: string;
  row_number: number | null;
};

type StaffImportRow = {
  name: string;
  email: string;
  role: string;
  assigned_section: string;
  row_number: number | null;
};

type RejectedImportRow = {
  sheet: string;
  row_number: number | null;
  identifier: string;
  reason: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const readText = (value: unknown, field: string, maxLength: number, required = false) => {
  if (value == null) {
    if (required) throw new Error(`${field} is required.`);
    return '';
  }
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  const result = value.trim();
  if (required && !result) throw new Error(`${field} is required.`);
  if (result.length > maxLength) throw new Error(`${field} exceeds ${maxLength} characters.`);
  return result;
};

const readRowNumber = (row: Record<string, unknown>) => {
  const value = row.row_number ?? row.rowNumber;
  if (value == null || value === '') return null;
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new Error('Row numbers must be positive integers.');
  }
  return Number(value);
};

const readRows = (value: unknown, label: string) => {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`${label} contains an invalid row.`);
    }
    return row as Record<string, unknown>;
  });
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization') || '';
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return jsonResponse({ error: 'A valid sign-in session is required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Missing Supabase environment configuration for append-roster.');
    return jsonResponse({ error: 'The roster import service is not configured.' }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await callerClient.auth.getUser(tokenMatch[1]);
  if (authError || !authData.user) {
    return jsonResponse({ error: 'The sign-in session is invalid or expired.' }, 401);
  }

  const { data: profile, error: profileError } = await callerClient
    .from('users')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Could not verify the roster importer profile:', profileError);
    return jsonResponse({ error: 'Could not verify your account permissions.' }, 500);
  }
  if (!profile?.is_active || !IMPORT_ROLES.has(profile.role)) {
    return jsonResponse({ error: 'Only an active Principal account can import roster data.' }, 403);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'The import request exceeds the 4 MB limit.' }, 413);
  }

  let payload: Record<string, unknown>;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'The import request exceeds the 4 MB limit.' }, 413);
    }
    payload = JSON.parse(body);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('The request body must be an object.');
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid JSON request.' }, 400);
  }

  let students: StudentImportRow[];
  let staff: StaffImportRow[];
  let rejected: RejectedImportRow[];
  let sourceFile: string;
  try {
    students = readRows(payload.students, 'Students').map((row) => ({
      lrn: readText(row.lrn, 'LRN', 12, true).replace(/\s+/g, ''),
      name: readText(row.name, 'Student name', 200, true),
      grade: readText(row.grade, 'Grade', 40, true),
      section: readText(row.section, 'Section', 100, true),
      academic_year: readText(row.academic_year, 'Academic year', 30, true),
      row_number: readRowNumber(row),
    }));
    staff = readRows(payload.staff, 'Staff').map((row) => {
      const role = readText(row.role, 'Staff role', 50, true);
      if (!STAFF_ROLES.has(role)) throw new Error('Staff row contains an unsupported role.');
      return {
        name: readText(row.name, 'Staff name', 200, true),
        email: readText(row.email, 'Staff email', 320, true).toLowerCase(),
        role,
        assigned_section: readText(row.assigned_section, 'Assigned section', 150),
        row_number: readRowNumber(row),
      };
    });
    if (students.length === 0) {
      throw new Error('The Students sheet must contain at least one current student.');
    }
    if (students.some((student) => !/^\d{11,12}$/.test(student.lrn))) {
      throw new Error('Every student LRN must contain 11 or 12 digits.');
    }
    if (new Set(students.map((student) => student.lrn)).size !== students.length) {
      throw new Error('The Students sheet contains duplicate LRNs.');
    }
    if (new Set(students.map((student) => student.academic_year)).size !== 1) {
      throw new Error('All student rows must belong to the same current academic year.');
    }
    if (new Set(staff.map((row) => row.email)).size !== staff.length) {
      throw new Error('The Staff sheet contains duplicate email addresses.');
    }
    if (staff.some((row) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))) {
      throw new Error('Every staff row must have a valid email address.');
    }
    rejected = readRows(payload.rejected, 'Rejected rows').map((row) => {
      const sheet = readText(row.sheet, 'Rejected sheet', 30, true);
      if (!['Students', 'Staff'].includes(sheet)) throw new Error('Rejected row has an unsupported sheet name.');
      return {
        sheet,
        row_number: readRowNumber(row),
        identifier: readText(row.identifier, 'Rejected-row identifier', 255),
        reason: readText(row.reason, 'Rejection reason', 1000, true),
      };
    });
    sourceFile = readText(payload.sourceFile, 'Source file name', 255, true);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid import data.' }, 400);
  }

  const rowCount = students.length + staff.length + rejected.length;
  if (rowCount < 1 || rowCount > MAX_ROWS) {
    return jsonResponse({ error: `The workbook must contain between 1 and ${MAX_ROWS} records.` }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await adminClient.rpc('append_roster_import', {
    p_source_file: sourceFile,
    p_students: students,
    p_staff: staff,
    p_rejected: rejected,
    p_actor_user_id: authData.user.id,
  });

  if (error) {
    console.error('Current roster import RPC failed:', error);
    return jsonResponse({ error: 'Import failed. No partial roster changes were committed.' }, 500);
  }
  return jsonResponse(data as Record<string, unknown>);
});
