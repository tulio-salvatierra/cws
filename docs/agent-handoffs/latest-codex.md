Task ID: CWS-MARKETING-M3
Agent: Codex
Objective: Make the completed one-post Marketing V1 experiment durable across reloads without extending the frozen M2 scope.

Files changed:
- `api/marketing-linkedin.js`
- `api/__tests__/marketing-linkedin.test.js`
- `src/pages/admin/MarketingPage.jsx`
- `src/pages/admin/__tests__/MarketingPage.test.jsx`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/agent-handoffs/latest-codex.md`

Implementation:
- The authenticated owner `GET /api/marketing-linkedin` still reads the latest `marketing_publish_attempts` row from server-only persistence. A non-terminal latest attempt is reconciled with bundle.social on that GET; a terminal Posted or Error row is rendered directly from persistence.
- The GET response now includes up to ten earlier attempts as `attempt_history`, excluding the current attempt. This is a read-only query; no migration, RLS change, or write path was added.
- The page makes Preparing, Scheduled, Processing, Retrying, Posted, and Error distinct. A Posted result states that it is complete, exposes the persisted LinkedIn permalink, locks the caption, and leaves no active Confirm action.
- Historical failed records remain visible with the retained provider error and an explicit audit-history label. The original upload-contract failure is never overwritten or retried by M3.

Verification:
- `npm run test:run` — 35 files, 133 tests passed. Provider requests are mocked; tests create no real post.
- `npm run lint` — no errors; the existing `src/Hooks/useDrafts.js` exhaustive-deps warning remains.
- `npm run build` — import-casing validation and Vite production build passed. Existing Lottie `eval` and large-chunk warnings remain.
- `git diff --check` — passed.

Safety boundary:
- No bundle.social upload, create-post call, provider mutation, or real LinkedIn post occurred in M3.
- No Instagram, Facebook, scheduling UI, webhook, notification, AI, asset-library, Campaign, Variant, Approval, Export, n8n, generic-event, CEO, or legacy Marketing change was added.
- Authority remains PREPARE -> owner CONFIRM -> automatic result reconciliation.

Git follow-up:
- Existing local documentation commits remain unpushed because GitHub HTTPS credentials were previously unavailable. Reattempt a normal scoped push after credentials are restored; documentation delivery must not gate this completed application behavior.
