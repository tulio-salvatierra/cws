Task ID: CWS-PUBLISH-ROUTE-FIX-032
Agent: Codex
Objective: Repair and production-verify the missing Vercel route used by the LinkedIn publish UI.

Files inspected:
- docs/product-definition.md
- docs/technical-conventions.md
- docs/decisions.md
- docs/learnings.md
- docs/agent-handoffs/latest-codex.md
- docs/task-ledger.md
- vercel.json
- api/publish-linkedin.js
- api/__tests__/publish-linkedin.test.js

Files changed:
- vercel.json
- api/__tests__/publish-linkedin-rewrite.test.js
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md
- docs/learnings.md

Database or API changes:
- Added a Vercel rewrite from `/api/publish/linkedin` to the existing `/api/publish-linkedin` serverless function.
- Removed the attempted wrapper-function approach from the final implementation because it exceeded the Vercel Hobby 12-function deployment limit.
- No publishing logic, credentials, database schema, n8n workflow, or Supabase data changed.

Security decisions:
- Production testing used safe unauthenticated `GET` probes only. A production `POST` probe was not run because it could trigger publishing if guards failed.
- The rewrite preserves the existing POST-only authenticated handler and its session, exported-status, workspace-membership, and environment checks.

Decisions made:
- Use a rewrite for this API alias instead of creating another Vercel function.

Assumptions:
- `/api/publish/linkedin` is the UI path to preserve because `VariantDetailPage` already calls it.
- A `405 Method not allowed` response to `GET /api/publish/linkedin` is the safe production proof that the alias reaches the existing POST-only handler.

Tests added:
- `api/__tests__/publish-linkedin-rewrite.test.js`

Tests run:
- `npm run test:run -- api/__tests__/publish-linkedin.test.js api/__tests__/publish-linkedin-rewrite.test.js`: passed, 2 files and 6 tests.
- `npm run lint`: passed with the existing `src/Hooks/useDrafts.js` exhaustive-deps warning.
- `npm run build`: passed, including import-casing validation.

Known issues:
- `src/Hooks/useDrafts.js` still has the pre-existing exhaustive-deps lint warning.
- Production authenticated publish was not executed from Codex because that would be a real publishing action.
- The local working tree still contains unrelated pre-existing dirty files.

Recommended next task:
- In the signed-in production UI, retry the LinkedIn action only for the intended exported variant. If n8n accepts it, verify the resulting `agent_runs` record and publish return-path completion.

Questions requiring Tulio:
- None.

Project-memory files updated:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md
- docs/learnings.md

Permanent decisions added:
- None.

Reusable learnings added:
- Use Vercel rewrites for API aliases when a wrapper function would consume another Hobby-plan function slot.

Memory updates withheld:
- None.

Git diff summary:
- Committed `a29f8e2` first with a wrapper function, but the production deploy failed because the Hobby plan allows no more than 12 serverless functions.
- Committed `f0a49d9` to replace the wrapper with a rewrite and regression test.
- Final production deployment for this route fix is `dpl_ELbCbyFjiJNXHEiydWc2FmYDuDMX`.
- A safe production `GET /api/publish/linkedin` returns `405 Method not allowed`, proving the alias reaches the existing POST-only handler.
