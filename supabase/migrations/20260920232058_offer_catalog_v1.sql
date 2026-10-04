-- CWS Offer Catalog V1 is durable, workspace-scoped reference data. It is not
-- ecommerce, invoicing, or a publishing scheduler. Marketing selects only
-- owner-approved active records; all provider work still needs the existing
-- explicit per-slot owner confirmation.
set local lock_timeout = '5s';

create table public.offers (
  id                     uuid primary key default extensions.uuid_generate_v4(),
  workspace_id           uuid not null references public.workspaces(id) on delete cascade,
  name                   text not null check (char_length(btrim(name)) between 1 and 160),
  description            text not null default '' check (char_length(description) <= 3000),
  price_mode             text not null check (price_mode in ('fixed', 'from', 'by_scope')),
  price_cents            bigint,
  price_display_override text check (price_display_override is null or char_length(btrim(price_display_override)) between 1 and 160),
  default_project_type   text check (default_project_type is null or char_length(btrim(default_project_type)) between 1 and 80),
  status                 text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_by             uuid not null references auth.users(id) on delete restrict,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (workspace_id, id),
  check (
    (price_mode = 'by_scope' and price_cents is null)
    or (price_mode in ('fixed', 'from') and price_cents is not null and price_cents > 0)
  ),
  check (status <> 'active' or char_length(btrim(description)) >= 10)
);

create index offers_workspace_status_idx
  on public.offers (workspace_id, status, created_at asc);

create trigger offers_updated_at
  before update on public.offers
  for each row execute function public.update_updated_at();

create table public.offer_media (
  id                     uuid primary key default extensions.uuid_generate_v4(),
  workspace_id           uuid not null,
  offer_id               uuid not null,
  storage_path           text not null check (storage_path ~ '^/images/([A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+[.](png|jpe?g|webp)$'),
  linkedin_compatible    boolean not null default false,
  facebook_compatible    boolean not null default false,
  instagram_compatible   boolean not null default false,
  status                 text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_by             uuid not null references auth.users(id) on delete restrict,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, offer_id, id),
  foreign key (workspace_id, offer_id) references public.offers(workspace_id, id) on delete restrict,
  check (
    status <> 'active'
    or (linkedin_compatible and facebook_compatible and instagram_compatible)
  )
);

create index offer_media_workspace_offer_status_idx
  on public.offer_media (workspace_id, offer_id, status, created_at asc);

create trigger offer_media_updated_at
  before update on public.offer_media
  for each row execute function public.update_updated_at();

create table public.offer_captions (
  id                     uuid primary key default extensions.uuid_generate_v4(),
  workspace_id           uuid not null,
  offer_id               uuid not null,
  locale                 text not null default 'en' check (locale in ('en', 'es')),
  body                   text not null check (char_length(btrim(body)) between 1 and 3000),
  status                 text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_by             uuid not null references auth.users(id) on delete restrict,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, offer_id, id),
  foreign key (workspace_id, offer_id) references public.offers(workspace_id, id) on delete restrict
);

create index offer_captions_workspace_offer_status_idx
  on public.offer_captions (workspace_id, offer_id, status, locale, created_at asc);

create trigger offer_captions_updated_at
  before update on public.offer_captions
  for each row execute function public.update_updated_at();

alter table public.marketing_publish_attempts
  add column offer_id uuid,
  add column offer_media_id uuid,
  add column offer_caption_id uuid,
  add constraint marketing_publish_attempts_catalog_reference_check check (
    (offer_id is null and offer_media_id is null and offer_caption_id is null)
    or (offer_id is not null and offer_media_id is not null and offer_caption_id is not null)
  ),
  add constraint marketing_publish_attempts_catalog_media_fk
    foreign key (workspace_id, offer_id, offer_media_id)
    references public.offer_media(workspace_id, offer_id, id) on delete restrict,
  add constraint marketing_publish_attempts_catalog_caption_fk
    foreign key (workspace_id, offer_id, offer_caption_id)
    references public.offer_captions(workspace_id, offer_id, id) on delete restrict;

create index marketing_publish_attempts_catalog_rotation_idx
  on public.marketing_publish_attempts (workspace_id, offer_id, offer_media_id, offer_caption_id, updated_at desc)
  where offer_id is not null;

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
    or new.asset_id is distinct from old.asset_id
    or new.offer_id is distinct from old.offer_id
    or new.offer_media_id is distinct from old.offer_media_id
    or new.offer_caption_id is distinct from old.offer_caption_id
    or new.destination <> old.destination
    or new.marketing_slot_key is distinct from old.marketing_slot_key
    or new.created_at <> old.created_at
  then
    raise exception 'marketing publish attempt identity fields are immutable';
  end if;

  return new;
end;
$$;

alter table public.offers enable row level security;
alter table public.offer_media enable row level security;
alter table public.offer_captions enable row level security;

revoke all on public.offers from public, anon, authenticated, service_role;
revoke all on public.offer_media from public, anon, authenticated, service_role;
revoke all on public.offer_captions from public, anon, authenticated, service_role;

grant select, insert, update, delete on public.offers to service_role;
grant select, insert, update, delete on public.offer_media to service_role;
grant select, insert, update, delete on public.offer_captions to service_role;
