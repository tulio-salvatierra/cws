begin;
select plan(19);
select has_table('public','project_time_entries','time ledger exists');
select col_type_is('public','project_time_entries','hours','integer','hours are whole integers');
select table_privs_are('public','project_time_entries','service_role',array['SELECT'],'agents/server cannot invent owner time');
select table_privs_are('public','project_time_entries','anon',array[]::text[],'anonymous cannot access time');
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','time-owner@example.test'),
 ('22222222-2222-4222-8222-222222222222','time-member@example.test');
insert into public.workspaces(id,name,slug,created_by) values
 ('44444444-4444-4444-8444-444444444444','Time test','project-time-test','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111'),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','member','active','11111111-1111-4111-8111-111111111111');
insert into public.clients(id,workspace_id,name,created_by) values
 ('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','Synthetic client','11111111-1111-4111-8111-111111111111'),
 ('55555555-5555-4555-8555-555555555556','44444444-4444-4444-8444-444444444444','Other client','11111111-1111-4111-8111-111111111111');
insert into public.operations_projects(id,workspace_id,client_id,name,project_type,status,created_by) values
 ('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555','Synthetic project','website_build','setup','11111111-1111-4111-8111-111111111111');
insert into public.client_service_agreements(id,workspace_id,client_id,product_name,setup_cents,monthly_cents,term_months,created_by) values
 ('77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555556','Negocio Listo — Synthetic',30000,14900,12,'11111111-1111-4111-8111-111111111111');
select throws_ok($q$update public.operations_projects set service_agreement_id='77777777-7777-4777-8777-777777777777' where id='66666666-6666-4666-8666-666666666666'$q$,'23503',null,'agreement must belong to project client');
select throws_ok($q$update public.operations_projects set actual_hours=1.5 where id='66666666-6666-4666-8666-666666666666'$q$,'42501',null,'direct fractional totals cannot bypass ledger');
set local role service_role;
select throws_ok($q$insert into public.project_time_entries(id,workspace_id,project_id,hours,worked_on,created_by) values('88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666',1,current_date,'11111111-1111-4111-8111-111111111111')$q$,'42501',null,'service cannot impersonate owner time');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select throws_ok($q$insert into public.project_time_entries(id,workspace_id,project_id,hours,worked_on) values('88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666',1,'2026-10-01')$q$,'42501',null,'member cannot enter time');
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select lives_ok($q$insert into public.project_time_entries(id,workspace_id,project_id,hours,worked_on) values('88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666',3,'2026-10-01')$q$,'owner records whole hours');
select is((select actual_hours from public.operations_projects where id='66666666-6666-4666-8666-666666666666'),3::numeric,'financial hours derive from entries');
select is((select created_by from public.project_time_entries where id='88888888-8888-4888-8888-888888888888'),'11111111-1111-4111-8111-111111111111'::uuid,'actual owner is recorded');
select throws_ok($q$select jsonb_populate_record(null::public.project_time_entries,'{"hours":1.5}'::jsonb)$q$,'22P02',null,'Data API fractional JSON is rejected instead of rounded');
select throws_ok($q$insert into public.project_time_entries(id,workspace_id,project_id,hours,worked_on) values('88888888-8888-4888-8888-888888888889','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666',0,'2026-10-01')$q$,'23514',null,'zero time is rejected');
select throws_ok($q$insert into public.project_time_entries(id,workspace_id,project_id,hours,worked_on) values('88888888-8888-4888-8888-888888888889','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666',1,'2100-01-01')$q$,'23514',null,'future work cannot be recorded');
select throws_ok($q$update public.project_time_entries set project_id='66666666-6666-4666-8666-666666666667' where id='88888888-8888-4888-8888-888888888888'$q$,'42501',null,'time identity cannot move to another project');
update public.project_time_entries set hours=4 where id='88888888-8888-4888-8888-888888888888';
select is((select actual_hours from public.operations_projects where id='66666666-6666-4666-8666-666666666666'),4::numeric,'owner correction recalculates total');
select is((select actual_hours from public.project_financial_summary where operations_project_id='66666666-6666-4666-8666-666666666666'),4::numeric,'financial view uses exact owner hours');
delete from public.project_time_entries where id='88888888-8888-4888-8888-888888888888';
select is((select actual_hours from public.operations_projects where id='66666666-6666-4666-8666-666666666666'),null::numeric,'removing final entry restores unknown hours');
select is((select count(*)::int from public.project_time_entries where workspace_id='44444444-4444-4444-8444-444444444444'),0,'correction leaves no hidden time');
reset role;
select * from finish();
rollback;
