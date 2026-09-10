-- Sales S2-SAFETY: a discovery capability is consumed once, before any
-- provider read. Historical runs intentionally retain null authorization data.

alter table public.sales_discovery_runs
  add column authorization_nonce_hash text,
  add column authorization_action text,
  add column authorization_owner_id uuid references auth.users(id) on delete restrict,
  add column authorization_scope jsonb,
  add column authorization_issued_at timestamptz,
  add column authorization_expires_at timestamptz,
  add column authorization_consumed_at timestamptz,
  add constraint sales_discovery_runs_authorization_shape_check
    check (
      (
        authorization_nonce_hash is null
        and authorization_action is null
        and authorization_owner_id is null
        and authorization_scope is null
        and authorization_issued_at is null
        and authorization_expires_at is null
        and authorization_consumed_at is null
      )
      or (
        authorization_nonce_hash ~ '^[0-9a-f]{64}$'
        and authorization_action = 'discover_prospects'
        and authorization_owner_id is not null
        and jsonb_typeof(authorization_scope) = 'object'
        and authorization_issued_at is not null
        and authorization_expires_at is not null
        and authorization_consumed_at is not null
        and authorization_expires_at > authorization_issued_at
      )
    );

create unique index sales_discovery_runs_authorization_nonce_unique
  on public.sales_discovery_runs (authorization_nonce_hash)
  where authorization_nonce_hash is not null;
