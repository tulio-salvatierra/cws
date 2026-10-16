-- Recovered 2026-10-16 from supabase_migrations.schema_migrations.
-- Schema statements below are the exact applied SQL.
-- The applied migration also contained one INSERT seeding a real client record
-- (pricing, agreement link, payment-plan identifier). It is intentionally omitted
-- here because this repository is public. The row exists in production; do not
-- re-seed it from this file.

-- Client project status, with authenticated reads and service-role writes.
create table public.client_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  client_name text not null,
  business_name text,
  stage text not null default 'discovery'
    check (stage in ('prospect', 'discovery', 'build', 'review', 'launched', 'paused', 'ended')),
  snapshot text,
  scope jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_projects_stage_idx on public.client_projects (stage);

create function public.client_projects_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger client_projects_updated_at
before update on public.client_projects
for each row execute function public.client_projects_set_updated_at();

alter table public.client_projects enable row level security;
revoke all on public.client_projects from public, anon, authenticated;
-- Anon has SELECT permission but no policy, so reads return zero rows.
grant select on public.client_projects to anon, authenticated;
grant all on public.client_projects to service_role;

create policy client_projects_authenticated_select
on public.client_projects for select to authenticated using (true);
