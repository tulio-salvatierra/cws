-- Sales S2A: retain only safe per-search provider diagnostics. These rows are
-- service-role-only and never contain API keys, headers, or raw responses.
create table public.sales_discovery_provider_diagnostics (
  id uuid primary key default extensions.uuid_generate_v4(),
  discovery_run_id uuid not null references public.sales_discovery_runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  diagnostic_scope text not null
    check (diagnostic_scope in ('discovery', 'contract_diagnostic')),
  category text not null
    check (category = btrim(category) and char_length(category) between 1 and 100),
  search_query text not null
    check (search_query = btrim(search_query) and char_length(search_query) between 1 and 500),
  outcome text not null
    check (outcome in ('pending', 'success', 'zero_results', 'error')),
  http_status integer
    check (http_status is null or http_status between 100 and 599),
  provider_status text
    check (provider_status is null or (provider_status = btrim(provider_status) and char_length(provider_status) between 1 and 100)),
  provider_code integer,
  provider_message text
    check (provider_message is null or (provider_message = btrim(provider_message) and char_length(provider_message) between 1 and 500)),
  result_count integer not null default 0
    check (result_count >= 0),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index sales_discovery_provider_diagnostics_run_idx
  on public.sales_discovery_provider_diagnostics (discovery_run_id, occurred_at);

create unique index sales_discovery_provider_diagnostics_one_contract_check
  on public.sales_discovery_provider_diagnostics (workspace_id)
  where diagnostic_scope = 'contract_diagnostic';

alter table public.sales_discovery_provider_diagnostics enable row level security;

create policy "sales_discovery_provider_diagnostics_no_browser_access"
  on public.sales_discovery_provider_diagnostics as restrictive for all to authenticated
  using (false) with check (false);

revoke all on public.sales_discovery_provider_diagnostics from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.sales_discovery_provider_diagnostics to service_role;
