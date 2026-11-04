-- Targeted, synthetic-only agreement fixture. It is intentionally not a
-- historical migration replay because RETIRE-002 protects an archived export.
\set ON_ERROR_STOP on
do $$ begin if current_database() <> 'agreement_billing_verify' then raise exception 'Use disposable agreement_billing_verify database only'; end if; end $$;

do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
create schema auth;
create schema private;
create schema extensions;
create extension "uuid-ossp" with schema extensions;
create extension pgtap with schema public;
grant usage on schema public,private,auth,extensions to anon,authenticated,service_role;

create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;

create table public.workspaces (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  created_by uuid not null
);
create table public.workspace_members (
  workspace_id uuid not null,
  user_id uuid not null,
  role text not null check(role in ('owner','member')),
  status text not null check(status in ('active','suspended')),
  created_by uuid not null,
  primary key(workspace_id,user_id)
);
create function private.is_workspace_member(target_workspace_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=auth.uid() and status='active')
$$;

create table public.clients (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id),
  name text not null,
  status text not null default 'active' check(status in ('active','inactive')),
  created_by uuid not null references auth.users(id),
  unique(id,workspace_id)
);
create table public.offers (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id)
);
create table public.financial_obligations (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  client_id uuid not null,
  description text not null check(description=btrim(description) and char_length(description) between 1 and 500),
  amount_cents bigint not null check(amount_cents>0 and amount_cents<=1000000000),
  currency text not null default 'USD' check(currency='USD'),
  obligation_type text not null check(obligation_type in ('deposit','milestone','final_payment','recurring','other')),
  due_date date,
  status text not null default 'expected' check(status in ('expected','waived','cancelled')),
  created_by uuid not null references auth.users(id),
  unique(id,workspace_id),
  foreign key(client_id,workspace_id) references public.clients(id,workspace_id)
);
create table public.payment_receipts (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  financial_obligation_id uuid not null,
  amount_cents bigint not null check(amount_cents>0 and amount_cents<=1000000000),
  received_at timestamptz not null,
  payment_method text not null check(payment_method in ('zelle','square','check','cash','bank_transfer','other')),
  reference_note text,
  recorded_by uuid not null references auth.users(id),
  unique(id,workspace_id),
  foreign key(financial_obligation_id,workspace_id) references public.financial_obligations(id,workspace_id)
);

grant select on public.workspace_members,public.clients,public.offers to service_role;
grant select,insert,update on public.financial_obligations to service_role;
grant select,insert on public.payment_receipts to service_role;
