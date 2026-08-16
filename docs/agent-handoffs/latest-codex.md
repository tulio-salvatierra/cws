# Latest Codex Handoff

Task ID: CWS-N8N-DRY-RUN-017
Agent: Codex
Objective: Retire the failing legacy schedules and establish the first authenticated, non-publishing CWS-to-n8n invocation path.

Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- Existing generation, approval, export, agent-run, and publication-return APIs and tests
- Live n8n workflow definitions, credentials, and recent execution failures
- Vercel Production and Preview environment configuration

Files changed:
- `.env.example`
- `api/n8n-dry-run.js`
- `api/__tests__/n8n-dry-run.test.js`
- `n8n/cws-dry-run-bridge.json`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `vercel.json`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`

Database or API changes:
- Added authenticated `POST /api/n8n-dry-run` for active workspace owners.
- The first cycle accepts only exported, archived test variants and loads the latest immutable export version.
- Each app invocation creates an `agent_runs` record, advances it through queued/running/completed or failed, and sends a minimized handoff to n8n.
- Added a dedicated published n8n workflow, `CWS OS — Dry Run Bridge` (`95kVRFWAVKMqhEuh`), with header authentication, payload validation, and a correlation-bound acknowledgement.
- No schema migration was required. No `published_posts` row is created and no social API is called.

Security decisions:
- The browser never receives the n8n URL or shared secret; the Vercel function invokes n8n server-side.
- The endpoint verifies the Supabase session and requires an active workspace owner before using the service-role client.
- The shared secret is stored only in n8n credentials and Vercel server-side Production/Preview variables; no value is stored in Git.
- The initial bridge is additionally limited to exported records explicitly classified and archived as tests.

Decisions made:
- Unpublished failing legacy workflows WF1 and WF5 while preserving their definitions and execution history.
- Made the current CWS Supabase project authoritative for revived integration work.
- Activated only a separate acknowledgement workflow; outbound publishing remains disabled.

Assumptions:
- `CWS-001-EN-FINALTEST` remains the approved disposable first-cycle record even though it is hidden from normal views by the archive filter.
- `command_level = propose` is the correct existing database-supported level for this technical dry run; generalized execute authority remains blocked.

Tests added:
- Five API tests covering authentication, owner authorization, archived-test restriction, successful correlation-bound invocation, and failure recording.
- One UI test proving explicit owner confirmation is required before dispatch.

Tests run:
- Full Vitest suite: 32 files and 112 tests passed.
- ESLint: zero errors and one pre-existing `useDrafts.js` hook warning.
- Production-configured Vite build and import-casing check: passed.
- Version-controlled n8n workflow JSON parse: passed.
- Direct authenticated production n8n webhook verification: HTTP 200 with `ok: true`, `mode: dry_run`, and matching `N8N-DIRECT-VERIFY-001` correlation ID.
- Temporary local verification credential and response files were deleted immediately after the check.

Known issues:
- The application route and button are not live until the local changes are committed, pushed, and Production is redeployed.
- The Vercel environment-variable update explicitly requires a new deployment before the function can read it.
- The direct n8n probe validated the workflow but intentionally bypassed the app API, so the first durable `agent_runs` end-to-end record remains pending after deployment.

Recommended next task:
- Commit and push this task, redeploy Production, reveal archived test variants, run `CWS-001-EN-FINALTEST` through the new button, and verify one completed `n8n-dry-run-bridge` agent run with no publication row.

Questions requiring Tulio:
- Approve commit, push, and Production redeploy for the completed local implementation.

Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`

Permanent decisions added:
- `DEC-026` records the approved authenticated dry-run revival boundary and keeps legacy/social publishing disabled.

Reusable learnings added:
- None.

Memory updates withheld:
- The individual legacy execution failures and direct test correlation are task evidence, not reusable permanent learnings.

Git diff summary:
- Added one server-side bridge API, six focused tests, one version-controlled n8n workflow, an owner-confirmed archived-test UI action, Vercel function/env documentation, and the required project-memory updates. No SQL or schema file changed.
