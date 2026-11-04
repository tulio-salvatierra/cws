-- Keep the database safety boundary aligned with the owner-facing URL
-- normalizer. This remains a manually entered Google reference only.
alter table public.leads
  drop constraint leads_google_business_profile_url_check;

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
        or lower(google_business_profile_url) ~ '^https://share\.google([/?#]|$)'
      )
    )
  );
