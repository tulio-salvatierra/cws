begin;

select plan(22);

select has_column('public', 'learnings', 'status', 'learnings have a lifecycle status');
select has_column('public', 'learnings', 'trigger', 'learnings retain the trigger');
select has_column('public', 'learnings', 'evidence', 'learnings retain evidence');
select has_column('public', 'learnings', 'action', 'learnings retain an action');
select has_column('public', 'learnings', 'exceptions', 'learnings retain exceptions');
select has_column('public', 'learnings', 'last_verified', 'learnings retain their verification date');
select has_column('public', 'learnings', 'scope', 'learnings retain their scope');
select has_column('public', 'decisions', 'observed_outcome', 'decisions retain their observed outcome');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'abababab-abab-abab-abab-abababababab',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'marketing-writeback-owner@example.test', 'not-used',
  now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.workspaces (id, name, slug, created_by) values
  ('abababab-0000-0000-0000-000000000001', 'Marketing Write-back Test Workspace', 'marketing-writeback-test-workspace', 'abababab-abab-abab-abab-abababababab');

insert into public.channels (id, workspace_id, name, slug, created_by) values
  ('abababab-0000-0000-0000-000000000002', 'abababab-0000-0000-0000-000000000001', 'Cicero Web Studio', 'cicero-web-studio', 'abababab-abab-abab-abab-abababababab');

insert into public.marketing_publish_attempts (
  id, workspace_id, created_by, reference_key, caption, destination
) values (
  'abababab-0000-0000-0000-000000000003',
  'abababab-0000-0000-0000-000000000001',
  'abababab-abab-abab-abab-abababababab',
  'cws-marketing-linkedin:abababab-abab-4bab-8bab-abababababab',
  'A legacy LinkedIn post.',
  'linkedin:cicero-web-studio'
);

select lives_ok(
  $$update public.marketing_publish_attempts set provider_status = 'posted', provider_post_id = 'legacy-linkedin-post', provider_permalink = 'https://www.linkedin.com/posts/legacy-linkedin-post' where id = 'abababab-0000-0000-0000-000000000003'$$,
  'a posted legacy LinkedIn attempt writes back a published post'
);
select results_eq(
  $$select platform::text, external_post_id, external_url, source, channel_id from public.published_posts where workspace_id = 'abababab-0000-0000-0000-000000000001' order by external_post_id$$,
  $$values ('linkedin', 'legacy-linkedin-post', 'https://www.linkedin.com/posts/legacy-linkedin-post', 'cws-os', 'abababab-0000-0000-0000-000000000002'::uuid)$$,
  'legacy write-back retains the platform post identity and CWS channel'
);
select lives_ok(
  $$update public.marketing_publish_attempts set provider_permalink = 'https://www.linkedin.com/posts/legacy-linkedin-post' where id = 'abababab-0000-0000-0000-000000000003'$$,
  'a repeated posted legacy update is safe'
);
select is(
  (select count(*) from public.published_posts where workspace_id = 'abababab-0000-0000-0000-000000000001' and platform = 'linkedin'),
  1::bigint,
  'the legacy write-back is idempotent'
);

insert into public.marketing_publish_attempts (
  id, workspace_id, created_by, reference_key, caption, destination
) values (
  'abababab-0000-0000-0000-000000000004',
  'abababab-0000-0000-0000-000000000001',
  'abababab-abab-abab-abab-abababababab',
  'cws-marketing-m4:abababab-abab-4bab-8bab-abababababab',
  'A multi-destination post.',
  'multi:cicero-web-studio'
);

insert into public.marketing_publish_destination_results (attempt_id, platform, provider_identity)
values ('abababab-0000-0000-0000-000000000004', 'FACEBOOK', '{}'::jsonb);

select lives_ok(
  $$update public.marketing_publish_destination_results set provider_status = 'posted', provider_post_id = 'facebook-post', provider_permalink = 'https://www.facebook.com/facebook-post' where attempt_id = 'abababab-0000-0000-0000-000000000004' and platform = 'FACEBOOK'$$,
  'a posted destination result writes back its platform post'
);
select results_eq(
  $$select platform::text, external_post_id, external_url, source from public.published_posts where workspace_id = 'abababab-0000-0000-0000-000000000001' and platform = 'facebook'$$,
  $$values ('facebook', 'facebook-post', 'https://www.facebook.com/facebook-post', 'cws-os')$$,
  'destination write-back uses the provider platform identity'
);
select lives_ok(
  $$update public.marketing_publish_destination_results set provider_permalink = 'https://www.facebook.com/facebook-post' where attempt_id = 'abababab-0000-0000-0000-000000000004' and platform = 'FACEBOOK'$$,
  'a repeated posted destination update is safe'
);
select is(
  (select count(*) from public.published_posts where workspace_id = 'abababab-0000-0000-0000-000000000001' and platform = 'facebook'),
  1::bigint,
  'the destination write-back is idempotent'
);

insert into public.marketing_publish_destination_results (attempt_id, platform, provider_identity)
values ('abababab-0000-0000-0000-000000000004', 'INSTAGRAM', '{}'::jsonb);

select lives_ok(
  $$update public.marketing_publish_destination_results set provider_status = 'posted' where attempt_id = 'abababab-0000-0000-0000-000000000004' and platform = 'INSTAGRAM'$$,
  'a provider-confirmed destination without a social ID still has a durable write-back'
);
select is(
  (select external_post_id from public.published_posts where workspace_id = 'abababab-0000-0000-0000-000000000001' and platform = 'instagram'),
  'marketing-attempt:abababab-0000-0000-0000-000000000004:instagram',
  'the no-ID fallback is deterministic rather than duplicating records'
);

insert into public.learnings (id, workspace_id, title, body, created_by) values
  ('abababab-0000-0000-0000-000000000005', 'abababab-0000-0000-0000-000000000001', 'A test learning', 'Existing learning body remains intact.', 'abababab-abab-abab-abab-abababababab');
select is(
  (select status from public.learnings where id = 'abababab-0000-0000-0000-000000000005'),
  'provisional',
  'existing and new learnings receive the provisional default'
);
select lives_ok(
  $$update public.learnings set status = 'verified', trigger = 'A test trigger', evidence = 'A test evidence record', action = 'A test action', exceptions = 'None', last_verified = '2026-09-15', scope = 'CWS' where id = 'abababab-0000-0000-0000-000000000005'$$,
  'learning metadata is optional and supports verified learnings'
);
select throws_ok(
  $$update public.learnings set status = 'unsupported' where id = 'abababab-0000-0000-0000-000000000005'$$,
  '23514', null, 'the learning lifecycle rejects unsupported states'
);

insert into public.decisions (id, workspace_id, title, decision, created_by) values
  ('abababab-0000-0000-0000-000000000006', 'abababab-0000-0000-0000-000000000001', 'A test decision', 'Keep existing decision behavior.', 'abababab-abab-abab-abab-abababababab');
select lives_ok(
  $$update public.decisions set observed_outcome = 'Outcome observed without changing the established decision status.' where id = 'abababab-0000-0000-0000-000000000006'$$,
  'a decision can store an observed outcome without changing its status vocabulary'
);

select * from finish();
rollback;
