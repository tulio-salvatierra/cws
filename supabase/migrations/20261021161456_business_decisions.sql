-- Preserve the legacy row, identities, provenance, timestamps and self-reference.
-- Never infer owner activation from a historical status.
do $$ begin
  if exists (select 1 from public.decisions where status <> 'proposed') then
    raise exception 'Unexpected legacy decision status: review before backfill';
  end if;
end $$;
alter table public.decisions rename to business_decisions;
alter table public.business_decisions drop constraint decisions_status_check;
alter table public.business_decisions
  add column review_by date,
  add column revisit_condition text,
  add column condition_observed_at timestamptz,
  add column condition_observed_by uuid references auth.users(id),
  add column activated_at timestamptz,
  add column activated_by uuid references auth.users(id),
  add constraint business_decisions_status_check check (status in ('proposed','active','superseded','rejected')),
  add constraint business_decisions_active_review_check check (
    status <> 'active' or (review_by is not null and revisit_condition is not null and length(btrim(revisit_condition)) > 0
      and activated_at is not null and activated_by is not null)),
  add constraint business_decisions_condition_evidence_check check (
    (condition_observed_at is null) = (condition_observed_by is null));

-- Replace all historical member-write policies; ordinary members can prepare
-- candidates, but only the signed-in owner can change lifecycle or review data.
drop policy workspace_members_can_add_decisions on public.business_decisions;
drop policy workspace_members_can_read_decisions on public.business_decisions;
drop policy workspace_members_can_update_decisions on public.business_decisions;
drop policy workspace_members_can_delete_decisions on public.business_decisions;
revoke all on public.business_decisions from anon, authenticated, service_role;
grant select, insert, update on public.business_decisions to authenticated;
grant select, insert on public.business_decisions to service_role;
create policy business_decisions_read on public.business_decisions for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy business_decisions_propose on public.business_decisions for insert to authenticated
  with check ((select private.is_workspace_member(workspace_id))
    and created_by = (select auth.uid()) and status = 'proposed');
create policy business_decisions_owner_update on public.business_decisions for update to authenticated
  using ((select private.is_workspace_owner(workspace_id)))
  with check ((select private.is_workspace_owner(workspace_id)));

create function private.protect_business_decision() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'proposed' or new.activated_at is not null or new.activated_by is not null
      or new.condition_observed_at is not null or new.condition_observed_by is not null then
      raise exception 'New decisions must be proposed without owner evidence' using errcode = '42501';
    end if;
  else
    if auth.uid() is null then
      raise exception 'A signed-in owner must change a decision' using errcode = '42501';
    end if;
    if not private.is_workspace_owner(old.workspace_id) then
      raise exception 'Only the owner can change a decision' using errcode = '42501';
    end if;
    if (new.id,new.workspace_id,new.created_by,new.created_at,new.source_agent_run_id)
       is distinct from (old.id,old.workspace_id,old.created_by,old.created_at,old.source_agent_run_id) then
      raise exception 'Decision identity and provenance are immutable' using errcode = '42501';
    end if;
    if old.status in ('superseded','rejected') then
      raise exception 'Closed decisions are immutable; prepare a new candidate' using errcode = '42501';
    end if;
    if old.status = 'active' and (new.title,new.context,new.decision,new.revisit_condition)
        is distinct from (old.title,old.context,old.decision,old.revisit_condition) then
      raise exception 'Active decision terms are immutable; prepare a replacement' using errcode = '42501';
    end if;
    if new.status = 'active' and old.status = 'proposed' then
      new.activated_by := auth.uid(); new.activated_at := now();
    elsif (new.activated_by,new.activated_at) is distinct from (old.activated_by,old.activated_at) then
      raise exception 'Activation evidence is immutable' using errcode = '42501';
    end if;
    if old.status = 'active' and new.status = 'proposed' then
      raise exception 'An active decision must be superseded or rejected' using errcode = '42501';
    end if;
    if new.condition_observed_at is distinct from old.condition_observed_at then
      if new.status <> 'active' then
        raise exception 'Only active decisions have review signals' using errcode = '42501';
      end if;
      new.condition_observed_by := case when new.condition_observed_at is null then null else auth.uid() end;
      new.condition_observed_at := case when new.condition_observed_at is null then null else now() end;
    elsif new.condition_observed_by is distinct from old.condition_observed_by then
      raise exception 'Review evidence actor is immutable' using errcode = '42501';
    end if;
  end if;
  -- Scope provenance and supersession to the same workspace.
  if new.superseded_by is not null and (new.superseded_by = new.id or not exists (
    select 1 from public.business_decisions d where d.id = new.superseded_by and d.workspace_id = new.workspace_id
  )) then raise exception 'Invalid replacement decision' using errcode = '23514'; end if;
  if new.source_agent_run_id is not null and not exists (
    select 1 from public.agent_runs r where r.id = new.source_agent_run_id and r.workspace_id = new.workspace_id
  ) then raise exception 'Invalid decision source' using errcode = '23514'; end if;
  return new;
end $$;
revoke all on function private.protect_business_decision() from public, anon;
create trigger business_decision_guard before insert or update on public.business_decisions
  for each row execute function private.protect_business_decision();
