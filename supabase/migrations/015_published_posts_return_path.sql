-- Add the pilot outcome fields and the durable publishing return path.

alter table public.content_variants
  add column published_at timestamptz,
  add column outcome_score text,
  add column outcome_note text,
  add column outcome_recorded_at timestamptz,
  add constraint content_variants_outcome_score_check
    check (outcome_score is null or outcome_score in ('worked', 'flat', 'flopped'));

create table public.published_posts (
  id                   uuid primary key default uuid_generate_v4(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  channel_id           uuid,
  campaign_id          uuid,
  content_variant_id   uuid,
  platform             platform_name not null,
  external_post_id     text,
  external_url         text,
  published_at         timestamptz not null,
  language             text check (language is null or language in ('en', 'es')),
  source               text not null check (source in ('manual', 'n8n', 'cws-os')),
  outcome_score        text check (
    outcome_score is null or outcome_score in ('worked', 'flat', 'flopped')
  ),
  outcome_note         text,
  outcome_recorded_at  timestamptz,
  raw_payload          jsonb check (
    raw_payload is null or jsonb_typeof(raw_payload) = 'object'
  ),
  created_by           uuid references auth.users(id) on delete restrict,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id)
    references public.channels(id, workspace_id)
    on delete restrict,
  foreign key (campaign_id, workspace_id)
    references public.campaigns(id, workspace_id)
    on delete restrict,
  foreign key (content_variant_id, workspace_id)
    references public.content_variants(id, workspace_id)
    on delete restrict
);

create unique index published_posts_platform_external_post_id_uidx
  on public.published_posts (platform, external_post_id)
  where external_post_id is not null;

create index published_posts_workspace_published_at_idx
  on public.published_posts (workspace_id, published_at desc);

create index published_posts_channel_workspace_idx
  on public.published_posts (channel_id, workspace_id)
  where channel_id is not null;

create index published_posts_campaign_workspace_idx
  on public.published_posts (campaign_id, workspace_id)
  where campaign_id is not null;

create index published_posts_variant_workspace_idx
  on public.published_posts (content_variant_id, workspace_id)
  where content_variant_id is not null;

create index published_posts_created_by_idx
  on public.published_posts (created_by)
  where created_by is not null;

create trigger published_posts_updated_at
  before update on public.published_posts
  for each row execute function public.update_updated_at();

create or replace function public.protect_published_post_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.channel_id is distinct from old.channel_id
    or new.campaign_id is distinct from old.campaign_id
    or new.content_variant_id is distinct from old.content_variant_id
    or new.platform <> old.platform
    or new.external_post_id is distinct from old.external_post_id
    or new.external_url is distinct from old.external_url
    or new.published_at <> old.published_at
    or new.language is distinct from old.language
    or new.source <> old.source
    or new.raw_payload is distinct from old.raw_payload
    or new.created_by is distinct from old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'published post identity fields are immutable';
  end if;

  if new.outcome_score is null then
    new.outcome_recorded_at := null;
  elsif new.outcome_recorded_at is null
    or new.outcome_score is distinct from old.outcome_score
    or new.outcome_note is distinct from old.outcome_note
  then
    new.outcome_recorded_at := now();
  end if;

  return new;
end;
$$;

create trigger protect_published_post_identity
  before update on public.published_posts
  for each row execute function public.protect_published_post_identity();

alter table public.published_posts enable row level security;

create policy "workspace_members_can_read_published_posts"
  on public.published_posts
  for select
  to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_update_published_post_outcomes"
  on public.published_posts
  for update
  to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

revoke all on function public.protect_published_post_identity() from public;
revoke all on public.published_posts from anon;
grant select, update on public.published_posts to authenticated;
grant all on public.published_posts to service_role;
