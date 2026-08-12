-- Cover the composite foreign keys in their declared column order.

create index content_variant_revision_events_variant_workspace_idx
  on public.content_variant_revision_events (content_variant_id, workspace_id);

create index content_variant_revision_events_approval_workspace_idx
  on public.content_variant_revision_events (source_approval_id, workspace_id);
