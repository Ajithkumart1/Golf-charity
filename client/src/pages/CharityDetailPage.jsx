// client/src/pages/CharityDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ExternalLink, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CharityDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [charity, setCharity]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [amount, setAmount]     = useState('10');
  const [donating, setDonating] = useState(false);

  const donationSuccess = searchParams.get('donation') === 'success';

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setCharity(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDonate = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) { toast.error('Minimum donation is £1'); return; }
    setDonating(true);
    try {
      const { data } = await api.post('/api/stripe/donate', {
        charity_id: id,
        amount: numAmount,
        user_id: user?.id || null,
      });
      window.location.href = data.url;
    } catch {
      toast.error('Could not start donation checkout');
    } finally {
      setDonating(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  if (!charity) return (
    <div className="text-center py-24">
      <p className="text-brand-300/50">Charity not found.</p>
      <Link to="/charities" className="btn-secondary mt-4 inline-block">Back to Charities</Link>
    </div>
  );

  return (
    <div className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
      <Link to="/charities"
        className="inline-flex items-center gap-2 text-sm text-brand-300/60
          hover:text-brand-400 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Charities
      </Link>

      {donationSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 p-4 rounded-xl
            bg-brand-500/10 border border-brand-500/30">
          <CheckCircle className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <p className="text-sm text-brand-300">
            Thank you! Your donation to{' '}
            <strong className="text-white">{charity.name}</strong> was successful.
          </p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-64 rounded-2xl bg-dark-700 mb-6 overflow-hidden flex items-center justify-center">
              {charity.image_url
                ? <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
                : <Heart className="w-16 h-16 text-brand-500/20" />
              }
            </div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display text-3xl font-bold text-white">{charity.name}</h1>
              {charity.category && (
                <span className="badge-active capitalize">
                  {charity.category.replace('-', ' ')}
                </span>
              )}
            </div>
            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-400
                  hover:text-brand-300 mb-6 transition-colors">
                <ExternalLink className="w-4 h-4" /> Visit Official Website
              </a>
            )}
            <p className="text-brand-300/70 leading-relaxed text-base">{charity.description}</p>
            {charity.total_raised > 0 && (
              <div className="mt-8 card border-brand-500/20 bg-brand-500/5">
                <p className="text-sm text-brand-300/60">Total raised through GreenGive subscribers</p>
                <p className="font-display text-3xl font-bold text-brand-400 mt-1">
                  £{Number(charity.total_raised).toLocaleString()}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="card border-brand-500/30 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">Make a Donation</h2>
            </div>
            <p className="text-xs text-brand-300/50 mb-5">One-time donation — no subscription required</p>
            <label className="label">Amount (£)</label>
            <input type="number" min="1" step="1" value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input mb-3" placeholder="10.00" />
            <div className="flex gap-2 mb-5">
              {['5','10','25','50'].map(v => (
                <button key={v} onClick={() => setAmount(v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${amount === v
                      ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                      : 'border-dark-600 text-brand-300/50 hover:text-brand-300'
                    }`}>
                  £{v}
                </button>
              ))}
            </div>
            <button onClick={handleDonate} disabled={donating}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {donating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                : <><Heart className="w-4 h-4" />Donate £{amount}</>
              }
            </button>
            <p className="text-xs text-brand-300/30 mt-4 text-center">Secured by Stripe</p>
          </div>

          <div className="card mt-4 border-gold-500/20 bg-gold-500/5">
            <h3 className="font-semibold text-white text-sm mb-2">Prefer ongoing support?</h3>
            <p className="text-xs text-brand-300/50 mb-4">
              Subscribe and automatically donate to this charity every month while playing for prizes.
            </p>
            <Link to="/register"
              className="btn-gold w-full text-center text-sm py-2.5 block">
              Subscribe &amp; Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
