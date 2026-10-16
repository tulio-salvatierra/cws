-- Sales S2E: Google Places business details remain transient until an owner
-- explicitly investigates a selected official website. Durable selection rows
-- retain only the permitted Place ID and authorization audit metadata.
set local lock_timeout = '5s';

alter table public.sales_discovery_candidates
  add column review_basis text not null default 'automated_evidence'
    check (review_basis in ('automated_evidence', 'owner_selected'));

alter table public.sales_discovery_candidates
  alter column opportunity drop not null;

alter table public.sales_discovery_candidates
  add constraint sales_discovery_candidates_owner_selected_opportunity_check
  check (opportunity is not null or review_basis = 'owner_selected');

create table public.sales_discovery_owner_selections (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  discovery_run_id uuid not null references public.sales_discovery_runs(id) on delete restrict,
  provider text not null default 'google_places'
    check (provider = 'google_places'),
  provider_place_id text not null
    check (provider_place_id = btrim(provider_place_id) and char_length(provider_place_id) between 1 and 300),
  action text not null
    check (action in ('investigate', 'skip')),
  status text not null
    check (status in ('running', 'complete', 'error')),
  authorization_nonce_hash text not null unique
    check (authorization_nonce_hash ~ '^[0-9a-f]{64}$'),
  authorization_owner_id uuid not null references auth.users(id) on delete restrict,
  authorization_issued_at timestamptz not null,
  authorization_expires_at timestamptz not null,
  authorization_consumed_at timestamptz not null,
  candidate_id uuid references public.sales_discovery_candidates(id) on delete restrict,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (authorization_expires_at > authorization_issued_at),
  check (
    (action = 'skip' and status = 'complete' and candidate_id is null and completed_at is not null)
    or (action = 'investigate' and status = 'running' and candidate_id is null and completed_at is null)
    or (action = 'investigate' and status = 'complete' and candidate_id is not null and completed_at is not null)
    or (action = 'investigate' and status = 'error' and candidate_id is null and completed_at is not null)
  ),
  check (error_message is null or (error_message = btrim(error_message) and char_length(error_message) between 1 and 500))
);

create index sales_discovery_owner_selections_workspace_place_idx
  on public.sales_discovery_owner_selections (workspace_id, provider, provider_place_id);

create index sales_discovery_owner_selections_run_idx
  on public.sales_discovery_owner_selections (discovery_run_id);

create index sales_discovery_owner_selections_candidate_idx
  on public.sales_discovery_owner_selections (candidate_id)
  where candidate_id is not null;

create unique index sales_discovery_owner_selections_active_place_unique
  on public.sales_discovery_owner_selections (workspace_id, provider, provider_place_id)
  where status in ('running', 'complete');

alter table public.sales_discovery_owner_selections enable row level security;

create policy "sales_discovery_owner_selections_no_browser_access"
  on public.sales_discovery_owner_selections as restrictive for all to authenticated
  using (false) with check (false);

revoke all on public.sales_discovery_owner_selections from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.sales_discovery_owner_selections to service_role;
