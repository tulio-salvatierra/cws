# Latest Codex Handoff

Task ID: CWS-VERCEL-RELIABILITY-006
Agent: Codex
Objective: Remove recurring client-portal intake 504 responses and repair browser-invalid form patterns.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `api/client-portal-intake.js`
- `api/__tests__/client-portal-intake.test.js`
- `server/google-sheets-webhook.js`
- `src/lib/clientPortalGoogleSheet.js`
- `src/lib/clientPortalAutomations.js`
- `src/components/ClientPortal/AdminClientDashboard.jsx`
- `src/components/LeadFormModal/LeadFormModal.tsx`
- `src/pages/admin/NewCampaignPage.jsx`
- `src/pages/admin/__tests__/WorkspacePagesSmoke.test.jsx`
- `vercel.json`
- Current official Vercel `waitUntil` documentation

## Files changed

- `api/client-portal-intake.js`
- `api/__tests__/client-portal-intake.test.js`
- `server/google-sheets-webhook.js`
- `src/components/ClientPortal/AdminClientDashboard.jsx`
- `src/components/LeadFormModal/LeadFormModal.tsx`
- `src/pages/admin/NewCampaignPage.jsx`
- `src/pages/admin/__tests__/WorkspacePagesSmoke.test.jsx`
- `package.json`
- `package-lock.json`
- `vercel.json`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

The intake endpoint now schedules the Google Sheets request with Vercel
`waitUntil` and immediately returns HTTP 202 with `{ ok: true, queued: true }`.
The bounded downstream deadline increased from 12 to 45 seconds, inside a
60-second function duration. Downstream rejection, timeout, and failure remain
structured server logs. No database or Supabase change was made.

## Security decisions

- The Google Sheets secret remains server-only and is still added only inside the Vercel function.
- The browser receives acceptance state, not the secret or downstream response body.
- Background work remains bounded and is registered with the function lifecycle rather than left as an unmanaged promise.

## Decisions made

- Treat the workbook update as a non-blocking side effect because client UI changes do not depend on its response body.
- Report the manual action as queued rather than claiming the workbook already changed.
- Use a hyphen-separated campaign-code pattern that is valid under current Unicode-aware HTML pattern rules.
- Remove the restrictive phone pattern; `type="tel"` and `inputMode="tel"` remain without rejecting legitimate international formats.

## Assumptions

- Vercel's configured Node runtime is at least Node 20, as required by `@vercel/functions` 3.9.1 and confirmed by the Node 24 Vercel build.
- Google Sheets processing is eventually consistent and is not required to complete before the UI update returns.

## Tests added

- The intake handler returns HTTP 202 immediately and registers one background promise.
- A downstream timeout is contained and logged without changing the accepted browser response.
- The campaign code field exposes the browser-valid hyphen-separated pattern.

## Tests run

- Focused intake and workspace tests — 2 files, 13 tests passed.
- `npm run test:run` — 21 files, 67 tests passed.
- `npm run lint` — passed with the existing `useDrafts` dependency warning.
- `npm run build` — passed, including import-casing validation.
- `npx vercel build` — passed with the 60-second function configuration.
- `git diff --check` — passed before project-memory refresh.

## Known issues

- A 202 response confirms queuing, not successful workbook persistence; production logs remain the source for downstream completion or failure.
- The Google Apps Script endpoint itself may still fail or exceed 45 seconds; the browser will no longer wait on it.
- The existing `src/Hooks/useDrafts.js` dependency warning remains.
- `npm audit` reports 19 dependency vulnerabilities; no broad audit fix was applied because it is outside this ticket.

## Recommended next task

Push and deploy, then change one client status and verify the browser receives
202 without a 504. Confirm the corresponding workbook change and inspect the
function log for the matching completion event. Also open New campaign and
verify `CWS-002` submits without a pattern warning.

## Questions requiring Tulio

- None before deployment testing.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Non-critical external side effects should use a managed background task and return an honest accepted/queued state to the UI.

## Memory updates withheld

- The 45/60-second timeout values are integration-specific implementation settings, not permanent product decisions.
- No guarantee of Google Sheets persistence is recorded until the deployed workflow is verified live.

## Git diff summary

Commit `b8206f6 fix: queue client portal sheet sync` changes the intake relay
from synchronous 504-prone behavior to managed background execution, adds the
official Vercel Functions dependency, repairs both browser-risky HTML patterns,
updates the manual sync message, and adds focused regression coverage and
required project records. It was pushed to `origin/main`. No unrelated
pre-existing changes were present.
