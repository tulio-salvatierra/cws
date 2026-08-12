# Latest Codex Handoff

Task ID: CWS-GENERATION-REVIEW-010
Agent: Codex
Objective: Add the smallest owner-only review path that can accept or reject a generated proposal without publishing it or overwriting an existing content variant.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `api/generate-draft.js`
- `api/__tests__/generate-draft.test.js`
- `src/pages/admin/AgentRunsPage.jsx`
- `src/pages/admin/__tests__/AgentRunsPage.test.jsx`
- `supabase/migrations/009_campaigns_content_variants.sql`
- `supabase/migrations/011_agent_runs.sql`
- `supabase/migrations/20260809195932_016_channel_brief.sql`
- `vercel.json`
- Current Supabase Data API, function, and RLS guidance

## Files changed

- `supabase/migrations/20260812153257_generated_draft_review.sql`
- `api/review-generated-draft.js`
- `api/__tests__/review-generated-draft.test.js`
- `src/components/admin/GeneratedDraftReviewCard.jsx`
- `src/components/admin/__tests__/GeneratedDraftReviewCard.test.jsx`
- `src/pages/admin/AgentRunsPage.jsx`
- `vercel.json`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Added nullable immutable `content_variants.source_agent_run_id` with a workspace-consistent composite foreign key to `agent_runs` and a unique partial index, so a generated run can create at most one promoted variant.
- Added service-role-only `review_generated_draft` as a security-invoker database function. It locks the run, verifies the generated-run type and active owner actor, and performs each review atomically.
- Accepting creates one new `draft` content variant from the owner-edited title, code, and copy, records immutable run provenance, and changes the run from `needs_review` to `completed`.
- Rejecting creates no content variant and changes the run from `needs_review` to `superseded`.
- Repeating the same terminal decision is idempotent; incompatible or unauthorized decisions fail.
- Added authenticated `POST /api/review-generated-draft`, which validates the Supabase user before calling the restricted function and translates duplicate variant codes into a friendly HTTP 409 response.
- Added the owner review card to `/admin/agent-runs`, including same-channel campaign selection, editable draft fields, an explicit confirmation boundary, accept, and reject.
- No approval record, publish event, webhook call, legacy-table mutation, or n8n integration was added.

## Security decisions

- Only a current active workspace owner may accept or reject a generated proposal.
- The browser never receives or sends the service-role key; it supplies only its access token and review input.
- The function's execute privilege is revoked from public, anonymous, and authenticated roles and granted only to the service role.
- Workspace provenance is enforced by a composite foreign key, not only application logic.
- Acceptance creates a new variant instead of overwriting an existing record, preserving history and preventing an AI proposal from silently replacing authored work.
- The Supabase security advisor reported the same two pre-existing warnings before and after the migration: intentional authenticated access to `create_workspace` and disabled leaked-password protection.

## Decisions made

- No permanent decision was added.
- The approved task-level workflow is owner review with accept or reject; acceptance creates a new draft content variant and remains disconnected from approvals and publishing.

## Assumptions

- A generated proposal must remain review-only until an owner makes an explicit decision.
- Campaign selection is required at acceptance because the generation run is channel-scoped but not campaign-scoped.
- The current one-run-to-one-promoted-variant model is the smallest viable provenance boundary.

## Tests added

- API authentication is required before a review call.
- Acceptance requires campaign, code, title, and draft.
- Edited acceptance input is forwarded with the authenticated actor ID.
- Rejection sends no variant fields.
- Duplicate variant codes return a friendly 409 response.
- The review UI filters campaigns to the generated run's channel and disables acceptance until explicit confirmation.
- The edited draft is submitted and the page refresh callback runs after acceptance.

## Tests run

- Managed staging transaction: owner acceptance created one linked draft variant; retry returned the same result and retained one variant; non-owner review failed; owner rejection created no variant; all synthetic rows were rolled back.
- Function privileges: anonymous false, authenticated false, service role true.
- Focused Vitest review tests: 3 files, 8 tests passed.
- Full Vitest suite: 28 files, 94 tests passed.
- `npm run lint`: passed with the unchanged `src/Hooks/useDrafts.js` dependency warning.
- `npm run build`: passed; import-casing check passed and 433 modules transformed.
- `git diff --check`: passed.
- `npx supabase migration list`: new migration `20260812153257` matches locally and remotely.

## Known issues

- The real generated run `e0104603-d197-461e-8ae3-780e1bb2ef35` remains `needs_review` and has no linked variant so Tulio can make the first real decision in the UI.
- PR #14 is merged into `main` as `8290694`, and Production deployment `dpl_Aa1SQQVr13pNzcs9W3pD7DpyDvEW` is Ready. The live endpoint rejects an unauthenticated review with HTTP 401, and `/admin/agent-runs` returns HTTP 200.
- Existing migration-history mismatches for local `015`, remote `20260809191332`, local `20260809195932`, and remote `20260809200028` remain unchanged and require a separate reconciliation task.
- Existing chunk-size, third-party `eval`, dependency-audit, and `useDrafts` lint warnings remain unchanged.
- Acceptance creates a draft variant only; approval requests and publishing remain separate later steps.

## Recommended next task

Have Tulio accept or reject the real generated proposal on `/admin/agent-runs`. If accepted, verify the linked draft variant and then design the separate approval-request step.

## Questions requiring Tulio

- Choose Accept or Reject for the first real generated proposal after reviewing and editing it in Production.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Promote a generated proposal through one atomic, idempotent database operation and enforce workspace-consistent provenance with a composite foreign key.

## Memory updates withheld

- The one-run-to-one-variant rule, terminal run statuses, UI wording, and requirement to select a campaign at review time remain task-level choices rather than approved permanent decisions.
- No automatic approval, publishing, n8n integration, or existing-variant overwrite behavior was added to permanent memory.

## Git diff summary

PR #14 merged as `8290694`; Production deployment `dpl_Aa1SQQVr13pNzcs9W3pD7DpyDvEW` is Ready. The task adds one migration, one authenticated review endpoint, one owner review component, seven focused API/UI tests, Agent Runs integration, a 30-second Vercel function limit, and required project-memory updates. Publishing, n8n, legacy social tables, existing variants, approvals, and the real generated run remain untouched pending Tulio's review decision.
