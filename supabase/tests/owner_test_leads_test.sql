begin;
select plan(14);
insert into auth.users(id,email) values
('11111111-1111-4111-8111-111111111111','test-flag-owner@example.test'),
('22222222-2222-4222-8222-222222222222','test-flag-member@example.test'),
('33333333-3333-4333-8333-333333333333','test-flag-outsider@example.test');
insert into public.workspaces(id,name,slug,created_by) values
('44444444-4444-4444-8444-444444444444','Flag fixture','flag-fixture','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111'),
('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','member','active','11111111-1111-4111-8111-111111111111');
insert into public.leads(id,workspace_id,name,created_by,email) values
('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','TEST ONLY fixture','11111111-1111-4111-8111-111111111111','qa@example.test');
select is((select is_test from public.leads where id='55555555-5555-4555-8555-555555555555'),false,'name does not automatically classify');
set local role authenticated;
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select throws_ok($q$update public.leads set is_test=true,test_record_reason='QA' where id='55555555-5555-4555-8555-555555555555'$q$,'P0001','Only the active workspace owner may change test classification','member cannot flag');
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select throws_ok($q$update public.leads set is_test=true where id='55555555-5555-4555-8555-555555555555'$q$,'P0001','A test classification reason is required','owner must supply reason');
select lives_ok($q$update public.leads set is_test=true,test_record_reason='  QA only  ',test_record_by='22222222-2222-4222-8222-222222222222',test_record_at='2000-01-01' where id='55555555-5555-4555-8555-555555555555'$q$,'owner flags explicitly');
select is((select test_record_by from public.leads where id='55555555-5555-4555-8555-555555555555'),'11111111-1111-4111-8111-111111111111'::uuid,'actor cannot be forged');
select is((select test_record_at from public.leads where id='55555555-5555-4555-8555-555555555555'),now(),'time cannot be forged');
select is((select test_record_reason from public.leads where id='55555555-5555-4555-8555-555555555555'),'QA only','reason trimmed');
select throws_ok($q$update public.leads set test_record_reason='rewrite' where id='55555555-5555-4555-8555-555555555555'$q$,'P0001','Test classification provenance changes only with the flag','provenance cannot be rewritten independently');
select lives_ok($q$update public.leads set is_test=false,test_record_reason='Real lead verified' where id='55555555-5555-4555-8555-555555555555'$q$,'owner can restore');
select is((select name from public.leads where id='55555555-5555-4555-8555-555555555555'),'TEST ONLY fixture','restoration preserves lead');
set local request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
select is((select count(*)::int from public.leads where id='55555555-5555-4555-8555-555555555555'),0,'outsider cannot read or target');
reset role;
set local role service_role;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select throws_ok($q$update public.leads set is_test=true,test_record_reason='service forged owner' where id='55555555-5555-4555-8555-555555555555'$q$,'P0001','Only the active workspace owner may change test classification','service role cannot flag even with owner sub');
select throws_ok($q$insert into public.leads(workspace_id,name,created_by,is_test,test_record_reason) values ('44444444-4444-4444-8444-444444444444','forged','11111111-1111-4111-8111-111111111111',true,'QA')$q$,'P0001','Create the lead first; only its owner may classify it as test','insert cannot forge classification');
reset role;
update public.workspace_members set role='owner' where workspace_id='44444444-4444-4444-8444-444444444444' and user_id='22222222-2222-4222-8222-222222222222';
update public.workspace_members set status='suspended' where workspace_id='44444444-4444-4444-8444-444444444444' and user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select is((select count(*)::int from public.leads where id='55555555-5555-4555-8555-555555555555'),0,'inactive owner has no classification access');
reset role;
select * from finish();
rollback;
