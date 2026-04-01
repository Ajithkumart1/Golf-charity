// server/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { supabaseAnon } = require('../config/supabase');

const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  const { email, password, full_name, charity_id, charity_percentage = 10 } = req.body;
  try {
    // service-role client can create users with email_confirm:true
    // so they can log in immediately without email verification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('[register] auth.admin.createUser failed:', authError.message);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name,
      charity_id: charity_id || null,
      charity_percentage: Math.max(10, Math.min(100, Number(charity_percentage))),
      role: 'subscriber',
    });

    if (userError) {
      console.error('[register] users insert failed:', userError.message);
      await supabase.auth.admin.deleteUser(userId); // rollback
      return res.status(400).json({ error: userError.message });
    }

    const token = signToken(userId);
    res.status(201).json({
      token,
      user: { id: userId, email, full_name, role: 'subscriber', charity_id, charity_percentage },
    });
  } catch (err) {
    console.error('[register] unexpected:', err);
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // CRITICAL: Must use the ANON client for signInWithPassword.
    // The service-role client is a privileged admin client — it does not
    // support signing in as an end user and will return auth errors.
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[login] signInWithPassword failed:', error.message);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return res.status(401).json({
          error: 'Email not confirmed. Check your inbox or contact support.',
        });
      }
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }
      return res.status(401).json({ error: 'Sign in failed. Please try again.' });
    }

    const userId = data.user.id;

    // Fetch profile from public.users (use service-role to bypass RLS)
    let { data: user, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, charity_id, charity_percentage')
      .eq('id', userId)
      .single();

    // If no profile exists (e.g. user created directly in Supabase dashboard),
    // create a minimal one automatically so login still works
    if (profileError || !user) {
      console.warn('[login] No public.users row for', userId, '— auto-creating');
      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email,
          role: 'subscriber',
          charity_percentage: 10,
        })
        .select('id, email, full_name, role, charity_id, charity_percentage')
        .single();

      if (createErr) {
        console.error('[login] auto-create user failed:', createErr.message);
        return res.status(500).json({
          error: 'Could not load account profile. Please contact support.',
        });
      }
      user = created;
    }

    const token = signToken(userId);
    res.json({ token, user });
  } catch (err) {
    console.error('[login] unexpected:', err);
    next(err);
  }
};

// ── Refresh ───────────────────────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  const { token: oldToken } = req.body;
  if (!oldToken) return res.status(400).json({ error: 'token is required' });
  try {
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    const newToken = signToken(decoded.sub);
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = (_req, res) => {
  res.json({ message: 'Logged out' });
};

// ── Forgot password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    // Must use anon client — service role cannot send password reset emails
    await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};
