-- Preserve completed approval evidence while giving owners an explicit,
-- auditable way to return non-exported approved content to draft for re-review.

create table public.content_variant_revision_events (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  content_variant_id    uuid not null,
  source_approval_id    uuid not null,
  reason                text not null check (
    reason = btrim(reason)
    and char_length(reason) between 1 and 1000
  ),
  created_by            uuid not null references auth.users(id) on delete restrict,
  created_at            timestamptz not null default now(),
  unique (id, workspace_id),
  unique (content_variant_id, source_approval_id),
  foreign key (content_variant_id, workspace_id)
    references public.content_variants(id, workspace_id)
    on delete no action,
  foreign key (source_approval_id, workspace_id)
    references public.approvals(id, workspace_id)
    on delete no action
);

create index content_variant_revision_events_workspace_variant_created_idx
  on public.content_variant_revision_events (
    workspace_id,
    content_variant_id,
    created_at desc
  );

create index content_variant_revision_events_created_by_idx
  on public.content_variant_revision_events (created_by);

create or replace function public.prepare_content_variant_revision_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  variant_row public.content_variants%rowtype;
  approval_row public.approvals%rowtype;
begin
  if actor_id is null
    or not (select private.is_workspace_owner(new.workspace_id))
  then
    raise exception 'an active workspace owner must start an approved-content revision';
  end if;

  select * into variant_row
  from public.content_variants
  where id = new.content_variant_id
    and workspace_id = new.workspace_id
  for update;

  if not found then
    raise exception 'content variant not found in revision workspace';
  end if;

  if variant_row.export_snapshot is not null then
    raise exception 'exported content cannot return to draft';
  end if;

  if variant_row.status <> 'approved' then
    raise exception 'only approved content can start this revision workflow';
  end if;

  select * into approval_row
  from public.approvals
  where content_variant_id = variant_row.id
    and workspace_id = variant_row.workspace_id
  order by created_at desc
  limit 1;

  if approval_row.id is null or approval_row.status <> 'approved' then
    raise exception 'the latest review must be approved before starting a revision';
  end if;

  new.reason := btrim(new.reason);

  if nullif(new.reason, '') is null then
    raise exception 'a revision reason is required';
  end if;

  new.source_approval_id := approval_row.id;
  new.created_by := actor_id;
  new.created_at := now();

  return new;
end;
$$;

create or replace function public.apply_content_variant_revision_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_variant_id uuid;
begin
  update public.content_variants
  set status = 'draft'
  where id = new.content_variant_id
    and workspace_id = new.workspace_id
  returning id into updated_variant_id;

  if updated_variant_id is null then
    raise exception 'content variant could not enter revision';
  end if;

  return new;
end;
$$;

create trigger prepare_content_variant_revision_event
  before insert on public.content_variant_revision_events
  for each row execute function public.prepare_content_variant_revision_event();

create trigger apply_content_variant_revision_event
  after insert on public.content_variant_revision_events
  for each row execute function public.apply_content_variant_revision_event();

create or replace function public.protect_approved_content_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  latest_approval_id uuid;
  reviewed_content_changed boolean;
  any_content_changed boolean;
begin
  if old.status <> 'approved' and new.status = 'approved' then
    if pg_trigger_depth() < 2 then
      raise exception 'approved status is managed by an owner approval decision';
    end if;

    return new;
  end if;

  if old.status <> 'approved' then
    return new;
  end if;

  reviewed_content_changed :=
    new.campaign_id is distinct from old.campaign_id
    or new.code is distinct from old.code
    or new.locale is distinct from old.locale
    or new.working_title is distinct from old.working_title
    or new.transcript is distinct from old.transcript
    or new.tone is distinct from old.tone
    or new.editing_notes is distinct from old.editing_notes;

  any_content_changed := reviewed_content_changed
    or new.caption_text is distinct from old.caption_text
    or new.export_reference is distinct from old.export_reference;

  if new.status = 'approved' then
    if any_content_changed then
      raise exception 'approved content is locked; start a revision before editing';
    end if;

    return new;
  end if;

  if new.status = 'exported' then
    if reviewed_content_changed then
      raise exception 'reviewed content cannot change during export';
    end if;

    return new;
  end if;

  if new.status = 'draft' then
    if any_content_changed then
      raise exception 'start the revision before editing approved content';
    end if;

    if actor_id is null
      or not (select private.is_workspace_owner(old.workspace_id))
    then
      raise exception 'an active workspace owner must start an approved-content revision';
    end if;

    select a.id into latest_approval_id
    from public.approvals a
    where a.content_variant_id = old.id
      and a.workspace_id = old.workspace_id
    order by a.created_at desc
    limit 1;

    if not exists (
      select 1
      from public.content_variant_revision_events r
      where r.content_variant_id = old.id
        and r.workspace_id = old.workspace_id
        and r.source_approval_id = latest_approval_id
        and r.created_by = actor_id
    ) then
      raise exception 'record an approved-content revision before returning to draft';
    end if;

    return new;
  end if;

  raise exception 'approved content can only remain approved, start a revision, or export';
end;
$$;

create trigger protect_approved_content_revision
  before update on public.content_variants
  for each row execute function public.protect_approved_content_revision();

alter table public.content_variant_revision_events enable row level security;

create policy "workspace_members_can_read_content_variant_revision_events"
  on public.content_variant_revision_events
  for select
  to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_owners_can_add_content_variant_revision_events"
  on public.content_variant_revision_events
  for insert
  to authenticated
  with check (
    (select private.is_workspace_owner(workspace_id))
    and created_by = (select auth.uid())
  );

revoke all on function public.prepare_content_variant_revision_event()
  from public, anon, authenticated;
revoke all on function public.apply_content_variant_revision_event()
  from public, anon, authenticated;
revoke all on function public.protect_approved_content_revision()
  from public, anon, authenticated;

revoke all on public.content_variant_revision_events
  from public, anon, authenticated, service_role;

grant select, insert on public.content_variant_revision_events to authenticated;
grant select, insert on public.content_variant_revision_events to service_role;
