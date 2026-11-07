import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import Modal from '../components/common/Modal';
import {
  Scale,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Users,
  Loader2,
  Gavel
} from 'lucide-react';

export default function LoginPage() {
  const { authenticate, requestPasswordReset, verifyPhoneRecovery, usersList, authError, demoMode } = useAuth();
  const { createAnonymousReport } = useIncidents();

  // Login form state
  const [email, setEmail] = useState('principal.jhs@hayag.edu.ph');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState('email');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Directory filter tabs: 'principals' | 'advisers' | 'osd' | 'ministro' | 'executives'
  const [directoryTab, setDirectoryTab] = useState('principals');
  const [directoryGradeFilter, setDirectoryGradeFilter] = useState('ALL');

  // Anonymous Report Modal State
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);
  const [anonSubmitting, setAnonSubmitting] = useState(false);
  const [anonSuccessCaseNum, setAnonSuccessCaseNum] = useState('');
  const [anonCategory, setAnonCategory] = useState('Physical Bullying');
  const [anonTitle, setAnonTitle] = useState('');
  const [anonDescription, setAnonDescription] = useState('');
  const [anonDate, setAnonDate] = useState(new Date().toISOString().substring(0, 10));
  const [anonLocation, setAnonLocation] = useState('Classroom');
  const [anonCustomLocation, setAnonCustomLocation] = useState('');
  const [anonUrgency, setAnonUrgency] = useState('Moderate');
  const [anonVictimName, setAnonVictimName] = useState('');
  const [anonVictimGrade, setAnonVictimGrade] = useState('Grade 7');
  const [anonVictimSection, setAnonVictimSection] = useState('Grade 7 - Mahogany');
  const [anonBullyName, setAnonBullyName] = useState('');
  const [anonBullyGradeSection, setAnonBullyGradeSection] = useState('');
  const [anonWitnesses, setAnonWitnesses] = useState('');
  const [anonError, setAnonError] = useState('');

  const resetAnonForm = () => {
    setAnonTitle('');
    setAnonDescription('');
    setAnonLocation('Classroom');
    setAnonCustomLocation('');
    setAnonVictimName('');
    setAnonBullyName('');
    setAnonBullyGradeSection('');
    setAnonWitnesses('');
    setAnonError('');
    setAnonSuccessCaseNum('');
  };

  const handleAnonymousSubmit = async (e) => {
    e.preventDefault();
    if (!anonDescription.trim()) {
      setAnonError('Please provide details regarding the incident.');
      return;
    }
    setAnonSubmitting(true);
    setAnonError('');
    try {
      const finalLocation =
        anonLocation === 'Other / Off-Campus Setting' && anonCustomLocation.trim()
          ? anonCustomLocation.trim()
          : anonLocation;

      const res = await createAnonymousReport({
        title: anonTitle.trim() || `${anonCategory} Incident Report (Anonymous)`,
        category: anonCategory,
        description: anonDescription.trim(),
        incident_date: anonDate,
        incident_location: finalLocation || 'School Grounds',
        urgency_level: anonUrgency,
        student_name: anonVictimName.trim() || 'Unspecified Student',
        student_grade: anonVictimGrade,
        student_section: anonVictimSection,
        bully_name: anonBullyName.trim() || null,
        bully_grade_section: anonBullyGradeSection.trim() || null,
        witnesses: anonWitnesses.trim() ? anonWitnesses.split(',').map((w) => w.trim()).filter(Boolean) : [],
      });
      setAnonSuccessCaseNum(res.case_number);
    } catch (error) {
      setAnonError(error.message || 'Failed to submit report. Please check connection and try again.');
    } finally {
      setAnonSubmitting(false);
    }
  };

  const handleLogin = async (e, credentials = {}) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await authenticate(credentials.email ?? email, credentials.password ?? password);
      if (!result.success) {
        setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMsg('Login network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryRequest = async (event) => {
    event.preventDefault();
    setRecoveryMessage('');
    setIsRecovering(true);
    try {
      const result = await requestPasswordReset(recoveryIdentifier, recoveryMethod);
      if (!result.success) {
        setRecoveryMessage(result.error);
      } else if (recoveryMethod === 'phone') {
        setRecoveryPhone(result.phone);
        setRecoveryCodeSent(true);
        setRecoveryMessage('If this verified phone is linked to an account, an SMS code has been sent.');
      } else {
        setRecoveryMessage('If this verified email is linked to an account, a password reset link will be sent.');
      }
    } catch (error) {
      setRecoveryMessage(error.message || 'Could not request password recovery. Please try again.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRecoveryCodeSubmit = async (event) => {
    event.preventDefault();
    setRecoveryMessage('');
    setIsRecovering(true);
    try {
      const result = await verifyPhoneRecovery(recoveryPhone, recoveryCode);
      if (!result.success) setRecoveryMessage(result.error);
    } catch (error) {
      setRecoveryMessage(error.message || 'Could not verify the recovery code. Please try again.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSelectAccount = (accEmail) => {
    if (demoMode) {
      setEmail(accEmail);
      setPassword('password123');
      void handleLogin(null, { email: accEmail, password: 'password123' });
      return;
    }
    setEmail(accEmail);
    setErrorMsg('');
  };

  // Staff accounts from usersList filtered by directory category
  const principalsList = usersList.filter((u) => u.role === 'principal');
  const advisersList = usersList.filter((u) => u.role === 'adviser');
  const osdList = usersList.filter((u) => u.role === 'osd');
  const ministroList = usersList.filter((u) => u.role === 'ministrong_tagasubaybay');
  const executiveList = usersList.filter((u) => u.role === 'board_of_discipline' || u.role === 'school_president');

  const filteredAdvisers = advisersList.filter((a) => {
    if (directoryGradeFilter === 'ALL') return true;
    return (a.assigned_section || '').toLowerCase().includes(directoryGradeFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 select-none text-slate-900 font-sans">
      {/* Institutional Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f2444] text-white shadow-md font-black text-2xl tracking-wider border border-blue-900/40">
          H
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2444] tracking-tight">
          HAYAGSYNC WEB
        </h1>
        <p className="text-sm font-semibold text-slate-600">
          Department of Education • Disciplinary Administrative Console & Incident Management Portal
        </p>
      </div>

      {/* Main Authentication Grid */}
      <div className={`mt-6 sm:mx-auto sm:w-full ${
        usersList.length > 0
          ? 'sm:max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch'
          : 'sm:max-w-md'
      }`}>
        {/* Left Column: Direct Authentication Form (5 cols) */}
        <div className={`${usersList.length > 0 ? 'lg:col-span-5' : ''} bg-white py-7 px-6 sm:px-8 shadow-md rounded-2xl border border-slate-300 space-y-5`}>
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-[#0f2444] flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-900" />
              <span>Official Staff Login</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sign in with your school account to access the administrative dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Username / Email / Phone *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="Username, verified email, or phone (+639...)"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2444] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Account Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2444] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(errorMsg || authError) && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 font-semibold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{errorMsg || authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0f2444] hover:bg-[#1b365d] disabled:opacity-70 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {!demoMode && (
            <section className="border-t border-slate-200 pt-4">
              {!forgotPasswordOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(true);
                    setRecoveryIdentifier(email.includes('@') && !email.endsWith('@hayag.edu.ph') ? email : '');
                    setRecoveryMessage('');
                  }}
                  className="text-sm font-semibold text-blue-900 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Recover your account</h3>
                  {!recoveryCodeSent ? (
                    <form onSubmit={handleRecoveryRequest} className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        Send recovery link/code to
                        <select
                          value={recoveryMethod}
                          onChange={(event) => {
                            setRecoveryMethod(event.target.value);
                            setRecoveryIdentifier('');
                            setRecoveryMessage('');
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                        >
                          <option value="email">Verified email</option>
                          <option value="phone">Verified phone (SMS)</option>
                        </select>
                      </label>
                      <label className="block text-xs font-bold text-slate-700">
                        {recoveryMethod === 'email' ? 'Email address' : 'Phone number'}
                        <input
                          type={recoveryMethod === 'email' ? 'email' : 'tel'}
                          required
                          value={recoveryIdentifier}
                          onChange={(event) => setRecoveryIdentifier(event.target.value)}
                          autoComplete={recoveryMethod === 'email' ? 'email' : 'tel'}
                          placeholder={recoveryMethod === 'email' ? 'name@gmail.com' : '+639171234567'}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                        />
                      </label>
                      {recoveryMessage && (
                        <p role="status" className="text-xs text-slate-700">{recoveryMessage}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={isRecovering}
                          className="rounded-lg bg-[#0f2444] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b365d] disabled:opacity-60"
                        >
                          {isRecovering ? 'Sending…' : 'Send recovery'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPasswordOpen(false);
                            setRecoveryMessage('');
                          }}
                          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRecoveryCodeSubmit} className="space-y-3">
                      <p className="text-xs leading-5 text-slate-600">
                        Enter the SMS code sent to {recoveryPhone}. The verified code will let you set a new password.
                      </p>
                      <label className="block text-xs font-bold text-slate-700">
                        SMS verification code
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={recoveryCode}
                          onChange={(event) => setRecoveryCode(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                        />
                      </label>
                      {recoveryMessage && (
                        <p role="status" className="text-xs text-slate-700">{recoveryMessage}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={isRecovering}
                          className="rounded-lg bg-[#0f2444] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b365d] disabled:opacity-60"
                        >
                          {isRecovering ? 'Verifying…' : 'Verify code'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryCodeSent(false);
                            setRecoveryCode('');
                            setRecoveryMessage('');
                          }}
                          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Use a different contact
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>
          )}

        </div>

        {usersList.length > 0 && <div className="min-w-0 lg:col-span-7 bg-white py-5 sm:py-6 px-4 sm:px-7 shadow-md rounded-2xl border border-slate-300 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#0f2444] flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-900" />
                <span>Authorized Staff Account Directory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {demoMode
                  ? 'Select an account to sign in directly to its demo profile.'
                  : 'Select a staff account to fill its username. Enter its temporary or personal password to continue.'}
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 self-start sm:self-auto">
              {usersList.length} Accounts
            </span>
          </div>

          {/* Directory Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDirectoryTab('principals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                directoryTab === 'principals'
                  ? 'bg-[#0f2444] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Principals ({principalsList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectoryTab('advisers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                directoryTab === 'advisers'
                  ? 'bg-[#0f2444] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Section Advisers ({advisersList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectoryTab('osd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                directoryTab === 'osd'
                  ? 'bg-[#0f2444] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>OSD Officers ({osdList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectoryTab('ministro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                directoryTab === 'ministro'
                  ? 'bg-[#0f2444] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ministro ({ministroList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectoryTab('executives')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                directoryTab === 'executives'
                  ? 'bg-[#0f2444] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Board & President ({executiveList.length})</span>
            </button>
          </div>

          {/* Sub-filter for Advisers by Grade */}
          {directoryTab === 'advisers' && (
            <div className="flex flex-wrap gap-1 items-center text-xs">
              <span className="text-slate-500 font-semibold mr-1">Filter Grade:</span>
              {['ALL', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDirectoryGradeFilter(g)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    directoryGradeFilter === g
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Directory Account Cards List */}
          <div className="space-y-2 max-h-[45vh] sm:max-h-[380px] overflow-y-auto pr-1">
            {/* 1. PRINCIPALS LIST */}
            {directoryTab === 'principals' && (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>Multi-Level Incident Responsibility:</strong> Principals handle <strong>Stage 3</strong> joint disciplinary actions with OSD for escalated cases within their assigned grade jurisdictions.
                </div>
                {principalsList.map((p) => {
                  const isJHS = p.email.includes('jhs') || (p.assigned_section || '').includes('7-10');
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 truncate">{p.name}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isJHS ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}>
                            {isJHS ? 'Junior High Principal (Grades 7–10)' : 'Senior High Principal (Grades 11–12)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Assigned Jurisdiction: <strong>{p.assigned_section || (isJHS ? 'Grades 7-10' : 'Grades 11-12')}</strong>
                        </p>
                        <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{p.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSelectAccount(p.email)}
                          className="px-3 py-1.5 rounded-lg bg-[#0f2444] hover:bg-[#1b365d] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>{demoMode ? 'Sign In' : 'Use username'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. SECTION ADVISERS LIST (ALL 13 SECTIONS) */}
            {directoryTab === 'advisers' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
                  <strong>Advisory Responsibility:</strong> Each section adviser manages <strong>Stage 2</strong> joint interventions for incidents involving their specific advisory section, while retaining full visibility over all school incident reports.
                </div>
                {filteredAdvisers.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{adv.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-100 text-teal-950 border border-teal-300">
                          {adv.assigned_section}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{adv.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(adv.email)}
                        className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>{demoMode ? 'Sign In' : 'Use username'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. OSD OFFICERS LIST */}
            {directoryTab === 'osd' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <strong>OSD Responsibility:</strong> Office of Student Discipline conducts <strong>Stage 1</strong> intake & assessment, forwarding cases to Stage 2, and joins Principals in <strong>Stage 3</strong> joint disciplinary hearings.
                </div>
                {osdList.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{o.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                          {o.assigned_section || 'Campus OSD'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{o.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(o.email)}
                      className="px-3 py-1.5 rounded-lg bg-[#0f2444] hover:bg-[#1b365d] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>{demoMode ? 'Sign In' : 'Use username'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 4. MINISTRONG TAGASUBAYBAY LIST */}
            {directoryTab === 'ministro' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
                  <strong>Guidance Responsibility:</strong> Ministrong Tagasubaybay collaborates with Section Advisers in <strong>Stage 2</strong> joint interventions, counseling, and restorative agreements.
                </div>
                {ministroList.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{m.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-100 text-teal-950 border border-teal-300">
                          {m.assigned_section || 'Guidance'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{m.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(m.email)}
                      className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>{demoMode ? 'Sign In' : 'Use username'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 5. BOARD OF DISCIPLINE & SCHOOL PRESIDENT */}
            {directoryTab === 'executives' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                  <strong>Stage 4 & Stage 5 Executive Scope:</strong> Board of Discipline conducts formal hearings and punishment determination (Stage 4). School President provides final executive review and affirmation (Stage 5).
                </div>
                {executiveList.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{ex.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                          {ex.title || ex.role}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{ex.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(ex.email)}
                      className="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>{demoMode ? 'Sign In' : 'Use username'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>}
      </div>

      {/* Legal & Data Privacy Act Compliance Notice */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl p-4 rounded-xl bg-white border border-slate-300 text-center space-y-1 shadow-xs">
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Philippine Data Privacy Act (RA 10173) • DepEd Child Protection Policy (D.O. 40, s. 2012)
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Access is strictly reserved for authorized educational personnel. Individual logins, section assignments, and report actions are permanently recorded in the institutional audit log.
        </p>
      </div>

      {/* ANONYMOUS INCIDENT REPORTING MODAL */}
      <Modal
        isOpen={showAnonymousModal}
        onClose={() => setShowAnonymousModal(false)}
        title="Submit Anonymous Incident Report"
        maxWidth="max-w-2xl"
      >
        {anonSuccessCaseNum ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Anonymous Report Submitted Successfully</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your report has been routed securely to the School Disciplinary Office. No account or personal identifier was recorded.
            </p>
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 max-w-xs mx-auto">
              <span className="text-xs uppercase font-bold text-slate-500 block">Case Tracking Reference</span>
              <span className="text-lg font-mono font-bold text-blue-900">{anonSuccessCaseNum}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAnonymousModal(false);
                resetAnonForm();
              }}
              className="px-6 py-2.5 bg-[#0f2444] text-white rounded-lg text-sm font-bold shadow-xs hover:bg-[#1b365d] transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleAnonymousSubmit} className="space-y-4">
            {/* Guarantee Notice */}
            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl flex items-start gap-3 border border-slate-800">
              <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-white block">Strict Identity & Privacy Protection Guarantee</span>
                <span className="text-slate-300">
                  You are reporting anonymously. No account is required. Your IP address, device fingerprints, and personal identity are neither logged nor accessible to anyone.
                </span>
              </div>
            </div>

            {anonError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{anonError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Incident Category *
                </label>
                <select
                  value={anonCategory}
                  onChange={(e) => setAnonCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
                >
                  <option value="Physical Bullying">Physical Bullying</option>
                  <option value="Verbal Bullying">Verbal Bullying</option>
                  <option value="Cyberbullying">Cyberbullying</option>
                  <option value="Social Bullying">Social / Relational Bullying</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Extortion / Coercion">Extortion / Coercion</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Urgency Level *
                </label>
                <select
                  value={anonUrgency}
                  onChange={(e) => setAnonUrgency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
                >
                  <option value="Low">Low - Minor teasing / dispute</option>
                  <option value="Moderate">Moderate - Repeated aggression</option>
                  <option value="High">High - Physical injury or severe threats</option>
                  <option value="Critical">Critical - Immediate danger / crisis</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Date of Incident *
                </label>
                <input
                  type="date"
                  required
                  value={anonDate}
                  onChange={(e) => setAnonDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Location / Setting of Incident *
                </label>
                <select
                  value={anonLocation}
                  onChange={(e) => setAnonLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Hallway / Corridors">Hallway / Corridors</option>
                  <option value="School Canteen / Cafeteria">School Canteen / Cafeteria</option>
                  <option value="Gymnasium / Sports Complex">Gymnasium / Sports Complex</option>
                  <option value="Senior High Study Hub / Library">Senior High Study Hub / Library</option>
                  <option value="School Grounds / Quadrangle">School Grounds / Quadrangle</option>
                  <option value="School Gate / Campus Perimeter">School Gate / Campus Perimeter</option>
                  <option value="Restroom / Comfort Rooms">Restroom / Comfort Rooms</option>
                  <option value="Science / Computer Laboratories">Science / Computer Laboratories</option>
                  <option value="School Bus / Student Transport">School Bus / Student Transport</option>
                  <option value="Online / Social Media Platform">Online / Social Media Platform</option>
                  <option value="Other / Off-Campus Setting">Other / Off-Campus Setting</option>
                </select>
                {anonLocation === 'Other / Off-Campus Setting' && (
                  <input
                    type="text"
                    required
                    placeholder="Please specify custom location / setting"
                    value={anonCustomLocation}
                    onChange={(e) => setAnonCustomLocation(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Report Title / Summary Header
              </label>
              <input
                type="text"
                placeholder="Brief summary of what happened"
                value={anonTitle}
                onChange={(e) => setAnonTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Incident Description *
              </label>
              <textarea
                required
                rows={4}
                value={anonDescription}
                onChange={(e) => setAnonDescription(e.target.value)}
                placeholder="Describe exactly what happened, when, and who was involved..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2444]"
              />
            </div>

            {/* In-depth Parties Involved */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Involved Parties (If Known)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Victim's Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full name or nickname"
                    value={anonVictimName}
                    onChange={(e) => setAnonVictimName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Victim's Grade
                  </label>
                  <select
                    value={anonVictimGrade}
                    onChange={(e) => setAnonVictimGrade(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Victim's Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahogany, Narra, STEM A"
                    value={anonVictimSection}
                    onChange={(e) => setAnonVictimSection(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Alleged Bully / Offender
                  </label>
                  <input
                    type="text"
                    placeholder="Name of student who engaged in bullying"
                    value={anonBullyName}
                    onChange={(e) => setAnonBullyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Bully's Grade & Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 8 - Uranus"
                    value={anonBullyGradeSection}
                    onChange={(e) => setAnonBullyGradeSection(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Witnesses (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Juan dela Cruz, Maria Santos"
                  value={anonWitnesses}
                  onChange={(e) => setAnonWitnesses(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAnonymousModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={anonSubmitting}
                className="px-5 py-2 bg-[#0f2444] hover:bg-[#1b365d] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {anonSubmitting ? 'Transmitting Incident...' : 'Submit Incident Report Securely'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
