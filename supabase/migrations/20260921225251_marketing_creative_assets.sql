-- Owner-triggered Marketing creative is private working material. Generated
-- images remain in a server-only Storage bucket until the owner explicitly
-- approves them into the existing evergreen offer catalog.
set local lock_timeout = '5s';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketing-creative',
  'marketing-creative',
  false,
  10485760,
  array['image/png']::text[]
)
on conflict (id) do nothing;

alter table public.offer_media
  add column media_source text not null default 'local',
  add column storage_bucket text,
  add column storage_object_path text,
  add column source_agent_run_id uuid;

alter table public.offer_media
  drop constraint offer_media_storage_path_check,
  alter column storage_path drop not null,
  add constraint offer_media_media_source_check
    check (media_source in ('local', 'generated')),
  add constraint offer_media_storage_reference_check
    check (
      (
        media_source = 'local'
        and storage_path ~ '^/images/([A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+[.](png|jpe?g|webp)$'
        and storage_bucket is null
        and storage_object_path is null
        and source_agent_run_id is null
      )
      or (
        media_source = 'generated'
        and storage_path is null
        and storage_bucket = 'marketing-creative'
        and storage_object_path ~ '^generated/[0-9a-f-]{36}/[0-9a-f-]{36}[.]png$'
        and source_agent_run_id is not null
      )
    ),
  add constraint offer_media_source_agent_run_fk
    foreign key (source_agent_run_id, workspace_id)
    references public.agent_runs(id, workspace_id)
    on delete restrict;

create index offer_media_source_agent_run_idx
  on public.offer_media (workspace_id, source_agent_run_id)
  where source_agent_run_id is not null;

create table public.marketing_creative_assets (
  id                 uuid primary key default extensions.uuid_generate_v4(),
  workspace_id       uuid not null references public.workspaces(id) on delete cascade,
  offer_id           uuid not null,
  idea_run_id        uuid not null,
  idea_id            text not null check (idea_id ~ '^idea-[1-9][0-9]*$'),
  asset_run_id       uuid not null,
  storage_bucket     text not null default 'marketing-creative' check (storage_bucket = 'marketing-creative'),
  storage_object_path text not null,
  status             text not null default 'generating'
    check (status in ('generating', 'ready', 'approving', 'failed', 'approved', 'retired')),
  failure_message    text,
  approved_media_id  uuid,
  approved_caption_id uuid,
  created_by         uuid not null references auth.users(id) on delete restrict,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, idea_run_id, idea_id),
  foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete restrict,
  foreign key (idea_run_id, workspace_id)
    references public.agent_runs(id, workspace_id) on delete restrict,
  foreign key (asset_run_id, workspace_id)
    references public.agent_runs(id, workspace_id) on delete restrict,
  foreign key (workspace_id, offer_id, approved_media_id)
    references public.offer_media(workspace_id, offer_id, id) on delete restrict,
  foreign key (workspace_id, offer_id, approved_caption_id)
    references public.offer_captions(workspace_id, offer_id, id) on delete restrict,
  check (storage_object_path ~ '^generated/[0-9a-f-]{36}/[0-9a-f-]{36}[.]png$'),
  check (
    (status = 'failed' and failure_message is not null)
    or (status <> 'failed' and failure_message is null)
  ),
  check (
    (status = 'approved' and approved_media_id is not null and approved_caption_id is not null)
    or (status <> 'approved' and approved_media_id is null and approved_caption_id is null)
  )
);

create index marketing_creative_assets_workspace_offer_status_idx
  on public.marketing_creative_assets (workspace_id, offer_id, status, created_at desc);

create index marketing_creative_assets_workspace_idea_run_idx
  on public.marketing_creative_assets (workspace_id, idea_run_id, created_at desc);

-- A browser replay reuses its own request key. This keeps each explicit
-- creative action at one durable agent run and at most one OpenAI request.
create unique index agent_runs_marketing_creative_request_uidx
  on public.agent_runs (workspace_id, agent_key, ((input ->> 'request_key')))
  where agent_key in ('marketing-story-ideas', 'marketing-asset-generator')
    and input ? 'request_key';

create trigger marketing_creative_assets_updated_at
  before update on public.marketing_creative_assets
  for each row execute function public.update_updated_at();

alter table public.marketing_creative_assets enable row level security;

revoke all on public.marketing_creative_assets from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.marketing_creative_assets to service_role;
