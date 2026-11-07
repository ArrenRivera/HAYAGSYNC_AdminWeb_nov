import React, { useState } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function SubmitReportPage({ onReturn }) {
  const { students, settings, createIncident } = useIncidents();
  const { currentUser } = useAuth();

  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(settings.categories[0]?.name || 'Physical Bullying');
  const [severity, setSeverity] = useState('Moderate');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState('Classroom');
  const [allegedOffender, setAllegedOffender] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterRole, setReporterRole] = useState(currentUser?.title || 'Faculty / Reporter');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submittedCase, setSubmittedCase] = useState(null);

  const activeStudentId = studentId || students[0]?.id || '';
  const selectedStudent = students.find((student) => student.id === activeStudentId);
  const section = selectedStudent ? `${selectedStudent.grade} - ${selectedStudent.section}` : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !selectedStudent) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const newInc = await createIncident({
        student_id: selectedStudent.id,
        numeric_student_id: selectedStudent.numeric_id,
        student_academic_year: selectedStudent.academic_year,
        student_name: selectedStudent.name,
        student_lrn: selectedStudent.lrn,
        grade: selectedStudent.grade,
        section: selectedStudent.section,
        title: title.trim(),
        category,
        severity,
        incident_date: incidentDate,
        incident_location: location,
        alleged_offender: allegedOffender.trim(),
        witnesses: witnesses.trim(),
        description: description.trim(),
        reporter_name: reporterName.trim() || 'Staff Member',
        reporter_role: reporterRole.trim() || 'Reporter',
        remarks: 'Filed via Staff Report Submission Portal.',
      });
      setSubmittedCase(newInc);
    } catch (error) {
      setErrorMessage(error.message || 'The report could not be saved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedCase(null);
    setTitle('');
    setDescription('');
    setStudentId(students[0]?.id || '');
    setAllegedOffender('');
    setWitnesses('');
  };

  // If submitted, show confirmation receipt ONLY
  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              Ulat Matagumpay na Naisumite (Report Submitted)
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
              Incident Report Confirmation
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Your confidential report has been securely transmitted to the Office of Student Discipline and Ministrong Tagasubaybay.
            </p>
          </div>

          {/* Reference Receipt Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs text-slate-400 font-semibold uppercase">Tracking Reference Number</span>
              <span className="font-mono text-base font-extrabold text-teal-600 dark:text-teal-400">
                {submittedCase.case_number}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Student / Subject:</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{submittedCase.student_name}</span>
                <span className="text-[11px] text-slate-500">{submittedCase.section}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Offense Category:</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{submittedCase.category}</span>
                <span className="text-[11px] text-slate-500">{submittedCase.severity} Severity</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date & Time Filed:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {new Date(submittedCase.created_at).toLocaleString('en-PH')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status:</span>
                <span className="font-bold text-blue-600 mt-0.5 block">Recent Report (Under Initial Intake)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <span>
              <strong>Confidentiality Notice:</strong> In compliance with the Philippine Data Privacy Act, previous case records and ongoing hearing details remain strictly confidential and cannot be displayed to reporters.
            </span>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              Submit Another Report
            </button>
            {onReturn && (
              <button
                onClick={onReturn}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-teal-600" /> File Student Incident Report
          </h1>
          <p className="text-xs text-slate-500">
            Official portal for teachers, guards, advisers, and students to document campus incidents
          </p>
        </div>
        {onReturn && (
          <button
            onClick={onReturn}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {errorMessage && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        {/* Student Name & Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Student Victim / Involved Student *
            </label>
            <select
              required
              value={activeStudentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={students.length === 0 || isSubmitting}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Select an active roster student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade} - {student.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Grade & Section *
            </label>
            <input
              type="text"
              readOnly
              value={section}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Report Title / Summary Headline *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Observed Verbal Harassment at 2nd Floor Hallway"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Offense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {settings.categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Estimated Severity Level *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="Low">Low Severity</option>
              <option value="Moderate">Moderate Severity</option>
              <option value="High">High Severity</option>
              <option value="Critical">Critical Severity</option>
            </select>
          </div>
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Date & Time Observed *
            </label>
            <input
              type="datetime-local"
              required
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Specific Location *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Canteen East Entrance, Gym Bleachers, Room 204"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Offender and Witnesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Alleged Bully / Offender (if known)
            </label>
            <input
              type="text"
              value={allegedOffender}
              onChange={(e) => setAllegedOffender(e.target.value)}
              placeholder="e.g. Student Name or Unknown Group"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Witnesses Present
            </label>
            <input
              type="text"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
              placeholder="e.g. Co-teachers, Security Guard, Classmates"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Narrative Description */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Detailed Narrative / Description *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please detail the observed actions, words spoken, physical contact, immediate intervention, and condition of the student..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Reporter Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Your Name (Reporter)
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Enter your name or leave blank for Anonymous"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Designation / Role
            </label>
            <input
              type="text"
              value={reporterRole}
              onChange={(e) => setReporterRole(e.target.value)}
              placeholder="e.g. Class Adviser, Teacher, Security Guard, Student"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Secure evidence upload is not connected yet. Do not enter or attach sensitive files here.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || students.length === 0}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Submit Confidential Incident Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
