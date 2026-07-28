-- CWS Operating System workspace and membership foundation.
-- Legacy publishing tables and policies are intentionally unchanged.

create table public.workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  slug        text not null unique check (
    slug = lower(slug)
    and char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  created_by  uuid not null references auth.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.workspace_members (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete restrict,
  role          text not null check (role in ('owner', 'member')),
  status        text not null default 'active' check (status in ('active', 'suspended')),
  created_by    uuid not null references auth.users(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index workspaces_created_by_idx
  on public.workspaces (created_by);

create index workspace_members_user_access_idx
  on public.workspace_members (user_id, status, workspace_id);

create index workspace_members_owner_lookup_idx
  on public.workspace_members (workspace_id, role, status);

create index workspace_members_created_by_idx
  on public.workspace_members (created_by);

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.update_updated_at();

create trigger workspace_members_updated_at
  before update on public.workspace_members
  for each row execute function public.update_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
      and membership.status = 'active'
  );
$$;

create or replace function public.preserve_workspace_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'workspace ownership fields are immutable';
  end if;

  return new;
end;
$$;

create trigger preserve_workspace_ownership
  before update on public.workspaces
  for each row execute function public.preserve_workspace_ownership();

create or replace function public.protect_workspace_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removes_active_owner boolean := false;
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id
      or new.workspace_id <> old.workspace_id
      or new.user_id <> old.user_id
      or new.created_by <> old.created_by
      or new.created_at <> old.created_at
    then
      raise exception 'workspace membership identity fields are immutable';
    end if;

    removes_active_owner :=
      old.role = 'owner'
      and old.status = 'active'
      and (new.role <> 'owner' or new.status <> 'active');
  elsif tg_op = 'DELETE' then
    -- A trusted workspace deletion cascades to memberships at trigger depth 2.
    -- Authenticated users are not granted workspace DELETE access.
    if pg_trigger_depth() > 1 then
      return old;
    end if;

    removes_active_owner := old.role = 'owner' and old.status = 'active';
  end if;

  if removes_active_owner then
    -- Lock the workspace so concurrent owner removals cannot both pass.
    perform 1
    from public.workspaces
    where id = old.workspace_id
    for update;

    if not exists (
      select 1
      from public.workspace_members as other_owner
      where other_owner.workspace_id = old.workspace_id
        and other_owner.id <> old.id
        and other_owner.role = 'owner'
        and other_owner.status = 'active'
    ) then
      raise exception 'a workspace must retain at least one active owner';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger protect_workspace_membership
  before update or delete on public.workspace_members
  for each row execute function public.protect_workspace_membership();

create or replace function public.create_workspace(
  workspace_name text,
  workspace_slug text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_workspace_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required';
  end if;

  if workspace_name is null or char_length(btrim(workspace_name)) not between 1 and 120 then
    raise exception 'workspace name must contain between 1 and 120 characters';
  end if;

  if workspace_slug is null
    or char_length(btrim(workspace_slug)) not between 1 and 80
    or lower(btrim(workspace_slug)) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception 'workspace slug must contain lowercase letters, numbers, and single hyphens';
  end if;

  insert into public.workspaces (name, slug, created_by)
  values (btrim(workspace_name), lower(btrim(workspace_slug)), actor_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    created_by
  )
  values (
    new_workspace_id,
    actor_id,
    'owner',
    'active',
    actor_id
  );

  return new_workspace_id;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "workspace_members_can_read_workspaces"
  on public.workspaces
  for select
  to authenticated
  using ((select public.is_workspace_member(id)));

create policy "workspace_owners_can_update_workspaces"
  on public.workspaces
  for update
  to authenticated
  using ((select public.is_workspace_owner(id)))
  with check ((select public.is_workspace_owner(id)));

create policy "workspace_members_can_read_memberships"
  on public.workspace_members
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_owners_can_add_memberships"
  on public.workspace_members
  for insert
  to authenticated
  with check (
    (select public.is_workspace_owner(workspace_id))
    and created_by = (select auth.uid())
  );

create policy "workspace_owners_can_update_memberships"
  on public.workspace_members
  for update
  to authenticated
  using ((select public.is_workspace_owner(workspace_id)))
  with check ((select public.is_workspace_owner(workspace_id)));

create policy "workspace_owners_can_delete_memberships"
  on public.workspace_members
  for delete
  to authenticated
  using ((select public.is_workspace_owner(workspace_id)));

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_owner(uuid) from public;
revoke all on function public.preserve_workspace_ownership() from public;
revoke all on function public.protect_workspace_membership() from public;
revoke all on function public.create_workspace(text, text) from public;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.create_workspace(text, text) to authenticated;

grant select, update on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;

grant all on public.workspaces to service_role;
grant all on public.workspace_members to service_role;
