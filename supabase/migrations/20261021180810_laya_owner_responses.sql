-- Only an explicit, authenticated owner response reaches the trusted server
-- insertion path. GET/evaluation/activation never insert into this table.
create table public.laya_evaluations (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id),
  decision_id uuid not null references public.business_decisions(id),
  evaluator text not null check (evaluator = 'decision_review'),
  policy_version text not null,
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  evaluation jsonb not null check (jsonb_typeof(evaluation) = 'object'),
  response text not null check (response in ('act','dismiss')),
  reason text not null check (reason = btrim(reason) and char_length(reason) between 1 and 2000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index laya_evaluations_workspace_history_idx on public.laya_evaluations(workspace_id,created_at desc);
create index laya_evaluations_decision_idx on public.laya_evaluations(decision_id);
create index laya_evaluations_actor_idx on public.laya_evaluations(created_by);
alter table public.laya_evaluations enable row level security;
revoke all on public.laya_evaluations from public,anon,authenticated,service_role;
grant select on public.laya_evaluations to authenticated;
grant select,insert on public.laya_evaluations to service_role;
create policy laya_evaluations_owner_read on public.laya_evaluations for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));

create function private.protect_laya_response() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'Laya response evidence is append-only' using errcode='42501';
  end if;
  if not exists (select 1 from public.workspace_members m where m.workspace_id=new.workspace_id
    and m.user_id=new.created_by and m.role='owner' and m.status='active') then
    raise exception 'A Laya response requires an active workspace owner' using errcode='42501';
  end if;
  if not exists (select 1 from public.business_decisions d where d.id=new.decision_id and d.workspace_id=new.workspace_id)
    or (new.input_snapshot->'decision'->>'id') is distinct from new.decision_id::text
    or (new.input_snapshot->'decision'->>'workspace_id') is distinct from new.workspace_id::text
    or (new.evaluation->'subject'->>'id') is distinct from new.decision_id::text
    or (new.evaluation->'subject'->>'workspace_id') is distinct from new.workspace_id::text
    or (new.evaluation->>'evaluator') is distinct from new.evaluator
    or (new.evaluation->>'policy_version') is distinct from new.policy_version
    or (new.evaluation->>'evaluated_at') is distinct from (new.input_snapshot->>'evaluated_at')
    or (new.evaluation->>'verdict') is null
    or (new.evaluation->>'verdict') not in ('do','revise','hold','skip','needs_data') then
    raise exception 'Laya response source and evaluation must match' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function private.protect_laya_response() from public,anon,authenticated;
create trigger laya_response_guard before insert or update or delete on public.laya_evaluations
  for each row execute function private.protect_laya_response();
