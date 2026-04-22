import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/config';

export const usePasswordReset = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'PASSWORD_RECOVERY') {
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (password: string) => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setError('Database not configured');
      setLoading(false);
      return;
    }
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
