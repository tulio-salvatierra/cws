begin;
select plan(12);
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','combined-owner@example.test'),
 ('22222222-2222-4222-8222-222222222222','combined-member@example.test');
insert into public.workspaces(id,name,slug,created_by) values
 ('44444444-4444-4444-8444-444444444444','Combined test','combined-test','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111'),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','member','active','11111111-1111-4111-8111-111111111111');
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
insert into public.company_profiles(workspace_id,source_note,objective) values
 ('44444444-4444-4444-8444-444444444444','Synthetic','Verify coexistence');
select throws_ok($q$insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation) values ('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','card','Synthetic','do','v1','{}','{}')$q$,'42501',null,'owner browser cannot bypass signed Next Move API');
reset role;
set local role service_role;
select lives_ok($q$insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation) values ('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','card','Synthetic','do','v1','{}','{}')$q$,'server records owner Next Move');
select is((select objective from public.company_profiles where workspace_id='44444444-4444-4444-8444-444444444444'),'Verify coexistence','Next Move preserves profile');
select throws_ok($q$update public.company_profiles set objective='Mutated'$q$,'42501',null,'Next Move server cannot edit company context');
select throws_ok($q$update public.laya_move_choices set action='drop'$q$,'42501',null,'Next Move events immutable');
select throws_ok($q$insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation) values ('77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','card','Synthetic','do','v1','{}','{}')$q$,'42501',null,'server cannot record member choice');
reset role;
set local role authenticated;
select is((select count(*)::int from public.laya_move_choices),1,'owner sees own Next Move');
select is((select count(*)::int from public.company_profiles),1,'owner sees own World Model');
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select is((select count(*)::int from public.laya_move_choices),0,'member sees no Next Move');
select is((select count(*)::int from public.company_profiles),0,'member sees no World Model');
reset role;
set local role anon;
select throws_ok($q$select * from public.company_profiles$q$,'42501',null,'anonymous cannot read company context');
select throws_ok($q$select * from public.laya_move_choices$q$,'42501',null,'anonymous cannot read Next Move');
reset role;
select * from finish();
rollback;
