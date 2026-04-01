// server/src/controllers/winnersController.js
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

exports.getMyWinnings = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .select('*, draw:draws(month, drawn_numbers)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ winners: data });
  } catch (err) { next(err); }
};

exports.uploadProof = async (req, res, next) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // Verify winner owns this record
    const { data: winner } = await supabase
      .from('winners')
      .select('user_id, proof_status')
      .eq('id', id)
      .single();

    if (!winner) return res.status(404).json({ error: 'Winner record not found' });
    if (winner.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const ext = req.file.mimetype === 'application/pdf' ? 'pdf' : 'jpg';
    const fileName = `${req.user.id}/${id}_${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_PROOF_BUCKET || 'proof-uploads')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_PROOF_BUCKET || 'proof-uploads')
      .getPublicUrl(fileName);

    await supabase.from('winners').update({
      proof_url: publicUrl,
      proof_status: 'pending',
      submitted_at: new Date().toISOString(),
    }).eq('id', id);

    res.json({ proof_url: publicUrl });
  } catch (err) { next(err); }
};

exports.listAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .select('*, user:users(full_name, email), draw:draws(month, drawn_numbers)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ winners: data });
  } catch (err) { next(err); }
};

exports.verifyProof = async (req, res, next) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }
  try {
    const { data, error } = await supabase
      .from('winners')
      .update({ proof_status: status, admin_notes, verified_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ winner: data });
  } catch (err) { next(err); }
};

exports.markPaid = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('winners')
      .update({ payout_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ winner: data });
  } catch (err) { next(err); }
};