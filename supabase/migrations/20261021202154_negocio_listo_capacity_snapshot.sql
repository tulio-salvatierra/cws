-- Other-deal availability and commitments are relevant reviewed capacity facts.
create or replace function private.nl_deal_snapshot(w uuid,a_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('agreements',coalesce((select jsonb_agg(jsonb_build_object(
 'id',a.id,'client_id',a.client_id,'product_name',a.product_name,'setup_cents',a.setup_cents,'monthly_cents',a.monthly_cents,'term_months',a.term_months,
 'plan',case when a.id=a_id or b.revision is null then null else jsonb_build_object('setup_hours',b.setup_hours,'monthly_hours',b.monthly_hours,'setup_cost_cents',b.setup_cost_cents,'monthly_cost_cents',b.monthly_cost_cents,'window_start',b.window_start,'window_end',b.window_end,'deal_window_hours',b.deal_window_hours,'available_hours',b.available_hours,'committed_hours',b.committed_hours) end
 ) order by a.id) from public.client_service_agreements a left join lateral (
 select * from public.negocio_listo_deal_budgets where workspace_id=w and agreement_id=a.id order by revision desc limit 1
 ) b on true where a.workspace_id=w),'[]'::jsonb),
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'client_id',p.client_id,'service_agreement_id',p.service_agreement_id,'status',p.status,'actual_hours',p.actual_hours,'updated_at',p.updated_at) order by p.id) from public.operations_projects p where p.workspace_id=w),'[]'::jsonb),
 'costs',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'operations_project_id',c.operations_project_id,'amount_cents',c.amount_cents,'incurred_on',c.incurred_on,'updated_at',c.updated_at) order by c.id) from public.project_costs c where c.workspace_id=w),'[]'::jsonb));
$$;
