-- Link an immutable publication record to the run that produced it.

alter table public.published_posts
  add column agent_run_id uuid references public.agent_runs(id) on delete set null;

create index published_posts_agent_run_id_idx
  on public.published_posts (agent_run_id)
  where agent_run_id is not null;

grant select, update on public.published_posts to authenticated;
grant all on public.published_posts to service_role;
