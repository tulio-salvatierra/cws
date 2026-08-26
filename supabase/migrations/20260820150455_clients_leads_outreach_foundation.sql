create table public.clients (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 200),
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

alter table public.projects
  add column client_id uuid,
  add constraint projects_client_id_workspace_id_fkey
    foreign key (client_id, workspace_id)
    references public.clients(id, workspace_id)
    on delete restrict;

create table public.leads (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  name text,
  email text not null check (email = btrim(email) and char_length(email) between 3 and 320),
  company text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'responded', 'won', 'lost', 'unresponsive')),
  source text,
  last_contacted_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table public.mailing_list_subscribers (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  email text not null check (email = btrim(email) and char_length(email) between 3 and 320),
  name text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table public.email_templates (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 200),
  type text not null check (type in ('intro', 'follow_up', 'cold', 'mailing_list')),
  lang text not null default 'en' check (lang in ('en', 'es')),
  subject text not null check (subject = btrim(subject) and char_length(subject) between 1 and 500),
  body text not null check (body = btrim(body) and char_length(body) between 1 and 20000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table public.outreach_sends (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  lead_id uuid,
  subscriber_id uuid,
  campaign_id uuid,
  template_id uuid,
  send_type text not null check (send_type in ('intro', 'follow_up', 'cold', 'mailing_list')),
  resend_message_id text,
  to_email text not null check (to_email = btrim(to_email) and char_length(to_email) between 3 and 320),
  subject text not null check (subject = btrim(subject) and char_length(subject) between 1 and 500),
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')),
  sent_at timestamptz,
  approval_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint outreach_sends_target_check check (
    (lead_id is not null and subscriber_id is null) or
    (lead_id is null and subscriber_id is not null)
  ),
  foreign key (lead_id, workspace_id)
    references public.leads(id, workspace_id)
    on delete restrict,
  foreign key (subscriber_id, workspace_id)
    references public.mailing_list_subscribers(id, workspace_id)
    on delete restrict,
  foreign key (campaign_id, workspace_id)
    references public.campaigns(id, workspace_id)
    on delete restrict,
  foreign key (template_id, workspace_id)
    references public.email_templates(id, workspace_id)
    on delete restrict,
  foreign key (approval_id, workspace_id)
    references public.approvals(id, workspace_id)
    on delete restrict
);

create index leads_workspace_id_idx on public.leads (workspace_id);
create index mailing_list_subscribers_workspace_id_idx on public.mailing_list_subscribers (workspace_id);
create index outreach_sends_workspace_id_idx on public.outreach_sends (workspace_id);
create index outreach_sends_lead_id_idx on public.outreach_sends (lead_id) where lead_id is not null;
create index outreach_sends_subscriber_id_idx on public.outreach_sends (subscriber_id) where subscriber_id is not null;
create index projects_client_id_idx on public.projects (client_id) where client_id is not null;

create trigger clients_updated_at before update on public.clients
for each row execute function public.update_updated_at();

create trigger leads_updated_at before update on public.leads
for each row execute function public.update_updated_at();

create trigger email_templates_updated_at before update on public.email_templates
for each row execute function public.update_updated_at();

alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.mailing_list_subscribers enable row level security;
alter table public.email_templates enable row level security;
alter table public.outreach_sends enable row level security;

create policy "workspace_members_can_read_clients" on public.clients for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_clients" on public.clients for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()));
create policy "workspace_members_can_update_clients" on public.clients for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_delete_clients" on public.clients for delete to authenticated using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_read_leads" on public.leads for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_leads" on public.leads for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()));
create policy "workspace_members_can_update_leads" on public.leads for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_delete_leads" on public.leads for delete to authenticated using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_read_mailing_list_subscribers" on public.mailing_list_subscribers for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_mailing_list_subscribers" on public.mailing_list_subscribers for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()));
create policy "workspace_members_can_update_mailing_list_subscribers" on public.mailing_list_subscribers for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_delete_mailing_list_subscribers" on public.mailing_list_subscribers for delete to authenticated using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_read_email_templates" on public.email_templates for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_add_email_templates" on public.email_templates for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and created_by = (select auth.uid()));
create policy "workspace_members_can_update_email_templates" on public.email_templates for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "workspace_members_can_delete_email_templates" on public.email_templates for delete to authenticated using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_read_outreach_sends" on public.outreach_sends for select to authenticated using ((select private.is_workspace_member(workspace_id)));

revoke all on public.clients from public, anon, authenticated, service_role;
revoke all on public.leads from public, anon, authenticated, service_role;
revoke all on public.mailing_list_subscribers from public, anon, authenticated, service_role;
revoke all on public.email_templates from public, anon, authenticated, service_role;
revoke all on public.outreach_sends from public, anon, authenticated, service_role;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.mailing_list_subscribers to authenticated;
grant select, insert, update, delete on public.email_templates to authenticated;
grant select on public.outreach_sends to authenticated;

grant select, insert, update, delete on public.clients to service_role;
grant select, insert, update, delete on public.leads to service_role;
grant select, insert, update, delete on public.mailing_list_subscribers to service_role;
grant select, insert, update, delete on public.email_templates to service_role;
grant select, insert, update on public.outreach_sends to service_role;
