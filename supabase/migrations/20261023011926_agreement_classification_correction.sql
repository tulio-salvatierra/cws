-- Classification only: no commercial, payment, launch or decision changes.
create table public.agreement_classification_corrections (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id),
 agreement_id uuid not null,
 previous_name text not null,
 corrected_name text not null,
 agreement_snapshot jsonb not null,
 reason text not null check(char_length(btrim(reason)) between 1 and 2000),
 recorded_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(agreement_id,workspace_id) references public.client_service_agreements(id,workspace_id)
);
create index agreement_classification_workspace_idx on public.agreement_classification_corrections(workspace_id,created_at desc);
create index agreement_classification_agreement_idx on public.agreement_classification_corrections(agreement_id,workspace_id);
create index agreement_classification_actor_idx on public.agreement_classification_corrections(recorded_by);
alter table public.agreement_classification_corrections enable row level security;
revoke all on public.agreement_classification_corrections from public,anon,authenticated,service_role;
grant select on public.agreement_classification_corrections to authenticated,service_role;
create policy classification_owner_read on public.agreement_classification_corrections for select to authenticated
 using((select private.is_workspace_owner(workspace_id)));

create function public.classify_agreement_negocio_listo(p_agreement_id uuid,p_expected_name text,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.client_service_agreements; corrected text; audit_id uuid;
begin
 if current_setting('role',true) <> 'authenticated' or auth.uid() is null then
  raise exception 'Only the signed-in owner may correct agreement classification' using errcode='42501';
 end if;
 select * into a from public.client_service_agreements where id=p_agreement_id for update;
 if not found or not private.is_workspace_owner(a.workspace_id) then
  raise exception 'Only the active agreement owner may correct classification' using errcode='42501';
 end if;
 if a.product_name is distinct from p_expected_name then
  raise exception 'Agreement changed; reload before correcting classification' using errcode='40001';
 end if;
 if a.product_name ~* '^negocio listo([[:space:]]|$|[—-])' then
  raise exception 'Agreement is already classified as Negocio Listo' using errcode='23514';
 end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 1 and 2000 then
  raise exception 'A classification reason is required' using errcode='23514';
 end if;
 corrected:='Negocio Listo — '||a.product_name;
 if char_length(corrected)>200 then raise exception 'Classification label exceeds 200 characters' using errcode='23514'; end if;
 insert into public.agreement_classification_corrections(workspace_id,agreement_id,previous_name,corrected_name,agreement_snapshot,reason,recorded_by)
 values(a.workspace_id,a.id,a.product_name,corrected,to_jsonb(a),btrim(p_reason),auth.uid()) returning id into audit_id;
 update public.client_service_agreements set product_name=corrected where id=a.id;
 return audit_id;
end $$;
revoke all on function public.classify_agreement_negocio_listo(uuid,text,text) from public,anon,service_role;
grant execute on function public.classify_agreement_negocio_listo(uuid,text,text) to authenticated;

-- Existing service-backed agreement actions may not bypass the owner correction.
create function private.guard_agreement_classification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.product_name is distinct from old.product_name then
  if current_setting('role',true) <> 'authenticated' or auth.uid() is null
    or not private.is_workspace_owner(old.workspace_id)
    or (to_jsonb(new)-'product_name') is distinct from (to_jsonb(old)-'product_name')
    or not exists(select 1 from public.agreement_classification_corrections c
      where c.agreement_id=old.id and c.workspace_id=old.workspace_id
        and c.recorded_by=auth.uid() and c.created_at=transaction_timestamp()
        and c.agreement_snapshot=to_jsonb(old) and c.corrected_name=new.product_name) then
   raise exception 'Use the owner audited classification correction' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_agreement_classification() from public,anon,authenticated,service_role;
create trigger guard_agreement_classification before update on public.client_service_agreements
for each row execute function private.guard_agreement_classification();
