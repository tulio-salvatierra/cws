-- Bind completeness to the exact register and date the owner reviewed.
create or replace function private.guard_negocio_listo_evidence() returns trigger language plpgsql security invoker set search_path='' as $$
declare today date:=(now() at time zone 'America/Chicago')::date; current_snapshot jsonb;
begin
 if tg_op<>'INSERT' then raise exception 'Goal evidence is append-only' using errcode='42501';end if;
 if auth.uid() is null or not private.is_workspace_owner(new.workspace_id) then raise exception 'Signed-in owner required' using errcode='42501';end if;
 new.created_by:=auth.uid();new.created_at:=clock_timestamp();
 if tg_table_name='negocio_listo_evidence' then
  if not exists(select 1 from public.client_service_agreements where id=new.agreement_id and workspace_id=new.workspace_id and client_id=new.client_id and trim(product_name) ~* '^negocio listo(\s|$|[—-])') then
   raise exception 'A Negocio Listo agreement in this workspace is required' using errcode='23514';end if;
 else
  -- Snapshot is computed here, never trusted from the browser. A changed row or
  -- new agreement invalidates the attestation during the next read.
  current_snapshot:=private.negocio_listo_snapshot(new.workspace_id);
  if new.confirmed_on is distinct from today or new.snapshot is distinct from current_snapshot then
   raise exception 'The register or Chicago date changed. Reload and review before confirming completeness' using errcode='23514';end if;
  new.snapshot:=current_snapshot;new.confirmed_on:=today;
  if exists(select 1 from jsonb_array_elements(new.snapshot) s left join public.negocio_listo_evidence e on e.revision=(s->>'revision')::bigint
   where e.revision is null or (e.counts_toward_goal and (e.signature_status='unknown' or e.subscription_status='unknown' or e.status_on<>today))) then
   raise exception 'Review every agreement and current-day subscription status before confirming completeness' using errcode='23514';end if;
  if exists(select e.client_id from jsonb_array_elements(new.snapshot) s join public.negocio_listo_evidence e on e.revision=(s->>'revision')::bigint
   where e.counts_toward_goal group by e.client_id having count(*)>1) then
   raise exception 'Count only one core subscription per client; explicitly exclude add-ons or replaced agreements' using errcode='23514';end if;
 end if;
 return new;
end $$;
