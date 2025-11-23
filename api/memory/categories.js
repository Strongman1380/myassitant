import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('memories')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error loading categories:', error);
      throw new Error('Failed to load categories from database');
    }

    const categoryCounts = data.reduce((acc, memory) => {
      const category = memory.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({ categories: categoryCounts });
  } catch (error) {
    console.error('Error in /api/memory/categories:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
