-- Existing projects can still apply broad default table grants. Make the
-- append-only export-version API explicit regardless of platform defaults.

revoke all on public.content_variant_exports from public, anon, authenticated, service_role;

grant select, insert on public.content_variant_exports to authenticated;
grant select, insert on public.content_variant_exports to service_role;
