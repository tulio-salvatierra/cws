set local lock_timeout = '5s';
-- Extend the existing append-only owner response boundary. No evidence rewrite,
-- table retirement, grant change, provider action or decision activation.
alter table public.laya_evaluations drop constraint laya_evaluations_evaluator_check;
alter table public.laya_evaluations add constraint laya_evaluations_evaluator_check check(evaluator in ('decision_review','goal_pace','deal_fit','lifecycle','priority_review'));
alter table public.laya_evaluations drop constraint laya_response_subject_shape;
alter table public.laya_evaluations add constraint laya_response_subject_shape check(
 subject_type is not null and subject_id is not null and (
 (evaluator='decision_review' and decision_id is not null and subject_type='business_decision' and subject_id=decision_id::text)
 or (evaluator='goal_pace' and decision_id is null and subject_type='negocio_listo_goal' and subject_id='negocio-listo-2026-12-31')
 or (evaluator in ('deal_fit','lifecycle') and decision_id is null and subject_type in ('lead','client_service_agreement') and char_length(subject_id)>0)
 or (evaluator='priority_review' and decision_id is null and subject_type='ceo_priority' and char_length(subject_id)>0)));

create or replace function private.protect_laya_response() returns trigger
language plpgsql security invoker set search_path='' as $$
declare kind text; sid text; src jsonb; principal jsonb; source_type text; principal_table text; present boolean;
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
 elsif new.evaluator='priority_review' then
  if new.decision_id is not null or new.input_snapshot->'subject' is distinct from new.evaluation->'subject'
   or new.evaluation->'subject'->>'type' is distinct from 'ceo_priority'
   or new.evaluation->'subject'->>'id' is distinct from new.input_snapshot->'inputs'->'action'->>'id'
   or new.input_snapshot->'inputs'->>'workspaceId' is distinct from new.workspace_id::text
   or new.input_snapshot->'inputs'->>'now' is distinct from new.evaluation->>'evaluated_at'
   or new.input_snapshot->>'business_date' is null
   or new.input_snapshot->>'business_date' is distinct from new.evaluation->>'business_date'
   or new.input_snapshot->>'time_zone' is distinct from 'America/Chicago'
   or new.evaluation->>'time_zone' is distinct from 'America/Chicago'
   or jsonb_typeof(new.input_snapshot->'inputs'->'sources') is distinct from 'array'
   or jsonb_typeof(new.input_snapshot->'inputs'->'availability') is distinct from 'object' then
   raise exception 'Priority reviewed inputs and evaluation must match' using errcode='23514';end if;
  source_type:=new.input_snapshot->'inputs'->'action'->>'source_type';
  if source_type is null or source_type not in ('sales_command','operations_delivery','accounting_financial','compliance_requirement','marketing_ready','marketing_missed','marketing_delivery_failure','fallback') then
   raise exception 'Unsupported priority source' using errcode='23514';end if;
  for src in select value from jsonb_array_elements(new.input_snapshot->'inputs'->'sources') loop
   if src->>'table'='marketing_publish_destination_results' then
    if not exists(select 1 from public.marketing_publish_attempts where id::text=src->'row'->>'attempt_id' and workspace_id=new.workspace_id)
     or not exists(select 1 from jsonb_array_elements(new.input_snapshot->'inputs'->'sources') s where s->>'table'='marketing_publish_attempts' and s->'row'->>'id'=src->'row'->>'attempt_id' and s->'row'->>'workspace_id'=new.workspace_id::text) then
     raise exception 'Priority destination scope must match' using errcode='23514';end if;
   elsif src->>'table' is null or src->>'table' not in ('leads','sales_promised_actions','outreach_sends','operations_projects','project_requirements','clients','financial_obligations','payment_receipts','recurring_revenue','compliance_requirements','compliance_completions','marketing_publish_attempts','marketing_slot_resolutions')
    or src->'row'->>'workspace_id' is distinct from new.workspace_id::text then
    raise exception 'Priority source workspace must match' using errcode='23514';end if;
  end loop;
  if source_type in ('marketing_ready','marketing_missed','marketing_delivery_failure') then
   if (new.evaluation->'subject'->>'id') !~ '^marketing:(ready|missed|failure):[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$' then raise exception 'Unknown priority occurrence' using errcode='23514';end if;
  elsif source_type='fallback' then
   if new.evaluation->'subject'->>'id' is distinct from 'sales:fallback:find-next-customer' then raise exception 'Unknown fallback priority' using errcode='23514';end if;
  else
   principal:=new.input_snapshot->'inputs'->'principal';principal_table:=principal->>'table';sid:=principal->'row'->>'id';
   if principal_table is null or sid is null or principal->'row'->>'workspace_id' is distinct from new.workspace_id::text
    or not exists(select 1 from jsonb_array_elements(new.input_snapshot->'inputs'->'sources') s where s=principal)
    or not coalesce(((source_type='sales_command' and principal_table='leads' and sid=new.input_snapshot->'inputs'->'action'->>'lead_id' and ((new.evaluation->'subject'->>'id') in ('sales:inbound:'||sid,'sales:warm:'||sid,'sales:follow_up:'||sid,'sales:new_prospect:'||sid) or exists(select 1 from jsonb_array_elements(new.input_snapshot->'inputs'->'sources') p where p->>'table'='sales_promised_actions' and p->'row'->>'lead_id'=sid and new.evaluation->'subject'->>'id'='sales:'||(p->'row'->>'id'))))
      or (source_type='operations_delivery' and principal_table='operations_projects' and sid=new.input_snapshot->'inputs'->'action'->>'project_id' and new.evaluation->'subject'->>'id'='operations:'||sid)
      or (source_type='accounting_financial' and principal_table in ('financial_obligations','recurring_revenue') and new.evaluation->'subject'->>'id'='accounting:'||(case when principal_table='financial_obligations' then 'financial_obligation' else 'recurring_revenue' end)||':'||sid)
      or (source_type='compliance_requirement' and principal_table='compliance_requirements' and new.evaluation->'subject'->>'id'='compliance:'||sid)),false) then
    raise exception 'Priority principal must match' using errcode='23514';end if;
   -- Identifiers are taken only from the fixed principal whitelist above.
   execute format('select exists(select 1 from public.%I where id::text=$1 and workspace_id=$2)',principal_table) into present using sid,new.workspace_id;
   if not present then raise exception 'Priority principal no longer exists in workspace' using errcode='23514';end if;
  end if;
 elsif new.evaluator in ('goal_pace','deal_fit','lifecycle') then
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
  if new.evaluator='lifecycle' and (
    (kind='lead' and split_part(coalesce(new.input_snapshot->'inputs'->'lead'->>'source',''),'|',1)<>'negocio-listo')
    or (kind='client_service_agreement' and btrim(coalesce(new.input_snapshot->'inputs'->'agreement'->>'product_name','')) !~* '^negocio listo([[:space:]]|$|[—-])')
  ) then raise exception 'Lifecycle source must identify Negocio Listo' using errcode='23514';end if;
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
