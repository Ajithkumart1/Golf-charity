// client/src/pages/admin/AdminWinners.jsx
import { useState, useEffect } from 'react';
import { Trophy, CheckCircle, XCircle, Loader2, ExternalLink, DollarSign } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    api.get('/api/winners').then(({ data }) => setWinners(data.winners)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const verify = async (id, status, notes = '') => {
    setProcessing(id + status);
    try {
      await api.patch(`/api/winners/${id}/verify`, { status, admin_notes: notes });
      toast.success(`Winner ${status}`);
      load();
    } catch { toast.error('Action failed'); }
    finally { setProcessing(null); }
  };

  const markPaid = async (id) => {
    setProcessing(id + 'paid');
    try {
      await api.patch(`/api/winners/${id}/paid`);
      toast.success('Marked as paid');
      load();
    } catch { toast.error('Failed'); }
    finally { setProcessing(null); }
  };

  const filtered = winners.filter((w) => {
    if (filter === 'pending') return w.proof_status === 'pending';
    if (filter === 'approved') return w.proof_status === 'approved';
    if (filter === 'unpaid') return w.proof_status === 'approved' && w.payout_status === 'pending';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-gold-400" />Winners</h1>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'unpaid'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${filter === f ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'border-dark-600 text-brand-300/50 hover:text-brand-300'}`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gold-400 animate-spin" /></div> : (
        <div className="space-y-4">
          {filtered.length === 0 && <div className="card text-center py-12 text-brand-300/40"><Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" /><p>No winners match this filter.</p></div>}
          {filtered.map((w) => (
            <div key={w.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold text-white">{w.user?.full_name}</p>
                  <p className="text-xs text-brand-300/40">{w.user?.email}</p>
                  <p className="text-xs text-brand-300/50 mt-1">
                    {w.draw?.month ? format(new Date(w.draw.month), 'MMMM yyyy') : '—'} — <span className="text-gold-400">{w.prize_tier}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-gold-400">£{Number(w.prize_amount || 0).toFixed(2)}</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    {w.proof_status === 'pending' && <span className="badge-warning">Proof Pending</span>}
                    {w.proof_status === 'approved' && <span className="badge-active">Approved</span>}
                    {w.proof_status === 'rejected' && <span className="badge-error">Rejected</span>}
                    {w.payout_status === 'paid' && <span className="badge-active">Paid</span>}
                  </div>
                </div>
              </div>

              {w.proof_url && (
                <div className="mb-4">
                  <a href={w.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 border border-brand-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    <ExternalLink className="w-3 h-3" /> View Proof Screenshot
                  </a>
                </div>
              )}

              {!w.proof_url && w.proof_status === 'pending' && (
                <p className="text-xs text-brand-300/40 mb-4">No proof uploaded yet.</p>
              )}

              {w.proof_url && w.proof_status === 'pending' && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => verify(w.id, 'approved')} disabled={!!processing} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
                    {processing === w.id + 'approved' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                  </button>
                  <button onClick={() => verify(w.id, 'rejected', 'Proof insufficient')} disabled={!!processing} className="text-xs py-2 px-3 flex items-center gap-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    {processing === w.id + 'rejected' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                  </button>
                </div>
              )}

              {w.proof_status === 'approved' && w.payout_status === 'pending' && (
                <button onClick={() => markPaid(w.id)} disabled={!!processing} className="btn-gold text-xs py-2 px-3 flex items-center gap-1">
                  {processing === w.id + 'paid' ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />} Mark as Paid
                </button>
              )}

              {w.admin_notes && <p className="text-xs text-brand-300/40 mt-2 italic">Note: {w.admin_notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}