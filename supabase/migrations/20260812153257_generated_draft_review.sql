-- Promote or reject generated draft proposals through an owner-reviewed,
-- auditable, idempotent transaction. Publishing remains out of scope.

alter table public.content_variants
  add column source_agent_run_id uuid,
  add constraint content_variants_source_agent_run_workspace_fkey
    foreign key (source_agent_run_id, workspace_id)
    references public.agent_runs(id, workspace_id)
    on delete restrict;

create unique index content_variants_source_agent_run_uidx
  on public.content_variants (source_agent_run_id)
  where source_agent_run_id is not null;

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
    or new.source_agent_run_id is distinct from old.source_agent_run_id
  then
    raise exception 'content variant ownership fields are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.review_generated_draft(
  p_run_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_feedback text default null,
  p_campaign_id uuid default null,
  p_code text default null,
  p_working_title text default null,
  p_draft_text text default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  run_row public.agent_runs%rowtype;
  campaign_row public.campaigns%rowtype;
  existing_variant public.content_variants%rowtype;
  created_variant public.content_variants%rowtype;
  reviewed_at timestamptz := now();
  normalized_feedback text := nullif(btrim(p_feedback), '');
begin
  if p_action not in ('accept', 'reject') then
    raise exception 'review action must be accept or reject';
  end if;

  select * into run_row
  from public.agent_runs
  where id = p_run_id
  for update;

  if not found or run_row.agent_key <> 'channel-draft-generator' then
    raise exception 'generated draft run not found';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = run_row.workspace_id
      and wm.user_id = p_actor_user_id
      and wm.role = 'owner'
      and wm.status = 'active'
  ) then
    raise exception 'an active workspace owner must review generated drafts';
  end if;

  if run_row.status in ('completed', 'superseded')
    and run_row.output->'review'->>'action' = p_action
  then
    return jsonb_build_object(
      'run_id', run_row.id,
      'status', run_row.status,
      'action', p_action,
      'content_variant_id', run_row.output->'review'->>'content_variant_id',
      'idempotent', true
    );
  end if;

  if run_row.status <> 'needs_review' then
    raise exception 'generated draft is not awaiting review';
  end if;

  if p_action = 'reject' then
    update public.agent_runs
    set
      status = 'superseded',
      output = run_row.output || jsonb_build_object(
        'review', jsonb_build_object(
          'action', 'reject',
          'feedback', normalized_feedback,
          'reviewed_by', p_actor_user_id,
          'reviewed_at', reviewed_at
        )
      )
    where id = run_row.id;

    return jsonb_build_object(
      'run_id', run_row.id,
      'status', 'superseded',
      'action', 'reject',
      'content_variant_id', null,
      'idempotent', false
    );
  end if;

  if p_campaign_id is null then
    raise exception 'campaign is required when accepting a generated draft';
  end if;
  if p_code is null or btrim(p_code) = '' then
    raise exception 'variant code is required when accepting a generated draft';
  end if;
  if p_working_title is null or btrim(p_working_title) = '' then
    raise exception 'working title is required when accepting a generated draft';
  end if;
  if p_draft_text is null or btrim(p_draft_text) = '' then
    raise exception 'draft text is required when accepting a generated draft';
  end if;
  if char_length(p_draft_text) > 20000 then
    raise exception 'draft text must be 20000 characters or fewer';
  end if;

  select * into campaign_row
  from public.campaigns
  where id = p_campaign_id
    and workspace_id = run_row.workspace_id
    and channel_id = (run_row.output->>'channel_id')::uuid;

  if not found then
    raise exception 'campaign must belong to the generated draft channel and workspace';
  end if;

  select * into existing_variant
  from public.content_variants
  where source_agent_run_id = run_row.id;

  if found then
    created_variant := existing_variant;
  else
    insert into public.content_variants (
      workspace_id,
      campaign_id,
      code,
      locale,
      working_title,
      transcript,
      tone,
      editing_notes,
      status,
      source_agent_run_id,
      created_by
    ) values (
      run_row.workspace_id,
      campaign_row.id,
      upper(btrim(p_code)),
      run_row.output->>'language',
      btrim(p_working_title),
      btrim(p_draft_text),
      run_row.input->'brief_snapshot'->>'tone',
      case
        when normalized_feedback is null then 'Generated draft accepted for human editing.'
        else 'Generated draft accepted for human editing. Review note: ' || normalized_feedback
      end,
      'draft',
      run_row.id,
      p_actor_user_id
    ) returning * into created_variant;
  end if;

  update public.agent_runs
  set
    status = 'completed',
    output = run_row.output || jsonb_build_object(
      'review', jsonb_build_object(
        'action', 'accept',
        'feedback', normalized_feedback,
        'reviewed_by', p_actor_user_id,
        'reviewed_at', reviewed_at,
        'content_variant_id', created_variant.id
      )
    )
  where id = run_row.id;

  return jsonb_build_object(
    'run_id', run_row.id,
    'status', 'completed',
    'action', 'accept',
    'content_variant_id', created_variant.id,
    'idempotent', false
  );
end;
$$;

revoke all on function public.review_generated_draft(
  uuid, uuid, text, text, uuid, text, text, text
) from public, anon, authenticated;

grant execute on function public.review_generated_draft(
  uuid, uuid, text, text, uuid, text, text, text
) to service_role;
