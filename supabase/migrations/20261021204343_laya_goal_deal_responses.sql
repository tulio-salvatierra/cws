-- Preserve existing decision evidence; add derived subject identity without
-- rewriting snapshots or disabling append-only protections.
alter table public.laya_evaluations alter column decision_id drop not null;
alter table public.laya_evaluations drop constraint laya_evaluations_evaluator_check;
alter table public.laya_evaluations add constraint laya_evaluations_evaluator_check check(evaluator in ('decision_review','goal_pace','deal_fit'));
alter table public.laya_evaluations
 add column subject_type text generated always as (case when evaluator='decision_review' then 'business_decision' else evaluation->'subject'->>'type' end) stored,
 add column subject_id text generated always as (coalesce(evaluation->'subject'->>'id',decision_id::text)) stored;
alter table public.laya_evaluations add constraint laya_response_subject_shape check(
 subject_type is not null and subject_id is not null and (
 (evaluator='decision_review' and decision_id is not null and subject_type='business_decision' and subject_id=decision_id::text)
 or (evaluator='goal_pace' and decision_id is null and subject_type='negocio_listo_goal' and subject_id='negocio-listo-2026-12-31')
 or (evaluator='deal_fit' and decision_id is null and subject_type in ('lead','client_service_agreement') and char_length(subject_id)>0)));
create index laya_evaluations_subject_history_idx on public.laya_evaluations(workspace_id,evaluator,subject_type,subject_id,created_at desc);

create or replace function private.protect_laya_response() returns trigger
language plpgsql security invoker set search_path='' as $$
declare kind text; sid text;
begin
 if tg_op<>'INSERT' then raise exception 'Laya response evidence is append-only' using errcode='42501';end if;
 if not exists(select 1 from public.workspace_members where workspace_id=new.workspace_id and user_id=new.created_by and role='owner' and status='active') then
 raise exception 'A Laya response requires an active workspace owner' using errcode='42501';end if;
 if (new.evaluation->'subject'->>'workspace_id') is distinct from new.workspace_id::text
 or (new.evaluation->>'evaluator') is distinct from new.evaluator
 or (new.evaluation->>'policy_version') is distinct from new.policy_version
 or (new.evaluation->>'evaluated_at') is null
 or (new.evaluation->>'evaluated_at') is distinct from (new.input_snapshot->>'evaluated_at')
 or (new.evaluation->>'verdict') is null or (new.evaluation->>'verdict') not in ('do','revise','hold','skip','needs_data') then
 raise exception 'Laya response source and evaluation must match' using errcode='23514';end if;
 if new.evaluator='decision_review' then
  if not exists(select 1 from public.business_decisions where id=new.decision_id and workspace_id=new.workspace_id)
   or (new.input_snapshot->'decision'->>'id') is distinct from new.decision_id::text
   or (new.input_snapshot->'decision'->>'workspace_id') is distinct from new.workspace_id::text
   or (new.evaluation->'subject'->>'id') is distinct from new.decision_id::text then
   raise exception 'Decision response source must match' using errcode='23514';end if;
 elsif new.evaluator in ('goal_pace','deal_fit') then
  kind:=new.evaluation->'subject'->>'type';sid:=new.evaluation->'subject'->>'id';
  if new.decision_id is not null or new.input_snapshot->'subject' is distinct from new.evaluation->'subject'
   or jsonb_typeof(new.input_snapshot->'inputs') is distinct from 'object'
   or (new.input_snapshot->'inputs'->>'workspaceId') is distinct from new.workspace_id::text
   or (new.input_snapshot->'inputs'->>'now') is distinct from (new.evaluation->>'evaluated_at')
   or (new.input_snapshot->>'business_date') is null
   or (new.input_snapshot->>'business_date') is distinct from (new.evaluation->>'business_date')
   or (new.input_snapshot->>'time_zone') is distinct from 'America/Chicago'
   or (new.evaluation->>'time_zone') is distinct from 'America/Chicago' then
   raise exception 'Reviewed inputs and evaluation must match' using errcode='23514';end if;
  if new.evaluator='goal_pace' then
   if kind is distinct from 'negocio_listo_goal' or sid is distinct from 'negocio-listo-2026-12-31' then raise exception 'Unknown goal subject' using errcode='23514';end if;
  elsif kind='lead' then
   if not exists(select 1 from public.leads where id::text=sid and workspace_id=new.workspace_id)
    or (new.input_snapshot->'inputs'->'lead'->>'id') is distinct from sid
    or (new.input_snapshot->'inputs'->'lead'->>'workspace_id') is distinct from new.workspace_id::text then raise exception 'Deal lead source must match' using errcode='23514';end if;
  elsif kind='client_service_agreement' then
   if not exists(select 1 from public.client_service_agreements where id::text=sid and workspace_id=new.workspace_id)
    or (new.input_snapshot->'inputs'->'agreement'->>'id') is distinct from sid
    or (new.input_snapshot->'inputs'->'agreement'->>'workspace_id') is distinct from new.workspace_id::text then raise exception 'Deal agreement source must match' using errcode='23514';end if;
  else raise exception 'Unknown deal subject' using errcode='23514';end if;
 else raise exception 'Unsupported evaluator' using errcode='23514';end if;
 return new;
end $$;
