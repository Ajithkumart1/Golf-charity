// client/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CreditCard, Heart, Trophy, Clock, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import api from '../../lib/api';

function StatCard({ icon: Icon, label, value, sub, color = 'brand', to }) {
  const colorMap = { brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20', gold: 'text-gold-400 bg-gold-500/10 border-gold-500/20' };
  return (
    <Link to={to || '#'} className={`card flex flex-col gap-3 ${to ? 'hover:border-brand-500/40 transition-all' : 'cursor-default'}`}>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-white">{value}</p>
        <p className="text-xs text-brand-300/50">{label}</p>
        {sub && <p className="text-xs text-brand-400 mt-1">{sub}</p>}
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/reports/overview')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { label: 'Run Monthly Draw', desc: 'Configure and publish this month\'s draw', to: '/admin/draws', icon: Trophy, color: 'gold' },
    { label: 'Verify Winners', desc: 'Review submitted proof screenshots', to: '/admin/winners', icon: Clock, color: 'brand' },
    { label: 'Add Charity', desc: 'Register a new charity partner', to: '/admin/charities', icon: Heart, color: 'brand' },
    { label: 'View Reports', desc: 'Prize pools, charity totals, draw stats', to: '/admin/reports', icon: TrendingUp, color: 'brand' },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-gold-400 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-brand-300/50 mt-1 text-sm">Platform health and quick actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? '—'} to="/admin/users" />
        <StatCard icon={CreditCard} label="Active Subscribers" value={stats?.activeSubscribers ?? '—'} to="/admin/subscriptions" />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={stats?.monthlyRevenue ? `£${Number(stats.monthlyRevenue).toFixed(0)}` : '£0'} color="gold" to="/admin/reports" />
        <StatCard icon={Clock} label="Pending Verification" value={stats?.pendingVerifications ?? '0'} sub="Winner proofs" to="/admin/winners" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {quickActions.map(({ label, desc, to, icon: Icon, color }) => (
            <motion.div key={label} whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Link to={to} className="card-hover flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color === 'gold' ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-brand-500/10 border border-brand-500/20'}`}>
                  <Icon className={`w-5 h-5 ${color === 'gold' ? 'text-gold-400' : 'text-brand-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{label}</p>
                  <p className="text-xs text-brand-300/40 mt-0.5 truncate">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-300/30" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}