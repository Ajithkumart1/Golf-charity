// client/src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Loader2, ArrowRight, Check,
  Heart, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'Charity', 'Review'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [step, setStep]   = useState(0);
  const [charities, setCharities]               = useState([]);
  const [charitiesLoading, setCharitiesLoading] = useState(true);
  const [charitiesError,   setCharitiesError]   = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    charity_id: '', charity_percentage: 10,
  });

  // Fetch charities DIRECTLY from Supabase — no backend server needed
  const fetchCharities = async () => {
    setCharitiesLoading(true);
    setCharitiesError(null);
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('id, name, description, category')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      if (!data || data.length === 0) {
        setCharitiesError('No charities found. Make sure the database seed has been run.');
      } else {
        setCharities(data);
      }
    } catch (err) {
      console.error('[RegisterPage] fetchCharities:', err);
      const msg = err?.message || '';
      if (msg.includes('Invalid API key') || msg.includes('apikey')) {
        setCharitiesError('Invalid Supabase key — check VITE_SUPABASE_ANON_KEY in client/.env');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setCharitiesError('Cannot reach Supabase — check VITE_SUPABASE_URL in client/.env');
      } else {
        setCharitiesError(msg || 'Failed to load charities. Please retry.');
      }
    } finally {
      setCharitiesLoading(false);
    }
  };

  useEffect(() => { fetchCharities(); }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedCharity = charities.find(c => c.id === form.charity_id);

  const goToCharity = (e) => {
    e.preventDefault();
    if (!form.full_name.trim())   return toast.error('Full name is required');
    if (!form.email.trim())       return toast.error('Email is required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setStep(1);
  };

  const goToReview = () => {
    if (!form.charity_id) return toast.error('Please select a charity to continue');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await register(form);
      toast.success('Account created! Choose a subscription plan.');
      navigate('/pricing');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
      setStep(0);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Create Your Account</h1>
          <p className="text-brand-300/50 mt-2 text-sm">Join thousands of golfers making a difference</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${i === step  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : i < step   ? 'text-brand-500'
                :               'text-brand-300/30'}`}
              >
                {i < step ? <Check className="w-3 h-3" /> : <span className="font-mono">{i+1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${i < step ? 'bg-brand-500' : 'bg-dark-600'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card border-dark-600">
          <AnimatePresence mode="wait">

            {/* ── STEP 0 — Account ──────────────────────────────────────── */}
            {step === 0 && (
              <motion.form key="s0"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}
                onSubmit={goToCharity} className="space-y-5"
              >
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" required autoComplete="name"
                    value={form.full_name}
                    onChange={e => update('full_name', e.target.value)}
                    className="input" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" required autoComplete="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    className="input" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required minLength={8} autoComplete="new-password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="input pr-11" placeholder="Min. 8 characters"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500/50 hover:text-brand-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {/* ── STEP 1 — Charity ──────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <p className="label flex items-center gap-2">
                    <Heart className="w-4 h-4 text-brand-400" /> Select Your Charity
                  </p>

                  {charitiesLoading && (
                    <div className="flex items-center justify-center gap-3 py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                      <span className="text-sm text-brand-300/50">Loading charities…</span>
                    </div>
                  )}

                  {!charitiesLoading && charitiesError && (
                    <div className="flex flex-col items-center gap-3 py-8 px-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <AlertCircle className="w-7 h-7 text-red-400/70" />
                      <p className="text-sm text-brand-300/60 text-center leading-relaxed">{charitiesError}</p>
                      <button type="button" onClick={fetchCharities}
                        className="btn-secondary text-xs py-2 px-4 flex items-center gap-2">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  )}

                  {!charitiesLoading && !charitiesError && charities.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mt-2">
                      {charities.map(c => (
                        <div
                          key={c.id}
                          role="button" tabIndex={0}
                          onClick={() => update('charity_id', c.id)}
                          onKeyDown={e => e.key === 'Enter' && update('charity_id', c.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                            transition-all duration-150 select-none outline-none
                            focus-visible:ring-2 focus-visible:ring-brand-500/50
                            ${form.charity_id === c.id
                              ? 'border-brand-500/60 bg-brand-500/15'
                              : 'border-dark-600 hover:border-brand-700/60 hover:bg-dark-700/40'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center
                            justify-center flex-shrink-0 transition-all
                            ${form.charity_id === c.id ? 'border-brand-500 bg-brand-500' : 'border-dark-500'}`}>
                            {form.charity_id === c.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-dark-900" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{c.name}</p>
                            {c.category && (
                              <p className="text-xs text-brand-300/40 capitalize mt-0.5">
                                {c.category.replace(/-/g, ' ')}
                              </p>
                            )}
                          </div>
                          {form.charity_id === c.id && (
                            <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Percentage slider — only after charity picked */}
                <AnimatePresence>
                  {form.charity_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="label">
                        Donation Percentage:{' '}
                        <span className="text-brand-400 font-semibold">{form.charity_percentage}%</span>
                      </p>
                      <input type="range" min="10" max="50" step="5"
                        value={form.charity_percentage}
                        onChange={e => update('charity_percentage', Number(e.target.value))}
                        className="w-full accent-brand-500" />
                      <div className="flex justify-between text-xs text-brand-300/40 mt-1">
                        <span>Min 10%</span><span>Max 50%</span>
                      </div>
                      <p className="text-xs text-brand-300/50 mt-2">
                        {form.charity_percentage}% of your subscription (≈ £
                        {(9.99 * form.charity_percentage / 100).toFixed(2)}/month) goes to{' '}
                        <span className="text-brand-400 font-medium">{selectedCharity?.name}</span>.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                  <button type="button" onClick={goToReview}
                    disabled={charitiesLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2 — Review ───────────────────────────────────────── */}
            {step === 2 && (
              <motion.form key="s2"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}
                onSubmit={handleSubmit} className="space-y-5"
              >
                <div className="space-y-3">
                  {[
                    { label: 'Name',      value: form.full_name },
                    { label: 'Email',     value: form.email },
                    { label: 'Charity',   value: selectedCharity?.name || '—' },
                    { label: 'Charity %', value: `${form.charity_percentage}%` },
                  ].map(({ label, value }) => (
                    <div key={label}
                      className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
                      <span className="text-xs text-brand-300/50">{label}</span>
                      <span className="text-sm text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-brand-300/40 leading-relaxed">
                  By creating an account you agree to our Terms of Service.
                  You can change your charity and percentage at any time from your dashboard.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={formLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {formLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                      : 'Create Account'
                    }
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-brand-300/50 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
