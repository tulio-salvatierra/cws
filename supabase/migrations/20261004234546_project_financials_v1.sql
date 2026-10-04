-- Project Financials V1 extends the existing Operations and Accounting
-- foundations. It does not invoice, charge cards, or create a general ledger.

alter table public.financial_obligations
  drop constraint financial_obligations_obligation_type_check,
  add constraint financial_obligations_obligation_type_check
    check (obligation_type in ('deposit', 'milestone', 'final_payment', 'recurring', 'other', 'service', 'add_on', 'reimbursement'));

alter table public.operations_projects
  add column actual_hours numeric(6, 1) check (actual_hours is null or actual_hours >= 0);

create table public.project_costs (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  operations_project_id uuid not null,
  description text not null check (description = btrim(description) and char_length(description) between 1 and 500),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  currency text not null default 'USD' check (currency = 'USD'),
  incurred_on date not null,
  recovery text not null default 'undecided' check (recovery in ('undecided', 'billed', 'absorbed')),
  reimbursed_by_obligation_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (operations_project_id, workspace_id)
    references public.operations_projects(id, workspace_id) on delete restrict,
  foreign key (reimbursed_by_obligation_id, workspace_id)
    references public.financial_obligations(id, workspace_id) on delete restrict,
  check ((recovery = 'billed') = (reimbursed_by_obligation_id is not null))
);

create index project_costs_project_workspace_idx
  on public.project_costs (operations_project_id, workspace_id, incurred_on desc);

create or replace function public.ensure_project_cost_reimbursement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  project_client_id uuid;
  obligation record;
begin
  if new.reimbursed_by_obligation_id is null then
    return new;
  end if;

  select client_id into project_client_id
  from public.operations_projects
  where id = new.operations_project_id and workspace_id = new.workspace_id;

  select client_id, operations_project_id, obligation_type into obligation
  from public.financial_obligations
  where id = new.reimbursed_by_obligation_id and workspace_id = new.workspace_id;

  if project_client_id is null or obligation.client_id is null
    or obligation.client_id <> project_client_id
    or obligation.operations_project_id <> new.operations_project_id
    or obligation.obligation_type <> 'reimbursement' then
    raise exception 'A billed project cost must link to a reimbursement for the same client and Operations project.';
  end if;
  return new;
end;
$$;

create trigger project_costs_validate_reimbursement
before insert or update of workspace_id, operations_project_id, recovery, reimbursed_by_obligation_id
on public.project_costs
for each row execute function public.ensure_project_cost_reimbursement();

create trigger project_costs_updated_at
before update on public.project_costs
for each row execute function public.update_updated_at();

create or replace function public.create_project_cost_with_reimbursement(
  p_workspace_id uuid,
  p_operations_project_id uuid,
  p_description text,
  p_amount_cents bigint,
  p_incurred_on date,
  p_recovery text,
  p_reimbursement_amount_cents bigint,
  p_created_by uuid
)
returns public.project_costs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  project_row public.operations_projects;
  obligation_row public.financial_obligations;
  cost_row public.project_costs;
begin
  select * into project_row from public.operations_projects
  where id = p_operations_project_id and workspace_id = p_workspace_id;
  if project_row.id is null then raise exception 'Operations project not found in this workspace.'; end if;
  if p_description is null or p_description <> btrim(p_description) or char_length(p_description) not between 1 and 500 then raise exception 'A cost description is required.'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'A positive cost amount is required.'; end if;
  if p_incurred_on is null then raise exception 'An incurred date is required.'; end if;
  if p_recovery not in ('undecided', 'billed', 'absorbed') then raise exception 'A valid cost recovery status is required.'; end if;
  if p_recovery = 'billed' and (p_reimbursement_amount_cents is null or p_reimbursement_amount_cents <= 0) then raise exception 'A positive reimbursement amount is required.'; end if;

  if p_recovery = 'billed' then
    insert into public.financial_obligations (workspace_id, client_id, operations_project_id, description, amount_cents, currency, obligation_type, status, created_by)
    values (p_workspace_id, project_row.client_id, p_operations_project_id, p_description, p_reimbursement_amount_cents, 'USD', 'reimbursement', 'expected', p_created_by)
    returning * into obligation_row;
  end if;

  insert into public.project_costs (workspace_id, operations_project_id, description, amount_cents, currency, incurred_on, recovery, reimbursed_by_obligation_id, created_by)
  values (p_workspace_id, p_operations_project_id, p_description, p_amount_cents, 'USD', p_incurred_on, p_recovery, obligation_row.id, p_created_by)
  returning * into cost_row;
  return cost_row;
end;
$$;

create or replace view public.project_financial_summary
with (security_invoker = true)
as
with obligation_totals as (
  select operations_project_id, workspace_id, sum(amount_cents)::bigint as contracted_cents
  from public.financial_obligations
  where status = 'expected' and operations_project_id is not null
  group by operations_project_id, workspace_id
), receipt_totals as (
  select obligation.operations_project_id, obligation.workspace_id, sum(receipt.amount_cents)::bigint as received_cents
  from public.financial_obligations obligation
  join public.payment_receipts receipt on receipt.financial_obligation_id = obligation.id and receipt.workspace_id = obligation.workspace_id
  where obligation.status = 'expected' and obligation.operations_project_id is not null
  group by obligation.operations_project_id, obligation.workspace_id
), cost_totals as (
  select operations_project_id, workspace_id, sum(amount_cents)::bigint as direct_cost_cents,
    count(*) filter (where recovery = 'undecided')::integer as undecided_cost_count
  from public.project_costs
  group by operations_project_id, workspace_id
)
select project.id as operations_project_id,
  project.workspace_id,
  coalesce(obligation_totals.contracted_cents, 0)::bigint as contracted_cents,
  coalesce(receipt_totals.received_cents, 0)::bigint as received_cents,
  greatest(coalesce(obligation_totals.contracted_cents, 0) - coalesce(receipt_totals.received_cents, 0), 0)::bigint as outstanding_cents,
  coalesce(cost_totals.direct_cost_cents, 0)::bigint as direct_cost_cents,
  (coalesce(obligation_totals.contracted_cents, 0) - coalesce(cost_totals.direct_cost_cents, 0))::bigint as margin_cents,
  (coalesce(receipt_totals.received_cents, 0) - coalesce(cost_totals.direct_cost_cents, 0))::bigint as cash_margin_cents,
  project.actual_hours,
  case when project.actual_hours is null or project.actual_hours = 0 then null else round((coalesce(obligation_totals.contracted_cents, 0) - coalesce(cost_totals.direct_cost_cents, 0)) / project.actual_hours)::bigint end as effective_hourly_rate_cents,
  coalesce(cost_totals.undecided_cost_count, 0)::integer as undecided_cost_count
from public.operations_projects project
left join obligation_totals on obligation_totals.operations_project_id = project.id and obligation_totals.workspace_id = project.workspace_id
left join receipt_totals on receipt_totals.operations_project_id = project.id and receipt_totals.workspace_id = project.workspace_id
left join cost_totals on cost_totals.operations_project_id = project.id and cost_totals.workspace_id = project.workspace_id;

alter table public.project_costs enable row level security;
create policy "workspace_members_can_read_project_costs"
  on public.project_costs for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

revoke all on public.project_costs from public, anon, authenticated, service_role;
revoke all on function public.create_project_cost_with_reimbursement(uuid, uuid, text, bigint, date, text, bigint, uuid) from public, anon, authenticated;
grant select on public.project_costs to authenticated;
grant select, insert, update on public.project_costs to service_role;
grant select on public.project_financial_summary to authenticated, service_role;
grant execute on function public.create_project_cost_with_reimbursement(uuid, uuid, text, bigint, date, text, bigint, uuid) to service_role;
