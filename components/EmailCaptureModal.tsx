import React, { useState, useCallback, useRef } from 'react';
import { Mail, X, Loader2, Check } from 'lucide-react';

const EMAIL_CAPTURED_KEY = 'gsl_email_captured';
const PENDING_REDIRECT_KEY = 'gsl_pending_redirect';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateUrl: string;
  productTitle: string;
}

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  isOpen,
  onClose,
  affiliateUrl,
  productTitle
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return;

    setStatus('saving');

    try {
      const existing = JSON.parse(localStorage.getItem(EMAIL_CAPTURED_KEY) || '[]');
      existing.push({ email: email.trim(), capturedAt: new Date().toISOString(), product: productTitle });
      localStorage.setItem(EMAIL_CAPTURED_KEY, JSON.stringify(existing));
    } catch {
      // Silently fail - email capture is a bonus, not critical
    }

    setStatus('done');
    setTimeout(() => {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }, 600);
  }, [email, affiliateUrl, productTitle, onClose]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(PENDING_REDIRECT_KEY, 'skipped');
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    onClose();
  }, [affiliateUrl, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Before You Go...</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get the best deals delivered to your inbox</p>
            </div>
          </div>
          <button onClick={handleSkip} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Get exclusive discounts, price drops, and curated recommendations for products like <strong className="text-slate-900 dark:text-white">{productTitle}</strong>.
        </p>

        {status === 'done' ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <Check size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">You're on the list! Redirecting...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status === 'saving'}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {status === 'saving' ? <Loader2 size={16} className="animate-spin" /> : null}
                Get Deals & Continue
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
              >
                Skip
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">No spam. Unsubscribe anytime.</p>
          </form>
        )}
      </div>
    </div>
  );
};

export const hasCapturedEmail = (): boolean => {
  const data = localStorage.getItem(EMAIL_CAPTURED_KEY);
  if (!data) return false;
  try {
    const entries = JSON.parse(data);
    return entries.length > 0;
  } catch {
    return false;
  }
};

export const shouldShowEmailCapture = (): boolean => {
  if (localStorage.getItem(PENDING_REDIRECT_KEY) === 'skipped') return false;
  if (hasCapturedEmail()) return false;
  return true;
};
