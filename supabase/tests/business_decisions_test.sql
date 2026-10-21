begin;
select plan(18);
select has_table('public','business_decisions','business decisions exist');
select hasnt_table('public','decisions','legacy name removed');
select table_privs_are('public','business_decisions','anon',array[]::text[],'anon has no access');
select table_privs_are('public','business_decisions','service_role',array['INSERT','SELECT'],'PREPARE cannot update or activate');
insert into auth.users (id,email) values
 ('11111111-1111-4111-8111-111111111111','decision-owner@example.test'),
 ('22222222-2222-4222-8222-222222222222','decision-member@example.test'),
 ('33333333-3333-4333-8333-333333333333','decision-outsider@example.test');
insert into public.workspaces (id,name,slug,created_by) values
 ('44444444-4444-4444-8444-444444444444','Decision test','decisions-001-test','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members (workspace_id,user_id,role,status,created_by) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111'),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','member','active','11111111-1111-4111-8111-111111111111');
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select lives_ok($q$insert into public.business_decisions(id,workspace_id,title,decision,created_by) values ('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','Synthetic proposal','Synthetic terms','22222222-2222-4222-8222-222222222222')$q$,'member may prepare');
select throws_ok($q$insert into public.business_decisions(workspace_id,title,decision,created_by,status) values ('44444444-4444-4444-8444-444444444444','Synthetic active','Terms','22222222-2222-4222-8222-222222222222','active')$q$,'42501',null,'member cannot insert active');
select is((select count(*)::int from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),1,'member reads workspace');
update public.business_decisions set status='active' where id='55555555-5555-4555-8555-555555555555';
select is((select status from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),'proposed','member cannot activate via update');
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
select is((select count(*)::int from public.business_decisions where workspace_id='44444444-4444-4444-8444-444444444444'),0,'outsider cannot read');
select throws_ok($q$insert into public.business_decisions(workspace_id,title,decision,created_by) values ('44444444-4444-4444-8444-444444444444','Intrusion','Terms','33333333-3333-4333-8333-333333333333')$q$,'42501',null,'outsider cannot prepare');
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select throws_ok($q$update public.business_decisions set status='active' where id='55555555-5555-4555-8555-555555555555'$q$,'23514',null,'owner activation requires review terms');
update public.business_decisions set review_by='2026-12-31',revisit_condition='Owner observes checkpoint',status='active' where id='55555555-5555-4555-8555-555555555555';
select is((select activated_by from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),'11111111-1111-4111-8111-111111111111'::uuid,'owner activation actor recorded');
select ok((select activated_at is not null from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),'activation timestamp recorded');
select throws_ok($q$update public.business_decisions set decision='Changed terms' where id='55555555-5555-4555-8555-555555555555'$q$,'42501',null,'active terms frozen');
select throws_ok($q$update public.business_decisions set workspace_id='66666666-6666-4666-8666-666666666666' where id='55555555-5555-4555-8555-555555555555'$q$,'42501',null,'workspace immutable');
update public.business_decisions set condition_observed_at=now() where id='55555555-5555-4555-8555-555555555555';
select is((select condition_observed_by from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),'11111111-1111-4111-8111-111111111111'::uuid,'owner condition evidence recorded');
reset role;
set local role service_role;
set local request.jwt.claim.sub = '';
select throws_ok($q$update public.business_decisions set status='active' where id='55555555-5555-4555-8555-555555555555'$q$,'42501',null,'service role cannot activate');
select throws_ok($q$insert into public.business_decisions(workspace_id,title,decision,created_by,status,review_by,revisit_condition,activated_at,activated_by) values ('44444444-4444-4444-8444-444444444444','Forged activation','Terms','11111111-1111-4111-8111-111111111111','active','2026-12-31','Checkpoint',now(),'11111111-1111-4111-8111-111111111111')$q$,'42501',null,'service role cannot forge active insert');
reset role;
select * from finish();
rollback;
