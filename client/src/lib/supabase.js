// client/src/lib/supabase.js
// Direct Supabase browser client — used for public read queries
// (charities, draws) that don't need the backend server.
// Auth-protected operations still go through the Express API.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    'Copy client/.env.example to client/.env and fill in your Supabase values.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '');
