-- supabase/migrations/003_add_youtube_platform.sql
ALTER TYPE platform_name ADD VALUE IF NOT EXISTS 'youtube';
