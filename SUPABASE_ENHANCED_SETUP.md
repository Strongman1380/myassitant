# Enhanced Professional Memory System Setup

## Overview

Your AI Assistant now has a professional-grade memory system with intelligent categorization, tagging, and organization. The AI automatically analyzes and organizes your memories with metadata for easy retrieval.

## Setup Instructions

### Step 1: Run the Enhanced SQL Migration

1. Go to your Supabase project: [https://supabase.com/dashboard/project/fyrttebrlbknznxpviwy](https://supabase.com/dashboard/project/fyrttebrlbknznxpviwy)

2. Click on **SQL Editor** in the left sidebar

3. Click **New query**

4. Copy and paste the contents of `supabase_migration_enhanced.sql` into the editor

5. Click **Run** (or press Cmd/Ctrl + Enter)

6. You should see: "Success. No rows returned"

### Step 2: Verify the Setup

1. Click **Table Editor** in the left sidebar
2. You should see the **memories** table with the following columns:
   - `id` - Unique identifier
   - `content` - The formatted memory
   - `raw_input` - Original input before formatting
   - `category` - Auto-categorized (biographical, preference, work, etc.)
   - `memory_type` - Type classification (fact, routine, habit, etc.)
   - `tags` - Searchable keywords
   - `importance_level` - Priority (low, medium, high, critical)
   - `related_entities` - People, places, organizations mentioned
   - `context` - Additional notes
   - `created_at` / `updated_at` - Timestamps
   - `is_active` / `deleted_at` - Soft delete support

## Features

### 🤖 AI-Powered Categorization

When you add a memory, the AI automatically:
- **Formats** it into third person (e.g., "I like pizza" → "Brandon likes pizza")
- **Categorizes** it (biographical, preference, schedule, contact, work, personal, health, finance, hobby, goal, relationship, skill, general)
- **Classifies** the type (fact, routine, habit, preference, relationship, event, goal, skill, contact_info, schedule, note)
- **Assigns** importance level (low, medium, high, critical)
- **Extracts** relevant tags for searching
- **Identifies** related entities (people, places, companies)

### 🎯 Smart Filtering

The frontend now includes:
- **Category filter** dropdown to view memories by category
- **Visual badges** showing category, type, and importance
- **Color-coded** importance levels (critical=red, high=orange, medium=blue, low=gray)
- **Category icons** for quick visual identification
- **Tags and entities** displayed for each memory
- **Date stamps** showing when each memory was added

### 🔍 Advanced API Endpoints

New endpoints for powerful memory management:

#### Get All Memories (with filters)
```
GET /api/memory/list
GET /api/memory/list?category=work
GET /api/memory/list?importance=high
GET /api/memory/list?tag=coffee
```

#### Get Categories
```
GET /api/memory/categories
```
Returns all unique categories with counts.

#### Get Tags
```
GET /api/memory/tags
```
Returns all unique tags with counts.

#### Search Memories
```
GET /api/memory/search?q=therapy
```
Full-text search across memory content.

#### Delete a Memory (soft delete)
```
DELETE /api/memory/:id
```
Marks memory as inactive without removing from database.

#### Clear All Memories
```
DELETE /api/memory/clear
```
Completely removes all memories (use with caution).

### 📊 Categories Explained

| Category | Icon | Examples |
|----------|------|----------|
| **biographical** | 👤 | Age, hometown, education, background |
| **preference** | ⭐ | Favorite foods, music, colors, styles |
| **schedule** | 📅 | Recurring appointments, routines |
| **contact** | 📞 | Phone numbers, addresses, emails |
| **work** | 💼 | Job, company, projects, colleagues |
| **personal** | 🏠 | Family, living situation, pets |
| **health** | ❤️ | Medical info, therapy, medications |
| **finance** | 💰 | Income, expenses, financial goals |
| **hobby** | 🎨 | Interests, hobbies, activities |
| **goal** | 🎯 | Aspirations, objectives, plans |
| **relationship** | 🤝 | Friends, family relationships |
| **skill** | 🔧 | Abilities, expertise, learning |
| **general** | 📝 | Miscellaneous information |

### 🎨 Memory Types

- **fact** - General factual information
- **routine** - Recurring activities or schedules
- **habit** - Personal habits or behaviors
- **preference** - Likes and dislikes
- **relationship** - Information about relationships with people
- **event** - One-time events or occurrences
- **goal** - Future objectives or aspirations
- **skill** - Abilities or expertise
- **contact_info** - Contact details for people
- **schedule** - Time-based commitments
- **note** - General notes or observations

### 💡 Importance Levels

- **critical** 🔴 - Vital information (medical, emergency contacts)
- **high** 🟠 - Very important (work deadlines, key preferences)
- **medium** 🔵 - Moderately important (general preferences, facts)
- **low** ⚪ - Nice to know (minor details, casual info)

## Example Usage

### Adding a Memory

Simply dictate or type naturally:
- "I have therapy every Tuesday at 2pm with Dr. Smith"
- "My favorite coffee is a vanilla latte with oat milk"
- "I work as a Software Developer at Aspire Impact Network"
- "Emergency contact is my mom Sarah at 555-1234"

The AI will automatically:
1. Format it professionally
2. Categorize it appropriately
3. Assign importance level
4. Extract relevant tags
5. Identify related entities

### Viewing Memories

- **All memories**: See everything at once
- **By category**: Use the dropdown filter to view specific categories
- **Visual organization**: Each memory shows badges for quick identification
- **Chronological order**: Newest memories appear first

## Database Schema Details

### Helper Functions

The migration includes PostgreSQL functions for advanced queries:

**Search by Tag:**
```sql
SELECT * FROM search_memories_by_tag('coffee');
```

**Get Memories by Category:**
```sql
SELECT * FROM get_memories_by_category('work');
```

### Indexes

Optimized indexes for fast queries on:
- Created date (descending)
- Category
- Memory type
- Importance level
- Tags (GIN index for array searching)
- Active status

## Migration from Old Schema

If you already ran the basic migration (`supabase_migration.sql`), the enhanced migration will:
1. Add the new columns to your existing table
2. Keep all existing memories intact
3. Set default values for new fields on old memories

You can run both migrations safely - the enhanced one uses `IF NOT EXISTS` checks.

## Ready to Use!

Your enhanced memory system is now ready. Try adding a memory and watch the AI automatically organize it with professional metadata!

## Troubleshooting

### Issue: "Column already exists" error
**Solution**: This is normal if you're running the migration twice. The migration is idempotent and will skip creating existing columns.

### Issue: Memories showing with empty metadata
**Solution**: Old memories from the basic schema will have default values. New memories will have full AI-generated metadata.

### Issue: AI returning "invalid JSON format" error
**Solution**: The AI occasionally returns malformed JSON. The system will catch this error and report it. Simply try adding the memory again.

## Future Enhancements

Potential additions to consider:
- Full-text search with PostgreSQL's `tsvector`
- Memory relationships (linking related memories)
- Export memories to different formats
- Import memories from other sources
- Memory versioning (track changes over time)
- Natural language queries ("show me all work-related memories from last month")
