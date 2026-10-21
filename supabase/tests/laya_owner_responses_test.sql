begin;
select plan(17);
select has_table('public','laya_evaluations','response evidence table exists');
select table_privs_are('public','laya_evaluations','anon',array[]::text[],'anonymous has no grants');
select table_privs_are('public','laya_evaluations','authenticated',array['SELECT'],'browser cannot forge response evidence');
select table_privs_are('public','laya_evaluations','service_role',array['INSERT','SELECT'],'server can only append/read');
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
-- This temp helper only supplies deterministic synthetic evidence to assertions.
create function pg_temp.laya_test_insert(actor uuid, review_id uuid, choice text, rationale text, subject_id uuid) returns void
language sql security invoker as $$
 insert into public.laya_evaluations(id,workspace_id,decision_id,evaluator,policy_version,input_snapshot,evaluation,response,reason,created_by)
 select review_id,d.workspace_id,d.id,'decision_review','decision-review-v1',
 jsonb_build_object('decision',to_jsonb(d),'evaluated_at','2026-10-21T18:00:00Z'),
 jsonb_build_object('evaluator','decision_review','policy_version','decision-review-v1','verdict','needs_data','evaluated_at','2026-10-21T18:00:00Z','subject',jsonb_build_object('id',subject_id,'workspace_id',d.workspace_id)),
 choice,rationale,actor from public.business_decisions d where id='55555555-5555-4555-8555-555555555555';
$$;
set local role service_role;
select lives_ok($q$select pg_temp.laya_test_insert('11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666','act','Synthetic owner response','55555555-5555-4555-8555-555555555555')$q$,'server appends an owner response');
select throws_ok($q$select pg_temp.laya_test_insert('11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666','act','Synthetic owner response','55555555-5555-4555-8555-555555555555')$q$,'23505',null,'review ID prevents duplicate rows');
select throws_ok($q$select pg_temp.laya_test_insert('22222222-2222-4222-8222-222222222222','77777777-7777-4777-8777-777777777777','dismiss','Member response','55555555-5555-4555-8555-555555555555')$q$,'42501',null,'member cannot be response actor');
select throws_ok($q$select pg_temp.laya_test_insert('11111111-1111-4111-8111-111111111111','77777777-7777-4777-8777-777777777777','dismiss','Wrong subject','88888888-8888-4888-8888-888888888888')$q$,'23514',null,'source and evaluation subject must agree');
select throws_ok($q$select pg_temp.laya_test_insert('11111111-1111-4111-8111-111111111111','77777777-7777-4777-8777-777777777777','dismiss','','55555555-5555-4555-8555-555555555555')$q$,'23514',null,'reason is required');
select throws_ok($q$select pg_temp.laya_test_insert('11111111-1111-4111-8111-111111111111','77777777-7777-4777-8777-777777777777','activate','Bad action','55555555-5555-4555-8555-555555555555')$q$,'23514',null,'activation is not a Laya response');
select throws_ok($q$update public.laya_evaluations set reason='Rewritten'$q$,'42501',null,'server cannot rewrite history');
select throws_ok($q$delete from public.laya_evaluations$q$,'42501',null,'server cannot delete history');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select is((select count(*)::int from public.laya_evaluations where workspace_id='44444444-4444-4444-8444-444444444444'),1,'owner reads saved history');
select throws_ok($q$select pg_temp.laya_test_insert('11111111-1111-4111-8111-111111111111','77777777-7777-4777-8777-777777777777','act','Forged browser payload','55555555-5555-4555-8555-555555555555')$q$,'42501',null,'owner browser cannot forge evaluation insert');
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select is((select count(*)::int from public.laya_evaluations where workspace_id='44444444-4444-4444-8444-444444444444'),0,'member cannot read owner responses');
set local request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
select is((select count(*)::int from public.laya_evaluations where workspace_id='44444444-4444-4444-8444-444444444444'),0,'outsider cannot read responses');
reset role;
select results_eq($q$select input_snapshot->'decision'->>'status',response,reason from public.laya_evaluations where id='66666666-6666-4666-8666-666666666666'$q$,$q$values('proposed','act','Synthetic owner response')$q$,'exact snapshot and response retained without activating');
select * from finish();
rollback;
