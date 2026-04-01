// client/src/pages/admin/AdminReports.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Heart, Trophy, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';

function ReportCard({ title, icon: Icon, children, color = 'brand' }) {
  const c = color === 'gold' ? 'text-gold-400' : 'text-brand-400';
  return (
    <div className="card">
      <h2 className={`font-semibold text-white flex items-center gap-2 mb-5`}>
        <Icon className={`w-5 h-5 ${c}`} /> {title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminReports() {
  const [overview, setOverview] = useState(null);
  const [pools, setPools] = useState([]);
  const [charities, setCharities] = useState([]);
  const [drawStats, setDrawStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/reports/overview'),
      api.get('/api/admin/reports/prize-pools'),
      api.get('/api/admin/reports/charity-totals'),
      api.get('/api/admin/reports/draw-stats'),
    ]).then(([o, p, c, d]) => {
      setOverview(o.data);
      setPools(p.data.pools || []);
      setCharities(c.data.charities || []);
      setDrawStats(d.data.draws || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  const totalCharity = charities.reduce((s, c) => s + Number(c.total_raised || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" /> Reports
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Platform analytics and financial overview.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: overview?.totalUsers ?? '—' },
          { label: 'Active Subscribers', value: overview?.activeSubscribers ?? '—' },
          { label: 'Monthly Revenue', value: `£${Number(overview?.monthlyRevenue || 0).toFixed(2)}` },
          { label: 'Total Charity Raised', value: `£${totalCharity.toFixed(2)}`, color: 'gold' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card border ${color === 'gold' ? 'border-gold-500/20' : 'border-dark-600'}`}>
            <p className="text-xs text-brand-300/50 mb-1">{label}</p>
            <p className={`font-display text-2xl font-bold ${color === 'gold' ? 'text-gold-400' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Prize Pool History */}
        <ReportCard title="Prize Pool History" icon={Trophy} color="gold">
          {pools.length === 0 ? (
            <p className="text-brand-300/40 text-sm text-center py-6">No prize pool data yet.</p>
          ) : (
            <div className="space-y-3">
              {pools.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p.month ? format(new Date(p.month), 'MMMM yyyy') : '—'}
                    </p>
                    <p className="text-xs text-brand-300/40 mt-0.5">
                      Rollover: £{Number(p.rollover_amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gold-400">£{Number(p.total_pool || 0).toFixed(2)}</p>
                    <p className="text-xs text-brand-300/40">5-match: £{Number(p.five_match_pot || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        {/* Charity Totals */}
        <ReportCard title="Charity Totals" icon={Heart}>
          {charities.length === 0 ? (
            <p className="text-brand-300/40 text-sm text-center py-6">No charity data yet.</p>
          ) : (
            <div className="space-y-3">
              {charities.slice(0, 8).map((c) => {
                const pct = totalCharity > 0 ? (Number(c.total_raised) / totalCharity) * 100 : 0;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-white truncate pr-4">{c.name}</p>
                      <p className="text-sm font-semibold text-brand-400 flex-shrink-0">
                        £{Number(c.total_raised).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-brand-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ReportCard>

        {/* Draw Stats */}
        <ReportCard title="Draw Statistics" icon={TrendingUp} color="gold">
          {drawStats.length === 0 ? (
            <p className="text-brand-300/40 text-sm text-center py-6">No draw data yet.</p>
          ) : (
            <div className="space-y-3">
              {drawStats.slice(0, 6).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {d.month ? format(new Date(d.month), 'MMMM yyyy') : '—'}
                    </p>
                    <p className="text-xs text-brand-300/40">
                      {d.drawn_numbers?.join(', ') || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-300/50">Winners</p>
                    <p className="font-bold text-brand-400">{d.winner_count ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        {/* Summary */}
        <ReportCard title="Platform Summary" icon={BarChart3}>
          <div className="space-y-4">
            {[
              { label: 'Pending Winner Verifications', value: overview?.pendingVerifications ?? 0 },
              { label: 'Total Draws Run', value: drawStats.length },
              { label: 'Active Charity Partners', value: charities.length },
              {
                label: 'Avg. Subscription Value',
                value: overview?.activeSubscribers
                  ? `£${(Number(overview.monthlyRevenue) / Number(overview.activeSubscribers)).toFixed(2)}`
                  : '£0.00',
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                <p className="text-sm text-brand-300/60">{label}</p>
                <p className="font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </ReportCard>
      </div>
    </div>
  );
}