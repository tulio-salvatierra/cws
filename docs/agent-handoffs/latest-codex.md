# Latest Codex Handoff

Task ID: CWS-CAMPAIGN-UX-007
Agent: Codex
Objective: Replace the raw duplicate campaign-code conflict with a clear, accessible form message.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `src/pages/admin/NewCampaignPage.jsx`
- Existing admin interaction and smoke tests
- `supabase/migrations/009_campaigns_content_variants.sql`
- Current Supabase PostgREST error-code and JavaScript error-handling documentation

## Files changed

- `src/pages/admin/NewCampaignPage.jsx`
- `src/pages/admin/__tests__/NewCampaignPage.test.jsx`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

The pending CWS-VERCEL-RELIABILITY-006 live-verification documentation in the
same four memory files was preserved.

## Database or API changes

None. The existing `(workspace_id, code)` uniqueness constraint remains the
authoritative enforcement boundary.

## Security decisions

- The UI handles only the stable Postgres `23505` error code and does not weaken, pre-bypass, or replace the database constraint.
- Other Supabase errors retain their existing human-readable message.
- No service-role credential, RLS change, or additional data read was introduced.

## Decisions made

- Branch on `error.code === '23505'`, not database message text.
- Tell the user that the campaign code already exists in the current workspace and ask for a different code.
- Render the message through an accessible `role="alert"` while keeping the completed form values and re-enabling submission.

## Assumptions

- Any `23505` returned by this minimal campaign insert currently represents the approved workspace/code uniqueness constraint.
- Campaign codes remain case-normalized by the existing uppercase input behavior.

## Tests added

- A Supabase `23505` response displays the workspace-scoped duplicate-code message.
- The Create campaign button is re-enabled after the rejected insert.

## Tests run

- Focused New campaign and workspace tests — 2 files, 12 tests passed.
- `npm run test:run` — 22 files, 68 tests passed.
- `npm run lint` — passed with the existing `useDrafts` dependency warning.
- `npm run build` — passed, including import-casing validation.
- `git diff --check` — passed before project-memory refresh.

## Known issues

- The browser network panel will still show the legitimate HTTP 409 because the database rejects the duplicate; the page now explains it clearly.
- The form does not proactively query code availability, avoiding a race-prone extra request.
- The existing `src/Hooks/useDrafts.js` dependency warning remains.

## Recommended next task

Push and deploy the duplicate-code message with the pending live-verification
records. Then resume the approval-history and new-review-cycle workflow.

## Questions requiring Tulio

- None.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Branch on stable Postgres/PostgREST error codes rather than message text when translating database errors into user-facing feedback.

## Memory updates withheld

- The exact duplicate-code wording is a scoped UI choice, not a permanent product or architectural decision.

## Git diff summary

Commit `22c3373 fix: explain duplicate campaign codes` adds a stable-code
duplicate-campaign error mapper, an accessible alert, one focused interaction
test, and required project records. It also contains the previously completed
live-verification record for CWS-VERCEL-RELIABILITY-006. It was pushed to
`origin/main`; no unrelated user changes were included.
