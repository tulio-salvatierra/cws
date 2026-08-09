# Latest Codex Handoff

Task ID: CWS-RETURN-PATH-007
Agent: Codex
Objective: Build one authenticated, idempotent endpoint for recording publish events from any source and a minimal member-visible outcome log.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/n8n-assessment.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/pilot-readiness.md`
- `api/lead-outreach.js`
- `api/client-portal-intake.js`
- `api/lib/`
- Existing API tests and admin page tests
- `src/App.jsx`
- `src/components/admin/ContentQueue.jsx`
- `src/components/admin/AdminLayout.jsx`
- `src/lib/supabase.js`
- Supabase migrations `001`–`012` and the three timestamped workspace migrations
- Live staging migration history, enum values, RLS helpers, tables, policies, indexes, and security advisor

## Files changed

- `.env.example`
- `api/published.js`
- `api/__tests__/published.test.js`
- `src/App.jsx`
- `src/components/admin/ContentAreaTabs.jsx`
- `src/components/admin/ContentQueue.jsx`
- `src/pages/admin/PublishedPostsPage.jsx`
- `src/pages/admin/__tests__/PublishedPostsPage.test.jsx`
- `supabase/migrations/015_published_posts_return_path.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`
- `docs/learnings.md`

## Database or API changes

- Applied staging migration `20260809191332` (`015_published_posts_return_path`). Migration 015 had not previously landed.
- Added `published_at`, `outcome_score`, `outcome_note`, and `outcome_recorded_at` to `content_variants`.
- Added `published_posts` with workspace-scoped foreign keys, the existing `platform_name` enum, source/outcome checks, immutable publication identity fields, raw request payload retention, member read/outcome policies, and service-role write access.
- Added a partial unique index on `(platform, external_post_id)` when the external ID is non-null and the required workspace/date index.
- Added `POST /api/published`. It requires `x-published-webhook-secret`, validates the live platform contract, uses constant-time secret comparison, defaults source to `manual`, and returns HTTP 200 with the existing row when a retry repeats a platform/external ID pair.
- Added `/admin/published`, linked as a tab beside `/admin/legacy-queue`, without adding a sidebar item.

## Security decisions

- The endpoint uses server-only `PUBLISHED_SUPABASE_URL`, `PUBLISHED_SUPABASE_SERVICE_ROLE_KEY`, and `PUBLISHED_WEBHOOK_SECRET`. Explicit endpoint-specific database variables prevent the generic Vercel Supabase integration from silently targeting a different project.
- The service-role key is never exposed to the browser, logged, committed, or included in the webhook body.
- `anon` has no `published_posts` access. Authenticated members receive only SELECT and UPDATE; no client INSERT or DELETE grant exists.
- A database trigger makes publication identity and raw payload immutable. Member UPDATE is therefore limited to outcome fields even if a client submits additional columns.
- The caller's complete JSON body is retained in `raw_payload`; the shared secret must remain in the request header.
- Staging RLS allowed an active member to read/update an outcome and returned zero rows for a fabricated non-member. Temporary verification rows were deleted.
- The security advisor reported the same two pre-existing warnings before and after: the intentional authenticated `create_workspace` security-definer RPC and disabled leaked-password protection. No new warning was introduced. Remediation references: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Decisions made

- Added approved DEC-025: every publish, from any pipeline, records to the OS at publish time; no pipeline may publish without recording.
- Reused `platform_name` unchanged. No legacy publishing enum or workflow was modified.
- A caller may supply `workspace_id`, or a single-workspace deployment may configure `PUBLISHED_WORKSPACE_ID`.
- `created_by` is nullable because machine-originated publish events do not necessarily have a user actor; the field remains explicit for manual/user-attributed events.

## Assumptions

- Migration 015's pending `content_variants` outcome fields are `published_at`, `outcome_score`, `outcome_note`, and `outcome_recorded_at`, matching the approved outcome vocabulary used by `published_posts`.
- `manual` is the safest default source when a caller omits `source`.
- English and Spanish remain the supported publication languages for this smallest return-path foundation.

## Tests added

- API: missing secret, wrong secret, invalid platform with accepted-value message, missing required timestamp, successful insert with full raw payload, and duplicate retry returning the existing row.
- UI: member-scoped newest-first publish-log rendering and persisted outcome score/note/timestamp updates.
- Existing Content Queue coverage now also exercises the shared content-area tab component.

## Tests run

- `npm ci` — passed.
- Focused API tests — 1 file, 6 tests passed.
- Focused publish-log and Content Queue tests — 2 files, 8 tests passed.
- `VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=test-anon-key npm run build` — passed; import casing passed and 432 modules transformed.
- `npm run lint` — passed with the existing `src/Hooks/useDrafts.js` dependency warning.
- `npx vitest run` — 24 files, 76 tests passed.
- `git diff --check` — passed before the final project-memory refresh.
- Staging manual POST — first request returned 201; the retry returned 200 with the same row ID; exactly one row existed and retained the full body.
- Staging manual outcome update — an active member set `worked` plus a note and `outcome_recorded_at` persisted.
- Local browser route check — `/admin/published` loaded through the app and correctly redirected the unauthenticated localhost origin to `/admin/login`.
- Production browser check — the authenticated `/admin/published` route loaded at `https://cws-two.vercel.app`, rendered the consolidated navigation, and showed the expected empty-state message.

## Exact webhook request

Required headers:

- `Content-Type: application/json`
- `x-published-webhook-secret: <PUBLISHED_WEBHOOK_SECRET>`

```bash
curl --request POST 'https://<cws-domain>/api/published' \
  --header 'Content-Type: application/json' \
  --header "x-published-webhook-secret: $PUBLISHED_WEBHOOK_SECRET" \
  --data '{
    "workspace_id": "a0eb078c-8ea5-44b6-b3cb-a7ba9ca23293",
    "platform": "youtube",
    "external_post_id": "<platform-post-id>",
    "external_url": "https://<platform>/<post>",
    "published_at": "2026-08-09T19:20:00Z",
    "language": "en",
    "source": "n8n"
  }'
```

Accepted platforms: `instagram`, `facebook`, `x`, `linkedin`, `pinterest`, `whatsapp`, `youtube`.

## Known issues

- The existing generic server-side Supabase integration points at a different project. Do not reuse it for this endpoint; configure the explicit `PUBLISHED_SUPABASE_*` variables for `cws-os-staging` or the future production OS project.
- Production currently uses the staging OS project through the endpoint-specific variables. Moving the return path to a future production OS project requires changing all matching endpoint variables together.
- The production UI is verified, but no synthetic publish event was left in the production log. The first real publisher integration should verify the live 201/200 retry path and member outcome update.
- The existing `useDrafts` lint warning and build chunk/eval warnings remain unchanged.
- The two pre-existing Supabase security-advisor warnings remain.

## Recommended next task

Wire the selected publisher to `POST /api/published` before enabling its outbound post node, then verify one real publication, one idempotent retry, and one member outcome update in the Production log.

## Questions requiring Tulio

- Should the endpoint use one configured workspace or require every future pipeline to send `workspace_id` explicitly?
- Which assessed publisher, if any, should be revived first and wired to the return path?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`
- `docs/learnings.md`

## Permanent decisions added

- DEC-025 — every publish must record to the CWS OS at publish time.
- DEC-021 through DEC-024 and DEC-026 were not added.

## Reusable learnings added

- Build the authenticated return path before publishing capability so every future pipeline begins with durable outcome evidence.

## Memory updates withheld

- The future production Supabase project and single-workspace versus caller-supplied workspace convention remain unapproved.
- No revive/retire decision, publishing platform scope, workflow identity, or n8n wiring decision was added.

## Git diff summary

The three ordered implementation commits plus the read-only n8n assessment are published through PR #11. Migration 015 is applied to staging. The four endpoint-specific variables are configured as encrypted Production variables, deployment `dpl_3vvwf3TjrzRFRo2qN7YNnrDv9fif` is Ready at `https://cws-two.vercel.app`, and the signed-in empty publish-log state is verified. No workflow, publishing action, social credential, CWS-001 record, or legacy enum was changed.
