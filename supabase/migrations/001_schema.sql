-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enums
create type draft_status as enum (
  'pending_image', 'pending_review', 'approved', 'rejected', 'published'
);
create type platform_name as enum (
  'instagram', 'facebook', 'x', 'linkedin', 'pinterest', 'whatsapp'
);
create type post_status as enum ('pending', 'approved', 'published', 'failed');
create type asset_type as enum ('template', 'stock');

-- research_topics: raw output from Research Agent
create table research_topics (
  id             uuid primary key default uuid_generate_v4(),
  topic          text not null,
  source_url     text,
  keywords       text[] default '{}',
  used           boolean default false,
  created_at     timestamptz default now()
);

-- keywords: admin-managed keyword seeds + block list
create table keywords (
  id             uuid primary key default uuid_generate_v4(),
  term           text unique not null,
  priority       int default 3 check (priority between 1 and 5),
  blocked        boolean default false,
  use_count      int default 0
);

-- content_drafts: one record per research topic batch
create table content_drafts (
  id                  uuid primary key default uuid_generate_v4(),
  topic               text not null,
  research_topic_id   uuid references research_topics(id),
  status              draft_status default 'pending_image',
  keywords            text[] default '{}',
  scheduled_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- platform_posts: one record per platform per draft (6 per draft)
create table platform_posts (
  id                uuid primary key default uuid_generate_v4(),
  draft_id          uuid references content_drafts(id) on delete cascade,
  platform          platform_name not null,
  copy              text,
  image_url         text,
  status            post_status default 'pending',
  platform_post_id  text,
  posted_at         timestamptz
);

-- media_assets: images stored in Supabase Storage
create table media_assets (
  id            uuid primary key default uuid_generate_v4(),
  draft_id      uuid references content_drafts(id) on delete cascade,
  storage_url   text not null,
  type          asset_type not null,
  source        text,
  created_at    timestamptz default now()
);

-- post_analytics: fetched from platform APIs in Phase 3
create table post_analytics (
  id                 uuid primary key default uuid_generate_v4(),
  platform_post_id   uuid references platform_posts(id) on delete cascade,
  likes              int default 0,
  shares             int default 0,
  comments           int default 0,
  clicks             int default 0,
  fetched_at         timestamptz default now()
);

-- Auto-update updated_at on content_drafts
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger content_drafts_updated_at
  before update on content_drafts
  for each row execute function update_updated_at();
