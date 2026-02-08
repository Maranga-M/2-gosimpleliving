import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration with robust environment variable detection
 * Supports:
 * - Vite (import.meta.env.VITE_*)
 * - Vercel/Next.js (process.env.NEXT_PUBLIC_*)
 * - Standard Node (process.env.*)
 */

// Helper to get environment variables across different environments
const getEnvVar = (key: string): string | undefined => {
  // 1. Try import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const value = (import.meta as any).env[key];
    if (value) return value;
  }

  // 2. Try process.env (Node/Vercel)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
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
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL');

// Try all possible prefixes for Anon Key
const supabaseKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY');

// Determine which prefix is effectively being used (for logging)
const getEffectivePrefix = () => {
  if (getEnvVar('VITE_SUPABASE_URL')) return 'VITE_';
  if (getEnvVar('NEXT_PUBLIC_SUPABASE_URL')) return 'NEXT_PUBLIC_';
  if (getEnvVar('SUPABASE_URL')) return 'STANDARD';
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
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        heartbeatIntervalMs: 30000 // 30s heartbeat
      }
    });
    console.log(`✅ Supabase client initialized successfully`);
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
