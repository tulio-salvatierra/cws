-- Retired linkage columns must remain empty; fail closed if new data appears.
set local lock_timeout = '5s';
lock table public.published_posts, public.outreach_sends in access exclusive mode;
do $$
begin
  if exists (select 1 from public.published_posts where campaign_id is not null or content_variant_id is not null)
    or exists (select 1 from public.outreach_sends where campaign_id is not null or approval_id is not null)
  then raise exception 'retirement columns contain data; export and review before cleanup';
  end if;
end;
$$;

-- The run link is part of immutable publication identity.

create or replace function public.protect_published_post_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.channel_id is distinct from old.channel_id
    or new.agent_run_id is distinct from old.agent_run_id
    or new.platform <> old.platform
    or new.external_post_id is distinct from old.external_post_id
    or new.external_url is distinct from old.external_url
    or new.published_at <> old.published_at
    or new.language is distinct from old.language
    or new.source <> old.source
    or new.raw_payload is distinct from old.raw_payload
    or new.created_by is distinct from old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'published post identity fields are immutable';
  end if;

  if new.outcome_score is null then
    new.outcome_recorded_at := null;
  elsif new.outcome_recorded_at is null
    or new.outcome_score is distinct from old.outcome_score
    or new.outcome_note is distinct from old.outcome_note
  then
    new.outcome_recorded_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.protect_published_post_identity() from public;
-- PostgreSQL removes the two indexes owned by these columns. No CASCADE.
alter table public.published_posts drop column campaign_id, drop column content_variant_id;
alter table public.outreach_sends drop column campaign_id, drop column approval_id;
