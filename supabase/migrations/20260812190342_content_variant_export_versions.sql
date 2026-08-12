-- Preserve every manual export as an immutable version and allow audited
-- corrections without rewriting the original handoff or publishing anything.

create table public.content_variant_exports (
  id                    uuid primary key default uuid_generate_v4(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  content_variant_id    uuid not null,
  version               integer not null check (version > 0),
  caption_text          text not null,
  export_reference      text not null,
  correction_reason     text,
  approved_approval_id  uuid,
  supersedes_export_id  uuid,
  content_snapshot      jsonb not null,
  is_historical         boolean not null default false,
  created_by            uuid references auth.users(id) on delete restrict,
  exported_at           timestamptz,
  created_at            timestamptz not null default now(),
  unique (id, workspace_id),
  unique (content_variant_id, version),
  unique (content_variant_id, export_reference),
  foreign key (content_variant_id, workspace_id)
    references public.content_variants(id, workspace_id)
    on delete no action,
  foreign key (approved_approval_id, workspace_id)
    references public.approvals(id, workspace_id)
    on delete no action,
  foreign key (supersedes_export_id, workspace_id)
    references public.content_variant_exports(id, workspace_id)
    on delete no action,
  check (
    (
      is_historical
      and version = 1
      and correction_reason is null
      and supersedes_export_id is null
    )
    or (
      not is_historical
      and created_by is not null
      and exported_at is not null
      and approved_approval_id is not null
      and caption_text = btrim(caption_text)
      and char_length(caption_text) between 1 and 10000
      and export_reference = btrim(export_reference)
      and char_length(export_reference) between 1 and 500
      and (
        (
          version = 1
          and correction_reason is null
          and supersedes_export_id is null
        )
        or (
          version > 1
          and correction_reason = btrim(correction_reason)
          and char_length(correction_reason) between 1 and 1000
          and supersedes_export_id is not null
        )
      )
    )
  )
);

create index content_variant_exports_workspace_variant_version_idx
  on public.content_variant_exports (workspace_id, content_variant_id, version desc);

create index content_variant_exports_created_by_idx
  on public.content_variant_exports (created_by)
  where created_by is not null;

-- Preserve every pre-existing handoff as version 1. Historical rows keep their
-- honest unavailable-evidence marker and do not receive invented attribution.
insert into public.content_variant_exports (
  workspace_id,
  content_variant_id,
  version,
  caption_text,
  export_reference,
  correction_reason,
  approved_approval_id,
  supersedes_export_id,
  content_snapshot,
  is_historical,
  created_by,
  exported_at,
  created_at
)
select
  cv.workspace_id,
  cv.id,
  1,
  coalesce(cv.caption_text, ''),
  coalesce(cv.export_reference, ''),
  null,
  case
    when coalesce(cv.export_snapshot->>'approved_approval_id', '') ~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    then (cv.export_snapshot->>'approved_approval_id')::uuid
    else null
  end,
  null,
  cv.export_snapshot || jsonb_build_object('export_version', 1),
  cv.export_snapshot ? 'unavailable_reason',
  cv.exported_by,
  cv.exported_at,
  coalesce(cv.exported_at, cv.updated_at, now())
from public.content_variants cv
where cv.export_snapshot is not null;

create or replace function public.prepare_content_variant_export_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  variant_row public.content_variants%rowtype;
  previous_row public.content_variant_exports%rowtype;
  approval_id uuid;
begin
  if actor_id is null then
    raise exception 'an authenticated workspace member must record an export version';
  end if;

  if not (select private.is_workspace_member(new.workspace_id)) then
    raise exception 'an active workspace member is required';
  end if;

  select * into variant_row
  from public.content_variants
  where id = new.content_variant_id
    and workspace_id = new.workspace_id
  for update;

  if not found then
    raise exception 'content variant not found in export workspace';
  end if;

  if variant_row.status <> 'exported'
    or variant_row.export_snapshot is null
  then
    raise exception 'only exported content can receive a corrected export version';
  end if;

  select * into previous_row
  from public.content_variant_exports
  where content_variant_id = variant_row.id
    and workspace_id = variant_row.workspace_id
  order by version desc
  limit 1;

  new.caption_text := btrim(new.caption_text);
  new.export_reference := btrim(new.export_reference);
  new.is_historical := false;
  new.created_by := actor_id;
  new.exported_at := now();
  new.created_at := new.exported_at;

  if nullif(new.caption_text, '') is null then
    raise exception 'caption text is required for an export version';
  end if;

  if nullif(new.export_reference, '') is null then
    raise exception 'an export filename or reference is required';
  end if;

  if found then
    new.correction_reason := btrim(new.correction_reason);

    if nullif(new.correction_reason, '') is null then
      raise exception 'a correction reason is required for a new export version';
    end if;

    if new.export_reference = previous_row.export_reference then
      raise exception 'a corrected export requires a new filename or reference';
    end if;

    new.version := previous_row.version + 1;
    new.supersedes_export_id := previous_row.id;
  else
    new.version := 1;
    new.correction_reason := null;
    new.supersedes_export_id := null;
    new.caption_text := variant_row.caption_text;
    new.export_reference := variant_row.export_reference;
  end if;

  begin
    approval_id := nullif(
      variant_row.export_snapshot->>'approved_approval_id',
      ''
    )::uuid;
  exception when invalid_text_representation then
    approval_id := null;
  end;

  if approval_id is null then
    select a.id into approval_id
    from public.approvals a
    where a.content_variant_id = variant_row.id
      and a.workspace_id = variant_row.workspace_id
      and a.status = 'approved'
    order by a.reviewed_at desc
    limit 1;
  end if;

  if approval_id is null then
    raise exception 'an approved review is required for a corrected export';
  end if;

  new.approved_approval_id := approval_id;
  new.content_snapshot := jsonb_build_object(
    'snapshot_version', 1,
    'export_version', new.version,
    'captured_at', new.exported_at,
    'approved_approval_id', approval_id,
    'supersedes_export_id', new.supersedes_export_id,
    'correction_reason', new.correction_reason,
    'code', variant_row.code,
    'locale', variant_row.locale,
    'working_title', variant_row.working_title,
    'transcript', variant_row.transcript,
    'tone', variant_row.tone,
    'editing_notes', variant_row.editing_notes,
    'caption_text', new.caption_text,
    'export_reference', new.export_reference
  );

  return new;
end;
$$;

create trigger prepare_content_variant_export_version
  before insert on public.content_variant_exports
  for each row execute function public.prepare_content_variant_export_version();

create or replace function public.capture_initial_content_variant_export_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.content_variant_exports (
    workspace_id,
    content_variant_id,
    caption_text,
    export_reference
  ) values (
    new.workspace_id,
    new.id,
    new.caption_text,
    new.export_reference
  );

  return new;
end;
$$;

create trigger capture_initial_content_variant_export_version
  after update of export_snapshot on public.content_variants
  for each row
  when (old.export_snapshot is null and new.export_snapshot is not null)
  execute function public.capture_initial_content_variant_export_version();

alter table public.content_variant_exports enable row level security;

create policy "workspace_members_can_read_content_variant_exports"
  on public.content_variant_exports
  for select
  to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_add_content_variant_exports"
  on public.content_variant_exports
  for insert
  to authenticated
  with check (
    (select private.is_workspace_member(workspace_id))
    and created_by = (select auth.uid())
    and not is_historical
  );

revoke all on function public.prepare_content_variant_export_version()
  from public, anon, authenticated;
revoke all on function public.capture_initial_content_variant_export_version()
  from public, anon, authenticated;

grant select, insert on public.content_variant_exports to authenticated;
grant select, insert on public.content_variant_exports to service_role;
