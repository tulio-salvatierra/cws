-- Sales S3: one auditable proposed prospect brief per owner-selected
-- discovery candidate, plus legitimate phone-only Sales leads. Existing
-- outreach rows retain their non-null recipient requirement.
set local lock_timeout = '5s';

alter table public.leads
  alter column email drop not null;

alter table public.leads
  drop constraint if exists leads_email_check;

alter table public.leads
  add constraint leads_contact_method_check
  check (
    (email is not null and email = btrim(email) and char_length(email) between 3 and 320)
    or (phone is not null and phone = btrim(phone) and char_length(phone) between 3 and 50)
  );

alter table public.sales_discovery_candidates
  add column prospect_brief_run_id uuid;

alter table public.sales_discovery_candidates
  add constraint sales_discovery_candidates_prospect_brief_run_workspace_fkey
  foreign key (prospect_brief_run_id, workspace_id)
  references public.agent_runs(id, workspace_id)
  on delete restrict;

create unique index sales_discovery_candidates_prospect_brief_run_unique
  on public.sales_discovery_candidates (prospect_brief_run_id)
  where prospect_brief_run_id is not null;
