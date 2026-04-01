// client/src/pages/dashboard/MyCharityPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Save, Loader2, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function MyCharityPage() {
  const { user, refreshUser, subscription } = useAuth();
  const [charities, setCharities] = useState([]);
  const [selected, setSelected] = useState(user?.charity_id || '');
  const [pct, setPct] = useState(user?.charity_percentage || 10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/charities').then(({ data }) => setCharities(data.charities));
  }, []);

  const charity = charities.find(c => c.id === selected);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/users/me', { charity_id: selected, charity_percentage: pct });
      await refreshUser();
      toast.success('Charity preferences saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const monthlyGiving = ((Number(subscription?.amount) || 9.99) * pct / 100).toFixed(2);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-brand-400" />My Charity
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Choose which charity receives your contribution each month.</p>
      </div>

      {/* Current impact */}
      {charity && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card border-brand-500/20 bg-brand-500/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {charity.image_url ? <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" /> : <Heart className="w-6 h-6 text-brand-500/40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{charity.name}</p>
              <p className="text-sm text-brand-400 font-medium mt-0.5">£{monthlyGiving}/month going to this cause</p>
            </div>
            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noopener noreferrer" className="p-2 text-brand-300/40 hover:text-brand-400 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Charity selector */}
      <div className="card">
        <label className="label mb-3">Select Charity</label>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {charities.map((c) => (
            <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected === c.id ? 'border-brand-500/50 bg-brand-500/10' : 'border-dark-600 hover:border-dark-500'}`}>
              <input type="radio" name="charity" value={c.id} checked={selected === c.id} onChange={() => setSelected(c.id)} className="sr-only" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected === c.id ? 'border-brand-500 bg-brand-500' : 'border-dark-500'}`}>
                {selected === c.id && <div className="w-2 h-2 bg-dark-900 rounded-full" />}
              </div>
              <span className="text-sm text-white">{c.name}</span>
              <span className="text-xs text-brand-300/30 capitalize ml-auto">{c.category?.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Percentage */}
      <div className="card">
        <label className="label">Donation Percentage: <span className="text-brand-400 font-bold">{pct}%</span></label>
        <input type="range" min="10" max="50" step="5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-brand-500 my-3" />
        <div className="flex justify-between text-xs text-brand-300/40">
          <span>Min 10% (required)</span><span>Max 50%</span>
        </div>
        <div className="mt-3 px-3 py-2 rounded-lg bg-dark-700 border border-dark-600">
          <p className="text-xs text-brand-300/60">
            At <strong className="text-brand-400">{pct}%</strong>, you'll donate approximately <strong className="text-brand-400">£{monthlyGiving}/month</strong> to {charity?.name || 'your chosen charity'}.
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !selected} className="btn-primary flex items-center gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Preferences</>}
      </button>
    </div>
  );
}