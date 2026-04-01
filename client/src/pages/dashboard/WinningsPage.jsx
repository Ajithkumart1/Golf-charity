// client/src/pages/dashboard/WinningsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Upload, CheckCircle, XCircle, Clock, Loader2, Trophy } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_MAP = {
  pending:  { label: 'Pending Proof',  icon: Clock,        className: 'badge-warning' },
  approved: { label: 'Approved',       icon: CheckCircle,  className: 'badge-active' },
  rejected: { label: 'Rejected',       icon: XCircle,      className: 'badge-error' },
};

const PAYOUT_MAP = {
  pending: { label: 'Payout Pending', className: 'badge-warning' },
  paid:    { label: 'Paid Out',       className: 'badge-active' },
};

export default function WinningsPage() {
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef({});

  useEffect(() => {
    api.get('/api/winners/my')
      .then(({ data }) => setWinnings(data.winners))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalEarned = winnings.filter(w => w.proof_status === 'approved').reduce((s, w) => s + Number(w.prize_amount || 0), 0);

  const handleUploadProof = async (winnerId, file) => {
    if (!file) return;
    setUploading(winnerId);
    const fd = new FormData();
    fd.append('proof', file);
    try {
      await api.post(`/api/winners/${winnerId}/proof`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Proof submitted! Awaiting admin review.');
      const { data } = await api.get('/api/winners/my');
      setWinnings(data.winners);
    } catch (err) {
      toast.error('Upload failed. Max 5MB, JPG/PNG/PDF only.');
    } finally { setUploading(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-gold-400" />Winnings
          </h1>
          <p className="text-brand-300/50 mt-1 text-sm">Your prize history and verification status.</p>
        </div>
        {totalEarned > 0 && (
          <div className="card border-gold-500/30 bg-gold-500/5 text-right px-5 py-3">
            <p className="text-xs text-brand-300/50">Total Approved</p>
            <p className="font-display text-2xl font-bold text-gold-400">£{totalEarned.toFixed(2)}</p>
          </div>
        )}
      </div>

      {winnings.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy className="w-14 h-14 text-brand-500/20 mx-auto mb-4" />
          <p className="text-brand-300/40">No winnings yet — keep entering those scores!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winnings.map((w, i) => {
            const proofStatus = STATUS_MAP[w.proof_status] || STATUS_MAP.pending;
            const payoutStatus = PAYOUT_MAP[w.payout_status] || PAYOUT_MAP.pending;
            const ProofIcon = proofStatus.icon;

            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-white">
                      {w.draw?.month ? format(new Date(w.draw.month), 'MMMM yyyy') : '—'} Draw
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-gold-500/20 text-gold-400 border border-gold-500/30`}>
                        {w.prize_tier}
                      </span>
                      <span className={proofStatus.className}><ProofIcon className="w-3 h-3" />{proofStatus.label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-gold-400">£{Number(w.prize_amount || 0).toFixed(2)}</p>
                    <span className={`text-xs ${payoutStatus.className}`}>{payoutStatus.label}</span>
                  </div>
                </div>

                {/* Drawn numbers */}
                {w.draw?.drawn_numbers && (
                  <div className="mb-4">
                    <p className="text-xs text-brand-300/40 mb-2">Winning Numbers</p>
                    <div className="flex gap-2 flex-wrap">
                      {w.draw.drawn_numbers.map((n) => (
                        <span key={n} className="number-ball-drawn">{n}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin notes */}
                {w.admin_notes && (
                  <div className="mb-4 p-3 rounded-lg bg-dark-700 border border-dark-600">
                    <p className="text-xs text-brand-300/50">Admin note: <span className="text-brand-300/80">{w.admin_notes}</span></p>
                  </div>
                )}

                {/* Proof upload */}
                {w.proof_status === 'pending' && !w.proof_url && (
                  <div className="border-t border-dark-600 pt-4">
                    <p className="text-sm text-brand-300/60 mb-3">
                      Please upload a screenshot proof of your score to verify your win.
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      ref={(el) => (fileRef.current[w.id] = el)}
                      className="hidden"
                      onChange={(e) => handleUploadProof(w.id, e.target.files[0])}
                    />
                    <button
                      onClick={() => fileRef.current[w.id]?.click()}
                      disabled={uploading === w.id}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      {uploading === w.id ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload Proof</>}
                    </button>
                  </div>
                )}

                {w.proof_url && (
                  <div className="border-t border-dark-600 pt-4">
                    <a href={w.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Proof submitted — view file
                    </a>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}