-- Keep the original destination set on historical attempts. New publishers
-- explicitly persist all four platforms before contacting the provider.
alter type public.platform_name add value if not exists 'google_business';
alter table public.marketing_publish_destination_results
  drop constraint marketing_publish_destination_results_platform_check;
alter table public.marketing_publish_destination_results
  add constraint marketing_publish_destination_results_platform_check
  check (platform in ('LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_BUSINESS'));
alter table public.marketing_publish_attempts
  add column required_platforms text[] not null default array['LINKEDIN', 'FACEBOOK', 'INSTAGRAM'];
alter table public.marketing_publish_attempts
  add constraint marketing_required_platforms_check check (
    required_platforms = array['LINKEDIN', 'FACEBOOK', 'INSTAGRAM']
    or required_platforms = array['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_BUSINESS']
  );

create function public.protect_marketing_required_platforms()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.required_platforms is distinct from old.required_platforms then
    raise exception 'marketing required platforms are immutable';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_marketing_required_platforms() from public;
create trigger protect_marketing_required_platforms
  before update on public.marketing_publish_attempts
  for each row execute function public.protect_marketing_required_platforms();
