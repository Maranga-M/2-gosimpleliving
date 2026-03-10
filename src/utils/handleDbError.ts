import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';

/**
 * Intercepts Supabase errors and checks if they are related to Authentication or Row Level Security (RLS).
 * If the session is invalid or expired, it gracefully logs the user out.
 * 
 * @param error The error object returned from a Supabase operation
 * @param customMessage Optional custom message to show if it's NOT an auth error
 * @returns boolean True if the error was handled as an auth error, false otherwise
 */
export const handleDbError = async (error: any, customMessage?: string): Promise<boolean> => {
    if (!error) return false;

    console.error("Database Error:", error);

    // Check if error is related to authentication/RLS and session expiration
    const isAuthError =
        error.code === 'PGRST301' || // JWT expired/invalid
        error.message?.toLowerCase().includes('row-level security') ||
        error.message?.toLowerCase().includes('jwt') ||
        error.message?.toLowerCase().includes('unauthorized');

    if (isAuthError) {
        console.warn("Auth/RLS error detected. Triggering forced logout to clear invalid session state.");
        toast.error('Session expired or access denied. Please log in again.');

        // Attempting signOut via supabase client. This will emit the 'SIGNED_OUT' event 
        // which our AppContext / useAuth hook listens to and performs the actual redirect.
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error("Force sign-out failed", e);
                // Fallback redirect if signOut throws
                localStorage.setItem('gsl_current_view', 'home');
                window.location.href = '/';
            }
        } else {
            localStorage.setItem('gsl_current_view', 'home');
            window.location.href = '/';
        }
        return true;
    }

    // Not an auth error
    toast.error(customMessage || `Error: ${error.message || 'Unknown database error'}`);
    return false;
};
