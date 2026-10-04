-- Accounting A1 is a deliberately small financial-state foundation. It tracks
-- money CWS expects and owner-confirmed receipts; it is not invoicing,
-- bookkeeping, payment processing, or a generic ledger.
set local lock_timeout = '5s';

create table public.financial_obligations (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  client_id uuid not null,
  operations_project_id uuid,
  description text not null check (description = btrim(description) and char_length(description) between 1 and 500),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  currency text not null default 'USD' check (currency = 'USD'),
  obligation_type text not null check (obligation_type in ('deposit', 'milestone', 'final_payment', 'recurring', 'other')),
  due_date date,
  status text not null default 'expected' check (status in ('expected', 'waived', 'cancelled')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (client_id, workspace_id)
    references public.clients(id, workspace_id)
    on delete restrict,
  foreign key (operations_project_id, workspace_id)
    references public.operations_projects(id, workspace_id)
    on delete restrict
);

create table public.payment_receipts (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  financial_obligation_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  received_at timestamptz not null,
  payment_method text not null check (payment_method in ('zelle', 'square', 'check', 'cash', 'bank_transfer', 'other')),
  reference_note text check (reference_note is null or (reference_note = btrim(reference_note) and char_length(reference_note) between 1 and 500)),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (financial_obligation_id, workspace_id)
    references public.financial_obligations(id, workspace_id)
    on delete restrict
);

create table public.recurring_revenue (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  client_id uuid not null,
  description text not null check (description = btrim(description) and char_length(description) between 1 and 500),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  currency text not null default 'USD' check (currency = 'USD'),
  cadence text not null default 'monthly' check (cadence = 'monthly'),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  provider text not null check (provider in ('square', 'manual', 'other')),
  provider_reference text check (provider_reference is null or (provider_reference = btrim(provider_reference) and char_length(provider_reference) between 1 and 500)),
  started_at date not null,
  next_expected_at date,
  ended_at date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (client_id, workspace_id)
    references public.clients(id, workspace_id)
    on delete restrict,
  check ((status <> 'ended') or ended_at is not null)
);

create index financial_obligations_workspace_status_due_idx
  on public.financial_obligations (workspace_id, status, due_date, created_at);
create index financial_obligations_client_workspace_idx
  on public.financial_obligations (client_id, workspace_id);
create index financial_obligations_operations_project_workspace_idx
  on public.financial_obligations (operations_project_id, workspace_id)
  where operations_project_id is not null;
create index payment_receipts_obligation_workspace_received_idx
  on public.payment_receipts (financial_obligation_id, workspace_id, received_at desc);
create index recurring_revenue_workspace_status_next_expected_idx
  on public.recurring_revenue (workspace_id, status, next_expected_at, created_at);

-- Server code validates this too. The trigger is the durable defense against
-- a service-side mistake linking one client's obligation to another client's
-- Operations project.
create or replace function public.ensure_financial_obligation_project_client()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  project_client_id uuid;
begin
  if new.operations_project_id is null then
    return new;
  end if;

  select client_id into project_client_id
  from public.operations_projects
  where id = new.operations_project_id
    and workspace_id = new.workspace_id;

  if project_client_id is null then
    raise exception 'The linked Operations project must belong to this workspace.';
  end if;
  if project_client_id <> new.client_id then
    raise exception 'The linked Operations project must belong to the same client.';
  end if;
  return new;
end;
$$;

create trigger financial_obligations_validate_project_client
before insert or update of workspace_id, client_id, operations_project_id on public.financial_obligations
for each row execute function public.ensure_financial_obligation_project_client();

-- Receipts are append-only. Locking the obligation row makes the receipt total
-- check safe across concurrent owner requests and prevents accidental
-- overpayment records at the database boundary.
create or replace function public.prevent_financial_receipt_overpayment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  obligation public.financial_obligations%rowtype;
  recorded_cents bigint;
begin
  select * into obligation
  from public.financial_obligations
  where id = new.financial_obligation_id
    and workspace_id = new.workspace_id
  for update;

  if obligation.id is null then
    raise exception 'The financial obligation was not found in this workspace.';
  end if;
  if obligation.status <> 'expected' then
    raise exception 'Receipts can only be recorded for an expected obligation.';
  end if;

  select coalesce(sum(amount_cents), 0) into recorded_cents
  from public.payment_receipts
  where financial_obligation_id = new.financial_obligation_id
    and workspace_id = new.workspace_id;

  if recorded_cents + new.amount_cents > obligation.amount_cents then
    raise exception 'A receipt cannot exceed the outstanding obligation amount.';
  end if;
  return new;
end;
$$;

create trigger payment_receipts_prevent_overpayment
before insert on public.payment_receipts
for each row execute function public.prevent_financial_receipt_overpayment();

create trigger financial_obligations_updated_at
before update on public.financial_obligations
for each row execute function public.update_updated_at();

create trigger recurring_revenue_updated_at
before update on public.recurring_revenue
for each row execute function public.update_updated_at();

alter table public.financial_obligations enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.recurring_revenue enable row level security;

create policy "workspace_members_can_read_financial_obligations"
  on public.financial_obligations for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_read_payment_receipts"
  on public.payment_receipts for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_read_recurring_revenue"
  on public.recurring_revenue for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

revoke all on public.financial_obligations from public, anon, authenticated, service_role;
revoke all on public.payment_receipts from public, anon, authenticated, service_role;
revoke all on public.recurring_revenue from public, anon, authenticated, service_role;

grant select on public.financial_obligations to authenticated;
grant select on public.payment_receipts to authenticated;
grant select on public.recurring_revenue to authenticated;

grant select, insert, update on public.financial_obligations to service_role;
grant select, insert on public.payment_receipts to service_role;
grant select, insert, update on public.recurring_revenue to service_role;
