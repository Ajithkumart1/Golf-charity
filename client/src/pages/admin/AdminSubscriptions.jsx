// client/src/pages/admin/AdminSubscriptions.jsx
import { useState, useEffect } from 'react';
import { CreditCard, Loader2, Search } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['active', 'cancelled', 'lapsed', 'past_due'];

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = () => {
    const params = filterStatus ? `?status=${filterStatus}` : '';
    api.get(`/api/admin/subscriptions${params}`)
      .then(({ data }) => setSubs(data.subscriptions))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const filtered = subs.filter(s =>
    s.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/api/admin/subscriptions/${id}`, { status });
      toast.success('Subscription updated');
      load();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const statusColor = {
    active: 'badge-active',
    cancelled: 'badge-error',
    lapsed: 'badge-error',
    past_due: 'badge-warning',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-400" /> Subscriptions
        </h1>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/40" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-52" placeholder="Search users…" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-2 text-sm w-40">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600 text-xs text-brand-300/40">
                  {['User', 'Plan', 'Amount', 'Charity £', 'Status', 'Period End', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-dark-700 hover:bg-dark-700/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{s.user?.full_name}</p>
                      <p className="text-xs text-brand-300/40">{s.user?.email}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-brand-300/70">{s.plan}</td>
                    <td className="px-5 py-3 font-semibold text-white">£{Number(s.amount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-brand-400">£{Number(s.charity_amount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={statusColor[s.status] || 'text-xs text-brand-300/40'}>{s.status}</span>
                    </td>
                    <td className="px-5 py-3 text-brand-300/50 text-xs">
                      {s.current_period_end ? format(new Date(s.current_period_end), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={s.status}
                        disabled={updating === s.id}
                        onChange={e => updateStatus(s.id, e.target.value)}
                        className="text-xs bg-dark-700 border border-dark-500 rounded-lg px-2 py-1 text-brand-300 focus:outline-none focus:border-brand-500"
                      >
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-brand-300/30 text-sm">No subscriptions found.</div>
          )}
        </div>
      )}
    </div>
  );
}