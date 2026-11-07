import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_USERS } from '../data/initialSeedData';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();
const DEMO_MODE = import.meta.env.VITE_HAYAGSYNC_DEMO_MODE === 'true';
const DEMO_DEFAULT_PASSWORD = 'password123';
const DEMO_PASSWORDS_KEY = 'hayagsync_demo_password_hashes';
const DEMO_AVATARS_KEY = 'hayagsync_demo_avatars';
const STAFF_ROLES = [
  'adviser',
  'board_of_discipline',
  'ministrong_tagasubaybay',
  'osd',
  'principal',
  'school_president',
];
const ROSTER_ADMIN_ROLES = ['osd', 'principal', 'school_president'];

const readDemoAvatars = () => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_AVATARS_KEY) || '{}');
  } catch {
    return {};
  }
};

const getDemoUser = (user) => ({
  ...user,
  avatar: readDemoAvatars()[user.id] || user.avatar || '',
});

const toAppUser = async (profile, authUser = null) => {
  const assignedSection = profile.assigned_section
    || profile.student_section
    || (profile.staff_section_assignments || [])
      .map(({ school_sections: section }) => section && `${section.grade} - ${section.section_name}`)
      .filter(Boolean)
      .join(', ');

  let avatar = profile.avatar || '';
  if (avatar.startsWith(`${profile.id}/`)) {
    const { data, error } = await supabase.storage
      .from('staff-profile-photos')
      .createSignedUrl(avatar, 7 * 24 * 60 * 60);
    if (error) {
      console.error('Could not load the staff profile photo:', error);
      avatar = '';
    } else {
      avatar = data.signedUrl;
    }
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: authUser?.phone || '',
    role: profile.role,
    assigned_section: assignedSection,
    title: profile.title || (
      profile.role === 'principal'
        ? 'School Principal'
        : profile.role === 'adviser'
          ? `Section Adviser - ${assignedSection}`
          : profile.role === 'ministrong_tagasubaybay'
            ? `Ministrong Tagasubaybay - ${assignedSection}`
            : profile.role === 'osd'
              ? 'OSD Discipline Officer'
              : 'Staff Official'
    ),
    department: profile.department || (
      profile.role === 'principal'
        ? 'Office of the Principal'
        : profile.role === 'adviser'
          ? 'Faculty / Grade Level Department'
          : 'Guidance & Student Well-Being Office'
    ),
    avatar,
  };
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not read the selected profile photo.'));
  reader.readAsDataURL(blob);
});

const hashDemoPassword = async (password) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    if (!DEMO_MODE) return null;
    try {
      const savedUser = JSON.parse(localStorage.getItem('hayagsync_user') || 'null');
      const demoUser = INITIAL_USERS.find((user) => user.id === savedUser?.id);
      return demoUser ? getDemoUser(demoUser) : null;
    } catch {
      return null;
    }
  });
  const [usersList, setUsersList] = useState(DEMO_MODE ? INITIAL_USERS.map(getDemoUser) : []);
  const [authLoading, setAuthLoading] = useState(!DEMO_MODE);
  const [authError, setAuthError] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) return undefined;
    let active = true;
    let requestId = 0;
    localStorage.removeItem('hayagsync_user');

    const loadSession = async (session) => {
      const currentRequestId = ++requestId;

      if (!session?.user) {
        if (active && currentRequestId === requestId) {
          setCurrentUser(null);
          setUsersList([]);
          setMustChangePassword(false);
          setPasswordRecovery(false);
          setAuthLoading(false);
        }
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, name, role, title, department, avatar, is_active, must_change_password, staff_section_assignments(school_sections(grade, section_name))')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!active || currentRequestId !== requestId) return;
      if (error || !profile || !profile.is_active || !STAFF_ROLES.includes(profile.role)) {
        const message = error
          ? `Could not verify your account profile: ${error.message}`
          : 'This account has no active HayagSYNC profile. Contact your system administrator.';
        setCurrentUser(null);
        setUsersList([]);
        setMustChangePassword(false);
        setAuthError(message);
        setAuthLoading(false);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) console.error('Could not clear the unverified Supabase session:', signOutError);
        return;
      }

      setAuthError('');
      const appUser = await toAppUser(profile, session.user);
      if (!active || currentRequestId !== requestId) return;
      setCurrentUser(appUser);
      setMustChangePassword(profile.must_change_password === true);
      setAuthLoading(false);

      if (ROSTER_ADMIN_ROLES.includes(profile.role)) {
        const { data: profiles, error: usersError } = await supabase
          .from('users')
          .select('id, email, name, role, title, department, avatar, must_change_password, staff_section_assignments(school_sections(grade, section_name))')
          .eq('is_active', true)
          .order('name');

        if (!active || currentRequestId !== requestId) return;
        if (usersError) {
          console.error('Could not load active account directory:', usersError);
          setUsersList([]);
        } else {
          try {
            setUsersList(await Promise.all((profiles || []).map(toAppUser)));
          } catch (avatarError) {
            console.error('Could not load active account profile photos:', avatarError);
            setUsersList([]);
          }
        }
      } else {
        setUsersList([]);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
      setTimeout(() => {
        void loadSession(session);
      }, 0);
    });

    const initializeSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setAuthError(`Could not restore your sign-in session: ${error.message}`);
        setAuthLoading(false);
        return;
      }
      await loadSession(data.session);
    };

    void initializeSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (DEMO_MODE) {
      setCurrentUser(null);
      localStorage.removeItem('hayagsync_user');
      setMustChangePassword(false);
      setPasswordRecovery(false);
      return { success: true };
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(`Could not sign out: ${error.message}`);
      return { success: false, error: error.message };
    }
    setCurrentUser(null);
    setUsersList([]);
    setMustChangePassword(false);
    setPasswordRecovery(false);
    setAuthError('');
    return { success: true };
  };

  const authenticate = async (email, password) => {
    if (DEMO_MODE) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const seedUser = INITIAL_USERS.find((user) => user.email.toLowerCase() === cleanEmail);
      const demoUser = seedUser ? getDemoUser(seedUser) : null;
      if (!demoUser || !password) {
        return { success: false, error: 'Enter a valid demo account email and password.' };
      }

      const savedHashes = JSON.parse(localStorage.getItem(DEMO_PASSWORDS_KEY) || '{}');
      const passwordMatches = savedHashes[demoUser.id]
        ? savedHashes[demoUser.id] === await hashDemoPassword(password)
        : password === DEMO_DEFAULT_PASSWORD;
      if (!passwordMatches) {
        return { success: false, error: 'Incorrect password for this demo account.' };
      }
      setCurrentUser(demoUser);
      setMustChangePassword(false);
      setAuthError('');
      localStorage.setItem('hayagsync_user', JSON.stringify(demoUser));
      return { success: true, user: demoUser };
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter your username, email, or phone number and password.' };
    }

    const normalizedPhone = cleanEmail.replace(/[\s()-]/g, '');
    const signInCredentials = /^\+?\d{8,15}$/.test(normalizedPhone)
      ? { phone: normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`, password }
      : { email: cleanEmail, password };
    const { data, error } = await supabase.auth.signInWithPassword(signInCredentials);
    if (error || !data.user) {
      return { success: false, error: 'Authentication failed. Please verify your account identifier and password.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role, title, department, avatar, is_active, must_change_password, staff_section_assignments(school_sections(grade, section_name))')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active || !STAFF_ROLES.includes(profile.role)) {
      const message = profileError
        ? `Could not verify your account profile: ${profileError.message}`
        : 'This account has no active HayagSYNC profile. Contact your system administrator.';
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error('Could not clear the unverified Supabase session:', signOutError);
      setAuthError(message);
      return { success: false, error: message };
    }

    const appUser = await toAppUser(profile, data.user);
    setAuthError('');
    setCurrentUser(appUser);
    setMustChangePassword(profile.must_change_password === true);
    return { success: true, user: appUser };
  };

  const updateProfilePhoto = async (imageBlob) => {
    if (!currentUser || !(imageBlob instanceof Blob)) {
      return { success: false, error: 'Choose a valid profile photo first.' };
    }

    if (DEMO_MODE) {
      try {
        const avatars = readDemoAvatars();
        const avatar = await blobToDataUrl(imageBlob);
        avatars[currentUser.id] = avatar;
        localStorage.setItem(DEMO_AVATARS_KEY, JSON.stringify(avatars));
        const updatedUser = { ...currentUser, avatar };
        setCurrentUser(updatedUser);
        setUsersList((users) => users.map((user) => (
          user.id === updatedUser.id ? updatedUser : user
        )));
        localStorage.setItem('hayagsync_user', JSON.stringify(updatedUser));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || 'Could not save the demo profile photo in this browser.' };
      }
    }

    const objectPath = `${currentUser.id}/profile.webp`;
    const { error: uploadError } = await supabase.storage
      .from('staff-profile-photos')
      .upload(objectPath, imageBlob, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      });
    if (uploadError) {
      return { success: false, error: `Could not upload the profile photo: ${uploadError.message}` };
    }

    const { error: updateError } = await supabase.rpc('update_my_profile_avatar', {
      p_avatar: objectPath,
    });
    if (updateError) {
      return { success: false, error: `Could not save the profile photo to your profile: ${updateError.message}` };
    }

    const { data, error: urlError } = await supabase.storage
      .from('staff-profile-photos')
      .createSignedUrl(objectPath, 7 * 24 * 60 * 60);
    if (urlError) {
      console.error('Uploaded profile photo but could not create its preview URL:', urlError);
      return { success: false, error: 'Photo uploaded, but could not load its preview. Refresh and try again.' };
    }

    setCurrentUser((user) => (user ? { ...user, avatar: data.signedUrl } : user));
    return { success: true };
  };

  const removeProfilePhoto = async () => {
    if (!currentUser) {
      return { success: false, error: 'You must be signed in to remove your profile photo.' };
    }

    if (DEMO_MODE) {
      try {
        const avatars = readDemoAvatars();
        delete avatars[currentUser.id];
        localStorage.setItem(DEMO_AVATARS_KEY, JSON.stringify(avatars));
        const updatedUser = { ...currentUser, avatar: '' };
        setCurrentUser(updatedUser);
        setUsersList((users) => users.map((user) => (
          user.id === updatedUser.id ? updatedUser : user
        )));
        localStorage.setItem('hayagsync_user', JSON.stringify(updatedUser));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || 'Could not remove the demo profile photo from this browser.' };
      }
    }

    const objectPath = `${currentUser.id}/profile.webp`;
    const { error: updateError } = await supabase.rpc('update_my_profile_avatar', {
      p_avatar: null,
    });
    if (updateError) {
      return { success: false, error: `Could not remove the profile photo from your account: ${updateError.message}` };
    }

    const updatedUser = { ...currentUser, avatar: '' };
    setCurrentUser(updatedUser);
    setUsersList((users) => users.map((user) => (
      user.id === updatedUser.id ? updatedUser : user
    )));

    const { error: removeError } = await supabase.storage
      .from('staff-profile-photos')
      .remove([objectPath]);
    if (removeError) {
      return {
        success: false,
        error: `Your profile photo was unlinked, but its stored image could not be deleted: ${removeError.message}`,
      };
    }

    return { success: true };
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'You must be signed in to change your password.' };

    if (DEMO_MODE) {
      const savedHashes = JSON.parse(localStorage.getItem(DEMO_PASSWORDS_KEY) || '{}');
      const currentPasswordMatches = savedHashes[currentUser.id]
        ? savedHashes[currentUser.id] === await hashDemoPassword(currentPassword)
        : currentPassword === DEMO_DEFAULT_PASSWORD;
      if (!currentPasswordMatches) {
        return { success: false, error: 'Your current password is incorrect.' };
      }

      savedHashes[currentUser.id] = await hashDemoPassword(newPassword);
      localStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(savedHashes));
      return { success: true };
    }

    if (!mustChangePassword && !passwordRecovery) {
      const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (reauthenticationError) {
        return { success: false, error: 'Your current password is incorrect.' };
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: `Could not change your password: ${error.message}` };

    if (mustChangePassword) {
      const { error: setupError } = await supabase.rpc('complete_my_password_setup');
      if (setupError) {
        return { success: false, error: `Password updated, but first-login setup could not be completed: ${setupError.message}` };
      }
      setMustChangePassword(false);
    }
    if (passwordRecovery) setPasswordRecovery(false);

    return { success: true };
  };

  const reauthenticateForContactChange = async (currentPassword) => {
    if (!currentUser || !currentPassword) {
      return { success: false, error: 'Enter your current password to change your recovery contact.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (error) {
      return { success: false, error: 'Your current password is incorrect.' };
    }
    return { success: true };
  };

  const requestEmailChange = async (email, currentPassword) => {
    if (DEMO_MODE) {
      return { success: false, error: 'Recovery email linking is available only for Supabase accounts.' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Enter a valid email address.' };
    }
    if (cleanEmail === currentUser?.email?.toLowerCase()) {
      return { success: false, error: 'That email is already linked to your account.' };
    }

    const reauthentication = await reauthenticateForContactChange(currentPassword);
    if (!reauthentication.success) return reauthentication;

    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    if (error) {
      console.error('Could not request a staff email change:', error);
      return { success: false, error: 'Could not send the email confirmation. Check the address and try again.' };
    }
    return { success: true };
  };

  const requestPhoneChange = async (phone, currentPassword) => {
    if (DEMO_MODE) {
      return { success: false, error: 'Recovery phone linking is available only for Supabase accounts.' };
    }

    const normalizedPhone = (phone || '').replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      return { success: false, error: 'Enter a valid phone number in international format, such as +639171234567.' };
    }
    if (normalizedPhone === currentUser?.phone) {
      return { success: false, error: 'That phone number is already linked to your account.' };
    }

    const reauthentication = await reauthenticateForContactChange(currentPassword);
    if (!reauthentication.success) return reauthentication;

    const { error } = await supabase.auth.updateUser({ phone: normalizedPhone });
    if (error) {
      console.error('Could not request a staff phone change:', error);
      return { success: false, error: 'Could not send the SMS verification code. Check the number and try again.' };
    }
    return { success: true, phone: normalizedPhone };
  };

  const verifyPhoneChange = async (phone, token) => {
    const normalizedPhone = (phone || '').replace(/[\s()-]/g, '');
    const cleanToken = (token || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone) || !cleanToken) {
      return { success: false, error: 'Enter the phone number and verification code.' };
    }

    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: cleanToken,
      type: 'phone_change',
    });
    if (error) {
      return { success: false, error: 'The phone verification code is invalid or expired. Request a new code and try again.' };
    }
    return { success: true };
  };

  const requestPasswordReset = async (identifier, method) => {
    if (DEMO_MODE) {
      return { success: false, error: 'Password recovery is available only for verified Supabase accounts.' };
    }

    if (method === 'email') {
      const email = (identifier || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Enter a valid email address.' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        console.error('Could not request a password reset email:', error);
        return { success: false, error: 'Could not send the reset email. Check the address and try again.' };
      }
      return { success: true };
    }

    const phone = (identifier || '').replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return { success: false, error: 'Enter the linked phone in international format, such as +639171234567.' };
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });
    if (error) {
      console.error('Could not request a password recovery SMS:', error);
      return { success: false, error: 'Could not send the recovery code. Check the number and try again.' };
    }
    return { success: true, phone };
  };

  const verifyPhoneRecovery = async (phone, token) => {
    const normalizedPhone = (phone || '').replace(/[\s()-]/g, '');
    const cleanToken = (token || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone) || !cleanToken) {
      return { success: false, error: 'Enter the linked phone number and SMS verification code.' };
    }

    setPasswordRecovery(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: cleanToken,
      type: 'sms',
    });
    if (error) {
      setPasswordRecovery(false);
      return { success: false, error: 'The recovery code is invalid or expired. Request a new code and try again.' };
    }
    return { success: true };
  };

  const isOSD = currentUser?.role === 'osd';
  const isMinistro = currentUser?.role === 'ministrong_tagasubaybay';
  const isPrincipal = currentUser?.role === 'principal';
  const isAdviser = currentUser?.role === 'adviser';
  const isBoard = currentUser?.role === 'board_of_discipline';
  const isPresident = currentUser?.role === 'school_president';
  const isStaff = ['osd', 'ministrong_tagasubaybay', 'principal', 'adviser', 'board_of_discipline', 'school_president'].includes(currentUser?.role);
  const isAdmin = isStaff;
  const isReporterOnly = currentUser?.role === 'reporter' || !isAdmin;

  const isJhsPrincipal = isPrincipal && (
    (currentUser?.email || '').toLowerCase().includes('jhs') ||
    (currentUser?.assigned_section || '').includes('7-10') ||
    (currentUser?.title || '').toLowerCase().includes('junior')
  );
  const isShsPrincipal = isPrincipal && (
    (currentUser?.email || '').toLowerCase().includes('shs') ||
    (currentUser?.assigned_section || '').includes('11-12') ||
    (currentUser?.title || '').toLowerCase().includes('senior')
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        authLoading,
        authError,
        mustChangePassword,
        passwordRecovery,
        demoMode: DEMO_MODE,
        authenticate,
        changePassword,
        requestEmailChange,
        requestPhoneChange,
        verifyPhoneChange,
        requestPasswordReset,
        verifyPhoneRecovery,
        updateProfilePhoto,
        removeProfilePhoto,
        logout,
        isAdmin,
        isStaff,
        isOSD,
        isMinistro,
        isPrincipal,
        isJhsPrincipal,
        isShsPrincipal,
        isAdviser,
        isBoard,
        isPresident,
        isReporterOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
