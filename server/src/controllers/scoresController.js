// server/src/controllers/scoresController.js
const supabase = require('../config/supabase');

exports.getMyScores = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json({ scores: data });
  } catch (err) {
    next(err);
  }
};

exports.addScore = async (req, res, next) => {
  const { score, played_at } = req.body;
  try {
    // Insert — trigger will auto-delete oldest if > 5
    const { data, error } = await supabase
      .from('scores')
      .insert({ user_id: req.user.id, score, played_at })
      .select()
      .single();

    if (error) throw error;

    // Return updated list
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: false })
      .limit(5);

    res.status(201).json({ score: data, scores });
  } catch (err) {
    next(err);
  }
};

exports.deleteScore = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id); // ensure ownership

    if (error) throw error;
    res.json({ message: 'Score deleted' });
  } catch (err) {
    next(err);
  }
};