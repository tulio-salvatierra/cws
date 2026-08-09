-- Keep RLS helper functions outside the Data API while preserving their use by
-- authenticated RLS policy evaluation.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_member(target_workspace_id uuid)
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

create or replace function private.is_workspace_owner(target_workspace_id uuid)
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

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.is_workspace_member(uuid) from anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;

revoke all on function private.is_workspace_owner(uuid) from public;
revoke all on function private.is_workspace_owner(uuid) from anon;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

-- The approval trigger is not exposed, but it still needs the private owner
-- helper when an authenticated owner reviews an approval.
create or replace function public.protect_approval_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.content_variant_id <> old.content_variant_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'approval ownership fields are immutable';
  end if;

  if old.status <> 'pending' then
    raise exception 'completed approvals are immutable';
  end if;

  if new.status = 'pending' then
    if new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'pending approvals cannot have review attribution';
    end if;

    return new;
  end if;

  if actor_id is null
    or not (select private.is_workspace_owner(old.workspace_id))
  then
    raise exception 'an active workspace owner must review approvals';
  end if;

  new.reviewed_by := actor_id;
  new.reviewed_at := now();

  return new;
end;
$$;

-- Repoint every existing CWS OS policy before removing the exposed helpers.
-- pg_get_expr deparses the function schema away in this database, so handle
-- both qualified and unqualified forms and only replace function calls (not
-- the SELECT aliases that share the helper names).
do $$
declare
  policy_row record;
  using_expr text;
  check_expr text;
begin
  for policy_row in
    select
      pol.polname,
      n.nspname as schema_name,
      c.relname as table_name,
      pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
      pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expr
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        pg_get_expr(pol.polqual, pol.polrelid) like '%is_workspace_member%'
        or pg_get_expr(pol.polqual, pol.polrelid) like '%is_workspace_owner%'
        or pg_get_expr(pol.polwithcheck, pol.polrelid) like '%is_workspace_member%'
        or pg_get_expr(pol.polwithcheck, pol.polrelid) like '%is_workspace_owner%'
      )
  loop
    if policy_row.using_expr is not null then
      using_expr := regexp_replace(
        regexp_replace(
          policy_row.using_expr,
          'public[.]is_workspace_member[[:space:]]*[(]',
          'private.is_workspace_member(',
          'g'
        ),
        '(^|[^[:alnum:]_.])is_workspace_member[[:space:]]*[(]',
        '\1private.is_workspace_member(',
        'g'
      );
      using_expr := regexp_replace(
        regexp_replace(
          using_expr,
          'public[.]is_workspace_owner[[:space:]]*[(]',
          'private.is_workspace_owner(',
          'g'
        ),
        '(^|[^[:alnum:]_.])is_workspace_owner[[:space:]]*[(]',
        '\1private.is_workspace_owner(',
        'g'
      );
      execute format(
        'alter policy %I on %I.%I using (%s)',
        policy_row.polname,
        policy_row.schema_name,
        policy_row.table_name,
        using_expr
      );
    end if;

    if policy_row.check_expr is not null then
      check_expr := regexp_replace(
        regexp_replace(
          policy_row.check_expr,
          'public[.]is_workspace_member[[:space:]]*[(]',
          'private.is_workspace_member(',
          'g'
        ),
        '(^|[^[:alnum:]_.])is_workspace_member[[:space:]]*[(]',
        '\1private.is_workspace_member(',
        'g'
      );
      check_expr := regexp_replace(
        regexp_replace(
          check_expr,
          'public[.]is_workspace_owner[[:space:]]*[(]',
          'private.is_workspace_owner(',
          'g'
        ),
        '(^|[^[:alnum:]_.])is_workspace_owner[[:space:]]*[(]',
        '\1private.is_workspace_owner(',
        'g'
      );
      execute format(
        'alter policy %I on %I.%I with check (%s)',
        policy_row.polname,
        policy_row.schema_name,
        policy_row.table_name,
        check_expr
      );
    end if;
  end loop;
end;
$$;

-- Remove the old public RPC endpoints after all policy and trigger references
-- have moved to the non-exposed schema.
drop function public.is_workspace_member(uuid);
drop function public.is_workspace_owner(uuid);
