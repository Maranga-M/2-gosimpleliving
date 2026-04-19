import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';

/**
 * Handles Supabase errors gracefully:
 * - Auth/RLS errors → always show toast + force sign-out (user must know)
 * - Other DB errors for ADMINS → show technical detail (useful for debugging)
 * - Other DB errors for regular USERS → show a calm, non-technical message
 *   (they don't need to hear "pgrst116" or Supabase internals)
 */

const isAdminSession = (): boolean => {
  try {
    // We look for the stored role in localStorage as a lightweight hint.
    // The actual role gating happens server-side via RLS; this is just for UX.
    const raw = localStorage.getItem('gsl_user_role');
    return raw === 'admin' || raw === 'editor';
  } catch {
    return false;
  }
};

export const handleDbError = async (error: any, customMessage?: string): Promise<boolean> => {
  if (!error) return false;

  console.error('[DB Error]', error);

  // ─── Auth / RLS errors ────────────────────────────────────────────────────
  // Always show these — the user needs to know their session is invalid.
  const isAuthError =
    error.code === 'PGRST301' ||
    error.message?.toLowerCase().includes('row-level security') ||
    error.message?.toLowerCase().includes('jwt') ||
    error.message?.toLowerCase().includes('unauthorized');

  if (isAuthError) {
    console.warn('[DB] Auth/RLS error – forcing sign-out');
    toast.error('Session expired or access denied. Please log in again.');

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        localStorage.setItem('gsl_current_view', 'home');
        window.location.href = '/';
      }
    } else {
      localStorage.setItem('gsl_current_view', 'home');
      window.location.href = '/';
    }
    return true;
  }

  // ─── All other errors ─────────────────────────────────────────────────────
  if (isAdminSession()) {
    // Admins see the raw technical message so they can debug
    toast.error(customMessage || `DB Error: ${error.message || 'Unknown error'}`);
  } else {
    // Regular users get a calm, non-alarming message
    toast.error(customMessage || 'Unable to save changes. Please try again shortly.');
  }

  return false;
};
