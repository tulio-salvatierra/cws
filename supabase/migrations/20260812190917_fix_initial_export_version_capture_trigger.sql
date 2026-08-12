-- The export handoff BEFORE trigger populates export_snapshot even though the
-- application does not name that column in its UPDATE statement. PostgreSQL
-- UPDATE OF triggers only inspect the original SET list, so watch every update
-- and retain the old/new transition guard instead.

drop trigger capture_initial_content_variant_export_version
  on public.content_variants;

create trigger capture_initial_content_variant_export_version
  after update on public.content_variants
  for each row
  when (old.export_snapshot is null and new.export_snapshot is not null)
  execute function public.capture_initial_content_variant_export_version();
