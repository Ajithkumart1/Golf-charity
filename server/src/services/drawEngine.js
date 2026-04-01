// server/src/services/drawEngine.js
const supabase = require('../config/supabase');

const SCORE_MIN = 1;
const SCORE_MAX = 45;
const DRAW_COUNT = 5;

// ── Generate Draw Numbers ────────────────────────────────────

/**
 * Random mode: 5 unique numbers from 1-45
 */
function randomDraw() {
  const pool = Array.from({ length: SCORE_MAX }, (_, i) => i + 1);
  const drawn = [];
  while (drawn.length < DRAW_COUNT) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn.sort((a, b) => a - b);
}

/**
 * Algorithmic mode:
 * - Fetch all scores from last month's active subscribers
 * - Weight numbers by frequency (most common = more likely, with some variety)
 * - Pick 5 unique weighted-random numbers
 */
async function algorithmicDraw() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const { data: scores } = await supabase
    .from('scores')
    .select('score')
    .gte('played_at', oneMonthAgo.toISOString().split('T')[0]);

  if (!scores || scores.length === 0) return randomDraw();

  // Build frequency map
  const freq = {};
  for (let i = SCORE_MIN; i <= SCORE_MAX; i++) freq[i] = 1; // base weight
  for (const { score } of scores) {
    freq[score] = (freq[score] || 1) + 2; // popular scores weighted higher
  }

  // Weighted random selection
  const drawn = [];
  const available = Object.keys(freq).map(Number);

  while (drawn.length < DRAW_COUNT && available.length > 0) {
    const totalWeight = available.reduce((sum, n) => sum + freq[n], 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < available.length; i++) {
      rand -= freq[available[i]];
      if (rand <= 0) {
        drawn.push(available[i]);
        available.splice(i, 1);
        break;
      }
    }
  }

  return drawn.sort((a, b) => a - b);
}

// ── Process Draw Results ─────────────────────────────────────

/**
 * Compare each subscriber's last 5 scores against drawn numbers.
 * Returns array of { user_id, matched_numbers, match_count }
 */
async function processDraw(drawId, drawnNumbers) {
  // Get all active subscribers with their last 5 scores
  const { data: subscribers } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active');

  if (!subscribers || subscribers.length === 0) return [];

  const drawnSet = new Set(drawnNumbers);
  const results = [];

  for (const { user_id } of subscribers) {
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user_id)
      .order('played_at', { ascending: false })
      .limit(5);

    if (!scores || scores.length === 0) continue;

    const userNumbers = [...new Set(scores.map((s) => s.score))];
    const matched = userNumbers.filter((n) => drawnSet.has(n));
    const matchCount = matched.length;

    let prizeTier = null;
    if (matchCount === 5) prizeTier = '5-match';
    else if (matchCount === 4) prizeTier = '4-match';
    else if (matchCount === 3) prizeTier = '3-match';

    results.push({
      draw_id: drawId,
      user_id,
      matched_numbers: matched,
      match_count: matchCount,
      is_winner: matchCount >= 3,
      prize_tier: prizeTier,
    });
  }

  // Upsert all results
  if (results.length > 0) {
    await supabase.from('draw_results').upsert(results, { onConflict: 'draw_id,user_id' });
  }

  return results;
}

// ── Calculate Prize Pool ─────────────────────────────────────

/**
 * Computes prize pool from active subscriptions for a given month.
 * Accounts for rollover from previous month's 5-match pot.
 */
async function computePrizePool(monthDate) {
  const monthStr = monthDate.toISOString().split('T')[0].substring(0, 7) + '-01';

  // Sum active subscription amounts for the month
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('amount, charity_amount')
    .eq('status', 'active');

  const totalCollection = (subs || []).reduce((sum, s) => sum + Number(s.amount), 0);
  const totalCharity = (subs || []).reduce((sum, s) => sum + Number(s.charity_amount || 0), 0);
  const prizeBase = totalCollection - totalCharity;

  // Check last month's rollover
  const lastMonth = new Date(monthDate);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0].substring(0, 7) + '-01';

  const { data: lastPool } = await supabase
    .from('prize_pool')
    .select('five_match_pot, rollover_amount')
    .eq('month', lastMonthStr)
    .single();

  // Check if last month had a 5-match winner
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('id, jackpot_rolled')
    .eq('month', lastMonthStr)
    .single();

  let rollover = 0;
  if (lastDraw?.jackpot_rolled && lastPool) {
    rollover = Number(lastPool.five_match_pot) + Number(lastPool.rollover_amount || 0);
  }

  const totalPool = prizeBase + rollover;
  const fiveMatchPot = totalPool * 0.4 + rollover; // 40% + rollover
  const fourMatchPot = totalPool * 0.35;
  const threeMatchPot = totalPool * 0.25;

  const { data: pool, error } = await supabase
    .from('prize_pool')
    .upsert(
      {
        month: monthStr,
        total_pool: totalPool,
        five_match_pot: fiveMatchPot,
        four_match_pot: fourMatchPot,
        three_match_pot: threeMatchPot,
        rollover_amount: rollover,
        is_finalized: false,
      },
      { onConflict: 'month' }
    )
    .select()
    .single();

  if (error) throw error;
  return pool;
}

// ── Assign Prize Amounts ─────────────────────────────────────

async function assignPrizes(drawId, prizePool) {
  const tiers = ['5-match', '4-match', '3-match'];
  const tierPots = {
    '5-match': prizePool.five_match_pot,
    '4-match': prizePool.four_match_pot,
    '3-match': prizePool.three_match_pot,
  };

  let jackpotRolled = false;

  for (const tier of tiers) {
    const { data: winners } = await supabase
      .from('draw_results')
      .select('user_id')
      .eq('draw_id', drawId)
      .eq('prize_tier', tier);

    if (!winners || winners.length === 0) {
      if (tier === '5-match') jackpotRolled = true;
      continue;
    }

    const prizeEach = tierPots[tier] / winners.length;

    for (const { user_id } of winners) {
      await supabase.from('winners').upsert({
        draw_id: drawId,
        user_id,
        prize_tier: tier,
        prize_amount: prizeEach,
        proof_status: 'pending',
        payout_status: 'pending',
      });
    }
  }

  return jackpotRolled;
}

module.exports = { randomDraw, algorithmicDraw, processDraw, computePrizePool, assignPrizes };