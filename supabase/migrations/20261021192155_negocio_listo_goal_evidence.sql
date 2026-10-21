-- Owner-entered evidence only. No historical signature/status inference or backfill.
create table public.negocio_listo_evidence (
 revision bigint generated always as identity primary key,
 workspace_id uuid not null references public.workspaces(id),
 agreement_id uuid not null,
 client_id uuid not null,
 counts_toward_goal boolean not null,
 signature_status text not null check(signature_status in ('signed','unsigned','unknown')),
 signed_on date,
 subscription_status text not null check(subscription_status in ('active','not_started','paused','cancelled','ended','unknown')),
 status_on date not null check(status_on <= (now() at time zone 'America/Chicago')::date),
 source_note text not null check(char_length(trim(source_note)) between 1 and 2000),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(agreement_id,workspace_id,client_id) references public.client_service_agreements(id,workspace_id,client_id),
 check((signature_status='signed' and signed_on is not null and signed_on<=status_on)
    or (signature_status<>'signed' and signed_on is null)),
 check(subscription_status in ('unknown','not_started') or signature_status='signed')
);
create index negocio_listo_evidence_agreement_idx on public.negocio_listo_evidence(workspace_id,agreement_id,revision desc);
create index negocio_listo_evidence_agreement_fk_idx on public.negocio_listo_evidence(agreement_id,workspace_id,client_id);
create index negocio_listo_evidence_client_idx on public.negocio_listo_evidence(client_id);
create index negocio_listo_evidence_creator_idx on public.negocio_listo_evidence(created_by);
create table public.negocio_listo_completeness (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id),
 snapshot jsonb not null,
 confirmed_on date not null,
 source_note text not null check(char_length(trim(source_note)) between 1 and 2000),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
create index negocio_listo_completeness_workspace_idx on public.negocio_listo_completeness(workspace_id,created_at desc);
create index negocio_listo_completeness_creator_idx on public.negocio_listo_completeness(created_by);
alter table public.negocio_listo_evidence enable row level security;
alter table public.negocio_listo_completeness enable row level security;
revoke all on public.negocio_listo_evidence,public.negocio_listo_completeness from public,anon,authenticated,service_role;
grant select,insert on public.negocio_listo_evidence,public.negocio_listo_completeness to authenticated;
grant select on public.negocio_listo_evidence,public.negocio_listo_completeness to service_role;
revoke all on sequence public.negocio_listo_evidence_revision_seq from public,anon,service_role;
grant usage on sequence public.negocio_listo_evidence_revision_seq to authenticated;
create policy nl_evidence_read on public.negocio_listo_evidence for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy nl_evidence_add on public.negocio_listo_evidence for insert to authenticated with check((select private.is_workspace_owner(workspace_id)) and created_by=(select auth.uid()));
create policy nl_completeness_read on public.negocio_listo_completeness for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy nl_completeness_add on public.negocio_listo_completeness for insert to authenticated with check((select private.is_workspace_owner(workspace_id)) and created_by=(select auth.uid()));

create function private.negocio_listo_snapshot(w uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'client_id',a.client_id,'product_name',a.product_name,'revision',e.revision) order by a.id),'[]'::jsonb)
 from public.client_service_agreements a left join lateral (
  select revision from public.negocio_listo_evidence where workspace_id=w and agreement_id=a.id order by revision desc limit 1
 ) e on true where a.workspace_id=w and trim(a.product_name) ~* '^negocio listo(\s|$|[—-])';
$$;
revoke all on function private.negocio_listo_snapshot(uuid) from public,anon,service_role;
grant execute on function private.negocio_listo_snapshot(uuid) to authenticated;

create function private.guard_negocio_listo_evidence() returns trigger language plpgsql security invoker set search_path='' as $$
declare today date:=(now() at time zone 'America/Chicago')::date;
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
  new.snapshot:=private.negocio_listo_snapshot(new.workspace_id);new.confirmed_on:=today;
  if exists(select 1 from jsonb_array_elements(new.snapshot) s left join public.negocio_listo_evidence e on e.revision=(s->>'revision')::bigint
   where e.revision is null or (e.counts_toward_goal and (e.signature_status='unknown' or e.subscription_status='unknown' or e.status_on<>today))) then
   raise exception 'Review every agreement and current-day subscription status before confirming completeness' using errcode='23514';end if;
  if exists(select e.client_id from jsonb_array_elements(new.snapshot) s join public.negocio_listo_evidence e on e.revision=(s->>'revision')::bigint
   where e.counts_toward_goal group by e.client_id having count(*)>1) then
   raise exception 'Count only one core subscription per client; explicitly exclude add-ons or replaced agreements' using errcode='23514';end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_negocio_listo_evidence() from public,anon,authenticated,service_role;
create trigger nl_evidence_guard before insert or update or delete on public.negocio_listo_evidence for each row execute function private.guard_negocio_listo_evidence();
create trigger nl_completeness_guard before insert or update or delete on public.negocio_listo_completeness for each row execute function private.guard_negocio_listo_evidence();
