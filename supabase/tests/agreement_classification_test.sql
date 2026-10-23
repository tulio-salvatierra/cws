begin;
select plan(13);
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

insert into public.client_service_agreements(id,workspace_id,client_id,product_name,setup_cents,monthly_cents,term_months,created_by) values('77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555','Website custom terms',30000,14900,12,'11111111-1111-4111-8111-111111111111');

set local role authenticated;set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select throws_ok($q$select public.classify_agreement_negocio_listo('77777777-7777-4777-8777-777777777777','Website custom terms','Owner verifies NL with custom terms')$q$,'42501',null,'member denied');

select is((select count(*)::int from public.agreement_classification_corrections),0,'member cannot read audit');
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select throws_ok($q$select public.classify_agreement_negocio_listo('77777777-7777-4777-8777-777777777777','Website custom terms',' ')$q$,'23514',null,'blank reason denied');
select throws_ok($q$select public.classify_agreement_negocio_listo('77777777-7777-4777-8777-777777777777','Stale label','Owner verifies NL with custom terms')$q$,'40001',null,'stale label denied');
select lives_ok($q$select public.classify_agreement_negocio_listo('77777777-7777-4777-8777-777777777777','Website custom terms','Owner verifies NL with custom terms')$q$,'owner corrects');

select is((select product_name from public.client_service_agreements where id='77777777-7777-4777-8777-777777777777'),'Negocio Listo — Website custom terms','custom label retained');
select is((select recorded_by from public.agreement_classification_corrections limit 1),'11111111-1111-4111-8111-111111111111'::uuid,'actor from JWT');
select ok((select (to_jsonb(a)-'product_name')=(c.agreement_snapshot-'product_name') from public.client_service_agreements a join public.agreement_classification_corrections c on c.agreement_id=a.id),'every nonclassification field preserved');
select throws_ok($q$select public.classify_agreement_negocio_listo('77777777-7777-4777-8777-777777777777','Website custom terms','Owner verifies NL with custom terms')$q$,'40001',null,'retry cannot duplicate');

select throws_ok($q$update public.agreement_classification_corrections set reason='forged'$q$,'42501',null,'audit cannot update');
select throws_ok($q$delete from public.agreement_classification_corrections$q$,'42501',null,'audit cannot delete');
reset role;set local role service_role;set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select throws_ok($q$select public.classify_agreement_negocio_listo('77777777-7777-4777-8777-777777777777','Website custom terms','Owner verifies NL with custom terms')$q$,'42501',null,'service cannot forge owner RPC');

select throws_ok($q$update public.client_service_agreements set product_name='Bypass' where id='77777777-7777-4777-8777-777777777777'$q$,'42501',null,'service cannot bypass audited correction');
reset role;select * from finish();rollback;
