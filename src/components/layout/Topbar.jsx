import React, { useState, useRef, useEffect } from 'react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { searchStudents } from '../../utils/searchUtils';
import ProfileAvatar from '../common/ProfileAvatar';
import ProfileAvatarButton from '../common/ProfileAvatarButton';
import {
  Search,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  Type,
  UserCheck,
  ChevronDown
} from 'lucide-react';

export default function Topbar({
  onSelectStudent,
  onOpenNotifications,
  darkMode,
  setDarkMode,
  textScale = 'normal',
  onTextScaleChange,
  onOpenTour,
}) {
  const { students, notifications } = useIncidents();
  const { currentUser, isOSD, isMinistro, isPrincipal, isAdviser, isBoard, isPresident } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 1) {
      const results = searchStudents(students, val, 6);
      setSuggestions(results);
      setIsSearching(true);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const handleSelectStudent = (student) => {
    setQuery('');
    setIsSearching(false);
    if (onSelectStudent) {
      onSelectStudent(student);
    }
  };

  // Font size scaler
  const increaseFontSize = () => {
    if (textScale === 'normal') onTextScaleChange && onTextScaleChange('large');
    else if (textScale === 'large') onTextScaleChange && onTextScaleChange('xlarge');
  };

  const decreaseFontSize = () => {
    if (textScale === 'xlarge') onTextScaleChange && onTextScaleChange('large');
    else if (textScale === 'large') onTextScaleChange && onTextScaleChange('normal');
  };

  const getTextScaleLabel = () => {
    if (textScale === 'xlarge') return 'Extra Large';
    if (textScale === 'large') return 'Large';
    return 'Standard';
  };

  return (
    <header className="min-h-[72px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 shrink-0 z-30 transition-colors shadow-xs">
      {/* 1. Large, always-visible search box (Main feature) */}
      <div className="relative flex-1 min-w-[280px] max-w-xl" ref={searchRef}>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => query.trim().length >= 1 && setIsSearching(true)}
            placeholder="Search student name, ID, or section..."
            className="w-full pl-12 pr-4 py-3 text-base bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-900 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none transition-all shadow-inner"
            aria-label="Search student name, ID, or section"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-300 dark:border-slate-700 overflow-hidden z-50">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex justify-between items-center">
              <span>Matching Student Records</span>
              <span>{suggestions.length} student(s) found</span>
            </div>

            {suggestions.length > 0 ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {suggestions.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-blue-50 dark:hover:bg-slate-800 text-left transition"
                  >
                    <ProfileAvatar
                      src={student.avatar}
                      name={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {student.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>{student.section}</span>
                        <span>•</span>
                        <span className="font-mono text-xs font-semibold">LRN: {student.lrn}</span>
                      </p>
                    </div>
                    {student.status === 'Expelled' && (
                      <span className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-md font-bold">
                        Expelled
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">
                No matching students found for "{query}". Please check the spelling or 12-digit LRN.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Right Controls: Font Scaling, Help, Notifications, User Info */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        {/* A+ / A- Font Size Adjustment Control */}
        <div
          className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1"
          title="Adjust Text Size for Readability"
        >
          <button
            type="button"
            onClick={decreaseFontSize}
            disabled={textScale === 'normal'}
            className="px-2.5 py-1 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-40"
            title="Decrease Text Size (A-)"
          >
            A-
          </button>
          <span className="px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none">
            {getTextScaleLabel()}
          </span>
          <button
            type="button"
            onClick={increaseFontSize}
            disabled={textScale === 'xlarge'}
            className="px-2.5 py-1 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-40"
            title="Increase Text Size (A+)"
          >
            A+
          </button>
        </div>

        {/* Help & Guided Tour Button */}
        <button
          type="button"
          onClick={onOpenTour}
          className="px-3 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition shadow-xs"
          title="Open User Guide and Tour"
        >
          <HelpCircle className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          <span className="hidden md:inline">Help & Tour</span>
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs"
          title="View Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Subtle Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* User Name & Role Banner (Clear & Legible) */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <ProfileAvatarButton
            key={`${currentUser?.id}-${currentUser?.email}-${currentUser?.phone}`}
            src={currentUser?.avatar}
            name={currentUser?.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-900/30 dark:border-blue-400 shrink-0"
          />
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {currentUser?.name}
            </p>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 truncate">
              {isAdviser
                ? `Section Adviser • ${currentUser?.assigned_section || ''}`
                : isPrincipal
                ? `School Principal • ${currentUser?.assigned_section || (currentUser?.email?.includes('jhs') ? 'Grades 7–10' : 'Grades 11–12')}`
                : isMinistro
                ? `Ministrong Tagasubaybay • ${currentUser?.assigned_section || 'Assigned Grade'}`
                : isOSD
                ? `OSD Discipline Officer • ${currentUser?.assigned_section || 'Campus Disciplinary Head'}`
                : isBoard
                ? 'Board of Discipline'
                : isPresident
                ? 'School President'
                : currentUser?.title || 'Staff Official'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
