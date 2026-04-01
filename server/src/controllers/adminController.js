// server/src/controllers/adminController.js
const supabase = require('../config/supabase');

// ── Users ────────────────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, subscriptions(status, plan, current_period_end), charity:charities(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: data });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, subscriptions(*), scores(*), charity:charities(*)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['full_name', 'role', 'charity_id', 'charity_percentage'];
    const updates = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('users').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    // Soft delete via Supabase Auth admin
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};

// ── Admin Score Management ───────────────────────────────────
exports.getUserScores = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('scores').select('*').eq('user_id', req.params.id)
      .order('played_at', { ascending: false });
    if (error) throw error;
    res.json({ scores: data });
  } catch (err) { next(err); }
};

exports.addUserScore = async (req, res, next) => {
  const { score, played_at } = req.body;
  if (!score || score < 1 || score > 45) {
    return res.status(400).json({ error: 'Score must be 1-45' });
  }
  try {
    const { data, error } = await supabase
      .from('scores')
      .insert({ user_id: req.params.id, score, played_at })
      .select().single();
    if (error) throw error;
    res.status(201).json({ score: data });
  } catch (err) { next(err); }
};

exports.deleteScore = async (req, res, next) => {
  try {
    const { error } = await supabase.from('scores').delete().eq('id', req.params.scoreId);
    if (error) throw error;
    res.json({ message: 'Score deleted' });
  } catch (err) { next(err); }
};

// ── Subscriptions ────────────────────────────────────────────
exports.listSubscriptions = async (req, res, next) => {
  try {
    const { status } = req.query;
    let q = supabase.from('subscriptions')
      .select('*, user:users(email, full_name)')
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ subscriptions: data });
  } catch (err) { next(err); }
};

exports.updateSubscription = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ subscription: data });
  } catch (err) { next(err); }
};

// ── Reports ──────────────────────────────────────────────────
exports.overviewReport = async (req, res, next) => {
  try {
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: subData },
      { count: pendingVerifications },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('amount').eq('status', 'active'),
      supabase.from('winners').select('*', { count: 'exact', head: true }).eq('proof_status', 'pending'),
    ]);

    const monthlyRevenue = (subData || []).reduce((sum, s) => sum + Number(s.amount), 0);

    res.json({ totalUsers, activeSubscribers, monthlyRevenue, pendingVerifications });
  } catch (err) { next(err); }
};

exports.prizePoolReport = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('prize_pool').select('*').order('month', { ascending: false }).limit(12);
    if (error) throw error;
    res.json({ pools: data });
  } catch (err) { next(err); }
};

exports.charityTotalsReport = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('charities').select('id, name, total_raised, category').eq('is_active', true)
      .order('total_raised', { ascending: false });
    if (error) throw error;

    // Also get subscriber charity breakdown
    const { data: subCharity } = await supabase
      .from('subscriptions')
      .select('charity_amount, user:users(charity_id, charity:charities(name))')
      .eq('status', 'active');

    res.json({ charities: data, subscriptionBreakdown: subCharity });
  } catch (err) { next(err); }
};

exports.drawStatsReport = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('vw_monthly_prize_summary').select('*').order('month', { ascending: false });
    if (error) throw error;
    res.json({ draws: data });
  } catch (err) { next(err); }
};