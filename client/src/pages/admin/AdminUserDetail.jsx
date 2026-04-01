// client/src/pages/admin/AdminUserDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newScore, setNewScore] = useState({ score: '', played_at: '' });
  const [addingScore, setAddingScore] = useState(false);

  const loadUser = () => {
    Promise.all([
      api.get(`/api/admin/users/${id}`),
      api.get(`/api/admin/users/${id}/scores`),
    ]).then(([u, s]) => {
      setUser(u.data.user);
      setScores(s.data.scores);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUser(); }, [id]);

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${id}`, {
        full_name: user.full_name,
        role: user.role,
        charity_percentage: user.charity_percentage,
      });
      toast.success('User updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleAddScore = async () => {
    if (!newScore.score || !newScore.played_at) return toast.error('Score and date required');
    setAddingScore(true);
    try {
      await api.post(`/api/admin/users/${id}/scores`, {
        score: parseInt(newScore.score),
        played_at: newScore.played_at,
      });
      setNewScore({ score: '', played_at: '' });
      toast.success('Score added');
      const { data } = await api.get(`/api/admin/users/${id}/scores`);
      setScores(data.scores);
    } catch { toast.error('Failed to add score'); }
    finally { setAddingScore(false); }
  };

  const handleDeleteScore = async (scoreId) => {
    try {
      await api.delete(`/api/admin/scores/${scoreId}`);
      setScores(s => s.filter(sc => sc.id !== scoreId));
      toast.success('Score deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-400 animate-spin" /></div>;
  if (!user) return <div className="text-center py-20 text-brand-300/40">User not found.</div>;

  const sub = user.subscriptions?.[0];

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/users" className="p-2 rounded-xl border border-dark-600 hover:border-brand-500/40 text-brand-300/50 hover:text-brand-400 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{user.full_name}</h1>
          <p className="text-brand-300/50 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Subscription status */}
      {sub && (
        <div className="card border-brand-500/20 bg-brand-500/5">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs text-brand-300/50">Subscription</p>
              <p className="font-semibold text-white capitalize">{sub.plan} — £{Number(sub.amount).toFixed(2)}</p>
            </div>
            <span className={sub.status === 'active' ? 'badge-active' : 'badge-error'}>{sub.status}</span>
            {sub.current_period_end && (
              <p className="text-xs text-brand-300/40">Renews {format(new Date(sub.current_period_end), 'dd MMM yyyy')}</p>
            )}
          </div>
        </div>
      )}

      {/* Edit user */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Edit User</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={user.full_name || ''} onChange={e => setUser({ ...user, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={user.role} onChange={e => setUser({ ...user, role: e.target.value })}>
              <option value="subscriber">Subscriber</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Charity % ({user.charity_percentage}%)</label>
            <input type="range" min="10" max="50" step="5" value={user.charity_percentage || 10}
              onChange={e => setUser({ ...user, charity_percentage: Number(e.target.value) })}
              className="w-full accent-brand-500 mt-2" />
          </div>
        </div>
        <button onClick={handleSaveUser} disabled={saving} className="btn-primary mt-4 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Score management */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Scores ({scores.length}/5)</h2>

        <div className="flex gap-3 mb-5">
          <input
            type="number" min="1" max="45" placeholder="Score (1-45)"
            value={newScore.score}
            onChange={e => setNewScore({ ...newScore, score: e.target.value })}
            className="input w-36 font-mono text-center"
          />
          <input
            type="date" max={new Date().toISOString().split('T')[0]}
            value={newScore.played_at}
            onChange={e => setNewScore({ ...newScore, played_at: e.target.value })}
            className="input flex-1"
          />
          <button onClick={handleAddScore} disabled={addingScore} className="btn-primary flex items-center gap-1 flex-shrink-0">
            {addingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>

        {scores.length === 0 ? (
          <p className="text-brand-300/40 text-sm text-center py-4">No scores logged.</p>
        ) : (
          <div className="space-y-2">
            {scores.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-dark-700 border border-dark-600">
                <span className="text-sm text-brand-300/70">{format(new Date(s.played_at), 'dd MMM yyyy')}</span>
                <span className="font-mono font-bold text-brand-400 text-xl">{s.score}</span>
                <button onClick={() => handleDeleteScore(s.id)} className="p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}