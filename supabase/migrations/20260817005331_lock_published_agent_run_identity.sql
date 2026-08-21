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
    or new.campaign_id is distinct from old.campaign_id
    or new.content_variant_id is distinct from old.content_variant_id
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
