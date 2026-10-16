-- Per-platform Marketing captions.
-- 1. Offer caption variants may target one audience surface (Meta covers
--    Facebook and Instagram). NULL keeps today's shared caption behavior.
-- 2. Each publish attempt records the exact text sent to every destination,
--    with the catalog caption it came from. Older attempts stay NULL and keep
--    using their shared caption. The record is immutable once written.

alter table public.offer_captions
  add column platform text
    constraint offer_captions_platform_check
    check (platform is null or platform in ('meta', 'linkedin', 'google_business'));

alter table public.marketing_publish_attempts
  add column platform_captions jsonb
    constraint marketing_publish_attempts_platform_captions_check
    check (platform_captions is null or jsonb_typeof(platform_captions) = 'object');

create or replace function public.protect_marketing_publish_attempt_identity()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.id <> old.id
    or new.workspace_id <> old.workspace_id
    or new.created_by <> old.created_by
    or new.reference_key <> old.reference_key
    or new.caption <> old.caption
    or new.platform_captions is distinct from old.platform_captions
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
$function$;
