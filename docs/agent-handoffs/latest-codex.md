Task ID: CWS-PUBLISH-ROUTE-FIX-032
Agent: Codex
Objective: Repair the missing Vercel route used by the LinkedIn publish UI.

Files inspected:
- src/pages/admin/VariantDetailPage.jsx
- api/publish-linkedin.js
- api/published.js
- api/__tests__/publish-linkedin.test.js

Files changed:
- api/publish/linkedin.js
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Database or API changes:
- Added `api/publish/linkedin.js` as a Vercel route wrapper for the existing
  `api/publish-linkedin.js` handler.
- No publishing logic, credentials, database schema, or n8n workflow changed.

Security decisions:
- The wrapper reuses the existing authenticated handler and preserves its
  session, exported-status, workspace-membership, and environment checks.

Tests added: None; the existing publish-linkedin handler tests cover behavior.

Tests run:
- Full Vitest suite: 35 files, 123 tests passed.
- `npm run lint`: passed with the existing `useDrafts` exhaustive-deps warning.
- `npm run build`: passed, including import-casing validation.

Deployment:
- Preview deployment `dpl_3b3fPAvgQycTzk9wFGbaj16TsZ1S` is READY at
  `https://cws-aes5wo8n1-t00lio-s-team.vercel.app`.

Known issues:
- The reported Supabase approvals 400 is separate from the route 404. The
  screenshot shows the variant already approved; a second approval submission
  should not be retried.

Recommended next task:
- Retry the LinkedIn action on the new Preview URL. Promote this commit to
  Production only after the route returns an authenticated response rather
  than HTML 404.

Questions requiring Tulio: None.
Project-memory files updated:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: None.
Git diff summary:
- Added one route wrapper; unrelated local changes remain preserved.
