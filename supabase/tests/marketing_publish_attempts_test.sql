begin;

select plan(8);

select has_table('public', 'marketing_publish_attempts', 'marketing publish attempts table exists');
select hasnt_policy('public', 'marketing_publish_attempts', 'authenticated_can_read_marketing_publish_attempts', 'browser users have no direct marketing-attempt policy');
select table_privs_are('anon', 'public', 'marketing_publish_attempts', array[]::text[], 'anon has no marketing-attempt table grant');
select table_privs_are('authenticated', 'public', 'marketing_publish_attempts', array[]::text[], 'authenticated has no direct marketing-attempt table grant');
select table_privs_are('service_role', 'public', 'marketing_publish_attempts', array['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'only the server service role can manage attempts');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'marketing-owner@example.test', 'not-used',
  now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.workspaces (id, name, slug, created_by) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Marketing Test Workspace', 'marketing-test-workspace', '44444444-4444-4444-4444-444444444444');

insert into public.marketing_publish_attempts (
  id, workspace_id, created_by, reference_key, caption
) values (
  'cccccccc-0000-0000-0000-000000000001',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '44444444-4444-4444-4444-444444444444',
  'cws-marketing-linkedin:44444444-4444-4444-8444-444444444444',
  'A controlled test caption.'
);

select throws_ok(
  $$update public.marketing_publish_attempts set reference_key = 'changed' where id = 'cccccccc-0000-0000-0000-000000000001'$$,
  'P0001', 'marketing publish attempt identity fields are immutable', 'reference key is immutable after intent creation'
);
select lives_ok(
  $$update public.marketing_publish_attempts set provider_status = 'processing', provider_post_id = 'bundle-post-1' where id = 'cccccccc-0000-0000-0000-000000000001'$$,
  'provider result fields can progress after intent creation'
);
select throws_ok(
  $$insert into public.marketing_publish_attempts (workspace_id, created_by, reference_key, caption) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'cws-marketing-linkedin:44444444-4444-4444-8444-444444444444', 'Duplicate')$$,
  '23505', null, 'reference keys prevent duplicate publish intents'
);

select * from finish();
rollback;
