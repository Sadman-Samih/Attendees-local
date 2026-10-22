'use strict';

// Replace these with your own Supabase project credentials.
// Find them in your Supabase project settings (API section).
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Demo mode is enabled automatically until real credentials are provided.
const isConfigured =
  !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');

if (isConfigured && typeof window.supabase !== 'undefined' && window.supabase) {
  window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

window.ATTENDANCE_DEMO_MODE = !isConfigured;