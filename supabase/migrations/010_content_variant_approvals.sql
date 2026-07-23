-- Human approval workflow for content variants.

create table public.approvals (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  content_variant_id  uuid not null,
  status              text not null default 'pending' check (
    status in ('pending', 'approved', 'revision_requested', 'rejected')
  ),
  feedback            text,
  reviewed_by         uuid references auth.users(id) on delete restrict,
  reviewed_at         timestamptz,
  created_by          uuid not null references auth.users(id) on delete restrict,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (content_variant_id, workspace_id)
    references public.content_variants(id, workspace_id)
    on delete no action
    deferrable initially deferred,
  check (
    (
      status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
    )
    or (
      status <> 'pending'
      and reviewed_by is not null
      and reviewed_at is not null
    )
  )
);

create unique index approvals_one_pending_per_variant_idx
  on public.approvals (content_variant_id)
  where status = 'pending';

create index approvals_variant_workspace_idx
  on public.approvals (content_variant_id, workspace_id);

create index approvals_workspace_status_created_at_idx
  on public.approvals (workspace_id, status, created_at desc);

create index approvals_created_by_idx
  on public.approvals (created_by);

create index approvals_reviewed_by_idx
  on public.approvals (reviewed_by)
  where reviewed_by is not null;

create trigger approvals_updated_at
  before update on public.approvals
  for each row execute function public.update_updated_at();

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
    or not (select public.is_workspace_owner(old.workspace_id))
  then
    raise exception 'an active workspace owner must review approvals';
  end if;

  new.reviewed_by := actor_id;
  new.reviewed_at := now();

  return new;
end;
$$;

create trigger protect_approval_lifecycle
  before update on public.approvals
  for each row execute function public.protect_approval_lifecycle();

alter table public.approvals enable row level security;

create policy "workspace_members_can_read_approvals"
  on public.approvals
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_request_approvals"
  on public.approvals
  for insert
  to authenticated
  with check (
    (select public.is_workspace_member(workspace_id))
    and created_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "workspace_owners_can_review_approvals"
  on public.approvals
  for update
  to authenticated
  using ((select public.is_workspace_owner(workspace_id)))
  with check (
    (select public.is_workspace_owner(workspace_id))
    and (
      (
        status = 'pending'
        and reviewed_by is null
        and reviewed_at is null
      )
      or (
        status <> 'pending'
        and reviewed_by = (select auth.uid())
        and reviewed_at is not null
      )
    )
  );

revoke all on function public.protect_approval_lifecycle() from public;

grant select, insert, update on public.approvals to authenticated;
grant all on public.approvals to service_role;
