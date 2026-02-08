import React, { useState } from 'react';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { Button } from '../../components/Button';
import { Loader2, CheckCircle } from 'lucide-react';

import toast from 'react-hot-toast';

export const PasswordResetPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { handlePasswordReset, loading, error, isDone } = usePasswordReset();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    handlePasswordReset(password);
  };

  if (isDone) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold mt-4">Password Updated</h1>
        <p className="text-slate-500 mt-2">Your password has been successfully updated. You can now sign in with your new password.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-6">Go to Homepage</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Your Password</h1>
        <div className="mb-4">
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="password">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="confirm-password">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
        </Button>
        {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
      </form>
    </div>
  );
};
