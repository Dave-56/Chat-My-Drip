import { createClient } from '@supabase/supabase-js';

// These will be set via environment variables (Vite uses import.meta.env)
// In Vercel, these need to be set in Project Settings > Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Supabase credentials not found. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.';
  console.error(errorMsg);
  // In production, throw a more helpful error
  if (import.meta.env.PROD) {
    throw new Error(`${errorMsg} Please set these in Vercel Project Settings > Environment Variables.`);
  }
}

// Validate before creating client
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required. Please set it in your environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please set it in your environment variables.');
}

// Create client with validated credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

