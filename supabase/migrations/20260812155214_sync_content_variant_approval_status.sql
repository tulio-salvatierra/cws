-- Capture durable evidence of the exact variant submitted for review and
-- keep the variant lifecycle synchronized with each approval transition.

alter table public.approvals
  add column content_snapshot jsonb not null default jsonb_build_object(
    'snapshot_version', 1,
    'unavailable_reason', 'Approval predates content snapshot capture.'
  );

create or replace function public.capture_approval_content_snapshot()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  variant_row public.content_variants%rowtype;
begin
  if new.status <> 'pending' then
    raise exception 'new approval requests must be pending';
  end if;

  select * into variant_row
  from public.content_variants
  where id = new.content_variant_id
    and workspace_id = new.workspace_id
  for update;

  if not found then
    raise exception 'content variant not found in approval workspace';
  end if;

  if variant_row.status not in (
    'draft',
    'script_ready',
    'ready_to_record',
    'recorded',
    'rough_cut',
    'fine_cut',
    'captions_pending',
    'ready_for_review'
  ) then
    raise exception 'content variant cannot be submitted from status %', variant_row.status;
  end if;

  new.content_snapshot := jsonb_build_object(
    'snapshot_version', 1,
    'captured_at', now(),
    'source_status', variant_row.status,
    'code', variant_row.code,
    'locale', variant_row.locale,
    'working_title', variant_row.working_title,
    'transcript', variant_row.transcript,
    'tone', variant_row.tone,
    'editing_notes', variant_row.editing_notes,
    'caption_text', variant_row.caption_text,
    'export_reference', variant_row.export_reference
  );

  return new;
end;
$$;

create trigger capture_approval_content_snapshot
  before insert on public.approvals
  for each row execute function public.capture_approval_content_snapshot();

create or replace function public.sync_content_variant_approval_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_status text;
  updated_variant_id uuid;
begin
  if tg_op = 'INSERT' then
    next_status := 'ready_for_review';
  elsif new.status = old.status then
    return new;
  elsif new.status = 'approved' then
    next_status := 'approved';
  elsif new.status in ('revision_requested', 'rejected') then
    next_status := 'draft';
  else
    raise exception 'unsupported approval status transition';
  end if;

  update public.content_variants
  set status = next_status
  where id = new.content_variant_id
    and workspace_id = new.workspace_id
  returning id into updated_variant_id;

  if updated_variant_id is null then
    raise exception 'content variant status could not be synchronized';
  end if;

  return new;
end;
$$;

create trigger sync_content_variant_approval_status
  after insert or update of status on public.approvals
  for each row execute function public.sync_content_variant_approval_status();

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
    or new.content_snapshot is distinct from old.content_snapshot
  then
    raise exception 'approval ownership and snapshot fields are immutable';
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

revoke all on function public.capture_approval_content_snapshot()
  from public, anon, authenticated;
revoke all on function public.sync_content_variant_approval_status()
  from public, anon, authenticated;
