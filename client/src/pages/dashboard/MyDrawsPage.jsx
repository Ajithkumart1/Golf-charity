// client/src/pages/dashboard/MyDrawsPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function MyDrawsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/draws/my/results')
      .then(({ data }) => setResults(data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gold-400" />Draw History
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Your participation in monthly draws.</p>
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy className="w-14 h-14 text-brand-500/20 mx-auto mb-4" />
          <p className="text-brand-300/40">No draw results yet. Keep logging your scores!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-white">{r.draw?.month ? format(new Date(r.draw.month), 'MMMM yyyy') : '—'}</p>
                  <p className="text-xs text-brand-300/40 mt-0.5 capitalize">{r.draw?.status} draw</p>
                </div>
                {r.is_winner ? (
                  <span className="badge-active">🏆 {r.prize_tier}</span>
                ) : (
                  <span className="text-xs text-brand-300/40">{r.match_count} match{r.match_count !== 1 ? 'es' : ''}</span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap mb-2">
                {(r.draw?.drawn_numbers || []).map((n) => (
                  <span key={n} className={r.matched_numbers?.includes(n) ? 'number-ball-matched' : 'number-ball-plain'}>{n}</span>
                ))}
              </div>

              {r.matched_numbers?.length > 0 && (
                <p className="text-xs text-brand-300/50 mt-2">
                  Matched: {r.matched_numbers.join(', ')}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}