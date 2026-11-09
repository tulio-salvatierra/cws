-- Prepare only: apply before deploying the format-picker code.
-- Existing PNG assets remain valid and are not reclassified as validated.
set local lock_timeout = '5s';

update storage.buckets set allowed_mime_types = array['image/png', 'image/jpeg']::text[]
where id = 'marketing-creative';

alter table public.marketing_creative_assets
  add column format_id text not null default 'instagram-feed-portrait',
  add column image_validation jsonb,
  add constraint marketing_creative_assets_format_id_check check (format_id in (
    'instagram-feed-square', 'instagram-feed-portrait', 'instagram-story', 'instagram-reel-cover',
    'facebook-feed-square', 'facebook-feed-portrait', 'facebook-story', 'facebook-reel-cover',
    'linkedin-feed-square', 'linkedin-feed-portrait', 'linkedin-feed-landscape'
  )),
  drop constraint marketing_creative_assets_workspace_id_idea_run_id_idea_id_key,
  add constraint marketing_creative_assets_idea_format_key unique (workspace_id, idea_run_id, idea_id, format_id),
  drop constraint marketing_creative_assets_storage_object_path_check,
  add constraint marketing_creative_assets_storage_object_path_check
    check (storage_object_path ~ '^generated/[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg)$');

alter table public.offer_media
  drop constraint offer_media_storage_reference_check,
  add constraint offer_media_storage_reference_check check (
    (media_source = 'local'
      and storage_path ~ '^/images/([A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+[.](png|jpe?g|webp)$'
      and storage_bucket is null and storage_object_path is null and source_agent_run_id is null)
    or (media_source = 'generated' and storage_path is null
      and storage_bucket = 'marketing-creative'
      and storage_object_path ~ '^generated/[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg)$'
      and source_agent_run_id is not null)
  );
