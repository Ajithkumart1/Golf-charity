// server/src/controllers/subscriptionsController.js
const supabase = require('../config/supabase');
const stripe = require('../config/stripe');

exports.getMy = async (req, res, next) => {
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

exports.cancel = async (req, res, next) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_sub_id')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (!sub?.stripe_sub_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end via Stripe
    await stripe.subscriptions.update(sub.stripe_sub_id, {
      cancel_at_period_end: true,
    });

    res.json({ message: 'Subscription will cancel at end of billing period' });
  } catch (err) { next(err); }
};