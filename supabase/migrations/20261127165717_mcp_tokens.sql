-- MCP-READ-001 (DEC-041): owner-issued personal tokens for the read-only MCP endpoint.
-- Only a SHA-256 hash of each token is stored. Tokens never expire; the owner revokes them.
-- Service role only: the API verifies the active owner before issuing or revoking.
-- The only update allowed after issue is last_used_at (auth bookkeeping) and revoked_at.
set local lock_timeout = '5s';

create table public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null check (token_prefix ~ '^cws_mcp_[A-Za-z0-9_-]{6}$'),
  label text not null check (char_length(trim(label)) between 1 and 80),
  scopes text[] not null default array['read']::text[] check (scopes = array['read']::text[]),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= created_at)
);

create index mcp_tokens_workspace_active_idx on public.mcp_tokens (workspace_id, created_at desc) where revoked_at is null;

alter table public.mcp_tokens enable row level security;
revoke all on public.mcp_tokens from public, anon, authenticated, service_role;
grant select, insert on public.mcp_tokens to service_role;
grant update (last_used_at, revoked_at) on public.mcp_tokens to service_role;

comment on table public.mcp_tokens is 'DEC-041 read-only MCP personal tokens. Hash only; owner-issued; manual revoke; no expiry.';
