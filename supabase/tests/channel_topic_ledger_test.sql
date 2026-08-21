begin;

select plan(25);

select has_table('public', 'channel_topics', 'channel topic vocabulary exists');
select has_table('public', 'topic_coverage', 'topic coverage evidence exists');
select has_table('public', 'topic_proposals', 'topic proposal queue exists');
select has_view('public', 'topic_performance', 'topic performance projection exists');
select has_function('public', 'render_channel_topic_ledger', array['uuid', 'text'], 'ledger renderer exists');
select hasnt_policy('public', 'topic_coverage', 'workspace_members_can_update_topic_coverage', 'coverage has no update policy');
select hasnt_policy('public', 'topic_coverage', 'workspace_members_can_delete_topic_coverage', 'coverage has no delete policy');
select table_privs_are('authenticated', 'public', 'topic_coverage', array['SELECT', 'INSERT'], 'authenticated coverage grants are append-only');
select table_privs_are('authenticated', 'public', 'topic_proposals', array['SELECT', 'INSERT', 'UPDATE'], 'authenticated proposals are mutable');
select table_privs_are('authenticated', 'public', 'channel_topics', array['SELECT', 'INSERT', 'UPDATE'], 'authenticated topic vocabulary grants are explicit');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'topic-ledger-a@example.test', 'not-used', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'topic-ledger-b@example.test', 'not-used', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.workspaces (id, name, slug, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Topic Ledger A', 'topic-ledger-a', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Topic Ledger B', 'topic-ledger-b', '22222222-2222-2222-2222-222222222222');

insert into public.workspace_members (workspace_id, user_id, role, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'owner', '22222222-2222-2222-2222-222222222222');

insert into public.channels (id, workspace_id, name, slug, created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Topic Ledger A', 'topic-ledger-a', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Topic Ledger B', 'topic-ledger-b', '22222222-2222-2222-2222-222222222222');

insert into public.channel_topics (id, workspace_id, channel_id, locale, topic, slug, created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'en', 'Conversion strategy', 'conversion-strategy', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'en', 'No coverage yet', 'no-coverage-yet', '11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$insert into public.channel_topics (workspace_id, channel_id, locale, topic, slug, created_by) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-0000-0000-0000-000000000001', 'en', 'Conversion strategy', 'conversion-strategy', '22222222-2222-2222-2222-222222222222')$$,
  'channel topic slug is not global'
);
select throws_ok(
  $$insert into public.channel_topics (workspace_id, channel_id, locale, topic, slug, created_by) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'es', 'Duplicate channel slug', 'conversion-strategy', '11111111-1111-1111-1111-111111111111')$$,
  '23505', null, 'channel topic slug is unique within a channel'
);

insert into public.published_posts (id, workspace_id, channel_id, platform, published_at, source, outcome_score) values
  ('aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'instagram', now(), 'manual', 'worked'),
  ('aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'instagram', now(), 'manual', 'flat'),
  ('aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'instagram', now(), 'manual', 'flopped');

insert into public.topic_coverage (workspace_id, channel_id, channel_topic_id, published_post_id, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000010', null, '11111111-1111-1111-1111-111111111111');

select is((select coverage_count from public.topic_performance where channel_topic_id = 'aaaaaaaa-0000-0000-0000-000000000010'), 4::bigint, 'performance includes coverage without a post');
select is((select worked_count from public.topic_performance where channel_topic_id = 'aaaaaaaa-0000-0000-0000-000000000010'), 1::bigint, 'performance counts worked outcomes');
select is((select flat_count from public.topic_performance where channel_topic_id = 'aaaaaaaa-0000-0000-0000-000000000010'), 1::bigint, 'performance counts flat outcomes');
select is((select flopped_count from public.topic_performance where channel_topic_id = 'aaaaaaaa-0000-0000-0000-000000000010'), 1::bigint, 'performance counts flopped outcomes');
select is((select coverage_count from public.topic_performance where channel_topic_id = 'aaaaaaaa-0000-0000-0000-000000000011'), 0::bigint, 'performance includes topics with zero coverage');

insert into public.topic_proposals (workspace_id, channel_id, channel_topic_id, locale, topic, status, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000010', 'en', 'Practical conversion audit', 'proposed', '11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$update public.topic_proposals set status = 'approved' where topic = 'Practical conversion audit'$$,
  '23514', null, 'approved proposals require decision attribution'
);
select throws_ok(
  $$insert into public.topic_proposals (workspace_id, channel_id, locale, topic, status, decided_by, decided_at, created_by) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-0000-0000-000000000001', 'en', 'Consumed without variant', 'consumed', '11111111-1111-1111-1111-111111111111', now(), '11111111-1111-1111-1111-111111111111')$$,
  '23514', null, 'consumed proposals require a consumed variant'
);
select like(public.render_channel_topic_ledger('aaaaaaaa-0000-0000-0000-000000000001', 'en'), '%Conversion strategy%', 'renderer includes coverage topics');
select like(public.render_channel_topic_ledger('aaaaaaaa-0000-0000-0000-000000000001', 'en'), '%Practical conversion audit%', 'renderer includes queued proposals');
select like(public.render_channel_topic_ledger('bbbbbbbb-0000-0000-0000-000000000001', 'en'), '%No topic coverage recorded%', 'renderer handles an empty channel');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select is_empty($$select 1 from public.channel_topics where workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$, 'workspace A cannot read workspace B topics');
select is_empty($$select 1 from public.topic_coverage where workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$, 'workspace A cannot read workspace B coverage');
select is_empty($$select 1 from public.topic_proposals where workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$, 'workspace A cannot read workspace B proposals');
reset role;

select * from finish();
rollback;
