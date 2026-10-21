begin;
select plan(25);
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

create function pg_temp.lifecycle_insert(kind text, choice text default 'act', tweak text default '', actor uuid default '11111111-1111-4111-8111-111111111111', review_id uuid default gen_random_uuid()) returns void
language plpgsql security invoker as $fn$
declare rowdata jsonb; subject jsonb; inputs jsonb; snapshot jsonb; output jsonb; decision uuid;
begin
 if kind='lead' then select to_jsonb(l) into rowdata from public.leads l where id='88888888-8888-4888-8888-888888888888';
 else select to_jsonb(a) into rowdata from public.client_service_agreements a where id='99999999-9999-4999-8999-999999999999';end if;
 subject:=jsonb_build_object('type',kind,'id',rowdata->>'id','workspace_id',rowdata->>'workspace_id');
 if tweak='source' then rowdata:=jsonb_set(rowdata,'{id}','"mismatch"');end if;
 if tweak='workspace' then rowdata:=jsonb_set(rowdata,'{workspace_id}','"other"');end if;
 if tweak='offer' then
  if kind='lead' then rowdata:=jsonb_set(rowdata,'{source}','"unrelated"');
  else rowdata:=jsonb_set(rowdata,'{product_name}','"Other offer"');end if;
 end if;
 inputs:=jsonb_build_object('workspaceId','44444444-4444-4444-8444-444444444444','now','2026-10-21T18:00:00Z','available',true,case when kind='lead' then 'lead' else 'agreement' end,rowdata);
 output:=jsonb_build_object('evaluator','lifecycle','policy_version','lifecycle-v1','subject',subject,'stage','prospect','verdict','do','evaluated_at','2026-10-21T18:00:00Z','business_date','2026-10-21','time_zone','America/Chicago','why',jsonb_build_array(jsonb_build_object('claim','Synthetic recorded source','source',rowdata)));
 snapshot:=jsonb_build_object('subject',subject,'inputs',inputs,'evaluated_at','2026-10-21T18:00:00Z','business_date','2026-10-21','time_zone','America/Chicago');
 if tweak='clock' then snapshot:=jsonb_set(snapshot,'{inputs,now}','"different"');end if;
 if tweak='subject' then snapshot:=jsonb_set(snapshot,'{subject,id}','"different"');end if;
 if tweak='decision' then decision:='55555555-5555-4555-8555-555555555555';end if;
 insert into public.laya_evaluations(id,workspace_id,decision_id,evaluator,policy_version,input_snapshot,evaluation,response,reason,created_by)
 values(review_id,'44444444-4444-4444-8444-444444444444',decision,'lifecycle','lifecycle-v1',snapshot,output,choice,'Synthetic exact lifecycle review',actor);
end;$fn$;
set local role service_role;
select lives_ok($q$select pg_temp.lifecycle_insert('lead','act','','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$q$,'server appends owner lifecycle Act');
select lives_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','dismiss','','11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')$q$,'server appends owner lifecycle Dismiss');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$q$,'23505',null,'review cannot duplicate');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','','22222222-2222-4222-8222-222222222222')$q$,'42501',null,'nonowner cannot be response actor');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','source')$q$,'23514',null,'lead rejects source mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','workspace')$q$,'23514',null,'lead rejects workspace mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','offer')$q$,'23514',null,'lead rejects offer mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','clock')$q$,'23514',null,'lead rejects clock mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','subject')$q$,'23514',null,'lead rejects subject mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','act','decision')$q$,'23514',null,'lead rejects decision mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','act','source')$q$,'23514',null,'client_service_agreement rejects source mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','act','workspace')$q$,'23514',null,'client_service_agreement rejects workspace mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','act','offer')$q$,'23514',null,'client_service_agreement rejects offer mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','act','clock')$q$,'23514',null,'client_service_agreement rejects clock mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','act','subject')$q$,'23514',null,'client_service_agreement rejects subject mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('client_service_agreement','act','decision')$q$,'23514',null,'client_service_agreement rejects decision mismatch');
select throws_ok($q$select pg_temp.lifecycle_insert('lead','activate')$q$,'23514',null,'response is not activation');
select throws_ok($q$update public.laya_evaluations set reason='overwrite' where evaluator='lifecycle'$q$,'42501',null,'lifecycle evidence immutable');
select throws_ok($q$delete from public.laya_evaluations where evaluator='lifecycle'$q$,'42501',null,'lifecycle evidence cannot be deleted');
reset role;
update public.leads set name='Later changed' where id='88888888-8888-4888-8888-888888888888';
select is((select input_snapshot->'inputs'->'lead'->>'name' from public.laya_evaluations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'Synthetic lead','saved exact source survives later edits');
select results_eq($q$select subject_type from public.laya_evaluations where evaluator='lifecycle' order by id$q$,$q$select 'lead'::text union all select 'client_service_agreement'::text$q$,'derived lifecycle metadata identifies exact subjects');
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select is((select count(*)::int from public.laya_evaluations where evaluator='lifecycle'),2,'owner reads lifecycle history');
select throws_ok($q$select pg_temp.lifecycle_insert('lead')$q$,'42501',null,'owner browser cannot forge evaluations');
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select is((select count(*)::int from public.laya_evaluations where evaluator='lifecycle'),0,'member cannot read lifecycle history');
reset role;
select is((select status from public.business_decisions where id='55555555-5555-4555-8555-555555555555'),'proposed','lifecycle responses never activate decisions');
select * from finish();
rollback;
