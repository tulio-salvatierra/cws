-- supabase/migrations/005_keywords_status.sql
ALTER TABLE keywords
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
    CHECK (status IN ('active', 'suggested', 'blocked'));

-- Backfill: mark existing blocked=true rows
UPDATE keywords SET status = 'blocked' WHERE blocked = true;
