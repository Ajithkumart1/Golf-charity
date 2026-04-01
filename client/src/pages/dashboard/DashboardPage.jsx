// client/src/pages/dashboard/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Trophy, Heart, CreditCard, ArrowRight, Star, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color = 'brand', to }) {
  const colorMap = { brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20', gold: 'text-gold-400 bg-gold-500/10 border-gold-500/20' };
  const inner = (
    <div className={`card flex flex-col gap-3 ${to ? 'hover:border-brand-500/40 cursor-pointer transition-all' : ''}`}>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-white">{value}</p>
        <p className="text-xs text-brand-300/50 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-brand-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { user, subscription, hasActiveSubscription } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasActiveSubscription) { setLoading(false); return; }
    api.get('/api/users/me/dashboard')
      .then(({ data: d }) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hasActiveSubscription]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Here's your GreenGive overview.</p>
      </div>

      {/* No subscription banner */}
      {!hasActiveSubscription && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card border-gold-500/30 bg-gold-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AlertCircle className="w-6 h-6 text-gold-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-white">No active subscription</p>
            <p className="text-sm text-brand-300/60 mt-0.5">Subscribe to enter draws, log scores, and support your charity.</p>
          </div>
          <Link to="/pricing" className="btn-gold text-sm py-2 px-4 flex items-center gap-2 flex-shrink-0">
            View Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CreditCard}
          label="Subscription"
          value={subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'None'}
          sub={subscription?.current_period_end ? `Renews ${format(new Date(subscription.current_period_end), 'dd MMM yy')}` : undefined}
          color={subscription?.status === 'active' ? 'brand' : 'gold'}
          to="/dashboard/subscription"
        />
        <StatCard icon={Target} label="Scores Logged" value={data?.scores?.length ?? '—'} sub="Last 5 kept" to="/dashboard/scores" />
        <StatCard icon={Trophy} label="Draws Entered" value={data?.drawResults?.length ?? '—'} sub="All time" to="/dashboard/draws" />
        <StatCard icon={Star} label="Total Winnings" value={data?.winnings?.length ? `£${data.winnings.reduce((s, w) => s + Number(w.prize_amount || 0), 0).toFixed(2)}` : '£0.00'} color="gold" to="/dashboard/winnings" />
      </div>

      {/* Scores preview */}
      {hasActiveSubscription && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white flex items-center gap-2"><Target className="w-4 h-4 text-brand-400" />Recent Scores</h2>
              <Link to="/dashboard/scores" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data?.scores?.length ? (
              <div className="space-y-2">
                {data.scores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                    <span className="text-sm text-brand-300/70">{format(new Date(s.played_at), 'dd MMM yyyy')}</span>
                    <span className="font-mono font-bold text-brand-400 text-lg">{s.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-brand-300/40 text-sm mb-3">No scores logged yet</p>
                <Link to="/dashboard/scores" className="btn-primary text-xs py-2 px-4">Add First Score</Link>
              </div>
            )}
          </div>

          {/* Charity card */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white flex items-center gap-2"><Heart className="w-4 h-4 text-brand-400" />Your Charity</h2>
              <Link to="/dashboard/charity" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Change <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data?.user?.charity ? (
              <div>
                <div className="h-24 rounded-xl bg-dark-700 mb-3 flex items-center justify-center overflow-hidden">
                  {data.user.charity.image_url
                    ? <img src={data.user.charity.image_url} alt={data.user.charity.name} className="w-full h-full object-cover" />
                    : <Heart className="w-8 h-8 text-brand-500/30" />}
                </div>
                <p className="font-semibold text-white">{data.user.charity.name}</p>
                <p className="text-xs text-brand-300/50 mt-1">
                  {data.user?.charity_percentage}% of your subscription (≈ £{(Number(subscription?.amount || 0) * (data.user?.charity_percentage || 10) / 100).toFixed(2)}/mo)
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-brand-300/40 text-sm mb-3">No charity selected</p>
                <Link to="/dashboard/charity" className="btn-primary text-xs py-2 px-4">Choose Charity</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Latest draw result */}
      {data?.drawResults?.[0] && (
        <div className="card border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-gold-400" />Latest Draw Result</h2>
            <Link to="/dashboard/draws" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              All Results <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {(() => {
            const r = data.drawResults[0];
            return (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div>
                  <p className="text-xs text-brand-300/50 mb-2">{format(new Date(r.draw?.month || new Date()), 'MMMM yyyy')} Draw</p>
                  <div className="flex gap-2 flex-wrap">
                    {(r.draw?.drawn_numbers || []).map((n) => (
                      <span key={n} className={`number-ball ${r.matched_numbers?.includes(n) ? 'number-ball-matched' : 'number-ball-drawn'}`}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="sm:ml-auto text-right">
                  {r.is_winner ? (
                    <div>
                      <span className="badge-active">🎉 Winner!</span>
                      <p className="text-xs text-brand-300/50 mt-1">{r.prize_tier} — {r.match_count} matches</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-brand-300/60 text-sm">{r.match_count} number{r.match_count !== 1 ? 's' : ''} matched</p>
                      <p className="text-xs text-brand-300/30 mt-1">Need 3+ to win</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}