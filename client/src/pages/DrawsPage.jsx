// client/src/pages/DrawsPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

export default function DrawsPage() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/draws')
      .then(({ data }) => setDraws(data.draws))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Trophy className="w-10 h-10 text-gold-400 mx-auto mb-4 animate-float" />
          <h1 className="section-heading mb-3">Monthly Draws</h1>
          <p className="text-brand-300/60 max-w-xl mx-auto">
            Each month, 5 numbers are drawn from 1–45. Match your Stableford scores to win a share of the prize pool.
          </p>
        </motion.div>
      </div>

      {/* Prize breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-3 gap-4 mb-12"
      >
        {[
          { match: '5 Numbers', pct: '40%', desc: 'Jackpot — rolls over if no winner', highlight: true },
          { match: '4 Numbers', pct: '35%', desc: 'Split among all 4-match winners' },
          { match: '3 Numbers', pct: '25%', desc: 'Split among all 3-match winners' },
        ].map(({ match, pct, desc, highlight }) => (
          <div key={match} className={`card text-center border ${highlight ? 'border-gold-500/30 bg-gold-500/5' : 'border-dark-600'}`}>
            <p className={`font-display text-4xl font-bold mb-1 ${highlight ? 'text-gold-400' : 'text-brand-400'}`}>{pct}</p>
            <p className="font-semibold text-white text-sm">{match} Matched</p>
            <p className="text-xs text-brand-300/50 mt-1">{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Draws list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
      ) : draws.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-brand-500/20 mx-auto mb-4" />
          <p className="text-brand-300/40">No draws have been published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {draws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {draw.month ? format(new Date(draw.month), 'MMMM yyyy') : '—'} Draw
                  </h2>
                  <p className="text-xs text-brand-300/40 mt-1 capitalize">
                    Mode: {draw.mode} &nbsp;·&nbsp;
                    {draw.drawn_at ? format(new Date(draw.drawn_at), 'dd MMM yyyy') : 'Draw date TBC'}
                  </p>
                </div>
                <div className="text-right">
                  {draw.prize_pool && (
                    <>
                      <p className="text-xs text-brand-300/50">Total Prize Pool</p>
                      <p className="font-display text-2xl font-bold text-gold-400">
                        £{Number(draw.prize_pool.total_pool || 0).toFixed(2)}
                      </p>
                    </>
                  )}
                  {draw.jackpot_rolled && (
                    <span className="badge-warning text-xs mt-1">🔄 Jackpot Rolled Over</span>
                  )}
                </div>
              </div>

              {/* Drawn numbers */}
              <div>
                <p className="text-xs text-brand-300/40 mb-3">Winning Numbers</p>
                <div className="flex gap-3 flex-wrap">
                  {(draw.drawn_numbers || []).map((n) => (
                    <div key={n} className="number-ball-drawn w-12 h-12 text-base shadow-lg shadow-brand-500/20">
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prize pots */}
              {draw.prize_pool && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: '5-Match Jackpot', value: draw.prize_pool.five_match_pot, gold: true },
                    { label: '4-Match Prize', value: draw.prize_pool.four_match_pot },
                    { label: '3-Match Prize', value: draw.prize_pool.three_match_pot },
                  ].map(({ label, value, gold }) => (
                    <div key={label} className="p-3 rounded-xl bg-dark-700 border border-dark-600 text-center">
                      <p className="text-xs text-brand-300/40 mb-1">{label}</p>
                      <p className={`font-mono font-bold ${gold ? 'text-gold-400' : 'text-brand-400'}`}>
                        £{Number(value || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}