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
- The former `GET /api/v1/social-account?teamId=…` provider request returned `404 Cannot GET` at the correct `https://api.bundle.social` host. The current public OpenAPI exposes the supported, read-only `GET /api/v1/social-account/by-type?type=LINKEDIN&teamId=…` route instead.
- Commit `2f86f98` replaces only that server-side lookup and its response shape. Vercel Production deployment `dpl_HBqkqFVBmHJSU6EXESbpuoHsHei5` is Ready. The new test asserts the complete provider URL and the server-side `x-api-key` header; it does not expose a real credential.
- Screenshot evidence shows the intended LinkedIn connection is “Cicero Web Studio” with `cicero-web-studio`. Commit `ea5e9e1`, deployed as `dpl_8wDfWdX8p7aNLUiyFeRF6RF79mFW`, recognizes that identifier in a selected channel plus all documented top-level account/user identity fields.
- Vercel's local Production environment pull supplied empty secret values to this execution environment. A direct read-only provider lookup therefore returned 401 and was not used to infer anything about Vercel runtime configuration. The temporary credentials file was deleted.
- An authenticated owner re-ran Production `/admin/marketing` after the identity-field update. It still returned “Not ready: The bundle.social team does not have the selected Cicero Web Studio LinkedIn Company Page.” Confirm remained disabled; no upload or post was made.
- Because the screenshot identifier matches every supported field, the Production API key/team configuration does not resolve to the dashboard team in the screenshot (or the key cannot access that team). The request remains strictly `type=LINKEDIN` and the fail-closed matcher does not expose a nonmatching account name to the browser.

Known limitations:
- The Production `BUNDLE_SOCIAL_TEAM_ID` is not the team containing the screenshot's selected Cicero Web Studio LinkedIn connection, or the Production API key cannot access that team.
- The remote database schema remains unverified until the Production database migration is applied.

Recommended next step:
- In bundle.social, identify the team that contains the screenshot's “Cicero Web Studio / cicero-web-studio” LinkedIn connection. Set Production `BUNDLE_SOCIAL_TEAM_ID` to that team ID (not the organization ID) and ensure `BUNDLE_SOCIAL_API_KEY` belongs to the same organization. Apply migration `20260907163842_marketing_publish_attempts.sql` to the database identified by the Production `GENERATION_SUPABASE_URL`. Then, as workspace owner, reopen `/admin/marketing`. Do not use Confirm unless it changes to “Destination verified.”

Permanent decisions added:
- None. The isolated M2 implementation is ticket-scoped and has not been elevated to a permanent architecture decision.

Reusable learnings added:
- None.

Git summary:
- M1 and M2 remain isolated from Campaigns, Channels, Variants, Approvals, Exports, n8n, webhooks, generic events, and the legacy Marketing publishing route. No old Marketing code was deleted.
