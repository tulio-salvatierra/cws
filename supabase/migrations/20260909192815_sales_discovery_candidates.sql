-- Sales S2A: owner-triggered prospect research stays separate from leads until
-- the owner has reviewed a verified business and public business email.
create table public.sales_discovery_runs (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  provider text not null default 'google_places'
    check (provider = 'google_places'),
  status text not null default 'running'
    check (status in ('running', 'complete', 'error')),
  places_searches integer not null default 0 check (places_searches between 0 and 4),
  place_detail_requests integer not null default 0 check (place_detail_requests = 0),
  website_inspections integer not null default 0 check (website_inspections between 0 and 10),
  candidates_created integer not null default 0 check (candidates_created >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  error_message text,
  started_by uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create unique index sales_discovery_runs_one_active_per_workspace
  on public.sales_discovery_runs (workspace_id)
  where status = 'running';

create index sales_discovery_runs_workspace_started_idx
  on public.sales_discovery_runs (workspace_id, started_at desc);

create table public.sales_discovery_candidates (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  provider text not null default 'google_places'
    check (provider = 'google_places'),
  provider_place_id text not null
    check (provider_place_id = btrim(provider_place_id) and char_length(provider_place_id) between 1 and 300),
  business_name text not null
    check (business_name = btrim(business_name) and char_length(business_name) between 1 and 200),
  category text not null
    check (category = btrim(category) and char_length(category) between 1 and 100),
  locality text not null default 'Chicago, IL'
    check (locality = btrim(locality) and char_length(locality) between 1 and 200),
  website_url text not null
    check (website_url = btrim(website_url) and char_length(website_url) between 1 and 2000),
  website_domain text not null
    check (website_domain = lower(btrim(website_domain)) and char_length(website_domain) between 1 and 253),
  business_email text
    check (business_email is null or (business_email = lower(btrim(business_email)) and char_length(business_email) between 3 and 320)),
  business_phone text
    check (business_phone is null or (business_phone = btrim(business_phone) and char_length(business_phone) between 3 and 50)),
  observed_facts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(observed_facts) = 'array'),
  opportunity text not null
    check (opportunity = btrim(opportunity) and char_length(opportunity) between 1 and 500),
  evidence_urls jsonb not null default '[]'::jsonb
    check (jsonb_typeof(evidence_urls) = 'array'),
  inspected_at timestamptz not null,
  review_state text not null default 'ready'
    check (review_state in ('ready', 'converting', 'converted', 'dismissed')),
  dismissed_at timestamptz,
  converted_lead_id uuid,
  converted_at timestamptz,
  possible_duplicate boolean not null default false,
  possible_duplicate_reason text,
  normalized_name text not null
    check (normalized_name = btrim(normalized_name) and char_length(normalized_name) between 1 and 200),
  normalized_locality text not null
    check (normalized_locality = btrim(normalized_locality) and char_length(normalized_locality) between 1 and 200),
  discovered_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, provider, provider_place_id),
  foreign key (converted_lead_id, workspace_id)
    references public.leads(id, workspace_id)
    on delete restrict,
  check (
    (review_state in ('ready', 'converting') and dismissed_at is null and converted_lead_id is null and converted_at is null)
    or (review_state = 'dismissed' and dismissed_at is not null and converted_lead_id is null and converted_at is null)
    or (review_state = 'converted' and dismissed_at is null and converted_lead_id is not null and converted_at is not null)
  )
);

create index sales_discovery_candidates_review_idx
  on public.sales_discovery_candidates (workspace_id, review_state, created_at);

create index sales_discovery_candidates_domain_idx
  on public.sales_discovery_candidates (workspace_id, website_domain);

create index sales_discovery_candidates_name_location_idx
  on public.sales_discovery_candidates (workspace_id, normalized_name, normalized_locality);

create trigger sales_discovery_candidates_updated_at
before update on public.sales_discovery_candidates
for each row execute function public.update_updated_at();

alter table public.sales_discovery_runs enable row level security;
alter table public.sales_discovery_candidates enable row level security;

create policy "sales_discovery_runs_no_browser_access"
  on public.sales_discovery_runs as restrictive for all to authenticated
  using (false) with check (false);

create policy "sales_discovery_candidates_no_browser_access"
  on public.sales_discovery_candidates as restrictive for all to authenticated
  using (false) with check (false);

revoke all on public.sales_discovery_runs from public, anon, authenticated, service_role;
revoke all on public.sales_discovery_candidates from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.sales_discovery_runs to service_role;
grant select, insert, update, delete on public.sales_discovery_candidates to service_role;
