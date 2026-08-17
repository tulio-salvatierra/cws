# Latest Codex Handoff

Task ID: CWS-PUBLISH-EXECUTE-018
Agent: Codex
Objective: Add the authenticated server-side LinkedIn publish dispatch endpoint, link publication records to agent runs, and validate the staging database wiring without calling n8n or LinkedIn.

Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- Existing `agent_runs`, `published_posts`, content-variant export migrations, API handlers/tests, env scripts, and Vercel configuration

Files changed:
- `api/publish-linkedin.js`
- `api/published.js`
- `api/__tests__/publish-linkedin.test.js`
- `api/__tests__/published.test.js`
- `supabase/migrations/20260817004928_allow_linkedin_publish_agent_run.sql`
- `supabase/migrations/20260817004936_link_published_posts_to_agent_runs.sql`
- `supabase/migrations/20260817005331_lock_published_agent_run_identity.sql`
- `.env.example`
- `env.keys.js`
- `vercel.json`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

Database or API changes:
- Added `POST /api/publish/linkedin`. It uses bearer-session authentication, resolves the variant workspace, requires active workspace membership, accepts `platform: linkedin`, requires `content_variants.status = exported`, loads the latest immutable export version, creates an `execute`/`running` `agent_runs` row, and sends a bounded server-side request to the configured n8n webhook. It returns 202 with `{ agent_run_id }` after webhook acceptance and marks the run failed before returning 502 when the webhook call fails.
- Added nullable `published_posts.agent_run_id` with a foreign key to `agent_runs(id)` and a partial index. Existing table grants remain explicit for authenticated reads/outcome updates and service-role writes.
- Extended `/api/published` additively to accept a valid `agent_run_id`, persist it, and complete the linked run with publication output. Existing source validation, secret authentication, and `(platform, external_post_id)` idempotency remain intact.
- Added the two server-only n8n publishing environment variables to the example and canonical env key list.
- Added a narrow `agent_runs` trigger exception for `agent_key = linkedin-publisher`; other execute agents remain blocked.

Security decisions:
- LinkedIn credentials remain in n8n; this repository stores only the server-side n8n URL and shared secret.
- The publish endpoint never exposes the n8n secret to the browser and never calls LinkedIn directly.
- Workspace membership is checked against the variant's workspace before creating a run.
- The endpoint publishes only immutable exported handoffs, not merely approved variants.

Decisions made:
- Status gate: `exported`. This is the narrowest safe gate because the export handoff contains the immutable, approved content snapshot and final caption/reference; `approved` alone still permits later export changes.
- Idempotency key format: `linkedin:v1:<content_variant_id>:export:<export_version>`. The export version is the revision component, so a corrected export receives a new key while retries of the same export reuse the same key.
- Existing `agent_runs` values used: `command_level = execute`, `status = running` on creation, then `completed` or `failed`.

Assumptions:
- `content_variant_exports.export_reference` is the outbound `link` field for this endpoint; the follow-up n8n ticket will map it as appropriate for the platform.
- The n8n webhook acknowledges receipt promptly; the endpoint waits only for HTTP acceptance, not workflow completion.

Tests added:
- Five LinkedIn dispatch API tests for authentication, membership, export gate, successful 202/run creation, and n8n failure/run failure recording.
- One publication return-path test for `agent_run_id` persistence and run completion.

Tests run:
- Full Vitest suite: 33 files and 118 tests passed.
- ESLint: zero errors and one pre-existing `useDrafts.js` exhaustive-deps warning.
- Production Vite build and import-casing check: passed.
- Staging migrations applied and listed as `20260817004928`, `20260817004936`, and `20260817005331`.
- Staging verification confirmed nullable UUID column, index, real agent-run checks, execute-run trigger acceptance in a rolled-back transaction, and no new security-advisor warnings.
- No n8n webhook or LinkedIn API was called.

Known issues:
- The endpoint and env changes are local only until committed, pushed, and deployed; the separate n8n webhook conversion and UI button are intentionally out of scope.
- The existing lint warning and two pre-existing Supabase security-advisor warnings remain.

Recommended next task:
- Commit/push and deploy this backend ticket, then implement the separate n8n webhook conversion and UI publish action with a mocked end-to-end test before any real publication.

Questions requiring Tulio:
- Approve commit, push, and Production deployment when ready.

Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld:
- The `exported` gate, idempotency-key format, and execute-agent exception are task-scoped implementation choices and are documented here pending explicit permanent approval.

Git diff summary:
- Added one authenticated publish-dispatch API, migrations for execute-run authorization, publication-to-run linkage, and immutable run identity, focused tests, server-only env documentation, and required project-memory updates. No UI or n8n workflow was modified.
