// client/src/pages/admin/AdminCharities.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', image_url: '', website_url: '', category: 'health' };
const CATEGORIES = ['health', 'mental-health', 'children', 'environment', 'poverty', 'elderly', 'emergency'];

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, 'new' or charity id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/api/charities').then(({ data }) => setCharities(data.charities)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (c) => { setForm(c); setEditing(c.id); };
  const close = () => { setEditing(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing === 'new') {
        await api.post('/api/charities', form);
        toast.success('Charity added');
      } else {
        await api.put(`/api/charities/${editing}`, form);
        toast.success('Charity updated');
      }
      close();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this charity?')) return;
    try {
      await api.delete(`/api/charities/${id}`);
      toast.success('Charity deactivated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2"><Heart className="w-6 h-6 text-brand-400" />Charities</h1>
        <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2"><Plus className="w-4 h-4" />Add Charity</button>
      </div>

      {/* Edit/Create form */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card border-brand-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">{editing === 'new' ? 'Add New Charity' : 'Edit Charity'}</h2>
              <button onClick={close}><X className="w-5 h-5 text-brand-300/50" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Charity name" />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input h-24 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the charity's mission" />
              </div>
              <div>
                <label className="label">Image URL</label>
                <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className="label">Website URL</label>
                <input className="input" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://…" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={close} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {charities.map((c) => (
            <div key={c.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white text-sm leading-tight">{c.name}</h3>
                <span className="text-xs text-brand-300/40 capitalize whitespace-nowrap">{c.category?.replace('-', ' ')}</span>
              </div>
              <p className="text-xs text-brand-300/50 line-clamp-2 flex-1">{c.description}</p>
              <p className="text-xs text-brand-400 font-medium">£{Number(c.total_raised).toLocaleString()} raised</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEdit(c)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><Edit2 className="w-3 h-3" />Edit</button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}