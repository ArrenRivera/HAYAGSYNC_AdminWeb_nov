import React, { useState } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import ProfileAvatar from '../components/common/ProfileAvatar';
import { Settings, PlusCircle, Shield, Users, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { settings, addCategory, addSection } = useIncidents();
  const { usersList, isOSD } = useAuth();

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatSev, setNewCatSev] = useState('Moderate');

  const [newSectionName, setNewSectionName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      severity_default: newCatSev,
    });

    setNewCatName('');
    setNewCatDesc('');
    setSuccessMsg('New offense category created successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    addSection(newSectionName.trim());
    setNewSectionName('');
    setSuccessMsg('Section added to school roster.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#0f2444] dark:text-blue-400" /> Administrative System Settings
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Configure institutional disciplinary policies, offense categories, and authorized school personnel.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl text-base font-bold flex items-center gap-3 border-2 border-emerald-300">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Offense Categories Manager */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0f2444] dark:text-blue-400" /> Bullying & Offense Categories
            </h3>
            <span className="text-sm text-slate-500 font-semibold">{settings.categories.length} registered</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
            {settings.categories.map((cat) => (
              <div key={cat.id} className="pt-3 pb-2 text-[15px]">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-slate-100 text-base">{cat.name}</span>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                    {cat.severity_default} Severity
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{cat.description}</p>
              </div>
            ))}
          </div>

          {/* Add Category Form (Single-Column, Visible Labels) */}
          {isOSD && (
            <form onSubmit={handleAddCategory} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-white block">
                Add Custom Offense Category
              </h4>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Offense Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberbullying / Online Harassment"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Severity Classification
                </label>
                <select
                  value={newCatSev}
                  onChange={(e) => setNewCatSev(e.target.value)}
                  className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0f2444]"
                >
                  <option value="Low">Low Severity (Warning / Reprimand)</option>
                  <option value="Moderate">Moderate Severity (Parent Conference / Service)</option>
                  <option value="High">High Severity (Suspension / Formal Sanction)</option>
                  <option value="Critical">Critical Severity (Expulsion Review Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Description & Legal Guidelines
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bullying through social networks, extortion, or verbal intimidation"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0f2444] hover:bg-[#1a365d] text-white rounded-lg text-base font-bold shadow-sm transition"
              >
                Save New Offense Category
              </button>
            </form>
          )}
        </div>

        {/* 2. Registered Staff & Admin Role Matrix */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0f2444] dark:text-blue-400" /> Authorized Roles & Discipline Officials
            </h3>
            <span className="text-sm text-slate-500 font-semibold">Strict Role-Based Access</span>
          </div>

          <div className="space-y-3">
            {usersList.map((u) => (
              <div key={u.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <ProfileAvatar src={u.avatar} name={u.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{u.title}</p>
                  <p className="text-xs text-[#0f2444] dark:text-blue-400 font-mono mt-0.5">{u.email}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase shrink-0 ${
                  u.role === 'osd'
                    ? 'bg-purple-100 text-purple-900 border-purple-200'
                    : 'bg-blue-100 text-blue-900 border-blue-200'
                }`}>
                  {u.role === 'osd' ? 'OSD Head' : 'Ministro Admin'}
                </span>
              </div>
            ))}
          </div>

          {/* Institutional Grade & Section Directory */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-white block">
                Active Advisory Sections ({settings.sections.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 p-2 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
              {settings.sections.map((sec, idx) => (
                <span key={idx} className="px-3 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                  {sec}
                </span>
              ))}
            </div>

            {isOSD && (
              <form onSubmit={handleAddSection} className="space-y-2 pt-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Register New Advisory Section
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10 - Molave"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0f2444]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0f2444] hover:bg-[#1a365d] text-white rounded-lg text-base font-bold shrink-0 transition"
                  >
                    Add Section
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
