begin;

select plan(11);

select has_table('public', 'marketing_slot_resolutions', 'M6 missed-slot resolution table exists');
select has_column('public', 'marketing_slot_resolutions', 'occurrence_slot_key', 'original occurrence is durable');
select has_column('public', 'marketing_slot_resolutions', 'target_slot_key', 'move target is durable');
select has_column('public', 'marketing_slot_resolutions', 'caption', 'edited caption is durable');
select hasnt_policy('public', 'marketing_slot_resolutions', 'authenticated_can_read_marketing_slot_resolutions', 'browser users have no direct missed-slot policy');
select table_privs_are('anon', 'public', 'marketing_slot_resolutions', array[]::text[], 'anon has no missed-slot decision grant');
select table_privs_are('authenticated', 'public', 'marketing_slot_resolutions', array[]::text[], 'authenticated has no missed-slot decision grant');
select table_privs_are('service_role', 'public', 'marketing_slot_resolutions', array['SELECT', 'INSERT'], 'only the server service role can read or record decisions');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '77777777-7777-7777-7777-777777777777',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'marketing-m6-owner@example.test', 'not-used',
  now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.workspaces (id, name, slug, created_by) values
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Marketing M6 Test Workspace', 'marketing-m6-test-workspace', '77777777-7777-7777-7777-777777777777');

select lives_ok(
  $$insert into public.marketing_slot_resolutions (workspace_id, occurrence_slot_key, origin_slot_key, action, target_slot_key, asset_id, asset_path, caption, created_by) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '2026-09-08:post-a', '2026-09-08:post-a', 'move', '2026-09-11:post-b', 'website-launch', '/images/en-launch.png', 'Keep this edited caption.', '77777777-7777-7777-7777-777777777777')$$,
  'a move records its original occurrence, target, asset, and caption'
);
select lives_ok(
  $$insert into public.marketing_slot_resolutions (workspace_id, occurrence_slot_key, origin_slot_key, action, asset_id, asset_path, caption, created_by) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '2026-09-11:post-b', '2026-09-11:post-b', 'skip', 'bilingual-website', '/images/en-bilingual.png', 'Skip this occurrence only.', '77777777-7777-7777-7777-777777777777')$$,
  'a skip records only its occurrence without a target'
);
select throws_ok(
  $$insert into public.marketing_slot_resolutions (workspace_id, occurrence_slot_key, origin_slot_key, action, target_slot_key, asset_id, asset_path, caption, created_by) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '2026-09-08:post-a', '2026-09-08:post-a', 'move', '2026-09-15:post-a', 'website-launch', '/images/en-launch.png', 'A second decision.', '77777777-7777-7777-7777-777777777777')$$,
  '23505', null, 'one original occurrence cannot receive more than one owner decision'
);

select * from finish();
rollback;
