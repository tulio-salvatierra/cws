-- Sales S2C: retain a small set of independently verified public-website
-- opportunities. The legacy single-text opportunity remains as historical
-- context for S2A/S2B candidates.

alter table public.sales_discovery_candidates
  add column opportunities jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(opportunities) = 'array'
      and jsonb_array_length(opportunities) <= 3
    );
