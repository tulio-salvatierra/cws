-- Schema-only prerequisites inspected from production on 2026-11-01; no business rows.
-- Targeted integration fixture, not a replacement for the full migration history.
\set ON_ERROR_STOP on
do $$ begin if current_database() <> 'laya_verify' then raise exception 'Use disposable laya_verify database only'; end if; end $$;
create extension if not exists "uuid-ossp" with schema public;
create extension if not exists pgtap with schema public;
create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$
select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
(nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub'))::uuid
$$;
create schema private;
grant usage on schema public,private,auth to anon,authenticated,service_role;
create table public.workspaces (
id uuid not null default uuid_generate_v4(),
name text not null,
slug text not null,
created_by uuid not null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now()
);
alter table public.workspaces add CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 120)));
alter table public.workspaces add PRIMARY KEY (id);
alter table public.workspaces add CHECK (((slug = lower(slug)) AND ((char_length(slug) >= 1) AND (char_length(slug) <= 80)) AND (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)));
alter table public.workspaces add UNIQUE (slug);
create table public.workspace_members (
id uuid not null default uuid_generate_v4(),
workspace_id uuid not null,
user_id uuid not null,
role text not null,
status text not null default 'active'::text,
created_by uuid not null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now()
);
alter table public.workspace_members add PRIMARY KEY (id);
alter table public.workspace_members add CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text])));
alter table public.workspace_members add CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text])));
alter table public.workspace_members add UNIQUE (workspace_id, user_id);
create table public.business_decisions (
id uuid not null default uuid_generate_v4(),
workspace_id uuid not null,
title text not null,
context text,
decision text not null,
status text not null default 'proposed'::text,
superseded_by uuid,
source_agent_run_id uuid,
created_by uuid not null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
observed_outcome text,
review_by date,
revisit_condition text,
condition_observed_at timestamp with time zone,
condition_observed_by uuid,
activated_at timestamp with time zone,
activated_by uuid
);
alter table public.business_decisions add CHECK (((status <> 'active'::text) OR ((review_by IS NOT NULL) AND (revisit_condition IS NOT NULL) AND (length(btrim(revisit_condition)) > 0) AND (activated_at IS NOT NULL) AND (activated_by IS NOT NULL))));
alter table public.business_decisions add CHECK (((condition_observed_at IS NULL) = (condition_observed_by IS NULL)));
alter table public.business_decisions add CHECK ((status = ANY (ARRAY['proposed'::text, 'active'::text, 'superseded'::text, 'rejected'::text])));
alter table public.business_decisions add PRIMARY KEY (id);
alter table public.business_decisions add CHECK (((title = btrim(title)) AND ((char_length(title) >= 1) AND (char_length(title) <= 200))));
create table public.agent_runs(id uuid primary key,workspace_id uuid);
CREATE OR REPLACE FUNCTION private.is_workspace_member(target_workspace_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$function$
;
CREATE OR REPLACE FUNCTION private.is_workspace_owner(target_workspace_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
      and membership.status = 'active'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.protect_business_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;
grant select on public.workspace_members to service_role;
grant select on public.workspaces to authenticated,service_role;
grant select,insert,update on public.business_decisions to authenticated;
grant select,insert on public.business_decisions to service_role;
alter table public.business_decisions enable row level security;
create policy decision_read on public.business_decisions for select to authenticated using (private.is_workspace_member(workspace_id));
create policy decision_propose on public.business_decisions for insert to authenticated with check (private.is_workspace_member(workspace_id) and created_by=auth.uid() and status='proposed');
create policy decision_update on public.business_decisions for update to authenticated using (private.is_workspace_owner(workspace_id)) with check (private.is_workspace_owner(workspace_id));
create trigger protect_business_decision before insert or update on public.business_decisions for each row execute function private.protect_business_decision();

