-- Sales S2B: a raw HTML absence is not a prospect qualification. Preserve the
-- original S2A candidate evidence while recording independent S2B verification.

alter table public.sales_discovery_candidates
  add column contact_path_state text not null default 'not_assessed'
    check (contact_path_state in ('not_assessed', 'unverified_gap', 'verified_gap', 'contact_path_exists', 'insufficient_evidence')),
  add column contact_path_verification jsonb not null default '{}'::jsonb
    check (jsonb_typeof(contact_path_verification) = 'object'),
  add column qualification_invalidated_at timestamptz,
  add column qualification_invalidation_reason text
    check (qualification_invalidation_reason is null or (qualification_invalidation_reason = btrim(qualification_invalidation_reason) and char_length(qualification_invalidation_reason) between 1 and 500));

alter table public.sales_discovery_runs
  add column inspection_outcomes jsonb not null default '[]'::jsonb
    check (jsonb_typeof(inspection_outcomes) = 'array' and jsonb_array_length(inspection_outcomes) <= 12);

alter table public.sales_discovery_candidates
  drop constraint sales_discovery_candidates_check,
  drop constraint sales_discovery_candidates_review_state_check;

alter table public.sales_discovery_candidates
  add constraint sales_discovery_candidates_review_state_check
    check (review_state in ('ready', 'converting', 'converted', 'dismissed', 'verification_required', 'invalidated')),
  add constraint sales_discovery_candidates_check
    check (
      (review_state in ('ready', 'converting') and dismissed_at is null and converted_lead_id is null and converted_at is null and qualification_invalidated_at is null)
      or (review_state = 'dismissed' and dismissed_at is not null and converted_lead_id is null and converted_at is null and qualification_invalidated_at is null)
      or (review_state = 'converted' and dismissed_at is null and converted_lead_id is not null and converted_at is not null and qualification_invalidated_at is null)
      or (review_state = 'verification_required' and dismissed_at is null and converted_lead_id is null and converted_at is null and qualification_invalidated_at is null)
      or (review_state = 'invalidated' and dismissed_at is null and converted_lead_id is null and converted_at is null and qualification_invalidated_at is not null and qualification_invalidation_reason is not null)
    );

-- These rows were created before S2B corroboration existed. They remain durable
-- audit records, but cannot appear as review-ready prospects until rechecked.
update public.sales_discovery_candidates
set review_state = 'verification_required', contact_path_state = 'unverified_gap'
where review_state = 'ready'
  and opportunity = 'Contact path may benefit from being more prominent.';
