-- Internal draft preparation only. No provider calls or publication records.
set local lock_timeout = '5s';
alter table public.marketing_slot_resolutions
  drop constraint marketing_slot_resolutions_asset_path_check,
  add constraint marketing_slot_resolutions_asset_path_check check (
    asset_path like '/images/%' or
    asset_path ~ '^storage://marketing-creative/generated/[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg)$'
  );
create table public.marketing_slot_drafts (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slot_key text not null check (slot_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$'),
  asset_id text not null check (char_length(asset_id) between 1 and 128),
  caption text not null check (char_length(trim(caption)) between 1 and 3000),
  platform_captions jsonb not null default '{}'::jsonb check (jsonb_typeof(platform_captions) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, slot_key)
);
alter table public.marketing_slot_drafts enable row level security;
revoke all on public.marketing_slot_drafts from public, anon, authenticated, service_role;
grant select, insert, update on public.marketing_slot_drafts to service_role;
