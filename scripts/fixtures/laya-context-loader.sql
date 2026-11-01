-- Synthetic local data only; guarded against running on any other database.
do $$ begin if current_database() <> 'laya_verify' then raise exception 'Disposable database only'; end if; end $$;
insert into auth.users(id,email) values ('11111111-1111-4111-8111-111111111111','loader-owner@example.test');
insert into public.workspaces(id,name,slug,created_by) values ('44444444-4444-4444-8444-444444444444','Combined loader fixture','loader-fixture','11111111-1111-4111-8111-111111111111');
insert into public.workspace_members(workspace_id,user_id,role,status,created_by) values ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','owner','active','11111111-1111-4111-8111-111111111111');
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
insert into public.company_profiles(workspace_id,source_note,objective) values ('44444444-4444-4444-8444-444444444444','Synthetic','Verify coexistence');
insert into public.company_state_snapshots(workspace_id,source_note,observed_at,valid_until,financial) values ('44444444-4444-4444-8444-444444444444','Synthetic',now()-interval '1 minute',now()+interval '1 day','{"cash_cents":0,"revenue_cents":null}');
insert into public.company_units(workspace_id,unit_key,name,source_note) values ('44444444-4444-4444-8444-444444444444','media','Synthetic media','Proposal');
insert into public.business_decisions(id,workspace_id,title,decision,created_by) values ('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','Synthetic','Test only','11111111-1111-4111-8111-111111111111');
insert into public.company_decision_contexts(id,workspace_id,decision_id,source_note) values ('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555','Synthetic');
insert into public.company_outcomes(workspace_id,decision_context_id,source_note,lesson,recommendation) values ('44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666','Synthetic','Observe test','observe');
reset role;
set role service_role;
insert into public.laya_move_choices(id,workspace_id,created_by,card_id,title,action,source_version,recommendation,evaluation) values ('77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','card','Synthetic','do','v1','{}','{}');
reset role;
