begin;
select plan(16);

insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111181','agreement-owner@example.test'),
 ('22222222-2222-4222-8222-222222222282','agreement-member@example.test');
insert into public.workspaces(id,name,slug,created_by) values
 ('44444444-4444-4444-8444-444444444484','Agreement billing test','agreement-billing-test','11111111-1111-4111-8111-111111111181'),
 ('44444444-4444-4444-8444-444444444485','Other workspace','agreement-billing-other','11111111-1111-4111-8111-111111111181');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
 ('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','owner','active','11111111-1111-4111-8111-111111111181'),
 ('44444444-4444-4444-8444-444444444484','22222222-2222-4222-8222-222222222282','member','active','11111111-1111-4111-8111-111111111181');
insert into public.clients(id,workspace_id,name,created_by) values
 ('55555555-5555-4555-8555-555555555585','44444444-4444-4444-8444-444444444484','Synthetic billing customer','11111111-1111-4111-8111-111111111181');
insert into public.client_service_agreements(id,workspace_id,client_id,product_name,setup_cents,monthly_cents,term_months,created_by) values
 ('77777777-7777-4777-8777-777777777787','44444444-4444-4444-8444-444444444484','55555555-5555-4555-8555-555555555585','Synthetic website plan',0,15000,12,'11111111-1111-4111-8111-111111111181'),
 ('77777777-7777-4777-8777-777777777788','44444444-4444-4444-8444-444444444484','55555555-5555-4555-8555-555555555585','Synthetic legacy launch',0,15000,12,'11111111-1111-4111-8111-111111111181');

set local role anon;
select throws_ok($q$select public.start_client_service_agreement_billing('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777787',date '2026-10-04')$q$,'42501',null,'anonymous caller cannot start billing');
reset role;
set local role service_role;
select throws_ok($q$select public.start_client_service_agreement_billing('44444444-4444-4444-8444-444444444484','22222222-2222-4222-8222-222222222282','77777777-7777-4777-8777-777777777787',date '2026-10-04')$q$,'P0001',null,'member cannot start billing');
select throws_ok($q$select public.start_client_service_agreement_billing('44444444-4444-4444-8444-444444444485','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777787',date '2026-10-04')$q$,'P0001',null,'wrong workspace cannot start billing');
select lives_ok($q$select public.start_client_service_agreement_billing('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777787',date '2026-10-04')$q$,'owner starts the actual billing schedule');
select is((select billing_start_date from public.client_service_agreements where id='77777777-7777-4777-8777-777777777787'),date '2026-10-04','billing start is retained separately');
select is((select launch_date from public.client_service_agreements where id='77777777-7777-4777-8777-777777777787'),null::date,'billing start does not assert a finished-site launch');
select is((select count(*)::int from public.agreement_installments where agreement_id='77777777-7777-4777-8777-777777777787' and installment between 1 and 12),12,'one monthly bill per recorded term month');
select is((select min(o.due_date) from public.agreement_installments i join public.financial_obligations o on o.id=i.financial_obligation_id where i.agreement_id='77777777-7777-4777-8777-777777777787' and i.installment>0),date '2026-10-04','first bill uses actual billing start');
select is((select max(o.due_date) from public.agreement_installments i join public.financial_obligations o on o.id=i.financial_obligation_id where i.agreement_id='77777777-7777-4777-8777-777777777787' and i.installment>0),date '2027-09-04','last bill is deterministic');
select lives_ok($q$select public.start_client_service_agreement_billing('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777787',date '2026-10-04')$q$,'same billing start is idempotent');
select is((select count(*)::int from public.agreement_installments where agreement_id='77777777-7777-4777-8777-777777777787' and installment>0),12,'idempotency creates no duplicate bills');
select throws_ok($q$select public.start_client_service_agreement_billing('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777787',date '2026-10-05')$q$,'P0001',null,'conflicting billing start is rejected');
select lives_ok($q$select public.launch_client_service_agreement('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777787',date '2026-10-21')$q$,'owner records the finished-site launch after billing');
select is((select launch_date from public.client_service_agreements where id='77777777-7777-4777-8777-777777777787'),date '2026-10-21','launch is retained separately from billing');
select lives_ok($q$select public.launch_client_service_agreement('44444444-4444-4444-8444-444444444484','11111111-1111-4111-8111-111111111181','77777777-7777-4777-8777-777777777788',date '2026-10-04')$q$,'legacy launch caller still creates its billing schedule');
select is((select billing_start_date from public.client_service_agreements where id='77777777-7777-4777-8777-777777777788'),date '2026-10-04','legacy launch uses launch date as billing start');

reset role;
select * from finish();
rollback;
