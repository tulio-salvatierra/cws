-- Operations O1 is deliberately separate from the generic planning projects
-- and tasks tables. These records are the durable source of truth for client
-- delivery readiness only; they do not create a reusable task/workflow model.

create table public.operations_projects (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  client_id uuid not null,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 200),
  project_type text not null check (project_type in (
    'website_build',
    'website_refresh',
    'photography_video',
    'marketing_support',
    'other'
  )),
  status text not null default 'setup' check (status in (
    'setup',
    'in_progress',
    'waiting_on_client',
    'waiting_on_cws',
    'completed',
    'paused'
  )),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (client_id, workspace_id)
    references public.clients(id, workspace_id)
    on delete restrict
);

create table public.project_requirements (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id),
  project_id uuid not null,
  requirement_key text not null check (requirement_key in (
    'business_basics',
    'brand_assets',
    'website_domain_access',
    'services_offers',
    'business_copy',
    'photos_video',
    'social_contact_links',
    'google_business_profile',
    'booking_ecommerce_integrations',
    'legal_policies',
    'project_specific_requirements'
  )),
  label text not null check (label = btrim(label) and char_length(label) between 1 and 200),
  category text not null check (category in (
    'business_basics',
    'brand',
    'website_domain',
    'services_offers',
    'business_copy',
    'photos_video',
    'social_contact_links',
    'google_business_profile',
    'booking_ecommerce_integrations',
    'legal_policies',
    'project_specific'
  )),
  status text not null default 'needed' check (status in ('needed', 'received', 'not_applicable')),
  timing text not null default 'needed_now' check (timing in ('needed_now', 'needed_later', 'opportunity')),
  responsible_party text not null default 'client' check (responsible_party in ('client', 'cws')),
  notes text check (notes is null or char_length(notes) <= 2000),
  requested_at timestamptz not null default now(),
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, requirement_key),
  foreign key (project_id, workspace_id)
    references public.operations_projects(id, workspace_id)
    on delete cascade
);

create index operations_projects_workspace_status_idx
  on public.operations_projects (workspace_id, status, updated_at desc);
create index operations_projects_client_workspace_idx
  on public.operations_projects (client_id, workspace_id) where status not in ('completed', 'paused');
create index operations_projects_created_by_idx
  on public.operations_projects (created_by);
create index project_requirements_project_workspace_idx
  on public.project_requirements (project_id, workspace_id, timing, status);
create index project_requirements_workspace_blocker_idx
  on public.project_requirements (workspace_id, timing, status, requested_at)
  where timing = 'needed_now' and status = 'needed';

-- A fixed checklist keeps O1 legible and makes the owner the source of truth
-- for applicability. No free-form requirements are created here.
create or replace function public.seed_operations_project_requirements()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.project_requirements (
    workspace_id, project_id, requirement_key, label, category
  ) values
    (new.workspace_id, new.id, 'business_basics', 'Business basics', 'business_basics'),
    (new.workspace_id, new.id, 'brand_assets', 'Brand assets', 'brand'),
    (new.workspace_id, new.id, 'website_domain_access', 'Website, domain, and access', 'website_domain'),
    (new.workspace_id, new.id, 'services_offers', 'Services and offers', 'services_offers'),
    (new.workspace_id, new.id, 'business_copy', 'Business copy', 'business_copy'),
    (new.workspace_id, new.id, 'photos_video', 'Photos and video', 'photos_video'),
    (new.workspace_id, new.id, 'social_contact_links', 'Social and contact links', 'social_contact_links'),
    (new.workspace_id, new.id, 'google_business_profile', 'Google Business Profile', 'google_business_profile'),
    (new.workspace_id, new.id, 'booking_ecommerce_integrations', 'Booking, ecommerce, and integrations', 'booking_ecommerce_integrations'),
    (new.workspace_id, new.id, 'legal_policies', 'Legal and policies', 'legal_policies'),
    (new.workspace_id, new.id, 'project_specific_requirements', 'Project-specific requirements', 'project_specific');
  return new;
end;
$$;

create trigger operations_projects_seed_requirements
after insert on public.operations_projects
for each row execute function public.seed_operations_project_requirements();

create trigger operations_projects_updated_at
before update on public.operations_projects
for each row execute function public.update_updated_at();

create trigger project_requirements_updated_at
before update on public.project_requirements
for each row execute function public.update_updated_at();

-- This single-purpose function keeps client reuse, project creation, and the
-- fixed checklist seed in one transaction. It is not a general project API.
create or replace function public.create_operations_project(
  p_workspace_id uuid,
  p_client_name text,
  p_contact_email text,
  p_contact_phone text,
  p_project_name text,
  p_project_type text,
  p_created_by uuid
)
returns public.operations_projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_client public.clients;
  created_project public.operations_projects;
begin
  if p_client_name is null or p_client_name <> btrim(p_client_name) or char_length(p_client_name) not between 1 and 200 then
    raise exception 'A client name is required.';
  end if;
  if p_project_name is null or p_project_name <> btrim(p_project_name) or char_length(p_project_name) not between 1 and 200 then
    raise exception 'A project name is required.';
  end if;

  select * into selected_client
  from public.clients
  where workspace_id = p_workspace_id
    and status = 'active'
    and lower(name) = lower(p_client_name)
  order by created_at asc
  limit 1;

  if selected_client.id is null then
    insert into public.clients (
      workspace_id, name, contact_email, contact_phone, created_by
    ) values (
      p_workspace_id, p_client_name, nullif(p_contact_email, ''), nullif(p_contact_phone, ''), p_created_by
    ) returning * into selected_client;
  end if;

  insert into public.operations_projects (
    workspace_id, client_id, name, project_type, created_by
  ) values (
    p_workspace_id, selected_client.id, p_project_name, p_project_type, p_created_by
  ) returning * into created_project;

  return created_project;
end;
$$;

alter table public.operations_projects enable row level security;
alter table public.project_requirements enable row level security;

create policy "workspace_members_can_read_operations_projects"
  on public.operations_projects for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_can_read_project_requirements"
  on public.project_requirements for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

revoke all on public.operations_projects from public, anon, authenticated, service_role;
revoke all on public.project_requirements from public, anon, authenticated, service_role;
revoke all on function public.create_operations_project(uuid, text, text, text, text, text, uuid) from public, anon, authenticated;

grant select on public.operations_projects to authenticated;
grant select on public.project_requirements to authenticated;
grant select, insert, update, delete on public.operations_projects to service_role;
grant select, insert, update, delete on public.project_requirements to service_role;
grant execute on function public.create_operations_project(uuid, text, text, text, text, text, uuid) to service_role;
