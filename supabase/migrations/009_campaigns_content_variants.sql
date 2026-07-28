-- Workspace campaigns and independent language/content variants.

create table public.campaigns (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  channel_id    uuid not null,
  code          text not null check (
    code = upper(code)
    and char_length(code) between 1 and 80
    and code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'
  ),
  title         text not null check (
    title = btrim(title)
    and char_length(title) between 1 and 200
  ),
  description   text,
  status        text not null default 'idea' check (
    status in (
      'idea',
      'selected',
      'planning',
      'preproduction',
      'recording',
      'editing',
      'review',
      'ready',
      'published',
      'measuring',
      'archived'
    )
  ),
  created_by    uuid not null references auth.users(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, code),
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id)
    references public.channels(id, workspace_id)
    on delete restrict
);

create table public.content_variants (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  campaign_id       uuid not null,
  code              text not null check (
    code = upper(code)
    and char_length(code) between 1 and 120
    and code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'
  ),
  locale            text not null check (
    locale = btrim(locale)
    and locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'
  ),
  working_title     text not null check (
    working_title = btrim(working_title)
    and char_length(working_title) between 1 and 200
  ),
  transcript        text,
  tone              text,
  editing_notes     text,
  caption_text      text,
  export_reference  text,
  status            text not null default 'draft' check (
    status in (
      'draft',
      'script_ready',
      'ready_to_record',
      'recorded',
      'rough_cut',
      'fine_cut',
      'captions_pending',
      'ready_for_review',
      'approved',
      'exported',
      'published',
      'archived'
    )
  ),
  created_by        uuid not null references auth.users(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (workspace_id, code),
  unique (id, workspace_id),
  foreign key (campaign_id, workspace_id)
    references public.campaigns(id, workspace_id)
    on delete cascade
);

create index campaigns_channel_workspace_idx
  on public.campaigns (channel_id, workspace_id);

create index campaigns_workspace_status_updated_at_idx
  on public.campaigns (workspace_id, status, updated_at desc);

create index campaigns_created_by_idx
  on public.campaigns (created_by);

create index content_variants_campaign_workspace_idx
  on public.content_variants (campaign_id, workspace_id);

create index content_variants_workspace_campaign_status_idx
  on public.content_variants (workspace_id, campaign_id, status);

create index content_variants_workspace_locale_idx
  on public.content_variants (workspace_id, locale);

create index content_variants_created_by_idx
  on public.content_variants (created_by);

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();

create trigger content_variants_updated_at
  before update on public.content_variants
  for each row execute function public.update_updated_at();

create or replace function public.preserve_campaign_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'campaign ownership fields are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.preserve_content_variant_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'content variant ownership fields are immutable';
  end if;

  return new;
end;
$$;

create trigger preserve_campaign_ownership
  before update on public.campaigns
  for each row execute function public.preserve_campaign_ownership();

create trigger preserve_content_variant_ownership
  before update on public.content_variants
  for each row execute function public.preserve_content_variant_ownership();

alter table public.campaigns enable row level security;
alter table public.content_variants enable row level security;

create policy "workspace_members_can_read_campaigns"
  on public.campaigns
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_add_campaigns"
  on public.campaigns
  for insert
  to authenticated
  with check (
    (select public.is_workspace_member(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "workspace_members_can_update_campaigns"
  on public.campaigns
  for update
  to authenticated
  using ((select public.is_workspace_member(workspace_id)))
  with check ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_delete_campaigns"
  on public.campaigns
  for delete
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_read_content_variants"
  on public.content_variants
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_add_content_variants"
  on public.content_variants
  for insert
  to authenticated
  with check (
    (select public.is_workspace_member(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "workspace_members_can_update_content_variants"
  on public.content_variants
  for update
  to authenticated
  using ((select public.is_workspace_member(workspace_id)))
  with check ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_delete_content_variants"
  on public.content_variants
  for delete
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

revoke all on function public.preserve_campaign_ownership() from public;
revoke all on function public.preserve_content_variant_ownership() from public;

grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.content_variants to authenticated;

grant all on public.campaigns to service_role;
grant all on public.content_variants to service_role;
