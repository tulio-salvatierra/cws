-- Run ONLY against an empty disposable PostgreSQL database. Synthetic fixtures only.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema private;
create table auth.users(id uuid primary key);
create table public.workspaces(id uuid primary key);
create table public.workspace_members(workspace_id uuid,user_id uuid,role text,status text);
create function private.is_workspace_owner(w uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.workspace_members m where m.workspace_id=w and m.user_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid and m.role='owner' and m.status='active')
$$;
grant usage on schema public,private,auth to anon,authenticated,service_role;
grant select on public.workspace_members to service_role;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.workspaces values ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002');
insert into public.workspace_members values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','owner','active'),('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','member','active');

\ir ../supabase/migrations/20261101181750_laya_move_choices.sql
-- Local isolated Postgres test. Bootstrap owner helper matches workspace-membership semantics.
-- Run after the migration; no real clients or production data are needed.
begin;
insert into auth.users values ('00000000-0000-0000-0000-000000000003');
insert into public.workspace_members values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','owner','active');
set local role service_role;
insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation)
values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','synthetic-card','Synthetic review','do','v1','{}','{}');
insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation)
values ('20000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','other-card','Other workspace review','do','v1','{}','{}');
do $$ begin
  begin
    insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation)
    values ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','synthetic-card','Synthetic review','do','v1','{}','{}');
    raise exception 'FAIL: member insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.laya_move_choices set title='changed';
    raise exception 'FAIL: service update accepted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.laya_move_choices;
    raise exception 'FAIL: service delete accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation)
    values ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','synthetic-card','Synthetic review','close','v1','{}','{}');
    raise exception 'FAIL: close without outcome accepted';
  exception when check_violation then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.laya_move_choices) <> 1 then raise exception 'FAIL: owner cannot read own event'; end if;
  begin
    insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation)
    values ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','synthetic-card','Synthetic review','do','v1','{}','{}');
    raise exception 'FAIL: direct browser insert accepted';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.laya_move_choices where workspace_id='10000000-0000-0000-0000-000000000002') then raise exception 'FAIL: foreign workspace read'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin if (select count(*) from public.laya_move_choices) <> 0 then raise exception 'FAIL: member can read'; end if; end $$;
reset role;
set local role anon;
do $$ begin
  begin perform * from public.laya_move_choices; raise exception 'FAIL: anon read'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  begin update public.laya_move_choices set title='changed'; raise exception 'FAIL: update bypassed guard'; exception when insufficient_privilege then null; end;
  begin delete from public.laya_move_choices; raise exception 'FAIL: delete bypassed guard'; exception when insufficient_privilege then null; end;
end $$;
rollback;
