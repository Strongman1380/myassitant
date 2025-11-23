import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing memory id' });
  }

  try {
    const deletedAt = new Date().toISOString();
    const { error } = await supabase
      .from('memories')
      .update({ is_active: false, deleted_at: deletedAt })
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting memory:', error);
      throw new Error('Failed to delete memory');
    }

    res.status(200).json({
      success: true,
      message: 'Memory deleted',
      deletedAt
    });
  } catch (error) {
    console.error('Error in /api/memory/[id]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
