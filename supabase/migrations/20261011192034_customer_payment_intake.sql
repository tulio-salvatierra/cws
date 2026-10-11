-- Create a customer-linked expected item and its receipt atomically.
-- The caller-generated receipt ID makes retries of the same form idempotent.
create function public.record_customer_payment(
  p_workspace_id uuid, p_client_id uuid, p_project_id uuid, p_description text,
  p_amount_cents bigint, p_received_at timestamptz, p_payment_method text,
  p_reference_note text, p_user_id uuid, p_receipt_id uuid
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare existing public.payment_receipts; obligation_id uuid;
begin
  if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner' and status='active') then raise exception 'Owner required.'; end if;
  if p_receipt_id is null then raise exception 'Receipt identifier required.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_receipt_id::text, 0));
  select * into existing from public.payment_receipts where id=p_receipt_id;
  if existing.id is not null then
    if existing.workspace_id <> p_workspace_id or existing.recorded_by <> p_user_id or existing.amount_cents <> p_amount_cents
      or existing.received_at <> p_received_at or existing.payment_method <> p_payment_method
      or existing.reference_note is distinct from p_reference_note
      or not exists(select 1 from public.financial_obligations where id=existing.financial_obligation_id and client_id=p_client_id and operations_project_id is not distinct from p_project_id and description=p_description)
      then raise exception 'Receipt identifier already used.'; end if;
    return existing.id;
  end if;
  if not exists(select 1 from public.clients where id=p_client_id and workspace_id=p_workspace_id and status='active') then raise exception 'Active customer required.'; end if;
  if p_project_id is not null and not exists(select 1 from public.operations_projects where id=p_project_id and client_id=p_client_id and workspace_id=p_workspace_id) then raise exception 'Project must belong to customer.'; end if;
  insert into public.financial_obligations(workspace_id,client_id,operations_project_id,description,amount_cents,currency,obligation_type,status,created_by)
  values(p_workspace_id,p_client_id,p_project_id,p_description,p_amount_cents,'USD','other','expected',p_user_id) returning id into obligation_id;
  insert into public.payment_receipts(id,workspace_id,financial_obligation_id,amount_cents,received_at,payment_method,reference_note,recorded_by)
  values(p_receipt_id,p_workspace_id,obligation_id,p_amount_cents,p_received_at,p_payment_method,p_reference_note,p_user_id);
  return p_receipt_id;
end;
$$;
revoke all on function public.record_customer_payment(uuid,uuid,uuid,text,bigint,timestamptz,text,text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.record_customer_payment(uuid,uuid,uuid,text,bigint,timestamptz,text,text,uuid,uuid) to service_role;
