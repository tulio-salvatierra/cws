-- Sales S1 owns only the state needed for a deterministic daily command queue.
-- Existing leads remain deliberately unclassified until an owner classifies them.
alter table public.leads
  add column sales_classification text,
  add column response_state text,
  add column phone text,
  add column locality text,
  add constraint leads_sales_classification_check
    check (sales_classification is null or sales_classification in ('inbound', 'prospect')),
  add constraint leads_response_state_check
    check (response_state is null or response_state in ('no_response', 'warm', 'neutral')),
  add constraint leads_phone_check
    check (phone is null or (phone = btrim(phone) and char_length(phone) between 3 and 50)),
  add constraint leads_locality_check
    check (locality is null or (locality = btrim(locality) and char_length(locality) between 1 and 200));

create table public.sales_promised_actions (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  lead_id uuid not null,
  action_text text not null check (action_text = btrim(action_text) and char_length(action_text) between 1 and 500),
  due_on date not null,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (lead_id, workspace_id)
    references public.leads(id, workspace_id)
    on delete restrict
);

create index sales_promised_actions_open_due_idx
  on public.sales_promised_actions (workspace_id, due_on, created_at)
  where completed_at is null;

create index sales_promised_actions_workspace_id_idx
  on public.sales_promised_actions (workspace_id);

create index sales_promised_actions_lead_workspace_idx
  on public.sales_promised_actions (lead_id, workspace_id);

create index sales_promised_actions_created_by_idx
  on public.sales_promised_actions (created_by);

alter table public.sales_promised_actions enable row level security;

create policy "sales_promised_actions_no_browser_access"
  on public.sales_promised_actions
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

revoke all on public.sales_promised_actions from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.sales_promised_actions to service_role;
