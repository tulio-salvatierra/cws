-- Record a confirmed, non-publishing export handoff for approved content.

alter table public.content_variants
  add column exported_by uuid references auth.users(id) on delete restrict,
  add column exported_at timestamptz,
  add column export_snapshot jsonb,
  add constraint content_variants_export_attribution_check check (
    (exported_by is null and exported_at is null)
    or (exported_by is not null and exported_at is not null)
  );

-- Historical exported rows predate auditable handoffs. Preserve them without
-- inventing an actor or timestamp.
update public.content_variants
set export_snapshot = jsonb_build_object(
  'snapshot_version', 1,
  'unavailable_reason', 'Export predates audited handoff capture.'
)
where status in ('exported', 'published')
  and export_snapshot is null;

create index content_variants_exported_by_idx
  on public.content_variants (exported_by)
  where exported_by is not null;

create or replace function public.enforce_content_variant_export_handoff()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  approved_approval_id uuid;
begin
  if old.export_snapshot is not null then
    if new.campaign_id is distinct from old.campaign_id
      or new.code is distinct from old.code
      or new.locale is distinct from old.locale
      or new.working_title is distinct from old.working_title
      or new.transcript is distinct from old.transcript
      or new.tone is distinct from old.tone
      or new.editing_notes is distinct from old.editing_notes
      or new.caption_text is distinct from old.caption_text
      or new.export_reference is distinct from old.export_reference
      or new.exported_by is distinct from old.exported_by
      or new.exported_at is distinct from old.exported_at
      or new.export_snapshot is distinct from old.export_snapshot
    then
      raise exception 'exported content and handoff evidence are immutable';
    end if;

    if old.status = 'exported'
      and new.status not in ('exported', 'published', 'archived')
    then
      raise exception 'exported content can only remain exported, publish, or archive';
    end if;

    if old.status = 'published'
      and new.status not in ('published', 'archived')
    then
      raise exception 'published content can only remain published or archive';
    end if;

    if old.status = 'archived' and new.status <> 'archived' then
      raise exception 'archived exported content must remain archived';
    end if;

    return new;
  end if;

  if new.status = 'published' then
    raise exception 'content must have a recorded export handoff before publishing';
  end if;

  if new.status = 'exported' then
    if old.status <> 'approved' then
      raise exception 'only approved content can be marked exported';
    end if;

    if actor_id is null then
      raise exception 'an authenticated workspace member must record the export handoff';
    end if;

    if nullif(btrim(new.caption_text), '') is null then
      raise exception 'caption text is required before export';
    end if;

    if nullif(btrim(new.export_reference), '') is null then
      raise exception 'an export filename or reference is required';
    end if;

    select a.id into approved_approval_id
    from public.approvals a
    where a.content_variant_id = old.id
      and a.workspace_id = old.workspace_id
      and a.status = 'approved'
    order by a.reviewed_at desc
    limit 1;

    if approved_approval_id is null then
      raise exception 'an approved review is required before export';
    end if;

    new.caption_text := btrim(new.caption_text);
    new.export_reference := btrim(new.export_reference);
    new.exported_by := actor_id;
    new.exported_at := now();
    new.export_snapshot := jsonb_build_object(
      'snapshot_version', 1,
      'captured_at', new.exported_at,
      'approved_approval_id', approved_approval_id,
      'code', new.code,
      'locale', new.locale,
      'working_title', new.working_title,
      'transcript', new.transcript,
      'tone', new.tone,
      'editing_notes', new.editing_notes,
      'caption_text', new.caption_text,
      'export_reference', new.export_reference
    );

    return new;
  end if;

  if new.exported_by is distinct from old.exported_by
    or new.exported_at is distinct from old.exported_at
    or new.export_snapshot is distinct from old.export_snapshot
  then
    raise exception 'export evidence is managed by the confirmed handoff transition';
  end if;

  return new;
end;
$$;

create trigger enforce_content_variant_export_handoff
  before update on public.content_variants
  for each row execute function public.enforce_content_variant_export_handoff();

revoke all on function public.enforce_content_variant_export_handoff()
  from public, anon, authenticated;
