-- Reconcile completed approvals created before approval decisions began
-- synchronizing their content-variant lifecycle status. Restrict the backfill
-- to the two observed stale-state shapes and never touch exported evidence.

with latest_approval as (
  select distinct on (a.content_variant_id)
    a.workspace_id,
    a.content_variant_id,
    a.status
  from public.approvals a
  order by a.content_variant_id, a.created_at desc
), reconciled as (
  select
    cv.id,
    cv.workspace_id,
    case
      when la.status = 'approved' then 'approved'
      when la.status in ('revision_requested', 'rejected') then 'draft'
    end as next_status
  from public.content_variants cv
  join latest_approval la
    on la.content_variant_id = cv.id
   and la.workspace_id = cv.workspace_id
  where cv.export_snapshot is null
    and (
      (la.status = 'approved' and cv.status = 'ready_for_review')
      or (
        la.status in ('revision_requested', 'rejected')
        and cv.status in ('ready_for_review', 'approved')
      )
    )
)
update public.content_variants cv
set status = reconciled.next_status
from reconciled
where cv.id = reconciled.id
  and cv.workspace_id = reconciled.workspace_id;
