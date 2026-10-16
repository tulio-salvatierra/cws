-- Keep the Marketing delivery ledger and the durable published-post ledger in
-- sync. One multi-destination Marketing attempt can create one published_posts
-- row per platform, while the pre-M4 LinkedIn-only attempt shape creates one.
-- The provider's exact social-post ID is preferred; the deterministic fallback
-- is only for a provider-confirmed post that lacks an individual social ID.

create or replace function public.record_marketing_published_post(
  p_attempt public.marketing_publish_attempts,
  p_platform text,
  p_provider_post_id text,
  p_provider_permalink text,
  p_provider_external_data jsonb,
  p_published_at timestamptz
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_channel_id uuid;
  v_platform public.platform_name;
  v_external_post_id text;
begin
  v_platform := lower(p_platform)::public.platform_name;
  v_external_post_id := coalesce(
    nullif(btrim(p_provider_post_id), ''),
    nullif(btrim(p_attempt.provider_post_id), ''),
    format('marketing-attempt:%s:%s', p_attempt.id, lower(p_platform))
  );

  select channel.id
    into v_channel_id
    from public.channels as channel
   where channel.workspace_id = p_attempt.workspace_id
     and channel.slug = 'cicero-web-studio'
   limit 1;

  insert into public.published_posts (
    workspace_id,
    channel_id,
    platform,
    external_post_id,
    external_url,
    published_at,
    source,
    raw_payload,
    created_by
  ) values (
    p_attempt.workspace_id,
    v_channel_id,
    v_platform,
    v_external_post_id,
    nullif(btrim(p_provider_permalink), ''),
    coalesce(p_published_at, now()),
    'cws-os',
    jsonb_build_object(
      'marketing_attempt_id', p_attempt.id,
      'destination', p_attempt.destination,
      'provider_status', 'posted',
      'provider_post_id', nullif(btrim(p_provider_post_id), ''),
      'provider_permalink', nullif(btrim(p_provider_permalink), ''),
      'provider_external_data', coalesce(p_provider_external_data, '{}'::jsonb),
      'external_post_id_source', case
        when nullif(btrim(p_provider_post_id), '') is not null then 'destination_provider_post_id'
        when nullif(btrim(p_attempt.provider_post_id), '') is not null then 'attempt_provider_post_id'
        else 'deterministic_marketing_identity'
      end
    ),
    p_attempt.created_by
  )
  on conflict (platform, external_post_id) where external_post_id is not null do nothing;
end;
$$;

create or replace function public.write_back_marketing_destination_post()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_attempt public.marketing_publish_attempts;
begin
  if new.provider_status <> 'posted' then
    return new;
  end if;

  select attempt.*
    into v_attempt
    from public.marketing_publish_attempts as attempt
   where attempt.id = new.attempt_id;

  if found then
    perform public.record_marketing_published_post(
      v_attempt,
      new.platform,
      new.provider_post_id,
      new.provider_permalink,
      new.provider_external_data,
      new.updated_at
    );
  end if;

  return new;
end;
$$;

create or replace function public.write_back_legacy_marketing_post()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.provider_status = 'posted'
    and new.destination = 'linkedin:cicero-web-studio' then
    perform public.record_marketing_published_post(
      new,
      'linkedin',
      new.provider_post_id,
      new.provider_permalink,
      new.provider_external_data,
      new.updated_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists write_back_marketing_destination_post
  on public.marketing_publish_destination_results;
create trigger write_back_marketing_destination_post
  after insert or update of provider_status, provider_post_id, provider_permalink, provider_external_data
  on public.marketing_publish_destination_results
  for each row
  when (new.provider_status = 'posted')
  execute function public.write_back_marketing_destination_post();

drop trigger if exists write_back_legacy_marketing_post
  on public.marketing_publish_attempts;
create trigger write_back_legacy_marketing_post
  after insert or update of provider_status, provider_post_id, provider_permalink, provider_external_data
  on public.marketing_publish_attempts
  for each row
  when (new.provider_status = 'posted' and new.destination = 'linkedin:cicero-web-studio')
  execute function public.write_back_legacy_marketing_post();

-- Reconcile historic provider-confirmed posts exactly once. The partial unique
-- index on (platform, external_post_id) makes this safe to re-run and keeps a
-- multi-destination attempt from duplicating its individual platform posts.
do $$
declare
  destination_result record;
  current_attempt public.marketing_publish_attempts;
begin
  for destination_result in
    select result.*
      from public.marketing_publish_destination_results as result
     where result.provider_status = 'posted'
  loop
    select attempt.*
      into current_attempt
      from public.marketing_publish_attempts as attempt
     where attempt.id = destination_result.attempt_id;

    perform public.record_marketing_published_post(
      current_attempt,
      destination_result.platform,
      destination_result.provider_post_id,
      destination_result.provider_permalink,
      destination_result.provider_external_data,
      destination_result.updated_at
    );
  end loop;

  for current_attempt in
    select attempt.*
      from public.marketing_publish_attempts as attempt
     where attempt.provider_status = 'posted'
       and attempt.destination = 'linkedin:cicero-web-studio'
  loop
    perform public.record_marketing_published_post(
      current_attempt,
      'linkedin',
      current_attempt.provider_post_id,
      current_attempt.provider_permalink,
      current_attempt.provider_external_data,
      current_attempt.updated_at
    );
  end loop;
end;
$$;

revoke all on function public.record_marketing_published_post(
  public.marketing_publish_attempts, text, text, text, jsonb, timestamptz
) from public;
revoke all on function public.write_back_marketing_destination_post() from public;
revoke all on function public.write_back_legacy_marketing_post() from public;

-- Extend the durable knowledge registers without changing existing data or the
-- established decisions.status vocabulary.
alter table public.learnings
  add column status text not null default 'provisional',
  add column trigger text,
  add column evidence text,
  add column action text,
  add column exceptions text,
  add column last_verified date,
  add column scope text,
  add constraint learnings_status_check
    check (status in ('provisional', 'verified', 'retired'));

alter table public.decisions
  add column observed_outcome text;
