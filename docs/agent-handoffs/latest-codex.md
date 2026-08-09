# Latest Codex Handoff

Task ID: CWS-VERCEL-RELIABILITY-005
Agent: Codex
Objective: Prevent stale Vite deployment chunks from producing a black screen and prevent the client-intake Google Sheets call from running until Vercel terminates it.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `api/client-portal-intake.js`
- `src/main.jsx`
- `src/lib/clientPortalGoogleSheet.js`
- `src/lib/clientPortalAutomations.js`
- `src/components/ClientPortal/ClientIntakeForm.jsx`
- `vite.config.js`
- `vercel.json`
- Live Vercel deployment metadata, response headers, and generated build output

## Files changed

- `api/client-portal-intake.js`
- `api/__tests__/client-portal-intake.test.js`
- `server/google-sheets-webhook.js`
- `src/main.jsx`
- `src/lib/vitePreloadRecovery.js`
- `src/lib/__tests__/vitePreloadRecovery.test.js`
- `vite.config.js`
- `vercel.json`
- `eslint.config.js`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

No database changes. `/api/client-portal-intake` now aborts its Google Sheets
webhook call after 12 seconds, returns controlled `502`/`504` JSON responses,
and records structured start/completion/failure logs without payload contents,
URLs, or secrets. Vercel allows the function to run for at most 20 seconds.
Local Vite development uses the same shared webhook behavior.

## Security decisions

- Webhook payloads, URLs, and secrets are excluded from logs.
- The shared server helper lives outside `/api`, so Vercel bundles it as a
  dependency instead of exposing it as a separate public function.
- No authentication, Supabase, RLS, n8n, or publishing behavior changed.

## Decisions made

- Handle `vite:preloadError` with one guarded reload per 10 seconds.
- Exclude `/assets`, `/api`, and file-like paths from the SPA fallback so a
  missing JavaScript asset returns a real 404 instead of `index.html`.
- Use a 12-second upstream deadline within a 20-second Vercel function limit.
- Ignore generated `.vercel` output during lint.

## Assumptions

- The Google Sheets webhook should normally respond within 12 seconds. Slower
  responses are treated as unhealthy and return a controlled retry message.
- Existing client-side handling remains unchanged; this task does not redesign
  client-intake persistence or notification sequencing.

## Tests added

- One-time Vite preload recovery and reload-loop prevention.
- Successful client-intake webhook forwarding.
- Controlled Google Sheets timeout behavior.

## Tests run

- `npx vitest run src/lib/__tests__/vitePreloadRecovery.test.js api/__tests__/client-portal-intake.test.js` — 2 files, 4 tests passed.
- `npm run test:run` — 19 files, 62 tests passed.
- `npm run check:imports` — passed.
- Production Vite build with non-secret validation values — passed.
- `npx vercel build --prod --yes` — passed and validated the route pattern and 20-second function configuration.
- `npm run lint` — passed with the existing `useDrafts` dependency warning; no errors.

## Known issues

- The real Google Sheets webhook was not invoked during automated testing to
  avoid creating a production intake row.
- Live asset-404 and intake behavior require deployment and production smoke
  testing.
- The existing `useDrafts` hook-dependency lint warning remains unrelated.
- Vercel's install step reports existing npm audit findings; no dependency
  upgrade was attempted in this scoped task.

## Recommended next task

Push and deploy this patch, then verify that an old/missing `/assets/*.js` URL
returns 404, a current campaign page loads, and one controlled client-intake
submission either succeeds or returns a logged error within 12 seconds.

## Questions requiring Tulio

- Approve the commit and push to `main` when ready for live verification.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- SPA catch-all rewrites must not convert missing hashed assets into HTML, and
  Vite apps should recover once from stale dynamic chunks after deployment.

## Memory updates withheld

- The 12-second/20-second timing values remain implementation settings, not
  permanent architectural decisions.

## Git diff summary

The reliability patch and project-memory updates are local and uncommitted.
No unrelated pre-existing worktree changes were present. No commit, push,
deployment, database mutation, or production intake submission was performed.
