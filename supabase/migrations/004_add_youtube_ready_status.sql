-- supabase/migrations/004_add_youtube_ready_status.sql
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'youtube_ready';
