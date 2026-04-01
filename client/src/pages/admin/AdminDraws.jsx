// client/src/pages/admin/AdminDraws.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Play, CheckCircle, AlertTriangle, Loader2, Plus, Eye } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [simulating, setSimulating] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const [newDraw, setNewDraw] = useState({
    month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
    mode: 'random',
  });

  const load = () => {
    api.get('/api/admin/reports/draw-stats')
      .then(({ data }) => setDraws(data.draws || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/api/draws', newDraw);
      toast.success(`Draw created: ${data.draw.drawn_numbers.join(', ')}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create draw');
    } finally { setCreating(false); }
  };

  const handleSimulate = async (id) => {
    setSimulating(id);
    setSimResult(null);
    try {
      const { data } = await api.post(`/api/draws/${id}/simulate`);
      setSimResult(data.simulation);
      toast.success('Simulation complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally { setSimulating(null); }
  };

  const handlePublish = async (id) => {
    if (!confirm('Publish this draw? This will assign prizes and notify winners. This cannot be undone.')) return;
    setPublishing(id);
    try {
      const { data } = await api.post(`/api/draws/${id}/publish`);
      toast.success(data.jackpotRolled ? 'Draw published — jackpot rolls over!' : 'Draw published successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed');
    } finally { setPublishing(null); }
  };

  const statusBadge = (s) => {
    if (s === 'published') return <span className="badge-active">Published</span>;
    if (s === 'simulation') return <span className="badge-warning">Simulated</span>;
    return <span className="text-xs px-2 py-1 rounded-full bg-dark-600 text-brand-300/50 border border-dark-500">Draft</span>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Shuffle className="w-6 h-6 text-gold-400" />Draw Engine
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Create, simulate, and publish monthly draws.</p>
      </div>

      {/* Create new draw */}
      <div className="card border-gold-500/20">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-gold-400" />Create New Draw</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Draw Month</label>
            <input
              type="month"
              value={newDraw.month.substring(0, 7)}
              onChange={(e) => setNewDraw({ ...newDraw, month: e.target.value + '-01' })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Draw Mode</label>
            <select
              value={newDraw.mode}
              onChange={(e) => setNewDraw({ ...newDraw, mode: e.target.value })}
              className="input"
            >
              <option value="random">🎲 Random</option>
              <option value="algorithmic">📊 Algorithmic (score-weighted)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleCreate} disabled={creating} className="btn-gold w-full flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
              Generate Draw
            </button>
          </div>
        </div>
        <p className="text-xs text-brand-300/40 mt-3">
          <strong>Random:</strong> 5 numbers drawn uniformly from 1–45. &nbsp;
          <strong>Algorithmic:</strong> weighted by frequency of recent subscriber scores.
        </p>
      </div>

      {/* Simulation result */}
      <AnimatePresence>
        {simResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card border-brand-500/30 bg-brand-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><Eye className="w-4 h-4 text-brand-400" />Simulation Preview</h3>
              <button onClick={() => setSimResult(null)} className="text-xs text-brand-300/40 hover:text-brand-300">Dismiss</button>
            </div>
            <div className="flex gap-2 mb-4">
              {(simResult.drawn_numbers || []).map((n) => (
                <span key={n} className="number-ball-drawn">{n}</span>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-dark-700 border border-dark-600">
                <p className="text-brand-300/50">5-Match Prize Pot</p>
                <p className="text-gold-400 font-bold text-lg">£{Number(simResult.prizePool?.five_match_pot || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-dark-700 border border-dark-600">
                <p className="text-brand-300/50">4-Match Prize Pot</p>
                <p className="text-brand-400 font-bold text-lg">£{Number(simResult.prizePool?.four_match_pot || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-dark-700 border border-dark-600">
                <p className="text-brand-300/50">3-Match Prize Pot</p>
                <p className="text-brand-400 font-bold text-lg">£{Number(simResult.prizePool?.three_match_pot || 0).toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-brand-300/40 mt-3">
              {simResult.results?.filter(r => r.is_winner).length || 0} winners identified in simulation.
              Publish to finalise and assign prizes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draws list */}
      <div>
        <h2 className="font-semibold text-white mb-4">All Draws</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : draws.length === 0 ? (
          <div className="card text-center py-12 text-brand-300/40"><Shuffle className="w-10 h-10 mx-auto mb-3 opacity-20" /><p>No draws yet.</p></div>
        ) : (
          <div className="space-y-3">
            {draws.map((d) => (
              <div key={d.month} className="card flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{d.month ? format(new Date(d.month), 'MMMM yyyy') : '—'}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(d.drawn_numbers || []).map((n) => (
                      <span key={n} className="number-ball-drawn text-xs w-8 h-8">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-right">
                  <p className="text-brand-300/50">Total Pool: <span className="text-white font-semibold">£{Number(d.total_pool || 0).toFixed(2)}</span></p>
                  <p className="text-brand-300/50">Winners: <span className="text-brand-400">{d.winner_count || 0}</span></p>
                </div>
                {statusBadge(d.status)}

                {d.status !== 'published' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSimulate(d.id)}
                      disabled={simulating === d.id}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      {simulating === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Simulate
                    </button>
                    <button
                      onClick={() => handlePublish(d.id)}
                      disabled={publishing === d.id}
                      className="btn-gold text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      {publishing === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Publish
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}