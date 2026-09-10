begin;

select plan(7);

select has_column('public', 'marketing_publish_attempts', 'asset_id', 'M5 asset identity is durable');
select has_column('public', 'marketing_publish_attempts', 'marketing_slot_key', 'M5 weekly slot identity is durable');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '66666666-6666-6666-6666-666666666666',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'marketing-m5-owner@example.test', 'not-used',
  now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.workspaces (id, name, slug, created_by) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Marketing M5 Test Workspace', 'marketing-m5-test-workspace', '66666666-6666-6666-6666-666666666666');

select lives_ok(
  $$insert into public.marketing_publish_attempts (workspace_id, created_by, reference_key, caption, destination) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-6666-6666-6666-666666666666', 'cws-marketing-m4-history:66666666-6666-4666-8666-666666666666', 'Historical M4 evidence.', 'multi:cicero-web-studio')$$,
  'historical M2/M3/M4 attempts remain valid without M5 fields'
);
select lives_ok(
  $$insert into public.marketing_publish_attempts (id, workspace_id, created_by, reference_key, caption, asset_path, asset_id, destination, marketing_slot_key) values ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-6666-6666-6666-666666666666', 'cws-marketing-m5:66666666-6666-4666-8666-666666666666', 'Prepared M5 Post A.', '/images/logo.png', 'cws-brand-introduction', 'multi:cicero-web-studio', '2026-09-08:post-a')$$,
  'an M5 publish attempt retains one asset and one weekly slot'
);
select throws_ok(
  $$insert into public.marketing_publish_attempts (workspace_id, created_by, reference_key, caption, asset_path, asset_id, destination, marketing_slot_key) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-6666-6666-6666-666666666666', 'cws-marketing-m5:duplicate-slot', 'Duplicate M5 Post A.', '/images/logo.png', 'cws-brand-introduction', 'multi:cicero-web-studio', '2026-09-08:post-a')$$,
  '23505', null, 'one workspace has only one durable attempt for a weekly slot'
);
select throws_ok(
  $$update public.marketing_publish_attempts set asset_id = 'changed' where id = 'eeeeeeee-0000-0000-0000-000000000001'$$,
  'P0001', 'marketing publish attempt identity fields are immutable', 'the selected M5 asset cannot be changed after confirmation'
);
select lives_ok(
  $$update public.marketing_publish_attempts set provider_status = 'processing' where id = 'eeeeeeee-0000-0000-0000-000000000001'$$,
  'provider result reconciliation remains mutable after confirmation'
);

select * from finish();
rollback;
