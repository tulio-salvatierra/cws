-- Keep test records and immutable lifecycle evidence available without mixing
-- them into normal operational views.

alter table public.campaigns
  add column is_test boolean not null default false,
  add column test_archived boolean not null default false,
  add column test_archived_at timestamptz,
  add column test_archived_by uuid references auth.users(id) on delete restrict,
  add constraint campaigns_test_archive_check check (
    (not test_archived and test_archived_at is null and test_archived_by is null)
    or (is_test and test_archived and test_archived_at is not null and test_archived_by is not null)
  );

alter table public.content_variants
  add column is_test boolean not null default false,
  add column test_archived boolean not null default false,
  add column test_archived_at timestamptz,
  add column test_archived_by uuid references auth.users(id) on delete restrict,
  add constraint content_variants_test_archive_check check (
    (not test_archived and test_archived_at is null and test_archived_by is null)
    or (is_test and test_archived and test_archived_at is not null and test_archived_by is not null)
  );

create index campaigns_workspace_test_archive_idx
  on public.campaigns (workspace_id, test_archived, updated_at desc);

create index campaigns_test_archived_by_idx
  on public.campaigns (test_archived_by)
  where test_archived_by is not null;

create index content_variants_workspace_test_archive_idx
  on public.content_variants (workspace_id, test_archived, updated_at desc);

create index content_variants_test_archived_by_idx
  on public.content_variants (test_archived_by)
  where test_archived_by is not null;

create or replace function public.manage_test_data_classification()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  classification_changed boolean;
begin
  classification_changed :=
    new.is_test is distinct from old.is_test
    or new.test_archived is distinct from old.test_archived;

  if not classification_changed then
    if new.test_archived_at is distinct from old.test_archived_at
      or new.test_archived_by is distinct from old.test_archived_by
    then
      raise exception 'test archive attribution is managed by the classification workflow';
    end if;

    return new;
  end if;

  if actor_id is null
    or not (select private.is_workspace_owner(old.workspace_id))
  then
    raise exception 'an active workspace owner must classify or archive test data';
  end if;

  if new.test_archived and not new.is_test then
    raise exception 'only records labeled as test data can be operationally archived';
  end if;

  if new.test_archived then
    if not old.test_archived then
      new.test_archived_at := now();
      new.test_archived_by := actor_id;
    elsif new.test_archived_at is distinct from old.test_archived_at
      or new.test_archived_by is distinct from old.test_archived_by
    then
      raise exception 'test archive attribution is immutable while archived';
    end if;
  else
    new.test_archived_at := null;
    new.test_archived_by := null;
  end if;

  return new;
end;
$$;

create trigger manage_campaign_test_data_classification
  before update of is_test, test_archived, test_archived_at, test_archived_by
  on public.campaigns
  for each row execute function public.manage_test_data_classification();

create trigger manage_content_variant_test_data_classification
  before update of is_test, test_archived, test_archived_at, test_archived_by
  on public.content_variants
  for each row execute function public.manage_test_data_classification();

revoke all on function public.manage_test_data_classification()
  from public, anon, authenticated;
