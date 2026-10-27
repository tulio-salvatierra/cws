set local lock_timeout = '5s';
-- Additive nullable metadata only. Existing responses and evidence are untouched.
alter table public.laya_evaluations
  add column reason_category text,
  add column alternative_action text,
  add constraint laya_response_reason_category_check check (
    reason_category is null or reason_category in (
      'right_next_step','not_now','different_priority','missing_information',
      'incorrect_information','already_done','not_relevant','other'
    )
  ),
  add constraint laya_response_alternative_action_check check (
    alternative_action is null or (
      alternative_action = btrim(alternative_action)
      and char_length(alternative_action) between 1 and 2000
    )
  );
-- Existing owner-only reads, service-only inserts and append-only guard retained.
