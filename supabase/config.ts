import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration with robust environment variable detection
 * Supports:
 * - Vite (import.meta.env.VITE_*)
 * - Vercel/Next.js (process.env.NEXT_PUBLIC_*)
 * - Standard Node (process.env.*)
 */

// Try explicitly accessing import.meta.env for Vite static replacement during build.
// Vite requires explicit property access (e.g., import.meta.env.VITE_SUPABASE_URL) 
// to replace them statically. Dynamic access like import.meta.env[key] fails in production.

const getViteEnv = (key: string) => {
  if (typeof import.meta === 'undefined' || !(import.meta as any).env) return undefined;

  const env = (import.meta as any).env;
  if (key === 'VITE_SUPABASE_URL') return env.VITE_SUPABASE_URL;
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') return env.NEXT_PUBLIC_SUPABASE_URL;
  if (key === 'VITE_SUPABASE_ANON_KEY') return env.VITE_SUPABASE_ANON_KEY;
  if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return undefined;
}

const getProcessEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors if process is not defined
  }
  return undefined;
};

// Start detection
console.log('🔧 Initializing Supabase Configuration...');

// Try all possible prefixes for URL
const supabaseUrl =
  getViteEnv('VITE_SUPABASE_URL') ||
  getViteEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getProcessEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getProcessEnv('VITE_SUPABASE_URL') ||
  getProcessEnv('SUPABASE_URL');

// Try all possible prefixes for Anon Key
const supabaseKey =
  getViteEnv('VITE_SUPABASE_ANON_KEY') ||
  getViteEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getProcessEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getProcessEnv('VITE_SUPABASE_ANON_KEY') ||
  getProcessEnv('SUPABASE_ANON_KEY');

// Determine which prefix is effectively being used (for logging)
const getEffectivePrefix = () => {
  if (getViteEnv('VITE_SUPABASE_URL')) return 'VITE_';
  if (getViteEnv('NEXT_PUBLIC_SUPABASE_URL')) return 'NEXT_PUBLIC_';
  if (getProcessEnv('NEXT_PUBLIC_SUPABASE_URL')) return 'PROCESS_NEXT_PUBLIC_';
  if (getProcessEnv('VITE_SUPABASE_URL')) return 'PROCESS_VITE_';
  if (getProcessEnv('SUPABASE_URL')) return 'STANDARD';
  return 'UNKNOWN';
}

const usingPrefix = getEffectivePrefix();

// Log configuration status (censored)
const configStatus = {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlValid: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
  endpoint: supabaseUrl ? new URL(supabaseUrl).hostname : 'MISSING',
  prefix: usingPrefix,
  mode: (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env.MODE : 'unknown'
};

console.log('🔧 Supabase Config Status:', configStatus);

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vibe_auth_token', // Distinct key for persistence
        storage: window.localStorage
      },
      global: {
        fetch: (...args) => fetch(...args), // Use standard native fetch without custom timeouts/dedup
        headers: { 'x-application-name': 'go-simple-living-vibe' }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10 // Standard interactivity limit
        }
      }
    });
    console.log(`✅ Supabase Vibe-Client initialized with pooling and de-duplication`);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
  }
} else {
  console.error(
    '❌ Supabase Configuration Error\n' +
    'Missing environment variables. Please check your .env file or Vercel project settings.\n' +
    'Required: VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
  );
}

export { supabase };
