begin;

select plan(8);

select has_table('public', 'marketing_publish_destination_results', 'destination results table exists');
select hasnt_policy('public', 'marketing_publish_destination_results', 'authenticated_can_read_marketing_destination_results', 'browser users have no destination-result policy');
select table_privs_are('anon', 'public', 'marketing_publish_destination_results', array[]::text[], 'anon has no destination-result table grant');
select table_privs_are('authenticated', 'public', 'marketing_publish_destination_results', array[]::text[], 'authenticated has no destination-result table grant');
select table_privs_are('service_role', 'public', 'marketing_publish_destination_results', array['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'only the server service role can manage destination results');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'marketing-m4-owner@example.test', 'not-used',
  now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.workspaces (id, name, slug, created_by) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Marketing M4 Test Workspace', 'marketing-m4-test-workspace', '55555555-5555-5555-5555-555555555555');

insert into public.marketing_publish_attempts (
  id, workspace_id, created_by, reference_key, caption, destination
) values (
  'dddddddd-0000-0000-0000-000000000001',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '55555555-5555-5555-5555-555555555555',
  'cws-marketing-m4:55555555-5555-4555-8555-555555555555',
  'A controlled M4 test caption.',
  'multi:cicero-web-studio'
);

insert into public.marketing_publish_destination_results (attempt_id, platform, provider_identity)
values ('dddddddd-0000-0000-0000-000000000001', 'FACEBOOK', '{"displayName":"Cicero Web Studio"}'::jsonb);

select lives_ok(
  $$update public.marketing_publish_destination_results set provider_status = 'posted', provider_permalink = 'https://example.test/cws' where attempt_id = 'dddddddd-0000-0000-0000-000000000001' and platform = 'FACEBOOK'$$,
  'provider result fields can progress independently'
);
select throws_ok(
  $$update public.marketing_publish_destination_results set platform = 'INSTAGRAM' where attempt_id = 'dddddddd-0000-0000-0000-000000000001' and platform = 'FACEBOOK'$$,
  'P0001', 'marketing destination result identity fields are immutable', 'platform identity is immutable after preparation'
);
select throws_ok(
  $$insert into public.marketing_publish_destination_results (attempt_id, platform) values ('dddddddd-0000-0000-0000-000000000001', 'FACEBOOK')$$,
  '23505', null, 'one durable result exists per attempt and platform'
);

select * from finish();
rollback;
