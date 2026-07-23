-- Allow trusted workspace deletion to cascade through workspace memberships.
-- Direct removal of the final active owner remains blocked.

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

revoke all on function public.protect_workspace_membership() from public;
