-- Store versioned channel strategy before any generation workflow exists.

create table public.channel_brief (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  channel_id          uuid not null,
  language            text not null check (language in ('en', 'es')),
  version             integer not null default 1 check (version > 0),
  audience            text,
  geography           text,
  tone                text,
  topics_allowed      text[],
  topics_forbidden    text[],
  cta                  text,
  example_good        text,
  example_bad         text,
  target_cadence_days integer,
  is_active           boolean not null default true,
  created_by          uuid references auth.users(id) on delete restrict,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, workspace_id),
  unique (channel_id, language, version),
  foreign key (channel_id, workspace_id)
    references public.channels(id, workspace_id)
    on delete cascade
);

create unique index channel_brief_one_active_language_uidx
  on public.channel_brief (channel_id, language)
  where is_active;

create index channel_brief_workspace_channel_language_active_idx
  on public.channel_brief (workspace_id, channel_id, language)
  where is_active;

create index channel_brief_created_by_idx
  on public.channel_brief (created_by)
  where created_by is not null;

create trigger channel_brief_updated_at
  before update on public.channel_brief
  for each row execute function public.update_updated_at();

create or replace function public.protect_channel_brief_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.channel_id <> old.channel_id
    or new.language <> old.language
    or new.version <> old.version
    or new.created_by is distinct from old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'channel brief identity fields are immutable';
  end if;

  return new;
end;
$$;

create trigger protect_channel_brief_identity
  before update on public.channel_brief
  for each row execute function public.protect_channel_brief_identity();

alter table public.channel_brief enable row level security;

create policy "workspace_members_can_read_channel_briefs"
  on public.channel_brief
  for select
  to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_update_channel_briefs"
  on public.channel_brief
  for update
  to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

revoke all on function public.protect_channel_brief_identity() from public;
revoke all on public.channel_brief from anon;
grant select, update on public.channel_brief to authenticated;
grant all on public.channel_brief to service_role;

alter table public.published_posts
  add column brief_version integer,
  add constraint published_posts_brief_version_check
    check (brief_version is null or brief_version > 0);

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
    or new.brief_version is distinct from old.brief_version
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
