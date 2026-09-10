-- M5 keeps weekly planning narrow: the slot identity lives on the already
-- durable Marketing attempt. The weekly calendar itself is deterministic.
-- Existing M2/M3/M4 rows remain valid historical records with null M5 fields.

alter table public.marketing_publish_attempts
  drop constraint marketing_publish_attempts_asset_path_check;

alter table public.marketing_publish_attempts
  add column asset_id text,
  add column marketing_slot_key text;

alter table public.marketing_publish_attempts
  add constraint marketing_publish_attempts_marketing_slot_key_check
  check (
    marketing_slot_key is null
    or marketing_slot_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}:post-[ab]$'
  ),
  add constraint marketing_publish_attempts_marketing_slot_asset_check
  check (
    (marketing_slot_key is null and asset_id is null)
    or (marketing_slot_key is not null and asset_id is not null)
  );

create unique index marketing_publish_attempts_workspace_slot_uidx
  on public.marketing_publish_attempts (workspace_id, marketing_slot_key)
  where marketing_slot_key is not null;

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
    or new.destination <> old.destination
    or new.marketing_slot_key is distinct from old.marketing_slot_key
    or new.created_at <> old.created_at
  then
    raise exception 'marketing publish attempt identity fields are immutable';
  end if;

  return new;
end;
$$;
