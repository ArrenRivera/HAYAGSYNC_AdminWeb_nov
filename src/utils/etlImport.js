const STUDENT_HEADERS = ['lrn', 'name', 'grade', 'section', 'academic year'];
const STAFF_HEADERS = ['name', 'email', 'role'];
const STAFF_ROLES = new Set([
  'adviser',
  'board_of_discipline',
  'ministrong_tagasubaybay',
  'osd',
  'principal',
  'school_president',
]);

const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const getCellText = (value) => {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
};

const readSheet = (sheet, entityType, requiredHeaders) => {
  if (!sheet || !sheet.data?.length) {
    throw new Error(`The workbook is missing a non-empty ${entityType} sheet.`);
  }

  const headers = sheet.data[0].map(normalizeHeader);
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`${sheet.sheet} sheet is missing required columns: ${missingHeaders.join(', ')}.`);
  }

  const rows = [];
  for (let index = 1; index < sheet.data.length; index += 1) {
    const rowValues = sheet.data[index];
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, getCellText(rowValues[columnIndex])]));
    if (Object.values(record).every((value) => !value)) continue;
    rows.push({ rowNumber: index + 1, record });
  }
  return rows;
};

export function parseRosterSheets(sheets) {
  const studentSheet = sheets.find((sheet) => normalizeHeader(sheet.sheet) === 'students');
  const staffSheet = sheets.find((sheet) => normalizeHeader(sheet.sheet) === 'staff');
  const studentRows = readSheet(studentSheet, 'Students', STUDENT_HEADERS);
  const staffRows = readSheet(staffSheet, 'Staff', STAFF_HEADERS);
  if (studentRows.length + staffRows.length > 5000) {
    throw new Error('The workbook must contain no more than 5000 non-empty data rows.');
  }

  const seenLrns = new Set();
  const seenEmails = new Set();
  const students = [];
  const staff = [];
  const rejected = [];

  studentRows.forEach(({ rowNumber, record }) => {
    const lrn = record.lrn.replace(/\s+/g, '');
    const normalizedLrn = lrn.toLowerCase();
    const issues = [];
    if (!/^\d{11,12}$/.test(lrn)) issues.push('LRN must contain 11 or 12 digits.');
    if (!record.name) issues.push('Name is required.');
    if (!record.grade) issues.push('Grade is required.');
    if (!record.section) issues.push('Section is required.');
    if (!record['academic year']) issues.push('Academic Year is required.');
    if (record.name.length > 200) issues.push('Name must be 200 characters or fewer.');
    if (record.grade.length > 40) issues.push('Grade must be 40 characters or fewer.');
    if (record.section.length > 100) issues.push('Section must be 100 characters or fewer.');
    if (record['academic year'].length > 30) issues.push('Academic Year must be 30 characters or fewer.');
    if (seenLrns.has(normalizedLrn)) issues.push('Duplicate LRN in this workbook.');
    seenLrns.add(normalizedLrn);

    if (issues.length) {
      rejected.push({ sheet: 'Students', rowNumber, identifier: lrn || 'Blank LRN', reason: issues.join(' ') });
      return;
    }

    students.push({
      lrn,
      name: record.name,
      grade: record.grade,
      section: record.section,
      academic_year: record['academic year'],
      row_number: rowNumber,
    });
  });

  staffRows.forEach(({ rowNumber, record }) => {
    const email = record.email.toLowerCase();
    const suppliedRole = normalizeHeader(record.role).replace(/[\s-]+/g, '_');
    const role = suppliedRole === 'section_adviser' ? 'adviser' : suppliedRole;
    const issues = [];
    if (!record.name) issues.push('Name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push('A valid email is required.');
    if (!STAFF_ROLES.has(role)) issues.push('Role must be one of the supported school staff roles.');
    if (record.name.length > 200) issues.push('Name must be 200 characters or fewer.');
    if (email.length > 320) issues.push('Email must be 320 characters or fewer.');
    if (record['assigned section']?.length > 150) issues.push('Assigned Section must be 150 characters or fewer.');
    if (seenEmails.has(email)) issues.push('Duplicate email in this workbook.');
    seenEmails.add(email);

    if (issues.length) {
      rejected.push({ sheet: 'Staff', rowNumber, identifier: email || 'Blank email', reason: issues.join(' ') });
      return;
    }

    staff.push({
      name: record.name,
      email,
      role,
      row_number: rowNumber,
      assigned_section: record['assigned section'] || '',
    });
  });

  if (students.length === 0) {
    throw new Error('The Students sheet must contain at least one valid current student row.');
  }
  if (new Set(students.map((student) => student.academic_year)).size !== 1) {
    throw new Error('All student rows must belong to the same current academic year.');
  }

  return {
    students,
    staff,
    rejected,
    totalRows: studentRows.length + staffRows.length,
  };
}

export async function parseRosterWorkbook(file) {
  if (!file || !/\.xlsx$/i.test(file.name)) {
    throw new Error('Please select an Excel workbook in .xlsx format.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('The workbook must be 10 MB or smaller.');
  }

  const { default: readXlsxFile } = await import('read-excel-file/browser');
  return parseRosterSheets(await readXlsxFile(file));
}
