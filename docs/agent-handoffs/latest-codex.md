# Latest Codex Handoff

Task ID: CWS-FIRST-RECORD-011
Agent: Codex
Objective: Prove the Production publication return endpoint end to end, restore an empty publication log, and reduce recording the first real post to one command.

## Ready-to-run command

The recording command is pending commit 2. No real publication row was created by this verification commit.

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

## Database or API changes

- No endpoint, schema, or permanent database change.
- Production was redeployed after the webhook secret was updated.
- One temporary `published_posts` row was inserted through the live endpoint, verified through an identical retry, and deleted by `external_post_id`.

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

- None in commit 1.

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

## Known issues

- The one-command recording script and its documentation remain for commit 2.
- The canonical checkout's ignored `.env.local` was accidentally overwritten during manual secret transfer and needs separate restoration. No secret was committed.

## Recommended next task

- Complete commit 2, then use the documented command only after a real post has actually been published.

## Questions requiring Tulio

- None for commit 1.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`

## Permanent decisions added

- None, as required.

## Reusable learnings added

- Pending commit 2.

## Memory updates withheld

- DEC-021 through DEC-024 and DEC-026 remain unratified and were not added or changed.
- No n8n, outbound publishing, social API, OAuth, UI, or schema work was performed.

## Git diff summary

- Commit 1 changes only this handoff to preserve the exact live verification and cleanup evidence.
- The isolated branch is `agent/first-record-011`; the unrelated uncommitted archive work in the canonical checkout remains untouched.
