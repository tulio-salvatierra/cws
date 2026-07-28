-- First-class workspace channels for CWS content operations.

create table public.channels (
  id                       uuid primary key default uuid_generate_v4(),
  workspace_id             uuid not null references public.workspaces(id) on delete cascade,
  name                     text not null check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  ),
  slug                     text not null check (
    slug = lower(slug)
    and char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  audience                 text,
  voice                    text,
  formats                  text[] not null default '{}',
  production_requirements  text,
  revenue_goal             text,
  success_metrics          text,
  created_by               uuid not null references auth.users(id) on delete restrict,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (workspace_id, slug),
  unique (id, workspace_id)
);

create index channels_workspace_updated_at_idx
  on public.channels (workspace_id, updated_at desc);

create index channels_created_by_idx
  on public.channels (created_by);

create trigger channels_updated_at
  before update on public.channels
  for each row execute function public.update_updated_at();

create or replace function public.preserve_channel_ownership()
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
    raise exception 'channel ownership fields are immutable';
  end if;

  return new;
end;
$$;

create trigger preserve_channel_ownership
  before update on public.channels
  for each row execute function public.preserve_channel_ownership();

alter table public.channels enable row level security;

create policy "workspace_members_can_read_channels"
  on public.channels
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_add_channels"
  on public.channels
  for insert
  to authenticated
  with check (
    (select public.is_workspace_member(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "workspace_members_can_update_channels"
  on public.channels
  for update
  to authenticated
  using ((select public.is_workspace_member(workspace_id)))
  with check ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_delete_channels"
  on public.channels
  for delete
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

revoke all on function public.preserve_channel_ownership() from public;

grant select, insert, update, delete on public.channels to authenticated;
grant all on public.channels to service_role;
