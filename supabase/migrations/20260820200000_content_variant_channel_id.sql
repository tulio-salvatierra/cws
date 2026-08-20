begin;

alter table public.content_variants
  add column channel_id uuid;

update public.content_variants v
set channel_id = c.channel_id
from public.campaigns c
where c.id = v.campaign_id
  and c.workspace_id = v.workspace_id;

do $$
begin
  if exists (
    select 1
    from public.content_variants
    where channel_id is null
  ) then
    raise exception 'content_variants.channel_id backfill left null rows';
  end if;
end
$$;

alter table public.content_variants
  alter column channel_id set not null;

alter table public.content_variants
  alter column campaign_id drop not null;

alter table public.content_variants
  add constraint content_variants_channel_id_workspace_id_fkey
  foreign key (channel_id, workspace_id)
  references public.channels(id, workspace_id)
  on delete restrict;

create index content_variants_channel_id_workspace_id_idx
  on public.content_variants(channel_id, workspace_id);

commit;
