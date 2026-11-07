import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ImagePlus, LogOut, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import ProfileAvatar from './ProfileAvatar';

export default function ProfileAvatarButton({ src, name, className = '' }) {
  const {
    currentUser,
    changePassword,
    requestEmailChange,
    requestPhoneChange,
    verifyPhoneChange,
    updateProfilePhoto,
    removeProfilePhoto,
    logout,
    demoMode,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [requestedPhone, setRequestedPhone] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const [contactFeedback, setContactFeedback] = useState('');
  const [isContactBusy, setIsContactBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState('');
  const [pendingPhotoRemoval, setPendingPhotoRemoval] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const photoPreviewUrl = useRef('');

  useEffect(() => () => {
    if (photoPreviewUrl.current) URL.revokeObjectURL(photoPreviewUrl.current);
  }, []);

  const clearPhotoPreview = () => {
    if (photoPreviewUrl.current) URL.revokeObjectURL(photoPreviewUrl.current);
    photoPreviewUrl.current = '';
    setPendingPhotoPreview('');
    setPendingPhoto(null);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    clearPhotoPreview();
    setPendingPhotoRemoval(false);
    setContactEmail(currentUser?.email || '');
    setContactPhone(currentUser?.phone || '');
    setRequestedPhone('');
    setPhoneVerificationCode('');
    setEmailConfirmationPending(false);
    setContactFeedback('');
    setFeedback('');
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    setFeedback('');
    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);
    if (!pendingPhoto && !pendingPhotoRemoval && !wantsPasswordChange) {
      setFeedback('There are no profile changes to save.');
      return;
    }
    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setFeedback('Fill in all three password fields to change your password.');
        return;
      }
      if (newPassword.length < 8) {
        setFeedback('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback('The new passwords do not match.');
        return;
      }
    }

    setIsSaving(true);
    const savedChanges = [];
    const errors = [];
    try {
      if (pendingPhoto) {
        const result = await updateProfilePhoto(pendingPhoto);
        if (result.success) {
          savedChanges.push('profile photo');
          clearPhotoPreview();
          setPendingPhotoRemoval(false);
        } else {
          errors.push(`Profile photo: ${result.error}`);
        }
      } else if (pendingPhotoRemoval) {
        const result = await removeProfilePhoto();
        if (result.success) {
          savedChanges.push('profile photo removed');
          setPendingPhotoRemoval(false);
        } else {
          errors.push(`Profile photo: ${result.error}`);
        }
      }

      if (wantsPasswordChange) {
        const result = await changePassword(currentPassword, newPassword);
        if (result.success) {
          savedChanges.push('password');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          errors.push(`Password: ${result.error}`);
        }
      }

      const completion = savedChanges.length
        ? `${savedChanges.map((change) => (
          change === 'profile photo removed' ? 'removed profile photo' : `saved ${change}`
        )).join(' and ')} ${demoMode ? 'in this browser only' : 'to your account'}.`
        : '';
      setFeedback([completion, ...errors].filter(Boolean).join(' '));
    } catch (error) {
      setFeedback(error.message || 'Could not save your profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFeedback('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback('The image must be 5 MB or smaller.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 4096 || bitmap.height > 4096) {
        bitmap.close();
        throw new Error('Image dimensions must be 4096 × 4096 pixels or smaller.');
      }
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        bitmap.close();
        throw new Error('Your browser could not process this image.');
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const optimizedImage = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not process this image.'));
            } else if (blob.type !== 'image/webp') {
              reject(new Error('Your browser does not support WebP photo uploads.'));
            } else {
              resolve(blob);
            }
          },
          'image/webp',
          0.82
        );
      });
      if (photoPreviewUrl.current) URL.revokeObjectURL(photoPreviewUrl.current);
      photoPreviewUrl.current = URL.createObjectURL(optimizedImage);
      setPendingPhoto(optimizedImage);
      setPendingPhotoPreview(photoPreviewUrl.current);
      setPendingPhotoRemoval(false);
    } catch (error) {
      setFeedback(error.message || 'Could not update the profile photo.');
    }
  };

  const handleRemovePhoto = () => {
    clearPhotoPreview();
    setPendingPhotoRemoval(true);
    setFeedback('');
  };

  const handleSignOut = async () => {
    setFeedback('');
    try {
      const result = await logout();
      if (!result?.success) {
        setFeedback(result?.error || 'Could not sign out. Please try again.');
        return;
      }
      closeModal();
    } catch (error) {
      setFeedback(error.message || 'Could not sign out. Please try again.');
    }
  };

  const handleRequestEmailChange = async () => {
    setContactFeedback('');
    setIsContactBusy(true);
    try {
      const result = await requestEmailChange(contactEmail, currentPassword);
      if (!result.success) {
        setContactFeedback(result.error);
      } else {
        setEmailConfirmationPending(true);
        setContactFeedback('Confirmation link sent. Verify the new inbox before using it to sign in or recover your password.');
      }
    } catch (error) {
      setContactFeedback(error.message || 'Could not request email verification.');
    } finally {
      setIsContactBusy(false);
    }
  };

  const handleRequestPhoneChange = async () => {
    setContactFeedback('');
    setIsContactBusy(true);
    try {
      const result = await requestPhoneChange(contactPhone, currentPassword);
      if (!result.success) {
        setContactFeedback(result.error);
      } else {
        setRequestedPhone(result.phone);
        setPhoneVerificationCode('');
        setContactFeedback('SMS verification code sent. Enter the code below to link this phone.');
      }
    } catch (error) {
      setContactFeedback(error.message || 'Could not request phone verification.');
    } finally {
      setIsContactBusy(false);
    }
  };

  const handleVerifyPhoneChange = async () => {
    setContactFeedback('');
    setIsContactBusy(true);
    try {
      const result = await verifyPhoneChange(requestedPhone, phoneVerificationCode);
      if (!result.success) {
        setContactFeedback(result.error);
      } else {
        setContactPhone(requestedPhone);
        setRequestedPhone('');
        setPhoneVerificationCode('');
        setContactFeedback('Phone number verified and linked to your account.');
      }
    } catch (error) {
      setContactFeedback(error.message || 'Could not verify the phone number.');
    } finally {
      setIsContactBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Open profile settings"
        aria-label="Open profile settings"
      >
        <ProfileAvatar src={src} name={name} className={className} />
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isSaving) closeModal();
        }}
        title="Profile Settings"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <section className="flex items-center gap-4">
            <ProfileAvatar
              src={pendingPhotoPreview || (pendingPhotoRemoval ? '' : src)}
              name={name}
              className="h-16 w-16 rounded-full border-2 border-slate-200 object-cover dark:border-slate-700"
            />
            <div className="space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">{name}</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <ImagePlus className="h-4 w-4" />
                {pendingPhoto ? 'Choose another photo' : 'Change photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isSaving}
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>
              {(src || pendingPhoto || pendingPhotoRemoval) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isSaving}
                  className="ml-2 inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove photo
                </button>
              )}
              <p className="text-xs text-slate-500">JPG, PNG, or WebP; up to 5 MB.</p>
              {pendingPhoto && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Photo selected — press Save Changes to apply it.
                </p>
              )}
              {pendingPhotoRemoval && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Photo will be removed when you save.
                </p>
              )}
            </div>
          </section>

          {demoMode && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Demo mode is active: profile changes are saved in this browser only. Use a real Supabase staff account for changes shared across devices.
            </p>
          )}

          <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <h4 className="mb-4 font-bold text-slate-900 dark:text-white">Change Password</h4>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Current password
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((visible) => !visible)}
                    disabled={isSaving}
                    className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                New password
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((visible) => !visible)}
                    disabled={isSaving}
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
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    disabled={isSaving}
                    className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </div>
          </section>
          {!demoMode && (
            <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h4 className="mb-2 font-bold text-slate-900 dark:text-white">Recovery contacts</h4>
              <p className="mb-4 text-xs leading-5 text-slate-500">
                Link a real inbox and/or phone you can access. Enter your current password above before requesting a change. Email and phone must be confirmed before they can be used to sign in or recover this account.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Sign-in and recovery email
                    <input
                      type="email"
                      autoComplete="email"
                      value={contactEmail}
                      onChange={(event) => {
                        setContactEmail(event.target.value);
                        setEmailConfirmationPending(false);
                        setContactFeedback('');
                      }}
                      disabled={isContactBusy}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestEmailChange}
                    disabled={isContactBusy || emailConfirmationPending || contactEmail.trim().toLowerCase() === (currentUser?.email || '').toLowerCase()}
                    className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {emailConfirmationPending ? 'Confirmation sent' : 'Send email confirmation'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Recovery phone
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+639171234567"
                      value={contactPhone}
                      onChange={(event) => {
                        setContactPhone(event.target.value);
                        setContactFeedback('');
                      }}
                      disabled={isContactBusy || Boolean(requestedPhone)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  {requestedPhone ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-slate-500">Enter the SMS code sent to {requestedPhone}.</p>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        aria-label="Phone verification code"
                        value={phoneVerificationCode}
                        onChange={(event) => setPhoneVerificationCode(event.target.value)}
                        disabled={isContactBusy}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneChange}
                        disabled={isContactBusy || !phoneVerificationCode.trim()}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Verify phone
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestPhoneChange}
                      disabled={isContactBusy || !contactPhone.trim() || contactPhone === currentUser?.phone}
                      className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Send phone verification code
                    </button>
                  )}
                </div>
              </div>
              {contactFeedback && (
                <p role="status" className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {contactFeedback}
                </p>
              )}
            </section>
          )}
          {feedback && (
            <p role="status" className="text-sm text-slate-700 dark:text-slate-200">
              {feedback}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving || (!pendingPhoto && !pendingPhotoRemoval && !currentPassword && !newPassword && !confirmPassword)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f2444] px-4 py-2.5 font-bold text-white hover:bg-[#1b365d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            {isSaving ? 'Saving changes…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </Modal>
    </>
  );
}
