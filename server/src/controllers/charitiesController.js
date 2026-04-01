// server/src/controllers/charitiesController.js
const supabase = require('../config/supabase');

exports.list = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = supabase.from('charities').select('*').eq('is_active', true);
    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category', category);
    const { data, error } = await query.order('name');
    if (error) throw error;
    res.json({ charities: data });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('charities').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json({ charity: data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, image_url, website_url, category } = req.body;
    const { data, error } = await supabase
      .from('charities').insert({ name, description, image_url, website_url, category })
      .select().single();
    if (error) throw error;
    res.status(201).json({ charity: data });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('charities')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ charity: data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await supabase.from('charities').update({ is_active: false }).eq('id', req.params.id);
    res.json({ message: 'Charity deactivated' });
  } catch (err) { next(err); }
};