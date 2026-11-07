// Philippine Data Privacy Act (RA 10173) compliant masking
export function maskSensitive(text, type = 'general') {
  if (!text) return '';
  const s = String(text);
  if (type === 'lrn') {
    // 10928374001 -> 1092****001
    if (s.length >= 8) {
      return s.slice(0, 4) + '****' + s.slice(-3);
    }
    return '****';
  }
  if (type === 'phone') {
    // +63 917 234 5678 -> +63 917 *** 5678
    return s.replace(/(\+?\d{2,4}\s*\d{3})\s*\d{3}(\s*\d{4})/, '$1 ***$2');
  }
  if (type === 'email') {
    const parts = s.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const maskedName = name.length > 2 ? name[0] + '***' + name.slice(-1) : '***';
      return `${maskedName}@${parts[1]}`;
    }
  }
  return s;
}

// Convert incident objects to CSV content
export function exportIncidentsToCSV(incidents, isMasked = false) {
  const headers = [
    'Case Number',
    'Student Name',
    'Student LRN',
    'Grade & Section',
    'Category',
    'Severity',
    'Status',
    'Incident Date',
    'Location',
    'Reporter',
    'Handler',
    'Description',
    'Remarks'
  ];

  const rows = incidents.map((inc) => [
    `"${inc.case_number}"`,
    `"${inc.student_name}"`,
    `"${isMasked ? maskSensitive(inc.student_lrn, 'lrn') : inc.student_lrn}"`,
    `"${inc.section}"`,
    `"${inc.category}"`,
    `"${inc.severity}"`,
    `"${inc.status}"`,
    `"${new Date(inc.incident_date).toLocaleString('en-PH')}"`,
    `"${(inc.incident_location || '').replace(/"/g, '""')}"`,
    `"${inc.reporter_name} (${inc.reporter_role})"`,
    `"${inc.handler_name || 'Unassigned'}"`,
    `"${(inc.description || '').replace(/"/g, '""')}"`,
    `"${(inc.remarks || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

// Trigger browser download
export function downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
