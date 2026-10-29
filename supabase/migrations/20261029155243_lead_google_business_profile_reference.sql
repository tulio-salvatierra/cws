-- Optional owner-entered reference only. It is not a Google provider identity,
-- connection, enrichment source, or publishing target.
alter table public.leads
  add column google_business_profile_url text;

alter table public.leads
  add constraint leads_google_business_profile_url_check
  check (
    google_business_profile_url is null
    or (
      google_business_profile_url = btrim(google_business_profile_url)
      and char_length(google_business_profile_url) between 1 and 2048
      and (
        lower(google_business_profile_url) ~ '^https://([a-z0-9-]+\.)*google\.com([/?#]|$)'
        or lower(google_business_profile_url) ~ '^https://(maps\.app\.)?goo\.gl([/?#]|$)'
        or lower(google_business_profile_url) ~ '^https://g\.page([/?#]|$)'
        or lower(google_business_profile_url) ~ '^https://g\.co([/?#]|$)'
      )
    )
  );
