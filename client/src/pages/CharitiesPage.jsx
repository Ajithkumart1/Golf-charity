// client/src/pages/CharitiesPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Heart, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  'all','health','mental-health','children',
  'environment','poverty','elderly','emergency'
];

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from('charities')
        .select('*')
        .eq('is_active', true);
      if (search)             q = q.ilike('name', `%${search}%`);
      if (category !== 'all') q = q.eq('category', category);
      const { data } = await q.order('name');
      setCharities(data || []);
      setLoading(false);
    };
    const t = setTimeout(load, 280);
    return () => clearTimeout(t);
  }, [search, category]);

  return (
    <div className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Heart className="w-10 h-10 text-brand-400 mx-auto mb-4" />
          <h1 className="section-heading mb-3">Our Charity Partners</h1>
          <p className="text-brand-300/60 max-w-xl mx-auto">
            Every subscription directly supports one of these verified charities.
            Your golf game can change lives.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-10"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/50" />
          <input
            type="text" placeholder="Search charities…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap
                transition-all border
                ${category === cat
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'bg-dark-800 border-dark-600 text-brand-300/50 hover:text-brand-300'
                }`}>
              {cat === 'all' ? 'All Categories' : cat.replace('-', ' ')}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-dark-700 rounded-xl mb-4" />
              <div className="h-4 bg-dark-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-dark-700 rounded w-full mb-1" />
              <div className="h-3 bg-dark-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities.map((charity, i) => (
            <motion.div key={charity.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-hover flex flex-col"
            >
              <div className="h-36 rounded-xl bg-dark-700 mb-4 overflow-hidden flex items-center justify-center">
                {charity.image_url
                  ? <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
                  : <Heart className="w-10 h-10 text-brand-500/30" />
                }
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-lg font-bold text-white leading-tight">{charity.name}</h3>
                {charity.category && (
                  <span className="text-xs px-2 py-1 rounded-lg bg-brand-500/10 text-brand-400
                    border border-brand-500/20 capitalize whitespace-nowrap flex-shrink-0">
                    {charity.category.replace('-', ' ')}
                  </span>
                )}
              </div>
              <p className="text-sm text-brand-300/60 flex-1 leading-relaxed mb-4 line-clamp-3">
                {charity.description}
              </p>
              {charity.total_raised > 0 && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-brand-500/5 border border-brand-500/15">
                  <p className="text-xs text-brand-400 font-medium">
                    £{Number(charity.total_raised).toLocaleString()} raised through GreenGive
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3 mt-auto">
                <Link to={`/charities/${charity.id}`}
                  className="flex-1 btn-secondary text-center text-sm py-2">
                  View Profile
                </Link>
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-dark-600 hover:border-brand-500/50
                      text-brand-300/50 hover:text-brand-400 transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && charities.length === 0 && (
        <div className="text-center py-20 text-brand-300/40">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No charities found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
