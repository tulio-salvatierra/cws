-- S2D1: existing S2C evidence permitted three independently verified
-- opportunities. Owner-review signals can coexist with them, so retain up to
-- five typed public-website evidence objects on one candidate.
-- No rows, policies, grants, or other Sales/Marketing tables are changed.

set local lock_timeout = '5s';

alter table public.sales_discovery_candidates
  drop constraint if exists sales_discovery_candidates_opportunities_check;

alter table public.sales_discovery_candidates
  add constraint sales_discovery_candidates_opportunities_max_five_check
  check (
    jsonb_typeof(opportunities) = 'array'
    and jsonb_array_length(opportunities) <= 5
  );
