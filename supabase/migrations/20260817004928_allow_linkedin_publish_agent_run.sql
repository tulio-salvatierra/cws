-- Permit the authenticated LinkedIn publisher to create execute-level runs.
-- Other execute agents remain blocked until their own approved contract exists.

create or replace function public.protect_agent_run_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.command_level = 'execute'
      and new.agent_key <> 'linkedin-publisher'
    then
      raise exception 'execute agent runs require an approved publisher contract';
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
    and new.status not in ('completed', 'failed', 'needs_review', 'superseded')
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

revoke all on function public.protect_agent_run_lifecycle() from public;

