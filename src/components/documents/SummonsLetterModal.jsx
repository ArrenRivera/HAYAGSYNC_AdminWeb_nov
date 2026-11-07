import React, { useRef } from 'react';
import Modal from '../common/Modal';
import { Printer, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function SummonsLetterModal({ isOpen, onClose, incident }) {
  const printAreaRef = useRef(null);

  if (!incident) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const conferenceDateStr = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Guardian Summons & Dialogue Notice (Pormal na Paanyaya)"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Printable Letterhead Paper */}
        <div
          ref={printAreaRef}
          className="p-8 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-inner font-serif print-shadow-none text-sm space-y-5"
        >
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-800 pb-4 font-sans">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-600">
              Republic of the Philippines • Department of Education
            </p>
            <p className="text-xs font-bold text-slate-700">National Capital Region • Division of City Schools</p>
            <h1 className="text-lg font-black tracking-tight text-slate-900 mt-1 uppercase">
              HAYAG INTEGRATED HIGH SCHOOL
            </h1>
            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mt-0.5">
              OFFICE OF STUDENT DISCIPLINE & CHILD PROTECTION COMMITTEE
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              REF NO: HHS-OSD-NOTICE-{new Date().getFullYear()}-{incident.case_number.replace('INC-', '')}
            </p>
          </div>

          {/* Date & Addressee */}
          <div className="space-y-1 font-sans text-xs">
            <p className="font-semibold text-right">{todayStr}</p>
            <p className="font-bold text-slate-900">TO THE PARENTS / GUARDIANS OF:</p>
            <p className="font-bold text-sm uppercase text-slate-900">{incident.student_name}</p>
            <p className="text-slate-600">Section: {incident.section} • LRN: {incident.student_lrn}</p>
          </div>

          {/* Subject Line */}
          <div className="bg-slate-100 p-2.5 rounded font-sans text-xs font-bold border-l-4 border-slate-800">
            SUBJECT: URGENT PARENT-TEACHER DIALOGUE & CASE CONFERENCE REGARDING CAMPUS INCIDENT ({incident.case_number})
          </div>

          {/* Body */}
          <div className="space-y-3 leading-relaxed text-xs">
            <p>Dear Parent / Guardian,</p>
            <p>
              Greetings of Peace and Constructive Discipline!
            </p>
            <p>
              In accordance with <strong>DepEd Order No. 40, s. 2012 (Child Protection Policy)</strong> and the institutional regulations of Hayag High School, this formal notice is hereby issued requesting your personal presence for an administrative case dialogue concerning your child, <strong>{incident.student_name}</strong>.
            </p>
            <p>
              The Office of Student Discipline has registered an incident report dated{' '}
              <strong>{new Date(incident.incident_date).toLocaleDateString('en-PH')}</strong> involving an alleged{' '}
              <strong>{incident.category}</strong> incident occurring at <strong>{incident.incident_location}</strong>.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 font-sans">
              <p><strong>Scheduled Conference Date:</strong> {conferenceDateStr} (Thursday)</p>
              <p><strong>Conference Time:</strong> 10:00 AM Philippine Standard Time</p>
              <p><strong>Location:</strong> OSD Dialogue Room 104, 1st Floor Administration Building</p>
              <p><strong>Presiding Officers:</strong> Atty. Roberto Mendoza (OSD Head) & Gng. Corazon Alcantara (Guidance)</p>
            </div>
            <p>
              Your personal presence is indispensable to ensure the safety, well-being, and due process rights of all students involved. Please bring a valid government-issued ID upon arrival at the campus entrance gate.
            </p>
            <p>
              For urgent confirmations or rescheduling inquiries, you may contact the Office of Student Discipline via the school trunkline or through the HayagSync official mobile portal.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs font-sans">
            <div>
              <p className="text-slate-500 mb-10">Prepared & Issued By:</p>
              <p className="font-bold uppercase text-slate-900">ATTY. ROBERTO MENDOZA</p>
              <p className="text-[11px] text-slate-600">Head, Office of Student Discipline</p>
            </div>
            <div>
              <p className="text-slate-500 mb-10">Noted & Approved By:</p>
              <p className="font-bold uppercase text-slate-900">DR. ALICIA MAGALONG, CESO V</p>
              <p className="text-[11px] text-slate-600">Principal IV, Hayag Integrated High School</p>
            </div>
          </div>

          {/* Data Privacy Notice Footer */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 font-sans text-center">
            CONFIDENTIAL DOCUMENT: In compliance with RA 10173 (Data Privacy Act of 2012), this notice contains private records of a minor student and is intended solely for the designated guardian.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Form generated automatically from official DepEd incident records.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close Window
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 text-base font-bold rounded-lg bg-[#0f2444] hover:bg-[#1a365d] text-white shadow-sm flex items-center gap-2 transition"
            >
              <Printer className="w-5 h-5" /> Print Official Notice to Paper or PDF
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
