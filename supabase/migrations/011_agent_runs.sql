-- Auditable Ask and Propose agent runs.
-- Execute remains blocked until generalized action approvals are implemented.

create table public.agent_runs (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  command_level  text not null check (
    command_level in ('ask', 'propose', 'execute')
  ),
  agent_key      text not null check (
    agent_key ~ '^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$'
  ),
  status         text not null default 'queued' check (
    status in (
      'queued',
      'running',
      'completed',
      'failed',
      'needs_review',
      'superseded'
    )
  ),
  input          jsonb not null check (jsonb_typeof(input) = 'object'),
  output         jsonb check (
    output is null or jsonb_typeof(output) = 'object'
  ),
  error_message  text,
  started_at     timestamptz,
  finished_at    timestamptz,
  created_by     uuid not null references auth.users(id) on delete restrict,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, workspace_id),
  check (
    (
      status = 'queued'
      and started_at is null
      and finished_at is null
      and output is null
      and error_message is null
    )
    or (
      status = 'running'
      and started_at is not null
      and finished_at is null
      and error_message is null
    )
    or (
      status in ('completed', 'needs_review', 'superseded')
      and started_at is not null
      and finished_at is not null
      and error_message is null
    )
    or (
      status = 'failed'
      and started_at is not null
      and finished_at is not null
      and error_message is not null
    )
  )
);

create index agent_runs_workspace_status_created_at_idx
  on public.agent_runs (workspace_id, status, created_at desc);

create index agent_runs_workspace_command_created_at_idx
  on public.agent_runs (workspace_id, command_level, created_at desc);

create index agent_runs_created_by_idx
  on public.agent_runs (created_by);

create index agent_runs_queued_idx
  on public.agent_runs (created_at)
  where status = 'queued';

create trigger agent_runs_updated_at
  before update on public.agent_runs
  for each row execute function public.update_updated_at();

create or replace function public.protect_agent_run_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.command_level = 'execute' then
      raise exception 'execute agent runs require generalized action approval';
    end if;

    return new;
  end if;

  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.command_level <> old.command_level
    or new.agent_key <> old.agent_key
    or new.input <> old.input
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'agent run request fields are immutable';
  end if;

  if old.status in ('completed', 'failed', 'superseded') then
    raise exception 'terminal agent runs are immutable';
  end if;

  if old.status = 'queued' and new.status not in ('running', 'superseded') then
    raise exception 'invalid queued agent run transition';
  end if;

  if old.status = 'running'
    and new.status not in (
      'completed',
      'failed',
      'needs_review',
      'superseded'
    )
  then
    raise exception 'invalid running agent run transition';
  end if;

  if old.status = 'needs_review'
    and new.status not in ('completed', 'failed', 'superseded')
  then
    raise exception 'invalid reviewed agent run transition';
  end if;

  if old.status = 'queued' and new.status = 'running' then
    new.started_at := now();
    new.finished_at := null;
  end if;

  if new.status in ('completed', 'failed', 'needs_review', 'superseded') then
    new.started_at := coalesce(old.started_at, now());
    new.finished_at := now();
  end if;

  return new;
end;
$$;

create trigger protect_agent_run_lifecycle
  before insert or update on public.agent_runs
  for each row execute function public.protect_agent_run_lifecycle();

alter table public.agent_runs enable row level security;

create policy "workspace_members_can_read_agent_runs"
  on public.agent_runs
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));

create policy "workspace_members_can_queue_agent_runs"
  on public.agent_runs
  for insert
  to authenticated
  with check (
    (select public.is_workspace_member(workspace_id))
    and created_by = (select auth.uid())
    and command_level in ('ask', 'propose')
    and status = 'queued'
    and output is null
    and error_message is null
    and started_at is null
    and finished_at is null
  );

revoke all on function public.protect_agent_run_lifecycle() from public;

grant select, insert on public.agent_runs to authenticated;
grant all on public.agent_runs to service_role;
