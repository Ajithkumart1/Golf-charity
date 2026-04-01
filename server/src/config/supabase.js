// server/src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

// SERVICE ROLE client — bypasses RLS, used for admin operations,
// user management, and reading/writing any table from the server.
// NEVER expose this key to the browser.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ANON client — used only for user-facing auth operations:
//   signInWithPassword, resetPasswordForEmail, signUp (as fallback)
// These methods require the anon key, NOT the service role key.
// The service role key bypasses auth checks entirely and cannot
// authenticate on behalf of an end user.
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;
module.exports.supabaseAnon = supabaseAnon;
