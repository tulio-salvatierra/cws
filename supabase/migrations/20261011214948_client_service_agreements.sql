-- Client-specific terms are snapshots; catalog edits never change an agreement.
create table public.client_service_agreements (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id),
 client_id uuid not null,
 offer_id uuid references public.offers(id),
 product_name text not null check(length(btrim(product_name)) between 1 and 200),
 setup_cents bigint not null check(setup_cents between 0 and 1000000000),
 monthly_cents bigint not null check(monthly_cents between 1 and 1000000000),
 term_months integer not null check(term_months between 1 and 60),
 launch_date date check(launch_date between '2000-01-01' and '2100-01-01'),
 square_subscription_reference text check(length(square_subscription_reference) between 1 and 200),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(id,workspace_id),
 foreign key(client_id,workspace_id) references public.clients(id,workspace_id)
);
create table public.agreement_installments (
 id uuid primary key default extensions.uuid_generate_v4(),
 agreement_id uuid not null,
 workspace_id uuid not null,
 installment integer not null check(installment between 0 and 60),
 financial_obligation_id uuid not null unique,
 unique(agreement_id,installment),
 foreign key(agreement_id,workspace_id) references public.client_service_agreements(id,workspace_id),
 foreign key(financial_obligation_id,workspace_id) references public.financial_obligations(id,workspace_id)
);
create index client_service_agreements_workspace_idx on public.client_service_agreements(workspace_id,client_id);
create index client_service_agreements_offer_idx on public.client_service_agreements(offer_id);
create index client_service_agreements_creator_idx on public.client_service_agreements(created_by);
create index agreement_installments_workspace_idx on public.agreement_installments(workspace_id);
alter table public.client_service_agreements enable row level security;
alter table public.agreement_installments enable row level security;
create policy agreements_read on public.client_service_agreements for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy installments_read on public.agreement_installments for select to authenticated using((select private.is_workspace_member(workspace_id)));
revoke all on public.client_service_agreements,public.agreement_installments from public,anon,authenticated,service_role;
grant select on public.client_service_agreements,public.agreement_installments to authenticated;
grant select,insert,update on public.client_service_agreements to service_role;
grant select,insert on public.agreement_installments to service_role;

create function public.create_client_service_agreement(p_workspace_id uuid,p_user_id uuid,p_id uuid,p_client_id uuid,p_offer_id uuid,p_product_name text,p_setup_cents bigint,p_monthly_cents bigint,p_term_months integer,p_setup_obligation_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare a public.client_service_agreements; o public.financial_obligations; setup_id uuid;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner' and status='active') then raise exception 'Owner required'; end if;
 if p_id is null then raise exception 'Agreement identifier required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text,0));
 select * into a from public.client_service_agreements where id=p_id;
 if a.id is not null then
   if a.workspace_id is distinct from p_workspace_id or a.client_id is distinct from p_client_id or a.offer_id is distinct from p_offer_id or a.product_name is distinct from p_product_name or a.setup_cents is distinct from p_setup_cents or a.monthly_cents is distinct from p_monthly_cents or a.term_months is distinct from p_term_months then raise exception 'Agreement identifier already used'; end if;
   if p_setup_obligation_id is not null and not exists(select 1 from public.agreement_installments where agreement_id=p_id and installment=0 and financial_obligation_id=p_setup_obligation_id) then raise exception 'Setup link differs'; end if;
   return a.id;
 end if;
 if not exists(select 1 from public.clients where id=p_client_id and workspace_id=p_workspace_id and status='active') then raise exception 'Active customer required'; end if;
 if p_offer_id is not null and not exists(select 1 from public.offers where id=p_offer_id and workspace_id=p_workspace_id) then raise exception 'Product must belong to workspace'; end if;
 if p_setup_obligation_id is not null then
   select * into o from public.financial_obligations where id=p_setup_obligation_id and workspace_id=p_workspace_id for update;
   if o.id is null or o.client_id is distinct from p_client_id or o.amount_cents is distinct from p_setup_cents or o.status <> 'expected' or p_setup_cents=0 then raise exception 'Setup must match customer and agreed amount'; end if;
   setup_id := o.id;
 end if;
 insert into public.client_service_agreements(id,workspace_id,client_id,offer_id,product_name,setup_cents,monthly_cents,term_months,created_by)
 values(p_id,p_workspace_id,p_client_id,p_offer_id,p_product_name,p_setup_cents,p_monthly_cents,p_term_months,p_user_id);
 if p_setup_cents>0 then
   if setup_id is null then
     insert into public.financial_obligations(workspace_id,client_id,description,amount_cents,obligation_type,due_date,created_by)
     values(p_workspace_id,p_client_id,p_product_name || ' — setup',p_setup_cents,'other',(now() at time zone 'America/Chicago')::date,p_user_id) returning id into setup_id;
   end if;
   insert into public.agreement_installments(agreement_id,workspace_id,installment,financial_obligation_id) values(p_id,p_workspace_id,0,setup_id);
 end if;
 return p_id;
end;
$$;

create function public.launch_client_service_agreement(p_workspace_id uuid,p_user_id uuid,p_id uuid,p_launch_date date)
returns uuid language plpgsql security invoker set search_path='' as $$
declare a public.client_service_agreements; n integer; due date; obligation_id uuid;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner' and status='active') then raise exception 'Owner required'; end if;
 if p_launch_date is null or p_launch_date > (now() at time zone 'America/Chicago')::date then raise exception 'Confirm an actual launch date'; end if;
 select * into a from public.client_service_agreements where id=p_id and workspace_id=p_workspace_id for update;
 if a.id is null then raise exception 'Agreement not found'; end if;
 if a.launch_date is not null then
   if a.launch_date <> p_launch_date then raise exception 'Agreement already launched on a different date'; end if;
   return a.id;
 end if;
 update public.client_service_agreements set launch_date=p_launch_date where id=p_id;
 for n in 1..a.term_months loop
   due := (p_launch_date + pg_catalog.make_interval(months=>n-1))::date;
   insert into public.financial_obligations(workspace_id,client_id,description,amount_cents,obligation_type,due_date,created_by)
   values(p_workspace_id,a.client_id,a.product_name || ' — month ' || n || '/' || a.term_months,a.monthly_cents,'recurring',due,p_user_id) returning id into obligation_id;
   insert into public.agreement_installments(agreement_id,workspace_id,installment,financial_obligation_id) values(p_id,p_workspace_id,n,obligation_id);
 end loop;
 return a.id;
end;
$$;

create function public.record_agreement_payment(p_workspace_id uuid,p_user_id uuid,p_obligation_id uuid,p_receipt_id uuid,p_amount_cents bigint,p_received_at timestamptz,p_method text,p_note text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.payment_receipts;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner' and status='active') then raise exception 'Owner required'; end if;
 if p_receipt_id is null then raise exception 'Receipt identifier required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_receipt_id::text,0));
 select * into r from public.payment_receipts where id=p_receipt_id;
 if r.id is not null then
   if r.workspace_id is distinct from p_workspace_id or r.financial_obligation_id is distinct from p_obligation_id or r.amount_cents is distinct from p_amount_cents or r.received_at is distinct from p_received_at or r.payment_method is distinct from p_method or r.reference_note is distinct from p_note then raise exception 'Receipt identifier already used'; end if;
   return r.id;
 end if;
 if not exists(select 1 from public.agreement_installments where financial_obligation_id=p_obligation_id and workspace_id=p_workspace_id) then raise exception 'Agreement bill required'; end if;
 if p_received_at is null or p_received_at::date > (now() at time zone 'America/Chicago')::date then raise exception 'Actual payment date required'; end if;
 insert into public.payment_receipts(id,workspace_id,financial_obligation_id,amount_cents,received_at,payment_method,reference_note,recorded_by)
 values(p_receipt_id,p_workspace_id,p_obligation_id,p_amount_cents,p_received_at,p_method,p_note,p_user_id);
 return p_receipt_id;
end;
$$;
revoke all on function public.create_client_service_agreement(uuid,uuid,uuid,uuid,uuid,text,bigint,bigint,integer,uuid),public.launch_client_service_agreement(uuid,uuid,uuid,date),public.record_agreement_payment(uuid,uuid,uuid,uuid,bigint,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.create_client_service_agreement(uuid,uuid,uuid,uuid,uuid,text,bigint,bigint,integer,uuid),public.launch_client_service_agreement(uuid,uuid,uuid,date),public.record_agreement_payment(uuid,uuid,uuid,uuid,bigint,timestamptz,text,text) to service_role;
