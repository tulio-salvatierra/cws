Task ID: CWS-MARKETING-M2
Agent: Codex
Objective: Deliver the smallest isolated, owner-confirmed path for one CWS LinkedIn post through bundle.social, without extending legacy Content Operations.

Files inspected:
- The frozen M1/M2 tickets, Task 001/M0 documentation, current admin auth and API patterns, legacy publish route, Vercel configuration, database conventions, and the existing CWS logo asset
- Official bundle.social account, upload, post, reference-key, and status documentation

Files changed:
- `api/marketing-linkedin.js`
- `api/__tests__/marketing-linkedin.test.js`
- `src/pages/admin/MarketingPage.jsx`
- `src/pages/admin/__tests__/MarketingPage.test.jsx`
- `src/App.jsx`
- `src/components/admin/AdminLayout.jsx`
- `src/components/admin/__tests__/AdminLayout.test.jsx`
- `supabase/migrations/20260907163842_marketing_publish_attempts.sql`
- `supabase/tests/marketing_publish_attempts_test.sql`
- `vercel.json`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

Database and API changes:
- Added the standalone `marketing_publish_attempts` migration. It stores the immutable owner/workspace/reference/caption/asset/destination identity plus upload ID, provider post ID, status, error, permalink, and provider response data. The table has no browser-role grants or RLS policies; only the server service role can use it.
- Added authenticated `GET`/`POST /api/marketing-linkedin`. It requires a valid session and active workspace owner, performs the read-only bundle.social Company Page verification before every post attempt, uploads only `public/images/logo.png`, sends only the LinkedIn request shape, and polls provider status while the page is open.
- The function includes the exact public logo file in its Vercel bundle. Provider credentials remain server-side environment variables and no `VITE_*` provider value was added.

Safety and duplicate protection:
- Confirm creates one UUID-backed `reference_key`; the UI locks after an attempt is created.
- The endpoint writes the durable intent before provider side effects and the database enforces a unique reference key.
- A repeated request returns the existing attempt without uploading or creating another post. If create-post has an ambiguous timeout/failure, the endpoint looks up the same reference key and never replays create-post.
- No real provider upload or social post was made by this task. The API uses the provider-required near-immediate scheduled timestamp internally, but exposes no scheduling control or scheduler.

Tests and verification:
- `npm run test:run` — 35 files and 127 tests passed. The provider tests mock every provider call and never contact bundle.social.
- `npm run lint` — no errors; the pre-existing `src/Hooks/useDrafts.js` exhaustive-deps warning remains.
- `npm run build` — import-casing validation and Vite production build passed. Existing lottie `eval` and large-chunk warnings remain.
- `git diff --check` — passed.
- `npx supabase test db` could not run because local Postgres is not running. The migration has not been applied or checked against a managed database: the linked migration-list request repeatedly timed out, and the available Supabase project is inactive and was not proven to be the Production database.

Live provider verification status:
- Vercel lists `BUNDLE_SOCIAL_API_KEY` and `BUNDLE_SOCIAL_TEAM_ID` as encrypted Production values, but the local Vercel environment pull had empty values. A direct local provider check therefore could not identify the connected Company Page.
- The deployed authenticated endpoint will block before upload/post creation unless bundle.social returns a LinkedIn channel whose returned name, username, address, or ID identifies Cicero Web Studio. A signed-in owner must load `/admin/marketing` after deployment and see “Destination verified” before using Confirm.

Known limitations:
- The exact connected Company Page and the remote database schema remain unverified until the correct Production deployment is live and its database migration is applied.
- The no-publish GET preflight requires an authenticated owner session by design; no owner browser session was available to independently run it here.

Recommended next step:
- After the commit reaches Production, apply migration `20260907163842_marketing_publish_attempts.sql` to the database identified by the Production `GENERATION_SUPABASE_URL`. Then, as workspace owner, open `/admin/marketing`. If the page shows “Destination verified,” review the caption and click Confirm yourself to make the one controlled LinkedIn post. If it shows “Not ready,” do not click Confirm; reconnect/select the Cicero Web Studio Company Page in bundle.social.

Permanent decisions added:
- None. The isolated M2 implementation is ticket-scoped and has not been elevated to a permanent architecture decision.

Reusable learnings added:
- None.

Git summary:
- M1 and M2 remain isolated from Campaigns, Channels, Variants, Approvals, Exports, n8n, webhooks, generic events, and the legacy Marketing publishing route. No old Marketing code was deleted.
