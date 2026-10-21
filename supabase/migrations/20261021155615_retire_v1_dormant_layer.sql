-- RETIRE-002 — Drop the v1 dormant layer and the n8n tables.
-- Product definition v3 §6. Audit: claude/retire-audit-2026-10-17.md (live DB, 2026-10-17).
--
-- Codex: save as supabase/migrations/<timestamp>_retire_v1_dormant_layer.sql.
-- The committed version MUST equal the applied remote version (definition of done §10.2).
--
-- Preconditions (all required):
--   1. RETIRE-001 is merged and deployed: no app code reads or writes any table below,
--      and no code writes published_posts.campaign_id/content_variant_id or
--      outreach_sends.campaign_id/approval_id.
--   2. The exact data-only export is saved and restore-verified privately at
--      /Users/tuliosalvatierra/Documents/CWS-backups/v1-dormant-export-2026-10-17.sql.
--      Owner explicitly requires keeping the archive out of the public repository.
--      Public verification records contain only checksums/counts, never archived rows.
--
-- KEPT on purpose (the audit showed they are live or reused):
--   agent_runs   — written 2026-10-16; referenced by marketing_creative_assets,
--                  sales_discovery_candidates, offer_media, published_posts
--   channels     — 39/39 published_posts rows reference it
--   decisions    — reshaped into business_decisions by DECISIONS-001
--   update_updated_at() — shared with live tables

begin;

set local time zone 'UTC';
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Prevent data from changing after the verified export check while retiring it.
lock table public.approvals, public.campaigns, public.channel_brief, public.channel_topics, public.content_drafts, public.content_variant_exports, public.content_variant_revision_events, public.content_variants, public.goals, public.initiatives, public.keywords, public.learnings, public.media_assets, public.platform_posts, public.post_analytics, public.projects, public.research_topics, public.tasks, public.topic_coverage, public.topic_proposals, public.published_posts, public.outreach_sends in share row exclusive mode;

-- Abort if any dormant data changed after the verified export.
do $export_guard$
begin
  if (select count(*) from public.goals) <> 4 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.goals t) <> '0b45fc459697b2cc75409e5c247441f6' then
    raise exception 'RETIRE-002 aborted: export mismatch for goals';
  end if;
  if (select count(*) from public.initiatives) <> 2 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.initiatives t) <> 'd40a18fd56fc88d873e23b999b020fc5' then
    raise exception 'RETIRE-002 aborted: export mismatch for initiatives';
  end if;
  if (select count(*) from public.projects) <> 1 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.projects t) <> '5239f45d72550de4ad92eeaab686bcde' then
    raise exception 'RETIRE-002 aborted: export mismatch for projects';
  end if;
  if (select count(*) from public.tasks) <> 1 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.tasks t) <> '59a50eef6231e2c0103df340b97fb67d' then
    raise exception 'RETIRE-002 aborted: export mismatch for tasks';
  end if;
  if (select count(*) from public.learnings) <> 1 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.learnings t) <> '00b724e717428605aa79d28f74ffdcf9' then
    raise exception 'RETIRE-002 aborted: export mismatch for learnings';
  end if;
  if (select count(*) from public.campaigns) <> 11 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.campaigns t) <> 'ed9b2dca8ad7695e7d0f2255dcdf4112' then
    raise exception 'RETIRE-002 aborted: export mismatch for campaigns';
  end if;
  if (select count(*) from public.content_variants) <> 17 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.content_variants t) <> 'fa40c6bc6a38f91095a837665c591b93' then
    raise exception 'RETIRE-002 aborted: export mismatch for content_variants';
  end if;
  if (select count(*) from public.approvals) <> 16 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.approvals t) <> 'e983fab405ea60db19af3f66ac9319bf' then
    raise exception 'RETIRE-002 aborted: export mismatch for approvals';
  end if;
  if (select count(*) from public.content_variant_exports) <> 11 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.content_variant_exports t) <> 'c611c6c839a421b08c98b7eda211e1e1' then
    raise exception 'RETIRE-002 aborted: export mismatch for content_variant_exports';
  end if;
  if (select count(*) from public.content_variant_revision_events) <> 3 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.content_variant_revision_events t) <> 'a74cb998a7d583def824ca1200782de8' then
    raise exception 'RETIRE-002 aborted: export mismatch for content_variant_revision_events';
  end if;
  if (select count(*) from public.channel_brief) <> 4 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.channel_brief t) <> '818521e5c4c0b149da85a197676cc1de' then
    raise exception 'RETIRE-002 aborted: export mismatch for channel_brief';
  end if;
  if (select count(*) from public.channel_topics) <> 12 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.channel_topics t) <> 'e83f010986e331c8125c295acfb537a1' then
    raise exception 'RETIRE-002 aborted: export mismatch for channel_topics';
  end if;
  if (select count(*) from public.topic_proposals) <> 4 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.topic_proposals t) <> '0a5675071071540ebf8959d2b8edacd6' then
    raise exception 'RETIRE-002 aborted: export mismatch for topic_proposals';
  end if;
  if (select count(*) from public.topic_coverage) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.topic_coverage t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for topic_coverage';
  end if;
  if (select count(*) from public.research_topics) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.research_topics t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for research_topics';
  end if;
  if (select count(*) from public.keywords) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.keywords t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for keywords';
  end if;
  if (select count(*) from public.content_drafts) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.content_drafts t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for content_drafts';
  end if;
  if (select count(*) from public.platform_posts) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.platform_posts t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for platform_posts';
  end if;
  if (select count(*) from public.media_assets) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.media_assets t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for media_assets';
  end if;
  if (select count(*) from public.post_analytics) <> 0 or (select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.post_analytics t) <> 'd41d8cd98f00b204e9800998ecf8427e' then
    raise exception 'RETIRE-002 aborted: export mismatch for post_analytics';
  end if;
end $export_guard$;

-- 0. Safety guard: the live columns that point at dormant tables must still be all NULL.
do $$
begin
  if exists (select 1 from public.published_posts where campaign_id is not null or content_variant_id is not null)
     or exists (select 1 from public.outreach_sends where campaign_id is not null or approval_id is not null) then
    raise exception 'RETIRE-002 aborted: a live row references a dormant table';
  end if;
end $$;

-- 1. Detach live tables from dormant parents.
--    Columns are kept for now (nullable, unused). They are dropped in a later cleanup after the code no longer selects them.
alter table public.published_posts
  drop constraint published_posts_campaign_id_workspace_id_fkey,
  drop constraint published_posts_content_variant_id_workspace_id_fkey;

alter table public.outreach_sends
  drop constraint outreach_sends_campaign_id_workspace_id_fkey,
  drop constraint outreach_sends_approval_id_workspace_id_fkey;

-- 2. Views on dormant tables.
drop view public.topic_performance;

-- 3. Dormant v1 tables and n8n tables, dropped together.
--    No CASCADE, so any unexpected dependency fails loudly.
drop table
  public.topic_coverage,
  public.topic_proposals,
  public.channel_topics,
  public.channel_brief,
  public.content_variant_revision_events,
  public.content_variant_exports,
  public.approvals,
  public.content_variants,
  public.tasks,
  public.projects,
  public.initiatives,
  public.goals,
  public.campaigns,
  public.learnings,
  public.post_analytics,
  public.platform_posts,
  public.media_assets,
  public.content_drafts,
  public.keywords,
  public.research_topics;

-- 4. Functions that only served the dropped tables.
drop function public.apply_content_variant_revision_event();
drop function public.capture_approval_content_snapshot();
drop function public.capture_initial_content_variant_export_version();
drop function public.enforce_content_variant_export_handoff();
drop function public.manage_test_data_classification();
drop function public.prepare_content_variant_export_version();
drop function public.prepare_content_variant_revision_event();
drop function public.preserve_campaign_ownership();
drop function public.preserve_content_variant_ownership();
drop function public.protect_approval_lifecycle();
drop function public.protect_approved_content_revision();
drop function public.protect_channel_brief_identity();
drop function public.sync_content_variant_approval_status();
drop function public.render_channel_topic_ledger(uuid, text);
drop function public.review_generated_draft(uuid, uuid, text, text, uuid, text, text, text);

commit;
