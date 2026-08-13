# Latest Codex Handoff

Task ID: CWS-FIRST-RECORD-011
Agent: Codex
Objective: Prove the Production publication return endpoint end to end, restore an empty publication log, and reduce recording the first real post to one command.

## Ready-to-run command

```bash
./scripts/record-published.sh instagram es "https://instagram.com/p/REAL_POST_ID"
```

Set `PUBLISHED_WEBHOOK_SECRET` for the terminal session first, and run the
command only after the post has actually been published.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md` including DEC-025
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `api/published.js`
- `api/__tests__/published.test.js`
- `supabase/migrations/20260809191332_015_published_posts_return_path.sql`
- Current Production Vercel environment-variable names and deployment
- Managed Supabase staging `published_posts`
- Current Supabase security guidance and changelog

## Files changed

- `docs/agent-handoffs/latest-codex.md`
- `scripts/record-published.sh`
- `scripts/README.md`
- `scripts/__tests__/record-published.test.js`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- No endpoint, schema, or permanent database change.
- Production was redeployed after the webhook secret was updated.
- One temporary `published_posts` row was inserted through the live endpoint, verified through an identical retry, and deleted by `external_post_id`.
- Added a local one-command wrapper that validates platform/language/version,
  defaults publication time and source, derives an external post ID when
  possible, calls the unchanged Production endpoint, and reports creation or
  idempotent reuse.

## Security decisions

- The webhook secret remained server-side and was never printed, committed, passed as a command-line argument, or stored in the handoff.
- The Production endpoint retained its existing constant-time shared-secret authentication.
- The temporary local secret file was deleted immediately after verification.

## Decisions made

- None. The live probe used the endpoint-supported `source: "manual"`; `source: "test"` is not an accepted API/database value.

## Assumptions

- `VERIFY-DELETE-ME-001` was reserved exclusively for this temporary verification row.
- The configured default workspace is the staging CWS workspace named by `PUBLISHED_WORKSPACE_ID`.

## Tests added

- Four script tests cover missing-secret failure, local platform validation,
  successful row reporting with derived identity, and idempotent reuse
  reporting.

## Tests run

Production endpoint `https://cws-two.vercel.app/api/published`:

1. No auth header → **401**

   `{"ok":false,"error":"Unauthorized"}`

2. Wrong secret → **401**

   `{"ok":false,"error":"Unauthorized"}`

3. GET instead of POST → **405**

   `{"ok":false,"error":"Method not allowed"}`

4. Unknown platform `tiktok` with valid secret → **400**

   `{"ok":false,"error":"Invalid platform. Accepted values: instagram, facebook, x, linkedin, pinterest, whatsapp, youtube."}`

5. Missing `published_at` → **400**

   `{"ok":false,"error":"published_at is required."}`

6. Valid manual insert with `external_post_id: "VERIFY-DELETE-ME-001"` and `brief_version: 1` → **201**

   `{"ok":true,"created":true,"id":"c8a490af-0e22-4a13-aead-eb0789b5be70","record":{"id":"c8a490af-0e22-4a13-aead-eb0789b5be70","workspace_id":"a0eb078c-8ea5-44b6-b3cb-a7ba9ca23293","channel_id":null,"campaign_id":null,"content_variant_id":null,"platform":"instagram","external_post_id":"VERIFY-DELETE-ME-001","external_url":"https://instagram.com/p/VERIFY-DELETE-ME-001","published_at":"2026-08-13T11:51:27.094+00:00","language":null,"source":"manual","outcome_score":null,"outcome_note":null,"outcome_recorded_at":null,"raw_payload":{"source":"manual","platform":"instagram","external_url":"https://instagram.com/p/VERIFY-DELETE-ME-001","published_at":"2026-08-13T11:51:27.094Z","brief_version":1,"external_post_id":"VERIFY-DELETE-ME-001"},"created_by":null,"created_at":"2026-08-13T11:51:27.944462+00:00","updated_at":"2026-08-13T11:51:27.944462+00:00","brief_version":1}}`

7. Identical repeat → **200**, `created: false`, same ID

   `{"ok":true,"created":false,"id":"c8a490af-0e22-4a13-aead-eb0789b5be70","record":{"id":"c8a490af-0e22-4a13-aead-eb0789b5be70","workspace_id":"a0eb078c-8ea5-44b6-b3cb-a7ba9ca23293","channel_id":null,"campaign_id":null,"content_variant_id":null,"platform":"instagram","external_post_id":"VERIFY-DELETE-ME-001","external_url":"https://instagram.com/p/VERIFY-DELETE-ME-001","published_at":"2026-08-13T11:51:27.094+00:00","language":null,"source":"manual","outcome_score":null,"outcome_note":null,"outcome_recorded_at":null,"raw_payload":{"source":"manual","platform":"instagram","external_url":"https://instagram.com/p/VERIFY-DELETE-ME-001","published_at":"2026-08-13T11:51:27.094Z","brief_version":1,"external_post_id":"VERIFY-DELETE-ME-001"},"created_by":null,"created_at":"2026-08-13T11:51:27.944462+00:00","updated_at":"2026-08-13T11:51:27.944462+00:00","brief_version":1}}`

8. `brief_version` → persisted as integer `1` on both responses.

Cleanup statement executed:

```sql
delete from public.published_posts
where external_post_id = 'VERIFY-DELETE-ME-001'
returning id, external_post_id;
```

It returned exactly the created ID. The subsequent count query returned `0`.

Repository checks:

- `npm ci`: completed from the lockfile; npm reported 19 existing audit findings.
- Focused recorder suite: 1 file, 4 tests passed.
- Full Vitest suite: 29 files, 103 tests passed.
- `npm run lint`: no errors; the existing `src/Hooks/useDrafts.js` hook warning remains.
- `npm run build`: passed with Production client variables, including import-casing validation.
- `bash -n scripts/record-published.sh`: passed.
- `git diff --check`: passed.
- Supabase security advisor: unchanged; only the pre-existing
  `create_workspace` executable-function warning and disabled leaked-password
  protection remain.

## Known issues

- The canonical checkout's ignored `.env.local` was accidentally overwritten during manual secret transfer and needs separate restoration. No secret was committed.
- Existing npm-audit, hook, bundle-size, third-party `eval`, and advisor
  warnings remain outside this ticket.

## Recommended next task

- After an actual manual publication, run the ready-to-run command with the real
  platform, language, URL, and optional brief version. Confirm the returned row
  in `/admin/published`; do not create a record before publication.

## Questions requiring Tulio

- None for commit 1.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None, as required.

## Reusable learnings added

- Added the verified rule to exercise the lowest durable Production layer
  before stacking more capability above it.

## Memory updates withheld

- DEC-021 through DEC-024 and DEC-026 remain unratified and were not added or changed.
- No n8n, outbound publishing, social API, OAuth, UI, or schema work was performed.

## Git diff summary

- Commit 1 records the exact Production verification and cleanup evidence.
- Commit 2 adds the executable recorder, usage documentation, four tests, and
  final project-memory updates.
- The isolated branch is `agent/first-record-011`; the unrelated uncommitted archive work in the canonical checkout remains untouched.
