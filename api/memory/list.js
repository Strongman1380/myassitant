import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, importance, tag } = req.query;

    let query = supabase
      .from('memories')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }
    if (importance) {
      query = query.eq('importance_level', importance);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to load memories from database');
    }

    res.status(200).json({
      type: 'memory_dump',
      memories: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in /api/memory/list:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
