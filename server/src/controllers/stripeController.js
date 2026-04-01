// server/src/controllers/stripeController.js
const stripe   = require('../config/stripe');
const supabase = require('../config/supabase');

const PLANS = {
  monthly: { priceId: process.env.STRIPE_MONTHLY_PRICE_ID, amount: 9.99  },
  yearly:  { priceId: process.env.STRIPE_YEARLY_PRICE_ID,  amount: 99.99 },
};

// ── Create Checkout Session ──────────────────────────────────────────────────
exports.createCheckout = async (req, res, next) => {
  const { plan = 'monthly' } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const userId = req.user.id;
  const email  = req.user.email;

  try {
    let customerId;
    const { data: user } = await supabase
      .from('users').select('stripe_customer_id').eq('id', userId).single();

    if (user?.stripe_customer_id) {
      customerId = user.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabase.from('users')
        .update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?sub=success`,
      cancel_url:  `${process.env.CLIENT_URL}/pricing?sub=cancelled`,
      metadata:    { user_id: userId, plan },
      subscription_data: { metadata: { user_id: userId, plan } },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) { next(err); }
};

// ── Donation Checkout ────────────────────────────────────────────────────────
exports.createDonationCheckout = async (req, res, next) => {
  const { charity_id, amount, user_id } = req.body;
  if (!charity_id || !amount || amount < 1)
    return res.status(400).json({ error: 'charity_id and amount (min £1) required' });

  try {
    const { data: charity } = await supabase
      .from('charities').select('name').eq('id', charity_id).single();
    if (!charity) return res.status(404).json({ error: 'Charity not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(amount * 100),
          product_data: { name: `Donation to ${charity.name}` },
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/charities/${charity_id}?donation=success`,
      cancel_url:  `${process.env.CLIENT_URL}/charities/${charity_id}`,
      metadata: { charity_id, user_id: user_id || null, type: 'donation' },
    });

    res.json({ url: session.url });
  } catch (err) { next(err); }
};

// ── Customer Portal ──────────────────────────────────────────────────────────
exports.createPortalSession = async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users').select('stripe_customer_id').eq('id', req.user.id).single();
    if (!user?.stripe_customer_id)
      return res.status(400).json({ error: 'No Stripe customer found' });

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripe_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) { next(err); }
};

// ── Webhook ──────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // FIX: removed duplicate case 'checkout.session.completed'
    // Switch now handles donation inside the same case using metadata.type
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object;
        if (sess.metadata?.type === 'donation') {
          await handleDonationCompleted(sess);
        } else {
          await handleCheckoutCompleted(sess);
        }
        break;
      }
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// ── Internal webhook helpers ─────────────────────────────────────────────────
async function handleCheckoutCompleted(session) {
  if (session.mode !== 'subscription') return;
  const userId = session.metadata?.user_id;
  const plan   = session.metadata?.plan || 'monthly';
  if (!userId) return;

  const sub        = await stripe.subscriptions.retrieve(session.subscription);
  const planConfig = PLANS[plan] || PLANS.monthly;

  const { data: user } = await supabase
    .from('users').select('charity_percentage').eq('id', userId).single();

  const charityPct    = user?.charity_percentage || 10;
  const charityAmount = (planConfig.amount * charityPct) / 100;

  await supabase.from('subscriptions').upsert(
    {
      user_id:              userId,
      stripe_session_id:    session.id,
      stripe_sub_id:        sub.id,
      stripe_price_id:      sub.items.data[0].price.id,
      plan,
      status:               'active',
      amount:               planConfig.amount,
      charity_amount:       charityAmount,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
    },
    { onConflict: 'stripe_sub_id' }
  );
}

async function handleSubscriptionUpdated(sub) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;
  const status =
    sub.status === 'active'   ? 'active'    :
    sub.status === 'canceled' ? 'cancelled' :
    sub.status === 'past_due' ? 'past_due'  : 'lapsed';

  await supabase.from('subscriptions').update({
    status,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
    cancelled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString() : null,
  }).eq('stripe_sub_id', sub.id);
}

async function handleSubscriptionDeleted(sub) {
  await supabase.from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('stripe_sub_id', sub.id);
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  await supabase.from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_sub_id', invoice.subscription);
}

async function handleDonationCompleted(session) {
  const { charity_id } = session.metadata;
  const amount = session.amount_total / 100;
  await supabase.from('charity_donations')
    .update({ status: 'completed' })
    .eq('stripe_session_id', session.id);
  await supabase.rpc('increment_charity_raised', {
    charity_id_param: charity_id,
    amount_param:     amount,
  });
}
