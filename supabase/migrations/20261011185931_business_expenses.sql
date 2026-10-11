-- Owner-managed expenses. Browser roles can read only their workspace.
create table public.expense_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  amount_cents bigint not null check (amount_cents between 1 and 1000000000),
  cadence text not null check (cadence in ('monthly', 'annual')),
  variable boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'canceled')),
  billing_anchor date not null check (billing_anchor between '2000-01-01' and '2100-01-01'),
  next_cycle integer not null default 0 check (next_cycle >= 0),
  operations_project_id uuid references public.operations_projects(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(id, workspace_id)
);
create table public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  amount_cents bigint not null check (amount_cents between 1 and 1000000000),
  due_on date not null,
  paid_on date,
  subscription_id uuid,
  cycle integer,
  operations_project_id uuid references public.operations_projects(id),
  project_cost_id uuid unique references public.project_costs(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (subscription_id, workspace_id) references public.expense_subscriptions(id, workspace_id),
  check ((subscription_id is null and cycle is null) or (subscription_id is not null and cycle >= 0)),
  unique(subscription_id, cycle)
);
create index expense_subscriptions_workspace on public.expense_subscriptions(workspace_id);
create index business_expenses_workspace on public.business_expenses(workspace_id);

create function public.expense_billing_date(anchor date, cadence text, cycle integer)
returns date language sql immutable strict set search_path = '' as $$
  select (anchor + make_interval(months => cycle * case when cadence = 'annual' then 12 else 1 end))::date;
$$;

create function public.validate_business_expense() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.operations_project_id is not null and not exists (
    select 1 from public.operations_projects where id = new.operations_project_id and workspace_id = new.workspace_id
  ) then raise exception 'Project must belong to the expense workspace.'; end if;
  if tg_table_name = 'expense_subscriptions' and tg_op = 'UPDATE' then
    if new.billing_anchor <> old.billing_anchor or new.cadence <> old.cadence then
      raise exception 'Billing schedule is immutable; cancel and add a new subscription.';
    end if;
    if old.status <> 'active' and new.status = 'active' then
      while public.expense_billing_date(new.billing_anchor, new.cadence, new.next_cycle) < (now() at time zone 'America/Chicago')::date loop
        new.next_cycle := new.next_cycle + 1;
      end loop;
    end if;
  end if;
  return new;
end;
$$;
create trigger validate_expense_subscription before insert or update on public.expense_subscriptions for each row execute function public.validate_business_expense();
create trigger validate_business_expense before insert or update on public.business_expenses for each row execute function public.validate_business_expense();

-- Locking the source and recording both expense and optional project cost in one
-- transaction makes concurrent/retried payment confirmations safe.
create function public.pay_business_expense(p_workspace_id uuid, p_id uuid, p_kind text, p_cycle integer, p_amount_cents bigint, p_paid_on date, p_user_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  subscription public.expense_subscriptions;
  expense public.business_expenses;
  cost_id uuid;
begin
  if p_amount_cents is null or p_amount_cents not between 1 and 1000000000 or p_paid_on is null or p_paid_on > (now() at time zone 'America/Chicago')::date then raise exception 'Invalid payment.'; end if;
  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id and role = 'owner' and status = 'active') then raise exception 'Owner required.'; end if;
  if p_kind = 'subscription' then
    select * into subscription from public.expense_subscriptions where id = p_id and workspace_id = p_workspace_id for update;
    if subscription.id is null or subscription.status <> 'active' or p_cycle is null or subscription.next_cycle <> p_cycle then raise exception 'Billing cycle changed.'; end if;
    insert into public.business_expenses(workspace_id, name, category, amount_cents, due_on, paid_on, subscription_id, cycle, operations_project_id, created_by)
    values(p_workspace_id, subscription.name, subscription.category, p_amount_cents, public.expense_billing_date(subscription.billing_anchor, subscription.cadence, p_cycle), p_paid_on, p_id, p_cycle, subscription.operations_project_id, p_user_id)
    returning * into expense;
    update public.expense_subscriptions set next_cycle = next_cycle + 1 where id = p_id;
  elsif p_kind = 'expense' then
    select * into expense from public.business_expenses where id = p_id and workspace_id = p_workspace_id for update;
    if expense.id is null or expense.paid_on is not null or expense.subscription_id is not null then raise exception 'Expense already paid or unavailable.'; end if;
    update public.business_expenses set paid_on = p_paid_on, amount_cents = p_amount_cents where id = p_id returning * into expense;
  else raise exception 'Invalid expense kind.';
  end if;
  if expense.operations_project_id is not null then
    insert into public.project_costs(workspace_id, operations_project_id, description, amount_cents, currency, incurred_on, recovery, created_by)
    values(p_workspace_id, expense.operations_project_id, expense.name, p_amount_cents, 'USD', p_paid_on, 'absorbed', p_user_id) returning id into cost_id;
    update public.business_expenses set project_cost_id = cost_id where id = expense.id;
  end if;
  return expense.id;
end;
$$;

alter table public.expense_subscriptions enable row level security;
alter table public.business_expenses enable row level security;
create policy workspace_read_expense_subscriptions on public.expense_subscriptions for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy workspace_read_business_expenses on public.business_expenses for select to authenticated using ((select private.is_workspace_member(workspace_id)));
revoke all on public.expense_subscriptions, public.business_expenses from public, anon, authenticated, service_role;
grant select on public.expense_subscriptions, public.business_expenses to authenticated;
grant select, insert, update on public.expense_subscriptions, public.business_expenses to service_role;
revoke all on function public.pay_business_expense(uuid, uuid, text, integer, bigint, date, uuid) from public, anon, authenticated;
grant execute on function public.pay_business_expense(uuid, uuid, text, integer, bigint, date, uuid) to service_role;
revoke all on function public.validate_business_expense() from public, anon, authenticated;
revoke all on function public.expense_billing_date(date, text, integer) from public, anon, authenticated;
grant execute on function public.expense_billing_date(date, text, integer) to service_role;
