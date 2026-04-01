// server/src/controllers/usersController.js
const supabase = require('../config/supabase');

exports.getMe = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, charity:charities(id, name, description, image_url)')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['full_name', 'charity_id', 'charity_percentage'];
    const updates = {};
    for (const f of allowed) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (updates.charity_percentage) {
      updates.charity_percentage = Math.max(10, Math.min(100, updates.charity_percentage));
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;

    // If charity_percentage changed, update active subscription charity_amount
    if (updates.charity_percentage) {
      const { data: sub } = await supabase
        .from('subscriptions').select('amount').eq('user_id', req.user.id).eq('status', 'active').single();
      if (sub) {
        const newCharityAmt = (Number(sub.amount) * updates.charity_percentage) / 100;
        await supabase.from('subscriptions')
          .update({ charity_amount: newCharityAmt })
          .eq('user_id', req.user.id).eq('status', 'active');
      }
    }

    res.json({ user: data });
  } catch (err) { next(err); }
};

exports.getMySubscription = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ subscription: data || null });
  } catch (err) { next(err); }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const [
      { data: user },
      { data: scores },
      { data: subscription },
      { data: drawResults },
      { data: winnings },
    ] = await Promise.all([
      supabase.from('users').select('*, charity:charities(*)').eq('id', uid).single(),
      supabase.from('scores').select('*').eq('user_id', uid).order('played_at', { ascending: false }).limit(5),
      supabase.from('subscriptions').select('*').eq('user_id', uid).eq('status', 'active').single(),
      supabase.from('draw_results').select('*, draw:draws(month, drawn_numbers, status)').eq('user_id', uid).order('created_at', { ascending: false }).limit(6),
      supabase.from('winners').select('*, draw:draws(month)').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);

    res.json({ user, scores, subscription, drawResults, winnings });
  } catch (err) { next(err); }
};