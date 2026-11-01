begin;
select plan(23);
select has_table('public','company_profiles','company profile exists');
select table_privs_are('public','company_state_snapshots','authenticated',array['INSERT','SELECT'],'snapshots append only');
select table_privs_are('public','company_outcomes','service_role',array['SELECT'],'service cannot record owner learning');
select table_privs_are('public','company_profiles','anon',array[]::text[],'anonymous denied');
insert into auth.users (id,email) values
 ('11111111-1111-4111-8111-111111111111','world-owner@example.test'),
 ('22222222-2222-4222-8222-222222222222','world-member@example.test');
insert into public.workspaces(id,name,slug,created_by) values
 ('44444444-4444-4444-8444-444444444444','World test','world-test','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111'),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','member','active','11111111-1111-4111-8111-111111111111');
insert into public.workspaces(id,name,slug,created_by) values
 ('88888888-8888-4888-8888-888888888888','Other world','other-world','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
 ('88888888-8888-4888-8888-888888888888','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111');
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select lives_ok($q$insert into public.company_profiles(workspace_id,source_note) values ('44444444-4444-4444-8444-444444444444','Synthetic context')$q$,'owner records unknown profile');
select is((select objective from public.company_profiles where workspace_id='44444444-4444-4444-8444-444444444444'),null,'unknown objective stays null');
select throws_ok($q$insert into public.company_profiles(workspace_id,source_note) values ('44444444-4444-4444-8444-444444444444','Duplicate')$q$,'23505',null,'one profile per canonical workspace');
insert into public.company_units(workspace_id,unit_key,name,source_note) values ('44444444-4444-4444-8444-444444444444','media','Synthetic media','Proposal');
select is((select status from public.company_units where unit_key='media'),'proposed','units are not active by default');
select throws_ok($q$insert into public.company_opportunities(workspace_id,title,source_note,unit_id) select '88888888-8888-4888-8888-888888888888','Foreign link','Synthetic',id from public.company_units where unit_key='media'$q$,'23503',null,'cross-workspace links rejected even for shared owner');
select throws_ok($q$update public.company_units set workspace_id='88888888-8888-4888-8888-888888888888' where unit_key='media'$q$,'42501',null,'context cannot move workspace');

select throws_ok($q$insert into public.company_constraints(workspace_id,category,statement,status,source_note) values ('44444444-4444-4444-8444-444444444444','legal','Synthetic law','confirmed','No evidence')$q$,'23514',null,'confirmed legal context requires time-bound source');
select throws_ok($q$insert into public.company_units(workspace_id,unit_key,name,source_note,performance) values ('44444444-4444-4444-8444-444444444444','bad','Bad','Synthetic','{"revenue":0}')$q$,'23514',null,'metrics require explicit unit and source');
select throws_ok($q$insert into public.company_state_snapshots(workspace_id,source_note,observed_at) values ('44444444-4444-4444-8444-444444444444','Future',now()+interval '1 day')$q$,'23514',null,'future observations denied');
select throws_ok($q$delete from public.company_units$q$,'42501',null,'no destructive delete grant');
insert into public.business_decisions(id,workspace_id,title,decision,created_by) values
 ('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','Synthetic decision','Recorded terms','11111111-1111-4111-8111-111111111111');
insert into public.company_decision_contexts(id,workspace_id,decision_id,source_note,decision_snapshot) values
 ('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555','Synthetic context','{"decision":"Forged terms"}');
select is((select decision_snapshot->>'decision' from public.company_decision_contexts where id='66666666-6666-4666-8666-666666666666'),'Recorded terms','database captures canonical decision');
select is((select status from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),'proposed','context does not activate decision');
select throws_ok($q$update public.company_decision_contexts set rationale='Rewrite'$q$,'42501',null,'decision context is immutable');
select throws_ok($q$insert into public.company_outcomes(workspace_id,decision_context_id,source_note) values ('44444444-4444-4444-8444-444444444444','77777777-7777-4777-8777-777777777777','Missing parent')$q$,'23503',null,'outcome requires linked context');
select lives_ok($q$insert into public.company_outcomes(workspace_id,decision_context_id,source_note,metrics) values ('44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666','Synthetic measurement','{"revenue":{"value":null,"unit":"USD cents","source":"Unverified"}}')$q$,'unknown metrics remain explicit');
select throws_ok($q$update public.company_outcomes set lesson='Rewritten'$q$,'42501',null,'outcome history is immutable');
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select is((select count(*)::int from public.company_profiles),0,'member cannot read owner context');
select throws_ok($q$insert into public.company_state_snapshots(workspace_id,source_note) values ('44444444-4444-4444-8444-444444444444','Member')$q$,'42501',null,'member cannot record state');
reset role;
set local role service_role;
select throws_ok($q$insert into public.company_outcomes(workspace_id,source_note,decision_context_id) values ('44444444-4444-4444-8444-444444444444','Agent','55555555-5555-4555-8555-555555555555')$q$,'42501',null,'agent cannot record outcomes');
reset role;
select * from finish();
rollback;
