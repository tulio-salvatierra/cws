begin;

select plan(18);

select has_column('public', 'business_decisions', 'observed_outcome', 'decisions retain their observed outcome');

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
select hasnt_column('public','published_posts','campaign_id','retired post campaign column is absent');
select hasnt_column('public','published_posts','content_variant_id','retired post variant column is absent');
select hasnt_column('public','outreach_sends','campaign_id','retired outreach campaign column is absent');
select hasnt_column('public','outreach_sends','approval_id','retired outreach approval column is absent');
select lives_ok($$update public.published_posts set outcome_score = 'worked' where external_post_id = 'legacy-linkedin-post' and workspace_id = 'abababab-0000-0000-0000-000000000001'$$,'outcome update works after column removal');
select throws_ok($$update public.published_posts set external_post_id = 'changed' where external_post_id = 'legacy-linkedin-post' and workspace_id = 'abababab-0000-0000-0000-000000000001'$$,'P0001','published post identity fields are immutable','remaining identity protection is preserved');
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

insert into public.business_decisions (id, workspace_id, title, decision, created_by) values
  ('abababab-0000-0000-0000-000000000006', 'abababab-0000-0000-0000-000000000001', 'A test decision', 'Keep existing decision behavior.', 'abababab-abab-abab-abab-abababababab');
insert into public.workspace_members (workspace_id,user_id,role,status,created_by) values
  ('abababab-0000-0000-0000-000000000001','abababab-abab-abab-abab-abababababab','owner','active','abababab-abab-abab-abab-abababababab');
set local request.jwt.claim.sub = 'abababab-abab-abab-abab-abababababab';
select lives_ok(
  $$update public.business_decisions set observed_outcome = 'Outcome observed without changing the established decision status.' where id = 'abababab-0000-0000-0000-000000000006'$$,
  'a decision can store an observed outcome without changing its status vocabulary'
);

select * from finish();
rollback;
