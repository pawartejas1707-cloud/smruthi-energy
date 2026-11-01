import { createClient } from '@supabase/supabase-js';

// Try loading from environment or user-configured runtime values
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if user stored custom credentials in session/local storage
const runtimeUrl = typeof window !== 'undefined' ? localStorage.getItem('smruthi_supabase_url') || '' : '';
const runtimeKey = typeof window !== 'undefined' ? localStorage.getItem('smruthi_supabase_key') || '' : '';

export const activeSupabaseUrl = runtimeUrl || ENV_SUPABASE_URL;
export const activeSupabaseKey = runtimeKey || ENV_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  activeSupabaseUrl &&
  activeSupabaseKey &&
  activeSupabaseUrl.startsWith('https://') &&
  !activeSupabaseUrl.includes('your-supabase-url')
);

// Create client if configured, otherwise null
export const supabase = isSupabaseConfigured
  ? createClient(activeSupabaseUrl, activeSupabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('smruthi_supabase_url', url.trim());
    localStorage.setItem('smruthi_supabase_key', key.trim());
    window.location.reload();
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('smruthi_supabase_url');
    localStorage.removeItem('smruthi_supabase_key');
    window.location.reload();
  }
}
