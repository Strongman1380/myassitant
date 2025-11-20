-- Enhanced Professional Memory Schema for Brandon Hinrichs
-- This migration adds professional metadata fields to the memories table

-- Drop existing memories table if you want to start fresh
-- DROP TABLE IF EXISTS memories CASCADE;

-- Create enhanced memories table with professional metadata
CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core content
  content TEXT NOT NULL,
  raw_input TEXT, -- Original input before AI formatting

  -- Categorization
  category VARCHAR(50) DEFAULT 'general',
  memory_type VARCHAR(50) DEFAULT 'fact',
  tags TEXT[] DEFAULT '{}', -- Array of searchable tags

  -- Metadata
  importance_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  related_entities TEXT[], -- People, places, organizations mentioned
  context TEXT, -- Additional context or notes

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Soft delete support
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS memories_category_idx ON memories(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS memories_memory_type_idx ON memories(memory_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS memories_importance_idx ON memories(importance_level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS memories_tags_idx ON memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS memories_is_active_idx ON memories(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is a personal app)
-- For production with multiple users, you'd want to add authentication
DROP POLICY IF EXISTS "Allow all operations on memories" ON memories;
CREATE POLICY "Allow all operations on memories" ON memories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to search memories by tag
CREATE OR REPLACE FUNCTION search_memories_by_tag(search_tag TEXT)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category VARCHAR(50),
  tags TEXT[],
  importance_level VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content, m.category, m.tags, m.importance_level, m.created_at
  FROM memories m
  WHERE search_tag = ANY(m.tags) AND m.is_active = true
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get memories by category
CREATE OR REPLACE FUNCTION get_memories_by_category(cat VARCHAR(50))
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type VARCHAR(50),
  tags TEXT[],
  importance_level VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content, m.memory_type, m.tags, m.importance_level, m.created_at
  FROM memories m
  WHERE m.category = cat AND m.is_active = true
  ORDER BY m.importance_level DESC, m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample categories as a reference (optional - you can delete these)
COMMENT ON COLUMN memories.category IS 'Categories: biographical, preference, schedule, contact, work, personal, health, finance, hobby, goal, relationship, skill, general';
COMMENT ON COLUMN memories.memory_type IS 'Types: fact, routine, habit, preference, relationship, event, goal, skill, contact_info, schedule, note';
COMMENT ON COLUMN memories.importance_level IS 'Levels: low, medium, high, critical';
