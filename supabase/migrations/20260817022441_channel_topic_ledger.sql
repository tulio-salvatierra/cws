-- Track channel topic vocabulary, coverage evidence, and the next-topic queue.
-- Policy remains in channel_brief; this ledger records history and proposals.

comment on table public.research_topics is
  'Legacy WF1 Research Agent and WF2 Copy Agent compatibility queue. Retire only after both dormant n8n workflows are decommissioned or migrated.';

create table public.channel_topics (
  id                        uuid primary key default extensions.uuid_generate_v4(),
  workspace_id              uuid not null references public.workspaces(id) on delete cascade,
  channel_id                uuid not null,
  locale                    text not null check (locale = btrim(locale) and locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  topic                     text not null check (topic = btrim(topic) and char_length(topic) between 1 and 300),
  slug                      text not null check (slug = lower(slug) and char_length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  seeded_from_channel_brief boolean not null default false,
  created_by                uuid references auth.users(id) on delete restrict,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (id, workspace_id),
  unique (channel_id, slug),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade
);

create table public.topic_coverage (
  id                 uuid primary key default extensions.uuid_generate_v4(),
  workspace_id       uuid not null references public.workspaces(id) on delete cascade,
  channel_id         uuid not null,
  channel_topic_id   uuid not null,
  content_variant_id uuid,
  published_post_id  uuid,
  agent_run_id       uuid,
  evidence_note      text check (evidence_note is null or (evidence_note = btrim(evidence_note) and char_length(evidence_note) between 1 and 2000)),
  created_by         uuid references auth.users(id) on delete restrict,
  created_at         timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (channel_topic_id, workspace_id) references public.channel_topics(id, workspace_id) on delete cascade,
  foreign key (content_variant_id, workspace_id) references public.content_variants(id, workspace_id) on delete restrict,
  foreign key (published_post_id, workspace_id) references public.published_posts(id, workspace_id) on delete restrict,
  foreign key (agent_run_id, workspace_id) references public.agent_runs(id, workspace_id) on delete restrict
);

create table public.topic_proposals (
  id                       uuid primary key default extensions.uuid_generate_v4(),
  workspace_id             uuid not null references public.workspaces(id) on delete cascade,
  channel_id               uuid not null,
  channel_topic_id         uuid,
  locale                   text not null check (locale = btrim(locale) and locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  topic                    text not null check (topic = btrim(topic) and char_length(topic) between 1 and 300),
  rationale                text check (rationale is null or (rationale = btrim(rationale) and char_length(rationale) between 1 and 2000)),
  status                   text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'consumed')),
  proposed_by_agent_run_id uuid,
  decided_by               uuid references auth.users(id) on delete restrict,
  decided_at               timestamptz,
  decision_note            text check (decision_note is null or (decision_note = btrim(decision_note) and char_length(decision_note) between 1 and 2000)),
  consumed_by_variant_id   uuid,
  created_by               uuid references auth.users(id) on delete restrict,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (channel_topic_id, workspace_id) references public.channel_topics(id, workspace_id) on delete restrict,
  foreign key (proposed_by_agent_run_id, workspace_id) references public.agent_runs(id, workspace_id) on delete restrict,
  foreign key (consumed_by_variant_id, workspace_id) references public.content_variants(id, workspace_id) on delete restrict,
  check (
    (status = 'proposed' and decided_by is null and decided_at is null and decision_note is null and consumed_by_variant_id is null)
    or (status in ('approved', 'rejected') and decided_by is not null and decided_at is not null and consumed_by_variant_id is null)
    or (status = 'consumed' and decided_by is not null and decided_at is not null and consumed_by_variant_id is not null)
  )
);

create index channel_topics_workspace_channel_locale_idx on public.channel_topics (workspace_id, channel_id, locale, topic);
create index topic_coverage_workspace_topic_created_idx on public.topic_coverage (workspace_id, channel_topic_id, created_at desc);
create index topic_coverage_published_post_id_idx on public.topic_coverage (published_post_id) where published_post_id is not null;
create index topic_proposals_workspace_channel_status_idx on public.topic_proposals (workspace_id, channel_id, status, created_at desc);

create trigger channel_topics_updated_at before update on public.channel_topics for each row execute function public.update_updated_at();
create trigger topic_proposals_updated_at before update on public.topic_proposals for each row execute function public.update_updated_at();

alter table public.channel_topics enable row level security;
alter table public.topic_coverage enable row level security;
alter table public.topic_proposals enable row level security;

create policy "workspace_members_can_read_channel_topics" on public.channel_topics for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_channel_topics" on public.channel_topics for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()) and not seeded_from_channel_brief);
create policy "workspace_members_can_update_channel_topics" on public.channel_topics for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_read_topic_coverage" on public.topic_coverage for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_topic_coverage" on public.topic_coverage for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()));
create policy "workspace_members_can_read_topic_proposals" on public.topic_proposals for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_topic_proposals" on public.topic_proposals for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()));
create policy "workspace_members_can_update_topic_proposals" on public.topic_proposals for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));

create view public.topic_performance with (security_invoker = true) as
select topic.id as channel_topic_id, topic.workspace_id, topic.channel_id, topic.locale, topic.topic, topic.slug,
  count(coverage.id) as coverage_count,
  count(coverage.published_post_id) as published_coverage_count,
  count(*) filter (where post.outcome_score = 'worked') as worked_count,
  count(*) filter (where post.outcome_score = 'flat') as flat_count,
  count(*) filter (where post.outcome_score = 'flopped') as flopped_count
from public.channel_topics as topic
left join public.topic_coverage as coverage on coverage.channel_topic_id = topic.id and coverage.workspace_id = topic.workspace_id
left join public.published_posts as post on post.id = coverage.published_post_id and post.workspace_id = coverage.workspace_id
group by topic.id, topic.workspace_id, topic.channel_id, topic.locale, topic.topic, topic.slug;

create or replace function public.render_channel_topic_ledger(target_channel_id uuid, target_locale text default null)
returns text language sql stable security invoker set search_path = '' as $$
  with selected_topics as (
    select * from public.topic_performance
    where channel_id = target_channel_id and (target_locale is null or locale = target_locale)
    order by locale, topic
  ), coverage_markdown as (
    select coalesce(string_agg(format('- %s (%s): %s coverage; worked %s, flat %s, flopped %s', topic, locale, coverage_count, worked_count, flat_count, flopped_count), E'\n'), '- No topic coverage recorded.') as value
    from selected_topics
  ), proposal_markdown as (
    select coalesce(string_agg(format('- %s (%s) [%s]', topic, locale, status), E'\n' order by created_at, topic), '- No topic proposals queued.') as value
    from public.topic_proposals
    where channel_id = target_channel_id and status in ('proposed', 'approved') and (target_locale is null or locale = target_locale)
  )
  select format('## Covered topics\n%s\n\n## Next topics\n%s', coverage_markdown.value, proposal_markdown.value)
  from coverage_markdown, proposal_markdown;
$$;

-- Seed CWS Instagram vocabulary from the explicit v1 bilingual briefs only.
-- These rows are policy-derived vocabulary, never coverage evidence.
insert into public.channel_topics (workspace_id, channel_id, locale, topic, slug, seeded_from_channel_brief)
select brief.workspace_id, brief.channel_id, brief.language, allowed_topic.topic,
  coalesce(nullif(regexp_replace(regexp_replace(lower(allowed_topic.topic), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), format('topic-%s', allowed_topic.ordinality)), true
from public.channel_brief as brief
join public.channels as channel on channel.id = brief.channel_id and channel.workspace_id = brief.workspace_id
cross join lateral unnest(brief.topics_allowed) with ordinality as allowed_topic(topic, ordinality)
where channel.slug = 'cicero-web-studio' and brief.language in ('en', 'es') and brief.version = 1
on conflict (channel_id, slug) do nothing;

-- Match the explicit export-version grant posture. Coverage is append-only.
revoke all on public.channel_topics from public, anon, authenticated, service_role;
revoke all on public.topic_coverage from public, anon, authenticated, service_role;
revoke all on public.topic_proposals from public, anon, authenticated, service_role;
revoke all on public.topic_performance from public, anon, authenticated, service_role;
revoke all on function public.render_channel_topic_ledger(uuid, text) from public, anon, authenticated, service_role;

grant select, insert, update on public.channel_topics to authenticated;
grant select, insert on public.topic_coverage to authenticated;
grant select, insert, update on public.topic_proposals to authenticated;
grant select on public.topic_performance to authenticated;
grant execute on function public.render_channel_topic_ledger(uuid, text) to authenticated;

grant select, insert, update, delete on public.channel_topics to service_role;
grant select, insert on public.topic_coverage to service_role;
grant select, insert, update, delete on public.topic_proposals to service_role;
grant select on public.topic_performance to service_role;
grant execute on function public.render_channel_topic_ledger(uuid, text) to service_role;
