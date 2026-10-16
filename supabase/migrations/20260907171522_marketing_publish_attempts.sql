-- Keep the isolated Marketing V1 publish path independent from legacy content operations.

create table public.marketing_publish_attempts (
  id                     uuid primary key default uuid_generate_v4(),
  workspace_id           uuid not null references public.workspaces(id) on delete cascade,
  created_by             uuid not null references auth.users(id) on delete restrict,
  reference_key          text not null check (char_length(reference_key) between 1 and 128),
  caption                text not null check (char_length(btrim(caption)) between 1 and 3000),
  asset_path             text not null default '/images/logo.png'
    check (asset_path = '/images/logo.png'),
  destination            text not null default 'linkedin:cicero-web-studio'
    check (destination = 'linkedin:cicero-web-studio'),
  upload_id              text,
  provider_post_id       text,
  provider_status        text not null default 'preparing'
    check (provider_status in ('preparing', 'scheduled', 'processing', 'posted', 'retrying', 'error')),
  provider_error         text,
  provider_permalink     text,
  provider_external_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(provider_external_data) = 'object'),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (reference_key),
  unique (id, workspace_id)
);

create unique index marketing_publish_attempts_provider_post_id_uidx
  on public.marketing_publish_attempts (provider_post_id)
  where provider_post_id is not null;

create index marketing_publish_attempts_workspace_created_at_idx
  on public.marketing_publish_attempts (workspace_id, created_at desc);

create trigger marketing_publish_attempts_updated_at
  before update on public.marketing_publish_attempts
  for each row execute function public.update_updated_at();

create or replace function public.protect_marketing_publish_attempt_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.created_by <> old.created_by
    or new.reference_key <> old.reference_key
    or new.caption <> old.caption
    or new.asset_path <> old.asset_path
    or new.destination <> old.destination
    or new.created_at <> old.created_at
  then
    raise exception 'marketing publish attempt identity fields are immutable';
  end if;

  return new;
end;
$$;

create trigger protect_marketing_publish_attempt_identity
  before update on public.marketing_publish_attempts
  for each row execute function public.protect_marketing_publish_attempt_identity();

alter table public.marketing_publish_attempts enable row level security;

revoke all on function public.protect_marketing_publish_attempt_identity() from public;
revoke all on public.marketing_publish_attempts from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.marketing_publish_attempts to service_role;
