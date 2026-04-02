import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration — production-hardened
 * - fetchWithRetry: 3 attempts, 10s per-call timeout, exponential backoff
 * - Handles 503/502 (free-tier cold starts) transparently
 * - Zero noisy console.log in production
 */

const getViteEnv = (key: string) => {
  if (typeof import.meta === 'undefined' || !(import.meta as any).env) return undefined;
  const env = (import.meta as any).env;
  if (key === 'VITE_SUPABASE_URL') return env.VITE_SUPABASE_URL;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') return env.NEXT_PUBLIC_SUPABASE_URL;
  if (key === 'VITE_SUPABASE_ANON_KEY') return env.VITE_SUPABASE_ANON_KEY;
  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return undefined;
};

const getProcessEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) return process.env[key];
  } catch {
    // process not available in browser
  }
  return undefined;
};

const isDev = (() => {
  try { return (import.meta as any).env?.MODE === 'development'; } catch { return false; }
})();

// Resolve credentials across all supported env naming conventions
const supabaseUrl =
  getViteEnv('VITE_SUPABASE_URL') ||
  getViteEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getProcessEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getProcessEnv('VITE_SUPABASE_URL') ||
  getProcessEnv('SUPABASE_URL');

const supabaseKey =
  getViteEnv('VITE_SUPABASE_ANON_KEY') ||
  getViteEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getProcessEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getProcessEnv('VITE_SUPABASE_ANON_KEY') ||
  getProcessEnv('SUPABASE_ANON_KEY');

if (isDev) {
  console.log('🔧 Supabase Config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    endpoint: supabaseUrl ? new URL(supabaseUrl).hostname : 'MISSING',
  });
}

/**
 * Resilient fetch wrapper:
 * - 10s timeout per attempt (individual REST calls should be fast)
 * - Retries up to 3× with 1s/2s exponential backoff
 * - Retries on network errors AND 502/503 (free-tier cold start responses)
 */
const PER_CALL_TIMEOUT_MS = 10_000;
const MAX_RETRY_ATTEMPTS = 3;

const fetchWithRetry: typeof fetch = async (input, init) => {
  let lastError: Error = new Error('Network request failed');

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PER_CALL_TIMEOUT_MS);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);

      // Retry on gateway/wakeup errors if we have attempts left
      if ((response.status === 503 || response.status === 502) && attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s → 2s
        if (isDev) console.warn(`[Supabase] ${response.status} – retrying in ${delay}ms (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      const isRetryable =
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('network') ||
        err.message?.toLowerCase().includes('fetch');

      if (isRetryable && attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s → 2s
        if (isDev) console.warn(`[Supabase] Fetch error – retrying in ${delay}ms (attempt ${attempt + 1})`, err.message);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
};

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vibe_auth_token',
        storage: window.localStorage,
      },
      global: {
        fetch: fetchWithRetry,
        headers: { 'x-application-name': 'go-simple-living-vibe' },
      },
      db: { schema: 'public' },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    if (isDev) console.log('✅ Supabase client ready (retry-fetch enabled)');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
  }
} else {
  console.error(
    '❌ Supabase Configuration Error – missing env vars.\n' +
    'Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

export { supabase };
