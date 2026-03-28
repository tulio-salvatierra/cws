-- Enable RLS on all tables
alter table research_topics   enable row level security;
alter table keywords          enable row level security;
alter table content_drafts    enable row level security;
alter table platform_posts    enable row level security;
alter table media_assets      enable row level security;
alter table post_analytics    enable row level security;

-- Only authenticated users (the admin) can read/write all tables
create policy "auth_all" on research_topics  for all to authenticated using (true) with check (true);
create policy "auth_all" on keywords         for all to authenticated using (true) with check (true);
create policy "auth_all" on content_drafts   for all to authenticated using (true) with check (true);
create policy "auth_all" on platform_posts   for all to authenticated using (true) with check (true);
create policy "auth_all" on media_assets     for all to authenticated using (true) with check (true);
create policy "auth_all" on post_analytics   for all to authenticated using (true) with check (true);

-- n8n uses the service role key which bypasses RLS — no policy needed for it
