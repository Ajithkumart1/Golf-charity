// client/src/pages/PricingPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Heart, Trophy, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£9.99',
    period: '/month',
    description: 'Perfect for trying out the platform',
    highlight: false,
    features: [
      'Enter up to 5 Stableford scores',
      'Monthly draw participation',
      'Win up to 40% of prize pool',
      'Minimum 10% to chosen charity',
      'Score history & analytics',
      'Cancel anytime',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '£99.99',
    period: '/year',
    description: 'Best value — save £19.89',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority draw entry',
      'Increase charity percentage',
      'Exclusive yearly winner leaderboard',
      'Early access to new features',
    ],
  },
];

const perks = [
  { icon: Trophy, label: 'Monthly Prize Draws', desc: 'Match your golf scores for cash prizes' },
  { icon: Heart, label: 'Charity Impact', desc: 'Min. 10% of every subscription donated' },
  { icon: Shield, label: 'Secure Payments', desc: 'Powered by Stripe — bank-level security' },
  { icon: Zap, label: 'Instant Access', desc: 'Start entering scores immediately' },
];

export default function PricingPage() {
  const { user, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (planId) => {
    if (!user) { navigate('/register'); return; }
    if (hasActiveSubscription) { navigate('/dashboard/subscription'); return; }
    setLoading(planId);
    try {
      const { data } = await api.post('/api/stripe/create-checkout', { plan: planId });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-3"
        >Subscription Plans</motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-heading mb-4"
        >Simple, Transparent Pricing</motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-brand-300/60 text-lg max-w-xl mx-auto"
        >
          Every plan includes draw participation and charity donations. No hidden fees.
        </motion.p>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`relative card flex flex-col ${plan.highlight ? 'border-brand-500/50 glow-green' : ''}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-brand-500 text-dark-900 text-xs font-bold">{plan.badge}</span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-white">{plan.name}</h2>
              <p className="text-brand-300/50 text-sm mt-1">{plan.description}</p>
            </div>

            <div className="mb-8">
              <span className="font-display text-5xl font-bold text-white">{plan.price}</span>
              <span className="text-brand-300/60 text-sm">{plan.period}</span>
              {plan.id === 'yearly' && (
                <p className="text-brand-400 text-xs mt-1 font-medium">≈ £8.33/month</p>
              )}
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-brand-200/80">
                  <Check className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                plan.highlight
                  ? 'btn-primary'
                  : 'btn-secondary'
              } disabled:opacity-50`}
            >
              {loading === plan.id ? (
                <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing…</>
              ) : hasActiveSubscription ? (
                'Current Plan'
              ) : (
                <><span>Get {plan.name}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Perks grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {perks.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="card text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <p className="text-xs text-brand-300/50">{desc}</p>
          </div>
        ))}
      </motion.div>

      <p className="text-center text-xs text-brand-300/30 mt-10">
        Payments secured by Stripe. Cancel anytime. Charity percentages are calculated per billing cycle.
      </p>
    </div>
  );
}