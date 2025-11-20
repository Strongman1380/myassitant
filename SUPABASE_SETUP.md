# Supabase Database Setup

## Run the SQL Migration

1. Go to your Supabase project: [https://supabase.com/dashboard/project/fyrttebrlbknznxpviwy](https://supabase.com/dashboard/project/fyrttebrlbknznxpviwy)

2. Click on **SQL Editor** in the left sidebar

3. Click **New query**

4. Copy and paste the contents of `supabase_migration.sql` into the editor

5. Click **Run** (or press Cmd/Ctrl + Enter)

6. You should see: "Success. No rows returned"

## What This Creates

The migration creates:
- **memories table** - Stores all your AI-formatted memories
  - `id` - Unique identifier (UUID)
  - `content` - The formatted memory text
  - `created_at` - When the memory was added
  - `updated_at` - When last modified

- **RLS Policies** - Row Level Security (allows all operations since it's a personal app)
- **Indexes** - For faster queries
- **Triggers** - Auto-updates `updated_at` timestamp

## Verify It Worked

After running the migration:

1. Click **Table Editor** in the left sidebar
2. You should see a **memories** table
3. It will be empty initially

## Migration Complete!

Your app is now using Supabase PostgreSQL instead of local JSON files. Your memories will:
- ✅ Sync across devices
- ✅ Persist in the cloud
- ✅ Be ready for mobile deployment
- ✅ Have automatic backups

Try adding a memory in the app - it will now save to Supabase!
