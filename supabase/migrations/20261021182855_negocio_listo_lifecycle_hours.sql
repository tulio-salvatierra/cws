-- No historical hours are inferred or rounded. Stop if the audited precondition
-- changed so an owner can reconcile existing totals explicitly.
do $$ begin
 if exists(select 1 from public.operations_projects where actual_hours is not null) then
  raise exception 'Existing actual hours require explicit owner reconciliation before ledger migration';
 end if;
end $$;
alter table public.client_service_agreements add constraint agreements_project_identity unique(id,workspace_id,client_id);
alter table public.operations_projects add column service_agreement_id uuid,
 add constraint operations_agreement_same_client foreign key(service_agreement_id,workspace_id,client_id)
 references public.client_service_agreements(id,workspace_id,client_id);
create index operations_projects_agreement_idx on public.operations_projects(service_agreement_id);

create table public.project_time_entries (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id),
 project_id uuid not null,
 hours integer not null check(hours between 1 and 9999),
 worked_on date not null check(worked_on <= (now() at time zone 'America/Chicago')::date),
 notes text not null default '' check(char_length(notes)<=2000),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(project_id,workspace_id) references public.operations_projects(id,workspace_id)
);
create index project_time_entries_project_idx on public.project_time_entries(project_id,workspace_id);
create index project_time_entries_workspace_idx on public.project_time_entries(workspace_id,worked_on desc);
create index project_time_entries_creator_idx on public.project_time_entries(created_by);
alter table public.project_time_entries enable row level security;
revoke all on public.project_time_entries from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.project_time_entries to authenticated;
grant select on public.project_time_entries to service_role;
create policy project_time_read on public.project_time_entries for select to authenticated
 using((select private.is_workspace_member(workspace_id)));
create policy project_time_add on public.project_time_entries for insert to authenticated
 with check((select private.is_workspace_owner(workspace_id)) and created_by=(select auth.uid()));
create policy project_time_edit on public.project_time_entries for update to authenticated
 using((select private.is_workspace_owner(workspace_id))) with check((select private.is_workspace_owner(workspace_id)));
create policy project_time_remove on public.project_time_entries for delete to authenticated
 using((select private.is_workspace_owner(workspace_id)));

create function private.guard_project_time() returns trigger language plpgsql security invoker set search_path='' as $$
declare w uuid; p uuid;
begin
 w:=case when tg_op='DELETE' then old.workspace_id else new.workspace_id end;
 p:=case when tg_op='DELETE' then old.project_id else new.project_id end;
 if auth.uid() is null or not private.is_workspace_owner(w) then
  raise exception 'Only the signed-in owner may enter project time' using errcode='42501';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p::text,0));
 if tg_op='DELETE' then return old; end if;
 if tg_op='INSERT' then new.created_by:=auth.uid();new.created_at:=now();
 elsif (new.id,new.workspace_id,new.project_id,new.created_by,new.created_at)
  is distinct from (old.id,old.workspace_id,old.project_id,old.created_by,old.created_at) then
  raise exception 'Time entry identity and provenance are immutable' using errcode='42501';
 end if;
 new.updated_at:=now();return new;
end $$;
revoke all on function private.guard_project_time() from public,anon;
create trigger project_time_guard before insert or update or delete on public.project_time_entries
 for each row execute function private.guard_project_time();

-- The private trigger can update only the derived financial-hours cache. It
-- checks the authenticated owner again; it is not exposed as a callable RPC.
create function private.sync_project_hours() returns trigger language plpgsql security definer set search_path='' as $$
declare p uuid;w uuid;total bigint;
begin
 p:=case when tg_op='DELETE' then old.project_id else new.project_id end;
 w:=case when tg_op='DELETE' then old.workspace_id else new.workspace_id end;
 if auth.uid() is null or not private.is_workspace_owner(w) then
  raise exception 'Owner required for project time' using errcode='42501';
 end if;
 select sum(hours) into total from public.project_time_entries where project_id=p and workspace_id=w;
 if total>99999 then raise exception 'Project total cannot exceed 99999 whole hours' using errcode='23514'; end if;
 update public.operations_projects set actual_hours=total where id=p and workspace_id=w;
 return null;
end $$;
revoke all on function private.sync_project_hours() from public,anon,authenticated,service_role;
create trigger project_hours_sync after insert or update or delete on public.project_time_entries
 for each row execute function private.sync_project_hours();
create function private.guard_project_hours_cache() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if (tg_op='INSERT' and new.actual_hours is not null)
  or (tg_op='UPDATE' and new.actual_hours is distinct from old.actual_hours and pg_trigger_depth()<2) then
  raise exception 'Project hours derive only from owner-entered whole-hour entries' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function private.guard_project_hours_cache() from public,anon;
create trigger project_hours_cache_guard before insert or update on public.operations_projects
 for each row execute function private.guard_project_hours_cache();
