-- Estimates remain explicit owner evidence, not actual project time or provider state.
create table public.negocio_listo_deal_budgets (
 revision bigint generated always as identity primary key,
 workspace_id uuid not null references public.workspaces(id),
 agreement_id uuid not null,
 client_id uuid not null,
 setup_hours integer not null check(setup_hours between 0 and 99999),
 monthly_hours integer not null check(monthly_hours between 0 and 99999),
 setup_cost_cents bigint not null check(setup_cost_cents between 0 and 1000000000),
 monthly_cost_cents bigint not null check(monthly_cost_cents between 0 and 1000000000),
 window_start date not null,
 window_end date not null check(window_end>=window_start),
 available_hours integer not null check(available_hours between 0 and 99999),
 committed_hours integer not null check(committed_hours between 0 and 99999),
 deal_window_hours integer not null check(deal_window_hours between 1 and 99999),
 labor_cost_complete boolean not null check(labor_cost_complete),
 capacity_complete boolean not null check(capacity_complete),
 verified_on date not null,
 snapshot jsonb not null,
 source_note text not null check(char_length(trim(source_note)) between 1 and 2000),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(agreement_id,workspace_id,client_id) references public.client_service_agreements(id,workspace_id,client_id),
 check(available_hours <= (window_end-window_start+1)::bigint*24),
 check(setup_hours+monthly_hours>0)
);
create index nl_budgets_latest_idx on public.negocio_listo_deal_budgets(workspace_id,agreement_id,revision desc);
create index nl_budgets_fk_idx on public.negocio_listo_deal_budgets(agreement_id,workspace_id,client_id);
create index nl_budgets_client_idx on public.negocio_listo_deal_budgets(client_id);
create index nl_budgets_creator_idx on public.negocio_listo_deal_budgets(created_by);
alter table public.negocio_listo_deal_budgets enable row level security;
revoke all on public.negocio_listo_deal_budgets from public,anon,authenticated,service_role;
grant select,insert on public.negocio_listo_deal_budgets to authenticated;
grant select on public.negocio_listo_deal_budgets to service_role;
revoke all on sequence public.negocio_listo_deal_budgets_revision_seq from public,anon,service_role;
grant usage on sequence public.negocio_listo_deal_budgets_revision_seq to authenticated;
create policy nl_budgets_read on public.negocio_listo_deal_budgets for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy nl_budgets_add on public.negocio_listo_deal_budgets for insert to authenticated with check((select private.is_workspace_owner(workspace_id)) and created_by=(select auth.uid()));

-- Relevant plan content, not review revisions: refreshing identical evidence
-- for another deal must not cause circular completeness invalidation.
create function private.nl_deal_snapshot(w uuid,a_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('agreements',coalesce((select jsonb_agg(jsonb_build_object(
 'id',a.id,'client_id',a.client_id,'product_name',a.product_name,'setup_cents',a.setup_cents,'monthly_cents',a.monthly_cents,'term_months',a.term_months,
 'plan',case when a.id=a_id or b.revision is null then null else jsonb_build_object('setup_hours',b.setup_hours,'monthly_hours',b.monthly_hours,'setup_cost_cents',b.setup_cost_cents,'monthly_cost_cents',b.monthly_cost_cents,'window_start',b.window_start,'window_end',b.window_end,'deal_window_hours',b.deal_window_hours) end
 ) order by a.id) from public.client_service_agreements a left join lateral (
 select * from public.negocio_listo_deal_budgets where workspace_id=w and agreement_id=a.id order by revision desc limit 1
 ) b on true where a.workspace_id=w),'[]'::jsonb),
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'client_id',p.client_id,'service_agreement_id',p.service_agreement_id,'status',p.status,'actual_hours',p.actual_hours,'updated_at',p.updated_at) order by p.id) from public.operations_projects p where p.workspace_id=w),'[]'::jsonb),
 'costs',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'operations_project_id',c.operations_project_id,'amount_cents',c.amount_cents,'incurred_on',c.incurred_on,'updated_at',c.updated_at) order by c.id) from public.project_costs c where c.workspace_id=w),'[]'::jsonb));
$$;
revoke all on function private.nl_deal_snapshot(uuid,uuid) from public,anon,service_role;
grant execute on function private.nl_deal_snapshot(uuid,uuid) to authenticated;

create function private.guard_nl_deal_budget() returns trigger language plpgsql security invoker set search_path='' as $$
declare a public.client_service_agreements; total_hours bigint; spent numeric; spent_cost numeric; links integer; today date:=(now() at time zone 'America/Chicago')::date;
begin
 if tg_op<>'INSERT' then raise exception 'Deal budgets are append-only' using errcode='42501';end if;
 if auth.uid() is null or not private.is_workspace_owner(new.workspace_id) then raise exception 'Signed-in owner required' using errcode='42501';end if;
 select * into a from public.client_service_agreements where id=new.agreement_id and workspace_id=new.workspace_id and client_id=new.client_id and trim(product_name) ~* '^negocio listo(\s|$|[—-])';
 if a.id is null then raise exception 'Same-client Negocio Listo agreement required' using errcode='23514';end if;
 if new.verified_on is distinct from today or new.window_start<today or new.snapshot is distinct from private.nl_deal_snapshot(new.workspace_id,new.agreement_id) then
 raise exception 'Records or Chicago date changed; reload and review the complete budget and capacity window' using errcode='23514';end if;
 total_hours:=new.setup_hours::bigint+new.monthly_hours::bigint*a.term_months;
 if total_hours<=0 or new.deal_window_hours>total_hours then raise exception 'Window demand must fit the positive full-term labor budget' using errcode='23514';end if;
 select count(*),sum(actual_hours) into links,spent from public.operations_projects where workspace_id=new.workspace_id and client_id=new.client_id and service_agreement_id=new.agreement_id;
 if links<>1 then raise exception 'Link exactly one same-client Operations project before confirming the budget' using errcode='23514';end if;
 if spent>total_hours then raise exception 'Full-term labor budget cannot be below recorded hours already spent' using errcode='23514';end if;
 select sum(c.amount_cents) into spent_cost from public.project_costs c join public.operations_projects p on p.id=c.operations_project_id and p.workspace_id=c.workspace_id where p.workspace_id=new.workspace_id and p.service_agreement_id=new.agreement_id and p.client_id=new.client_id;
 if spent_cost>new.setup_cost_cents+new.monthly_cost_cents*a.term_months then raise exception 'Full-term direct-cost budget cannot be below recorded project costs' using errcode='23514';end if;
 new.created_by:=auth.uid();new.created_at:=clock_timestamp();return new;
end $$;
revoke all on function private.guard_nl_deal_budget() from public,anon,authenticated,service_role;
create trigger nl_deal_budget_guard before insert or update or delete on public.negocio_listo_deal_budgets for each row execute function private.guard_nl_deal_budget();
