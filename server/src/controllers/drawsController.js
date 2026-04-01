// server/src/controllers/drawsController.js
const supabase = require('../config/supabase');
const { randomDraw, algorithmicDraw, processDraw, computePrizePool, assignPrizes } = require('../services/drawEngine');

exports.listDraws = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select('*, prize_pool(*)')
      .eq('status', 'published')
      .order('month', { ascending: false });
    if (error) throw error;
    res.json({ draws: data });
  } catch (err) { next(err); }
};

exports.getDraw = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select('*, prize_pool(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json({ draw: data });
  } catch (err) { next(err); }
};

exports.getMyResults = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('draw_results')
      .select('*, draw:draws(month, drawn_numbers, status)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ results: data });
  } catch (err) { next(err); }
};

exports.createDraw = async (req, res, next) => {
  const { month, mode = 'random' } = req.body;
  if (!month) return res.status(400).json({ error: 'month required (YYYY-MM-DD first of month)' });

  try {
    const drawnNumbers = mode === 'algorithmic' ? await algorithmicDraw() : randomDraw();

    const { data: draw, error } = await supabase
      .from('draws')
      .insert({ month, drawn_numbers: drawnNumbers, mode, status: 'draft' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ draw });
  } catch (err) { next(err); }
};

exports.simulateDraw = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data: draw } = await supabase.from('draws').select('*').eq('id', id).single();
    if (!draw) return res.status(404).json({ error: 'Draw not found' });

    const prizePool = await computePrizePool(new Date(draw.month));
    const results = await processDraw(id, draw.drawn_numbers);

    await supabase.from('draws')
      .update({ status: 'simulation', prize_pool_id: prizePool.id })
      .eq('id', id);

    res.json({ simulation: { drawn_numbers: draw.drawn_numbers, results, prizePool } });
  } catch (err) { next(err); }
};

exports.publishDraw = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data: draw } = await supabase.from('draws').select('*').eq('id', id).single();
    if (!draw) return res.status(404).json({ error: 'Draw not found' });
    if (draw.status === 'published') return res.status(400).json({ error: 'Already published' });

    const prizePool = await computePrizePool(new Date(draw.month));
    await processDraw(id, draw.drawn_numbers);
    const jackpotRolled = await assignPrizes(id, prizePool);

    await supabase.from('draws')
      .update({
        status: 'published',
        drawn_at: new Date().toISOString(),
        prize_pool_id: prizePool.id,
        jackpot_rolled: jackpotRolled,
      })
      .eq('id', id);

    await supabase.from('prize_pool')
      .update({ is_finalized: true })
      .eq('id', prizePool.id);

    res.json({ message: 'Draw published', jackpotRolled });
  } catch (err) { next(err); }
};