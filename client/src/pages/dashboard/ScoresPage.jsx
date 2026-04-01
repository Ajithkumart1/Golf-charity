// client/src/pages/dashboard/ScoresPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, Loader2, Info } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ score: '', played_at: '' });
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/api/scores');
      setScores(data.scores);
    } catch (e) { toast.error('Failed to load scores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const scoreNum = parseInt(form.score);
    if (!scoreNum || scoreNum < 1 || scoreNum > 45) { toast.error('Score must be 1–45'); return; }
    if (!form.played_at) { toast.error('Date is required'); return; }
    setAdding(true);
    try {
      const { data } = await api.post('/api/scores', { score: scoreNum, played_at: form.played_at });
      setScores(data.scores);
      setForm({ score: '', played_at: '' });
      toast.success('Score added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add score');
    } finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/api/scores/${id}`);
      setScores((s) => s.filter((sc) => sc.id !== id));
      toast.success('Score removed');
    } catch {
      toast.error('Failed to delete score');
    } finally { setDeleting(null); }
  };

  const scoreColor = (s) => {
    if (s >= 36) return 'text-brand-400';
    if (s >= 25) return 'text-gold-400';
    return 'text-brand-300/70';
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-brand-400" /> My Scores
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Your last 5 Stableford scores are used as your draw numbers each month.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/15">
        <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-brand-300/60 leading-relaxed">
          Only your <strong className="text-brand-400">last 5 scores</strong> are kept. When you add a 6th, the oldest is automatically removed.
          Scores must be between <strong className="text-brand-400">1 and 45</strong> (Stableford range).
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-brand-400" />Add New Score</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="label">Score (1–45)</label>
            <input
              type="number" min="1" max="45" required
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              className="input font-mono text-lg text-center"
              placeholder="36"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="label">Date Played</label>
            <input
              type="date" required
              max={new Date().toISOString().split('T')[0]}
              value={form.played_at}
              onChange={(e) => setForm({ ...form, played_at: e.target.value })}
              className="input"
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <button type="submit" disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2">
              {adding ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : <><Plus className="w-4 h-4" />Add Score</>}
            </button>
          </div>
        </div>
      </form>

      {/* Scores list */}
      <div className="card">
        <h2 className="font-semibold text-white mb-5">
          Your Scores <span className="text-brand-300/40 font-normal text-sm">({scores.length}/5)</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : scores.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-brand-500/20 mx-auto mb-3" />
            <p className="text-brand-300/40 text-sm">No scores yet. Add your first Stableford score above.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {scores.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-dark-700 border border-dark-600"
                >
                  <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center">
                    <span className={`font-mono font-bold text-xl ${scoreColor(s.score)}`}>{s.score}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{format(new Date(s.played_at), 'EEEE, d MMMM yyyy')}</p>
                    <p className="text-xs text-brand-300/40 mt-0.5">
                      {i === 0 ? '🏆 Most recent' : `Score #${i + 1}`}
                    </p>
                  </div>
                  <div className={`number-ball ${s.score >= 36 ? 'number-ball-drawn' : s.score >= 25 ? 'number-ball-matched' : 'number-ball-plain'}`}>
                    {s.score}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="p-2 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    {deleting === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {scores.length === 5 && (
          <p className="text-xs text-brand-300/30 text-center mt-4">You have the maximum 5 scores. Adding a new one will remove the oldest.</p>
        )}
      </div>

      {/* Draw numbers display */}
      {scores.length > 0 && (
        <div className="card border-brand-500/20 bg-brand-500/5">
          <h2 className="font-semibold text-white mb-3 text-sm">Your Current Draw Numbers</h2>
          <div className="flex gap-3 flex-wrap">
            {scores.map((s) => (
              <div key={s.id} className="number-ball-drawn text-lg w-12 h-12">{s.score}</div>
            ))}
          </div>
          <p className="text-xs text-brand-300/40 mt-3">These numbers will be matched against this month's draw.</p>
        </div>
      )}
    </div>
  );
}