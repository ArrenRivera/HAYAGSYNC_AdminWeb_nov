import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';

export default function IncidentFormModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { students, settings, createIncident } = useIncidents();

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(settings.categories[0]?.name || 'Physical Bullying');
  const [severity, setSeverity] = useState('Moderate');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState('Classroom');
  const [allegedOffender, setAllegedOffender] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeStudentId = selectedStudentId || students[0]?.id || '';
  const selectedStudent = students.find((s) => s.id === activeStudentId);

  const locationsList = [
    'Classroom',
    'Main School Canteen',
    '2nd Floor Academic Hallway',
    'Gymnasium / Basketball Court',
    'Campus Restrooms',
    'Playground / Open Field',
    'School Perimeter / Gate Entrance',
    'Online / Social Media Group Chat',
    'Other School Premises',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !selectedStudent) return;

    setIsSaving(true);
    setErrorMessage('');
    try {
      await createIncident({
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
        reporter_name: currentUser?.name || 'Staff Member',
        reporter_role: currentUser?.title || 'Reporter',
        remarks: 'Report registered in system.',
      });

      setTitle('');
      setDescription('');
      setAllegedOffender('');
      setWitnesses('');
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'The report could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log New Incident Report" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        {/* Student Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Student Subject / Victim *
            </label>
            <select
              value={activeStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              disabled={students.length === 0 || isSaving}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Class Section & Grade
            </label>
            <input
              type="text"
              readOnly
              value={selectedStudent ? `${selectedStudent.grade} - ${selectedStudent.section}` : ''}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Incident Headline / Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Verbal Altercation & Social Intimidation during Lunch..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Offense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-semibold"
            >
              <option value="Low">Low Severity (Minor classroom concern)</option>
              <option value="Moderate">Moderate Severity (Repeated teasing / disruptive)</option>
              <option value="High">High Severity (Physical assault / extortion / cyber)</option>
              <option value="Critical">Critical Severity (Weapons / severe injury / emergency)</option>
            </select>
          </div>
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Date & Time of Occurrence *
            </label>
            <input
              type="datetime-local"
              required
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Campus Location *
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alleged Offender & Witnesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Alleged Bully / Offender (if identified)
            </label>
            <input
              type="text"
              value={allegedOffender}
              onChange={(e) => setAllegedOffender(e.target.value)}
              placeholder="e.g. Student Name or Unknown Group"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Witnesses (Mga Saksi)
            </label>
            <input
              type="text"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
              placeholder="e.g. Ms. Santos, Guard Danilo, Classmates"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Detailed Narrative / Statement *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what occurred chronologically, actions taken immediately, and current condition of the student..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Secure evidence upload is not connected yet. Do not enter or attach sensitive files here.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || students.length === 0}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Submit Incident Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
