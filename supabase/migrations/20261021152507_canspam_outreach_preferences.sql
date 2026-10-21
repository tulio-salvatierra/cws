-- CANSPAM-FIX-001: persistent workspace/email suppression and non-expiring opt-out tokens.
-- No customer addresses, recipient rows, or owner postal address are embedded here.
create table public.outreach_email_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 320),
  unsubscribed_at timestamptz,
  reason text check (reason in ('recipient_opt_out', 'owner_recorded_opt_out', 'legacy_opt_out', 'bounced', 'complained')),
  recorded_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);
create index outreach_email_preferences_recorded_by_idx on public.outreach_email_preferences(recorded_by) where recorded_by is not null;
alter table public.outreach_email_preferences enable row level security;
-- Bearer opt-out tokens must not be readable through the browser Data API.
revoke all on public.outreach_email_preferences from public, anon, authenticated, service_role;
grant select, insert, update on public.outreach_email_preferences to service_role;
create policy service_manages_email_preferences on public.outreach_email_preferences
  for all to service_role using (true) with check (true);

-- Preserve known suppression across Sales, mailing lists, duplicate leads and casing.
insert into public.outreach_email_preferences (workspace_id, email, unsubscribed_at, reason)
select workspace_id, lower(btrim(email)), min(unsubscribed_at), 'legacy_opt_out'
from public.mailing_list_subscribers where unsubscribed_at is not null
group by workspace_id, lower(btrim(email))
on conflict (workspace_id, email) do nothing;
insert into public.outreach_email_preferences (workspace_id, email, unsubscribed_at, reason)
select workspace_id, lower(btrim(to_email)), min(coalesce(sent_at, created_at)),
  case when bool_or(status = 'complained') then 'complained' else 'bounced' end
from public.outreach_sends where status in ('bounced', 'complained')
group by workspace_id, lower(btrim(to_email))
on conflict (workspace_id, email) do nothing;

-- Content is completed with the owner-configured address and recipient token before review.
update public.email_templates
set body = body || E'\n\n---\nCommercial email from Cicero Web Studio.\n{{postal_address}}\nUnsubscribe from all marketing emails: {{unsubscribe_url}}'
where type in ('intro', 'cold', 'follow_up', 'mailing_list')
  and position(E'\n\n---\nCommercial email from Cicero Web Studio.' in body) = 0;
