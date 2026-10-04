-- C1 keeps CWS's verified compliance obligations separate from generic Tasks,
-- Planning, client intake, and any research. A requirement is never trusted as
-- applicable until an owner has deliberately verified it.
set local lock_timeout = '5s';

create table public.compliance_requirements (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  title text not null check (title = btrim(title) and char_length(title) between 1 and 200),
  category text not null check (category in (
    'business_registration', 'license', 'tax', 'filing', 'insurance', 'employment', 'privacy', 'other'
  )),
  authority_name text not null check (authority_name = btrim(authority_name) and char_length(authority_name) between 1 and 200),
  source_url text check (source_url is null or (source_url = btrim(source_url) and char_length(source_url) between 1 and 2048)),
  jurisdiction text check (jurisdiction is null or (jurisdiction = btrim(jurisdiction) and char_length(jurisdiction) between 1 and 200)),
  description text not null check (description = btrim(description) and char_length(description) between 1 and 2000),
  applicability_status text not null default 'needs_verification' check (applicability_status in ('needs_verification', 'applies', 'not_applicable')),
  verified_by_owner_at timestamptz,
  verified_by_owner_id uuid references auth.users(id) on delete restrict,
  verified_source_at timestamptz,
  recurrence_type text not null default 'none' check (recurrence_type in ('none', 'one_time', 'annual', 'quarterly', 'monthly', 'custom')),
  recurrence_interval integer check (recurrence_interval is null or recurrence_interval between 1 and 120),
  last_completed_at date,
  next_due_date date,
  status text not null default 'active' check (status in ('active', 'retired')),
  notes text check (notes is null or (notes = btrim(notes) and char_length(notes) between 1 and 2000)),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  check (
    applicability_status = 'needs_verification'
    or (verified_by_owner_at is not null and verified_by_owner_id is not null)
  ),
  check (verified_source_at is null or verified_by_owner_at is not null),
  check ((recurrence_type = 'custom') = (recurrence_interval is not null))
);

-- Completion facts are append-only. The current requirement row remains fast
-- to read, while this table preserves the owner-confirmed completion record.
create table public.compliance_completions (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  compliance_requirement_id uuid not null,
  completed_at date not null check (completed_at <= current_date),
  notes text check (notes is null or (notes = btrim(notes) and char_length(notes) between 1 and 2000)),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (compliance_requirement_id, workspace_id)
    references public.compliance_requirements(id, workspace_id)
    on delete restrict
);

create index compliance_requirements_workspace_applicability_due_idx
  on public.compliance_requirements (workspace_id, applicability_status, next_due_date, created_at);
create index compliance_completions_requirement_workspace_completed_idx
  on public.compliance_completions (compliance_requirement_id, workspace_id, completed_at desc);

create trigger compliance_requirements_updated_at
before update on public.compliance_requirements
for each row execute function public.update_updated_at();

-- Completion and any next deadline confirmation are one atomic owner action.
-- C1 never derives a legal deadline: ongoing requirements require an owner to
-- explicitly supply the next date after recording completion.
create or replace function public.record_compliance_completion(
  p_workspace_id uuid,
  p_requirement_id uuid,
  p_completed_at date,
  p_next_due_date date,
  p_notes text,
  p_recorded_by uuid
)
returns public.compliance_completions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requirement public.compliance_requirements%rowtype;
  completion public.compliance_completions%rowtype;
begin
  select * into requirement
  from public.compliance_requirements
  where id = p_requirement_id
    and workspace_id = p_workspace_id
  for update;

  if requirement.id is null then
    raise exception 'Compliance requirement was not found in this workspace.';
  end if;
  if requirement.status <> 'active' or requirement.applicability_status <> 'applies'
    or requirement.verified_by_owner_at is null or requirement.verified_by_owner_id is null then
    raise exception 'Only an owner-verified applicable requirement can be completed.';
  end if;
  if p_completed_at is null or p_completed_at > current_date then
    raise exception 'Completion date must be today or earlier.';
  end if;
  if requirement.recurrence_type in ('annual', 'quarterly', 'monthly', 'custom')
    and p_next_due_date is null then
    raise exception 'The owner must confirm the next due date for a recurring requirement.';
  end if;
  if p_next_due_date is not null and p_next_due_date <= p_completed_at then
    raise exception 'The next due date must be after the completed date.';
  end if;

  insert into public.compliance_completions (
    workspace_id, compliance_requirement_id, completed_at, notes, recorded_by
  ) values (
    p_workspace_id, p_requirement_id, p_completed_at, nullif(p_notes, ''), p_recorded_by
  ) returning * into completion;

  update public.compliance_requirements
  set last_completed_at = p_completed_at,
      next_due_date = p_next_due_date
  where id = p_requirement_id
    and workspace_id = p_workspace_id;

  return completion;
end;
$$;

alter table public.compliance_requirements enable row level security;
alter table public.compliance_completions enable row level security;

create policy "workspace_members_can_read_compliance_requirements"
  on public.compliance_requirements for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_read_compliance_completions"
  on public.compliance_completions for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

revoke all on public.compliance_requirements from public, anon, authenticated, service_role;
revoke all on public.compliance_completions from public, anon, authenticated, service_role;
revoke all on function public.record_compliance_completion(uuid, uuid, date, date, text, uuid) from public, anon, authenticated;

grant select on public.compliance_requirements to authenticated;
grant select on public.compliance_completions to authenticated;

grant select, insert, update on public.compliance_requirements to service_role;
grant select, insert on public.compliance_completions to service_role;
grant execute on function public.record_compliance_completion(uuid, uuid, date, date, text, uuid) to service_role;
