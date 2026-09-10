-- M6 records only owner decisions for missed Marketing occurrences. Publication
-- attempts remain the existing M5 durable publishing record.

create table public.marketing_slot_resolutions (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  occurrence_slot_key text not null
    check (occurrence_slot_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$'),
  origin_slot_key     text not null
    check (origin_slot_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$'),
  action              text not null check (action in ('move', 'skip')),
  target_slot_key     text
    check (target_slot_key is null or target_slot_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$'),
  asset_id            text not null check (char_length(btrim(asset_id)) between 1 and 128),
  asset_path          text not null check (asset_path like '/images/%'),
  caption             text not null check (char_length(btrim(caption)) between 1 and 3000),
  created_by          uuid not null references auth.users(id) on delete restrict,
  decided_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  unique (workspace_id, occurrence_slot_key),
  check (
    (action = 'move' and target_slot_key is not null and target_slot_key <> occurrence_slot_key)
    or (action = 'skip' and target_slot_key is null)
  )
);

create unique index marketing_slot_resolutions_workspace_target_uidx
  on public.marketing_slot_resolutions (workspace_id, target_slot_key)
  where target_slot_key is not null;

create index marketing_slot_resolutions_workspace_decided_idx
  on public.marketing_slot_resolutions (workspace_id, decided_at asc);

alter table public.marketing_slot_resolutions enable row level security;

revoke all on public.marketing_slot_resolutions from public, anon, authenticated, service_role;
grant select, insert on public.marketing_slot_resolutions to service_role;
