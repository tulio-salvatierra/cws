begin;
select plan(22);
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','laya-owner@example.test'),
 ('22222222-2222-4222-8222-222222222222','laya-member@example.test'),
 ('33333333-3333-4333-8333-333333333333','laya-outsider@example.test');
insert into public.workspaces(id,name,slug,created_by) values
 ('44444444-4444-4444-8444-444444444444','Laya test','laya-response-test','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111'),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','member','active','11111111-1111-4111-8111-111111111111');
insert into public.business_decisions(id,workspace_id,title,decision,created_by) values
 ('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','Synthetic proposal','Synthetic terms','11111111-1111-4111-8111-111111111111');
insert into public.leads(id,workspace_id,name,source,email,created_by) values('88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','Synthetic lead','negocio-listo|test','synthetic@example.test','11111111-1111-4111-8111-111111111111');
insert into public.clients(id,workspace_id,name,created_by) values('99999999-9999-4999-8999-999999999998','44444444-4444-4444-8444-444444444444','Synthetic client','11111111-1111-4111-8111-111111111111');
insert into public.client_service_agreements(id,workspace_id,client_id,product_name,setup_cents,monthly_cents,term_months,created_by) values('99999999-9999-4999-8999-999999999999','44444444-4444-4444-8444-444444444444','99999999-9999-4999-8999-999999999998','Negocio Listo Básico',30000,10000,12,'11111111-1111-4111-8111-111111111111');


insert into public.operations_projects(id,workspace_id,client_id,name,project_type,status,created_by) values('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','99999999-9999-4999-8999-999999999998','Synthetic project','website_build','setup','11111111-1111-4111-8111-111111111111');
insert into public.financial_obligations(id,workspace_id,client_id,description,amount_cents,obligation_type,created_by) values('77777777-7777-4777-8777-777777777771','44444444-4444-4444-8444-444444444444','99999999-9999-4999-8999-999999999998','Synthetic due',10000,'service','11111111-1111-4111-8111-111111111111');
insert into public.recurring_revenue(id,workspace_id,client_id,description,amount_cents,provider,started_at,created_by) values('77777777-7777-4777-8777-777777777772','44444444-4444-4444-8444-444444444444','99999999-9999-4999-8999-999999999998','Synthetic recurring',10000,'manual','2026-10-01','11111111-1111-4111-8111-111111111111');
insert into public.compliance_requirements(id,workspace_id,title,category,authority_name,description,created_by) values('77777777-7777-4777-8777-777777777773','44444444-4444-4444-8444-444444444444','Synthetic requirement','other','Recorded authority','Synthetic review','11111111-1111-4111-8111-111111111111');
create function pg_temp.priority_insert(kind text,choice text default 'act',tweak text default '',actor uuid default '11111111-1111-4111-8111-111111111111', review_id uuid default gen_random_uuid()) returns void language plpgsql as $fn$
declare principal jsonb:='null'; sources jsonb:='[]'; a jsonb; subject jsonb; inputs jsonb; output jsonb; snapshot jsonb; r jsonb; t text; decision uuid;
begin
 if kind='sales_command' then select to_jsonb(l) into r from public.leads l where id='88888888-8888-4888-8888-888888888888';t:='leads';a:=jsonb_build_object('id','sales:inbound:'||(r->>'id'),'lead_id',r->>'id');
 elsif kind='operations_delivery' then select to_jsonb(p) into r from public.operations_projects p where id='66666666-6666-4666-8666-666666666666';t:='operations_projects';a:=jsonb_build_object('id','operations:'||(r->>'id'),'project_id',r->>'id');
 elsif kind='accounting_financial' then select to_jsonb(p) into r from public.financial_obligations p where id='77777777-7777-4777-8777-777777777771';t:='financial_obligations';a:=jsonb_build_object('id','accounting:financial_obligation:'||(r->>'id'));
 elsif kind='recurring' then select to_jsonb(p) into r from public.recurring_revenue p where id='77777777-7777-4777-8777-777777777772';t:='recurring_revenue';kind:='accounting_financial';a:=jsonb_build_object('id','accounting:recurring_revenue:'||(r->>'id'));
 elsif kind='compliance_requirement' then select to_jsonb(p) into r from public.compliance_requirements p where id='77777777-7777-4777-8777-777777777773';t:='compliance_requirements';a:=jsonb_build_object('id','compliance:'||(r->>'id'));
 elsif kind='fallback' then a:=jsonb_build_object('id','sales:fallback:find-next-customer');
 else a:=jsonb_build_object('id','marketing:ready:2026-10-19:post-b');end if;
 a:=a||jsonb_build_object('source_type',kind,'human_action','Synthetic exact priority');
 if t is not null then
  if tweak='workspace' then r:=jsonb_set(r,'{workspace_id}','"foreign"');end if;
  principal:=jsonb_build_object('table',t,'row',r);sources:=jsonb_build_array(principal);
 end if;
 subject:=jsonb_build_object('type','ceo_priority','id',a->>'id','workspace_id','44444444-4444-4444-8444-444444444444');
 inputs:=jsonb_build_object('workspaceId','44444444-4444-4444-8444-444444444444','now','2026-10-22T17:00:00Z','action',a,'principal',principal,'sources',sources,'availability',jsonb_build_object('read',true));
 output:=jsonb_build_object('evaluator','priority_review','policy_version','priority-review-v1','subject',subject,'verdict','needs_data','evaluated_at','2026-10-22T17:00:00Z','business_date','2026-10-22','time_zone','America/Chicago');
 snapshot:=jsonb_build_object('subject',subject,'inputs',inputs,'evaluated_at','2026-10-22T17:00:00Z','business_date','2026-10-22','time_zone','America/Chicago');
 if tweak='clock' then snapshot:=jsonb_set(snapshot,'{inputs,now}','"wrong"');end if;
 if tweak='subject' then snapshot:=jsonb_set(snapshot,'{subject,id}','"wrong"');end if;
 if tweak='source_type' then snapshot:=jsonb_set(snapshot,'{inputs,action,source_type}','"unrelated"');end if;
 if tweak='missing_principal' then snapshot:=jsonb_set(snapshot,'{inputs,principal}','null');end if;
 if tweak='unlisted_principal' then snapshot:=jsonb_set(snapshot,'{inputs,sources}','[]');end if;
 if tweak='decision' then decision:='55555555-5555-4555-8555-555555555555';end if;
 insert into public.laya_evaluations(id,workspace_id,decision_id,evaluator,policy_version,input_snapshot,evaluation,response,reason,created_by) values(review_id,'44444444-4444-4444-8444-444444444444',decision,'priority_review','priority-review-v1',snapshot,output,choice,'Synthetic exact reason',actor);
end;$fn$;
set local role service_role;
select lives_ok($q$select pg_temp.priority_insert('sales_command','act','','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$q$,'owner Sales Act appended');
select lives_ok($q$select pg_temp.priority_insert('operations_delivery','dismiss')$q$,'owner Operations Dismiss appended');
select lives_ok($q$select pg_temp.priority_insert('accounting_financial')$q$,'obligation source appended');
select lives_ok($q$select pg_temp.priority_insert('recurring')$q$,'recurring source appended');
select lives_ok($q$select pg_temp.priority_insert('compliance_requirement')$q$,'compliance source appended');
select lives_ok($q$select pg_temp.priority_insert('marketing_ready')$q$,'derived Marketing source appended');
select lives_ok($q$select pg_temp.priority_insert('fallback')$q$,'fallback needs-data review appended');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$q$,'23505',null,'duplicate review rejected');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','','22222222-2222-4222-8222-222222222222')$q$,'42501',null,'member actor rejected');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','workspace')$q$,'23514',null,'reject workspace mismatch');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','clock')$q$,'23514',null,'reject clock mismatch');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','subject')$q$,'23514',null,'reject subject mismatch');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','source_type')$q$,'23514',null,'reject source_type mismatch');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','missing_principal')$q$,'23514',null,'reject missing_principal mismatch');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','unlisted_principal')$q$,'23514',null,'reject unlisted_principal mismatch');
select throws_ok($q$select pg_temp.priority_insert('sales_command','act','decision')$q$,'23514',null,'reject decision mismatch');
select throws_ok($q$update public.laya_evaluations set reason='rewrite' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$q$,'42501',null,'history immutable');
select throws_ok($q$delete from public.laya_evaluations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$q$,'42501',null,'history undeletable');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select is((select count(*)::int from public.laya_evaluations where workspace_id='44444444-4444-4444-8444-444444444444'),7,'owner reads saved priorities');
select throws_ok($q$select pg_temp.priority_insert('sales_command')$q$,'42501',null,'browser cannot append arbitrary evaluations');
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select is((select count(*)::int from public.laya_evaluations where workspace_id='44444444-4444-4444-8444-444444444444'),0,'member cannot read history');
set local request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
select is((select count(*)::int from public.laya_evaluations where workspace_id='44444444-4444-4444-8444-444444444444'),0,'outsider cannot read history');
reset role;
select * from finish();
rollback;
