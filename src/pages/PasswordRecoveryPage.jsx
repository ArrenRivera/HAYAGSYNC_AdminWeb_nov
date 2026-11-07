import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PasswordRecoveryPage() {
  const { currentUser, changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 12) {
      setErrorMessage('Choose a password with at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('The new passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await changePassword('', newPassword);
      if (!result.success) setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(error.message || 'Could not save your new password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Reset your password</h1>
            <p className="text-sm text-slate-500">{currentUser?.name}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Choose a new password with at least 12 characters. After saving, you can continue to HayagSYNC.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            New password
            <div className="relative mt-1">
              <input
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={12}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Confirm new password
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          {errorMessage && (
            <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f2444] px-4 py-2.5 font-bold text-white hover:bg-[#1b365d] disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {isSaving ? 'Saving password…' : 'Save new password'}
          </button>
        </form>
        <button
          type="button"
          onClick={logout}
          className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Cancel and sign out
        </button>
      </section>
    </main>
  );
}
