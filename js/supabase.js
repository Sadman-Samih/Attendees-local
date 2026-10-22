'use strict';

// Replace these with your own Supabase project credentials.
// Find them in your Supabase project settings (API section).
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);