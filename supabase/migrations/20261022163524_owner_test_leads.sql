-- Explicit owner classification only. Existing leads remain live; no name-based backfill.
set local lock_timeout = '5s';
alter table public.leads
  add column is_test boolean not null default false,
  add column test_record_reason text check (test_record_reason is null or char_length(btrim(test_record_reason)) between 1 and 2000),
  add column test_record_by uuid references auth.users(id),
  add column test_record_at timestamptz;
create index leads_test_record_by_idx on public.leads(test_record_by);

create function private.protect_lead_test_record() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.is_test or new.test_record_reason is not null or new.test_record_by is not null or new.test_record_at is not null then
      raise exception 'Create the lead first; only its owner may classify it as test';
    end if;
    return new;
  end if;
  if new.is_test is distinct from old.is_test then
    if new.workspace_id is distinct from old.workspace_id or new.id is distinct from old.id
      or current_user <> 'authenticated' or auth.uid() is null or not private.is_workspace_owner(old.workspace_id) then
      raise exception 'Only the active workspace owner may change test classification';
    end if;
    if new.test_record_reason is null or char_length(btrim(new.test_record_reason)) not between 1 and 2000 then
      raise exception 'A test classification reason is required';
    end if;
    new.test_record_reason := btrim(new.test_record_reason);
    new.test_record_by := auth.uid();
    new.test_record_at := now();
  elsif new.test_record_reason is distinct from old.test_record_reason
    or new.test_record_by is distinct from old.test_record_by
    or new.test_record_at is distinct from old.test_record_at then
    raise exception 'Test classification provenance changes only with the flag';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_lead_test_record() from public,anon,authenticated,service_role;
create trigger protect_lead_test_record before insert or update on public.leads
for each row execute function private.protect_lead_test_record();
