import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/config';

export const usePasswordReset = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event is triggered when the user clicks the password recovery link.
        // The session is not yet available, so we don't need to do anything here.
        // The user will be redirected to the password reset page.
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsDone(true);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { handlePasswordReset, loading, error, isDone };
};
