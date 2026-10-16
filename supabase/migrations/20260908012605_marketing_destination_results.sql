-- M4 extends the isolated Marketing V1 attempt only. Historical M2/M3 rows
-- remain valid LinkedIn-only records and are never rewritten.

alter table public.marketing_publish_attempts
  drop constraint marketing_publish_attempts_destination_check;

alter table public.marketing_publish_attempts
  add constraint marketing_publish_attempts_destination_check
  check (destination in ('linkedin:cicero-web-studio', 'multi:cicero-web-studio'));

create table public.marketing_publish_destination_results (
  id                     uuid primary key default uuid_generate_v4(),
  attempt_id             uuid not null references public.marketing_publish_attempts(id) on delete cascade,
  platform               text not null check (platform in ('LINKEDIN', 'FACEBOOK', 'INSTAGRAM')),
  provider_identity      jsonb not null default '{}'::jsonb
    check (jsonb_typeof(provider_identity) = 'object'),
  provider_post_id       text,
  provider_status        text not null default 'preparing'
    check (provider_status in ('preparing', 'scheduled', 'processing', 'posted', 'retrying', 'error')),
  provider_error         text,
  provider_permalink     text,
  provider_external_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(provider_external_data) = 'object'),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (attempt_id, platform)
);

create index marketing_publish_destination_results_attempt_idx
  on public.marketing_publish_destination_results (attempt_id, platform);

create trigger marketing_publish_destination_results_updated_at
  before update on public.marketing_publish_destination_results
  for each row execute function public.update_updated_at();

create or replace function public.protect_marketing_destination_result_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.attempt_id <> old.attempt_id
    or new.platform <> old.platform
    or new.provider_identity <> old.provider_identity
    or new.created_at <> old.created_at
  then
    raise exception 'marketing destination result identity fields are immutable';
  end if;

  return new;
end;
$$;

create trigger protect_marketing_destination_result_identity
  before update on public.marketing_publish_destination_results
  for each row execute function public.protect_marketing_destination_result_identity();

alter table public.marketing_publish_destination_results enable row level security;

revoke all on function public.protect_marketing_destination_result_identity() from public;
revoke all on public.marketing_publish_destination_results from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.marketing_publish_destination_results to service_role;
