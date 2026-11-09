-- DEC-040: Negocio Listo monthly billing starts 14 days after the setup payment,
-- which can be a date in the near future. start_client_service_agreement_billing
-- keeps its "actual date, today or earlier" rule for manual starts; this function
-- schedules a start up to 31 days ahead and creates the same monthly bills.
create function public.schedule_client_service_agreement_billing(p_workspace_id uuid,p_user_id uuid,p_id uuid,p_billing_start_date date)
returns uuid language plpgsql security invoker set search_path='' as $$
declare a public.client_service_agreements; n integer; due date; obligation_id uuid; monthly_count integer; today date := (now() at time zone 'America/Chicago')::date;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner' and status='active') then raise exception 'Owner required'; end if;
 if p_billing_start_date is null or p_billing_start_date < today - 60 or p_billing_start_date > today + 31 then raise exception 'Billing start must be within 60 days before or 31 days after today'; end if;
 select * into a from public.client_service_agreements where id=p_id and workspace_id=p_workspace_id for update;
 if a.id is null then raise exception 'Agreement not found'; end if;
 select count(*) into monthly_count from public.agreement_installments where agreement_id=p_id and installment between 1 and a.term_months;
 if a.billing_start_date is not null then
   if a.billing_start_date <> p_billing_start_date then raise exception 'Billing already scheduled on a different date'; end if;
   if monthly_count <> a.term_months then raise exception 'Existing billing schedule is incomplete'; end if;
   return a.id;
 end if;
 if monthly_count <> 0 then raise exception 'Monthly billing rows exist without a recorded billing start'; end if;
 update public.client_service_agreements set billing_start_date=p_billing_start_date where id=p_id;
 for n in 1..a.term_months loop
   due := (p_billing_start_date + pg_catalog.make_interval(months=>n-1))::date;
   insert into public.financial_obligations(workspace_id,client_id,description,amount_cents,obligation_type,due_date,created_by)
   values(p_workspace_id,a.client_id,a.product_name || ' — month ' || n || '/' || a.term_months,a.monthly_cents,'recurring',due,p_user_id) returning id into obligation_id;
   insert into public.agreement_installments(agreement_id,workspace_id,installment,financial_obligation_id) values(p_id,p_workspace_id,n,obligation_id);
 end loop;
 return a.id;
end;
$$;
revoke all on function public.schedule_client_service_agreement_billing(uuid,uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.schedule_client_service_agreement_billing(uuid,uuid,uuid,date) to service_role;
