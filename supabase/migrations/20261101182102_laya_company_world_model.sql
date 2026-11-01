-- Additive context substrate. Existing workspace is the canonical company.
-- No seeds, activation, external actions, or changes to existing evaluations.
begin;
create function private.valid_company_metrics(metrics jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare item jsonb;
begin
  if metrics is null then return true; end if;
  if jsonb_typeof(metrics) <> 'object' then return false; end if;
  for item in select value from jsonb_each(metrics) loop
    if jsonb_typeof(item) <> 'object'
      or not (item ? 'value') or jsonb_typeof(item->'value') not in ('number','null')
      or jsonb_typeof(item->'unit') is distinct from 'string' or length(btrim(item->>'unit')) = 0
      or jsonb_typeof(item->'source') is distinct from 'string' or length(btrim(item->>'source')) = 0 then
      return false;
    end if;
  end loop;
  return true;
end $$;
revoke all on function private.valid_company_metrics(jsonb) from public;
grant execute on function private.valid_company_metrics(jsonb) to authenticated, service_role;
create unique index business_decisions_world_identity on public.business_decisions(id,workspace_id);
create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  unique (workspace_id),
  mission text,
  objective text,
  legal_structure text,
  operating_geography text[],
  jurisdictions text[],
  human_capabilities text[],
  company_capabilities text[],
  strategic_principles text[]
);
create table public.company_state_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  financial jsonb check (jsonb_typeof(financial) = 'object'),
  sales_pipeline jsonb check (jsonb_typeof(sales_pipeline) = 'object'),
  clients_projects jsonb check (jsonb_typeof(clients_projects) = 'object'),
  marketing jsonb check (jsonb_typeof(marketing) = 'object'),
  capacity jsonb check (jsonb_typeof(capacity) = 'object'),
  blockers text[],
  unknowns text[]
);
create table public.company_units (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  unit_key text not null check (length(btrim(unit_key)) between 1 and 80),
  name text not null check (length(btrim(name)) between 1 and 200),
  kind text,
  status text not null default 'proposed' check (status in ('proposed','active','paused','retired')),
  performance jsonb check (private.valid_company_metrics(performance)),
  unique (workspace_id, unit_key)
);
create table public.company_constraints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  category text not null check (category in ('legal','jurisdictional','financial','platform','owner_time','risk','prohibited_action')),
  statement text not null check (length(btrim(statement)) > 0),
  jurisdiction text,
  status text not null default 'unverified' check (status in ('unverified','confirmed','retired')),
  source_url text check (source_url ~ '^https?://[^[:space:]]+$'),
  check (status <> 'confirmed' or category not in ('legal','jurisdictional','platform') or
    (source_url is not null and observed_at is not null and valid_until is not null))
);
create table public.company_opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  unit_id uuid,
  title text not null check (length(btrim(title)) between 1 and 200),
  hypothesis text,
  expected_value_cents bigint check (expected_value_cents between 0 and 9007199254740991),
  cost_cents bigint check (cost_cents between 0 and 9007199254740991),
  currency text check (currency ~ '^[A-Z]{3}$'),
  human_hours integer check (human_hours >= 0),
  scalability text,
  strategic_value text,
  risk text,
  confidence numeric check (confidence between 0 and 1),
  success_criteria text,
  deadline date,
  status text not null default 'candidate' check (status in ('candidate','testing','paused','completed','rejected')),
  foreign key (unit_id,workspace_id) references public.company_units(id,workspace_id),
  check ((expected_value_cents is null and cost_cents is null) or currency is not null)
);
create table public.company_decision_contexts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  decision_id uuid not null,
  state_snapshot_id uuid,
  opportunity_id uuid,
  alternatives jsonb check (jsonb_typeof(alternatives) = 'array'),
  rationale text,
  expected_outcome text,
  assumptions text[],
  confidence numeric check (confidence between 0 and 1),
  decision_snapshot jsonb not null default '{}' check (jsonb_typeof(decision_snapshot) = 'object'),
  foreign key (decision_id,workspace_id) references public.business_decisions(id,workspace_id),
  foreign key (state_snapshot_id,workspace_id) references public.company_state_snapshots(id,workspace_id),
  foreign key (opportunity_id,workspace_id) references public.company_opportunities(id,workspace_id)
);
create table public.company_outcomes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_note text not null check (length(btrim(source_note)) between 1 and 4000),
  observed_at timestamptz,
  valid_until timestamptz,
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  check (valid_until is null or (observed_at is not null and valid_until > observed_at)),
  unique (id, workspace_id),
  decision_context_id uuid not null,
  actual_outcome text,
  metrics jsonb check (private.valid_company_metrics(metrics)),
  human_feedback text,
  lesson text,
  recommendation text check (recommendation in ('scale','modify','kill','observe')),
  foreign key (decision_context_id,workspace_id) references public.company_decision_contexts(id,workspace_id)
);

create function private.protect_company_context() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_workspace_owner(new.workspace_id) then
    raise exception 'Signed-in active owner required' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (new.id,new.workspace_id,new.created_by,new.created_at)
      is distinct from (old.id,old.workspace_id,old.created_by,old.created_at) then
    raise exception 'Context identity and provenance are immutable' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  end if;
  new.updated_at := now();
  if new.observed_at > now() then
    raise exception 'Evidence observation cannot be in the future' using errcode = '23514';
  end if;
  if tg_table_name = 'company_decision_contexts' then
    select to_jsonb(d) into new.decision_snapshot from public.business_decisions d
      where d.id = new.decision_id and d.workspace_id = new.workspace_id;
    if new.decision_snapshot is null then
      raise exception 'Same-workspace decision required' using errcode = '23503';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.protect_company_context() from public;

alter table public.company_profiles enable row level security;
revoke all on public.company_profiles from anon, authenticated, service_role;
grant select, insert, update on public.company_profiles to authenticated;
grant select on public.company_profiles to service_role;
create policy company_profiles_read on public.company_profiles for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_profiles_insert on public.company_profiles for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create policy company_profiles_update on public.company_profiles for update to authenticated
  using ((select private.is_workspace_owner(workspace_id)))
  with check ((select private.is_workspace_owner(workspace_id)));
create trigger company_profiles_provenance before insert or update on public.company_profiles
  for each row execute function private.protect_company_context();
create index company_profiles_workspace_time on public.company_profiles(workspace_id,created_at desc,id desc);

alter table public.company_state_snapshots enable row level security;
revoke all on public.company_state_snapshots from anon, authenticated, service_role;
grant select, insert on public.company_state_snapshots to authenticated;
grant select on public.company_state_snapshots to service_role;
create policy company_state_snapshots_read on public.company_state_snapshots for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_state_snapshots_insert on public.company_state_snapshots for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create trigger company_state_snapshots_provenance before insert or update on public.company_state_snapshots
  for each row execute function private.protect_company_context();
create index company_state_snapshots_workspace_time on public.company_state_snapshots(workspace_id,created_at desc,id desc);

alter table public.company_units enable row level security;
revoke all on public.company_units from anon, authenticated, service_role;
grant select, insert, update on public.company_units to authenticated;
grant select on public.company_units to service_role;
create policy company_units_read on public.company_units for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_units_insert on public.company_units for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create policy company_units_update on public.company_units for update to authenticated
  using ((select private.is_workspace_owner(workspace_id)))
  with check ((select private.is_workspace_owner(workspace_id)));
create trigger company_units_provenance before insert or update on public.company_units
  for each row execute function private.protect_company_context();
create index company_units_workspace_time on public.company_units(workspace_id,created_at desc,id desc);

alter table public.company_constraints enable row level security;
revoke all on public.company_constraints from anon, authenticated, service_role;
grant select, insert, update on public.company_constraints to authenticated;
grant select on public.company_constraints to service_role;
create policy company_constraints_read on public.company_constraints for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_constraints_insert on public.company_constraints for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create policy company_constraints_update on public.company_constraints for update to authenticated
  using ((select private.is_workspace_owner(workspace_id)))
  with check ((select private.is_workspace_owner(workspace_id)));
create trigger company_constraints_provenance before insert or update on public.company_constraints
  for each row execute function private.protect_company_context();
create index company_constraints_workspace_time on public.company_constraints(workspace_id,created_at desc,id desc);

alter table public.company_opportunities enable row level security;
revoke all on public.company_opportunities from anon, authenticated, service_role;
grant select, insert, update on public.company_opportunities to authenticated;
grant select on public.company_opportunities to service_role;
create policy company_opportunities_read on public.company_opportunities for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_opportunities_insert on public.company_opportunities for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create policy company_opportunities_update on public.company_opportunities for update to authenticated
  using ((select private.is_workspace_owner(workspace_id)))
  with check ((select private.is_workspace_owner(workspace_id)));
create trigger company_opportunities_provenance before insert or update on public.company_opportunities
  for each row execute function private.protect_company_context();
create index company_opportunities_workspace_time on public.company_opportunities(workspace_id,created_at desc,id desc);

alter table public.company_decision_contexts enable row level security;
revoke all on public.company_decision_contexts from anon, authenticated, service_role;
grant select, insert on public.company_decision_contexts to authenticated;
grant select on public.company_decision_contexts to service_role;
create policy company_decision_contexts_read on public.company_decision_contexts for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_decision_contexts_insert on public.company_decision_contexts for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create trigger company_decision_contexts_provenance before insert or update on public.company_decision_contexts
  for each row execute function private.protect_company_context();
create index company_decision_contexts_workspace_time on public.company_decision_contexts(workspace_id,created_at desc,id desc);

alter table public.company_outcomes enable row level security;
revoke all on public.company_outcomes from anon, authenticated, service_role;
grant select, insert on public.company_outcomes to authenticated;
grant select on public.company_outcomes to service_role;
create policy company_outcomes_read on public.company_outcomes for select to authenticated
  using ((select private.is_workspace_owner(workspace_id)));
create policy company_outcomes_insert on public.company_outcomes for insert to authenticated
  with check ((select private.is_workspace_owner(workspace_id)) and created_by = (select auth.uid()));
create trigger company_outcomes_provenance before insert or update on public.company_outcomes
  for each row execute function private.protect_company_context();
create index company_outcomes_workspace_time on public.company_outcomes(workspace_id,created_at desc,id desc);
commit;
