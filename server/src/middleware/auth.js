// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Verifies JWT from Authorization header.
 * Attaches req.user = { id, email, role }
 */
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch fresh user from DB to catch role changes / deletions
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, charity_id, charity_percentage')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Checks that req.user has an active subscription.
 * Must be used AFTER authenticate.
 */
const requireActiveSubscription = async (req, res, next) => {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', req.user.id)
    .eq('status', 'active')
    .single();

  if (!sub) {
    return res.status(403).json({
      error: 'Active subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
    // Mark lapsed
    await supabase
      .from('subscriptions')
      .update({ status: 'lapsed' })
      .eq('user_id', req.user.id);

    return res.status(403).json({
      error: 'Subscription has lapsed',
      code: 'SUBSCRIPTION_LAPSED',
    });
  }

  req.subscription = sub;
  next();
};

/**
 * Requires admin role.
 * Must be used AFTER authenticate.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireActiveSubscription, requireAdmin };