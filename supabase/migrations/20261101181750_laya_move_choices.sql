-- Owner-authorized Decision Rules V1 release.
set local lock_timeout = '5s';
create table public.laya_move_choices (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  card_id text not null check (char_length(card_id) between 1 and 500),
  title text not null,
  action text not null check (action in ('do','later','handoff','close','drop','scope')),
  outcome text check (outcome in ('yes','no','not_yet','skip')),
  defer_until date,
  source_version text not null,
  recommendation jsonb not null check (jsonb_typeof(recommendation) = 'object'),
  evaluation jsonb not null check (jsonb_typeof(evaluation) = 'object'),
  scope_evidence jsonb,
  check ((action = 'close') = (outcome is not null)),
  check ((action = 'later') = (defer_until is not null)),
  check ((action = 'scope') = (scope_evidence is not null)),
  check (scope_evidence is null or jsonb_typeof(scope_evidence) = 'object')
);
create index laya_move_choices_history on public.laya_move_choices(workspace_id,created_at desc,id desc);
alter table public.laya_move_choices enable row level security;
revoke all on public.laya_move_choices from public,anon,authenticated,service_role;
grant select on public.laya_move_choices to authenticated;
grant select,insert on public.laya_move_choices to service_role;
create policy laya_move_owner_read on public.laya_move_choices for select to authenticated
using ((select private.is_workspace_owner(workspace_id)));
create function private.guard_laya_move_choice() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'Next move choices are append-only' using errcode='42501';
  end if;
  if not exists (select 1 from public.workspace_members m where m.workspace_id=new.workspace_id
    and m.user_id=new.created_by and m.role='owner' and m.status='active') then
    raise exception 'An active workspace owner is required' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.guard_laya_move_choice() from public,anon,authenticated;
create trigger laya_move_guard before insert or update or delete on public.laya_move_choices
for each row execute function private.guard_laya_move_choice();
