-- Sales S0: make the existing durable send record the pre-provider attempt.
-- Existing rows are historical and remain valid with null S0 fields.
alter table public.outreach_sends
  add column idempotency_key text,
  add column draft_hash text,
  add column error_message text;

create unique index outreach_sends_workspace_idempotency_uidx
  on public.outreach_sends (workspace_id, idempotency_key)
  where idempotency_key is not null;

alter table public.outreach_sends
  add constraint outreach_sends_idempotency_key_check
  check (idempotency_key is null or char_length(btrim(idempotency_key)) between 1 and 500),
  add constraint outreach_sends_draft_hash_check
  check (draft_hash is null or draft_hash ~ '^[0-9a-f]{64}$');
