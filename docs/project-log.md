# Project Log

## 2026-07-21 — CWS-AUDIT-001

Agent: GPT/Codex  
Status: Completed

### Objective

Audit the repository and compare it against the CWS Operating System definition.

### Steps completed

1. Reviewed the stack and routing approach.
2. Inspected existing docs and memory files.
3. Confirmed the repo is Vite + React Router.

### Files inspected

- package.json
- docs/product-definition.md

### Files changed

- None

### Decisions

- A schema-only next step is safest.

### Issues discovered

- `/admin` is already used by the legacy publishing workflow.

### Next action

Request an architecture review before adding new tables.

### Reusable learning

Name collisions with existing subsystems should be resolved before schema work starts.

## 2026-07-23 — CWS-DB-DESIGN-001

Agent: Codex

Status: Completed

### Objective

Design the smallest viable workspace-owned database foundation without writing SQL or implementing migrations.

### Steps completed

1. Reviewed the product, technical, decision, memory, handoff, and task records.
2. Inspected all existing Supabase migrations and current database callers.
3. Defined required columns, relationships, statuses, RLS intent, indexes, ownership, and deferred fields for the requested tables.
4. Identified legacy isolation requirements, naming conflicts, migration risks, ordering, and the smallest safe first migration.

### Files changed

- `.gitignore`
- `docs/agent-handoffs/latest-codex.md`
- `docs/decisions.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Approved first-class, workspace-owned channels before campaign implementation.
- Approved owner-only membership management, approval outcomes, and sensitive decision transitions.

### Issues discovered

- The product definition requires first-class channels, including the channel for `CWS-001`; the omission from the original table list was resolved by approving `DEC-008`.

### Next action

Implement and test only the workspace and membership foundation migration.

### Reusable learning

- None added; implementation has not yet verified the proposed schema patterns.

## 2026-07-23 — CWS-DB-FOUNDATION-001

Agent: Codex

Status: Completed with validation limitation

### Objective

Implement the smallest safe Supabase workspace and membership foundation.

### Steps completed

1. Added `workspaces` and `workspace_members` with explicit user provenance, constraints, and indexes.
2. Added atomic workspace/owner bootstrap, non-recursive membership helpers, and workspace-authorized RLS.
3. Protected immutable ownership fields and the final active owner.
4. Ran the production build, targeted Supabase tests, the full test suite, static SQL/security review, and diff validation.

### Files changed

- `supabase/migrations/006_workspace_foundation.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

### Decisions

- Implemented the approved explicit workspace ownership and owner-only sensitive transitions.

### Issues discovered

- The repository has no local Supabase configuration, PostgreSQL client, or Docker runtime, so the migration was not executed locally.
- Two unrelated existing UI tests fail; 40 of 42 tests pass.

### Next action

Apply migrations `001` through `006` in a disposable Supabase environment and test tenant isolation and owner transitions with two users.

### Reusable learning

Static SQL review and application tests do not replace executing migrations against PostgreSQL with authenticated RLS scenarios.

## 2026-07-23 — CWS-DB-VALIDATION-001

Agent: Codex

Status: Completed

### Objective

Execute migrations `001` through `006` in a disposable PostgreSQL environment and test workspace RLS and owner protections.

### Steps completed

1. Verified the Supabase CLI login and created the dedicated `cws-os-staging` non-production project.
2. Created a disposable embedded PostgreSQL environment under `/tmp`.
3. Applied and tested migrations `001` through `007` in disposable PostgreSQL and managed Supabase.
4. Tested workspace bootstrap, two-user tenant isolation, member and owner permissions, immutable identity fields, creator spoofing, slug validation, ownership transfer, final-owner protection, and administrative workspace cleanup.
5. Fixed the membership-cascade edge case through migration `007`.
6. Deleted the explicitly approved unrelated Supabase project after confirming the healthy replacement.

### Files changed

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`
- `supabase/migrations/006_workspace_foundation.sql`
- `supabase/migrations/007_allow_workspace_member_cascade.sql`

### Decisions

- `cws-os-staging` is the dedicated non-production validation target.
- Direct final-owner removal remains blocked while trusted workspace deletion may cascade to memberships.

### Issues discovered

- Validation scripts remain temporary under `/tmp` rather than checked into the repository.

### Next action

Implement the approved first-class `channels` migration against the validated workspace foundation.

### Reusable learning

Child-row guard triggers must test parent-delete cascades as well as direct mutations; otherwise a valid administrative delete can be blocked.

## 2026-07-23 — CWS-DB-CHANNELS-001

Agent: Codex

Status: Completed

### Objective

Implement and validate first-class workspace-owned channels before campaigns.

### Steps completed

1. Added the `channels` table with workspace ownership, strategy fields, constraints, indexes, and immutable ownership protection.
2. Added active-member CRUD RLS while preventing cross-workspace access and creator spoofing.
3. Applied migration `008` to `cws-os-staging`.
4. Passed fresh-database and managed-Supabase channel/RLS scenarios.
5. Confirmed local and remote migration history through `008` and a clean database lint.

### Files changed

- `supabase/migrations/008_channels.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Implemented first-class channels according to `DEC-008` and ordinary member management according to `DEC-009`.

### Issues discovered

- Initial workspace and channel rows cannot be seeded until the owner/workspace identity is selected.

### Next action

Implement workspace-owned campaigns and independent content variants for `CWS-001`.

### Reusable learning

- None added.

## 2026-08-08 — CWS-PILOT-READINESS-004

Agent: Codex

Phase 1 added one render smoke assertion for each of the 11 relocated workspace
pages: Workspace, Campaigns, Campaign detail, New campaign, New variant,
Variant detail, Tasks, Planning, New goal, Knowledge, and Agent runs. Supabase
is mocked; the tests assert only that the primary heading renders. Phase 1 was
committed as `cbc9186 test: add workspace page render smoke coverage`.

Phase 2 audited the first complete CWS-001 cycle without changing application
code, data, or schema. Findings are recorded in `docs/pilot-readiness.md`.
The live staging query found one workspace, two channels, two campaigns, three
variants, one task, one unrelated approval, four goals, two initiatives, one
project, zero decisions, zero learnings, and zero agent runs. CWS-001 remains
`editing`; both EN and ES variants remain `recorded` with no transcript,
caption text, editing notes, or export reference, and no CWS-001 approval.

The UI can create a campaign, create variants, request/review a pending
approval, create a campaign-linked task, and complete that task. It cannot
drive campaign or variant status transitions, edit variant lifecycle fields,
resolve a revision-requested approval, write decisions or learnings, or record
an outcome. The schema has no outcome or `published_at` field, as expected by
the ticket; no migration was added.

Required validation passed: `npm ci`, production build with non-secret staging
client values, import-casing check, lint with the existing single
`useDrafts` dependency warning, and `npx vitest run` with 16 files and 57 tests.
Phase 2 remains local and unpushed.

## 2026-08-08 — CWS-ADMIN-CONSOLIDATE-003 security correction

Agent: Codex

The approved helper-access correction was applied to staging project
`ddbhxqkckzpwzwvnoxqt`. Migration `20260808203339_move_workspace_rls_helpers_to_private`
creates the non-exposed `private` schema, moves `is_workspace_member` and
`is_workspace_owner` there, preserves authenticated execution for RLS policy
evaluation, repoints all 47 affected policies, updates the approval trigger,
and removes the old public helper functions. The prior migration source file
was renamed locally to `20260807215908_harden_function_security.sql` so local
history matches the remote migration version.

Staging validation passed: the owner sees one workspace, one membership, two
campaigns, and four goals; a non-member sees zero rows for those same workspace
scopes. Both private helpers have authenticated schema usage and execution,
anonymous/public execution is denied, no public helper functions remain, and
all 47 policy references are private. The security advisor now reports only the
intentional `create_workspace` warning and the independent leaked-password
protection warning.

Repository checks also passed: import casing, 42 Vitest tests across 12 files,
production build, and lint with the existing single hook-dependency warning.
No push or deployment was performed. Next action is to decide whether to accept
the two remaining advisor warnings, then push and smoke-test the consolidated
`/admin` route tree.

## 2026-08-08 — CWS-ADMIN-CONSOLIDATE-003 channels follow-up

Agent: Codex

Added the protected `/admin/channels` route using the existing workspace-owned
`channels` table. The page loads the active member’s workspace channels through
Supabase RLS and displays each channel’s audience, voice, formats, production
requirements, revenue goal, and success metrics. Admin overview, sidebar, and
workspace navigation now link to the page; the legacy publishing surface and
database schema remain unchanged.

Extracted the legacy workspace redirect component so its dynamic-id behavior can
be tested directly. Added navigation, channel-data, membership-denial, and
redirect smoke tests. `npx vitest run` now passes 15 files and 46 tests; the
production build and import-casing check pass; lint still has only the existing
`useDrafts` hook-dependency warning.

Committed locally as `dbd9396 feat: add admin channels overview`. It has not been
pushed or deployed. Next action is to push this commit and verify the live
`/admin/channels` page and `/workspace` redirect manually.

## 2026-08-08 — CWS-PILOT-READINESS-004 variant editor follow-up

Agent: Codex

Implemented the first high-value gap from the pilot readiness audit. The
content-variant detail page now lets an active workspace member edit and save
each variant's transcript/script, tone, editing notes, caption text, existing
export reference, and lifecycle status independently. Updates are scoped by
both variant ID and workspace ID and use the existing RLS policy; approval
records remain separate and completed approvals remain unchanged.

Added a focused interaction test for the save flow and status transition. No
database migration, seed, publishing integration, outcome field, or push was
performed.

Validation passed: 17 Vitest files and 58 tests, import casing, production
build with a non-secret staging client placeholder, `git diff --check`, and
lint with the existing single `useDrafts` dependency warning.

Next action: implement revision resolution by creating a new pending approval
after a revision request, preserving completed approval history. Decision and
learning capture remain after that; export filename/version and outcome fields
still require a separately approved migration.

## 2026-07-23 — CWS-DB-CONTENT-001

Agent: Codex

Status: Completed

### Objective

Implement and validate workspace-owned campaigns and independent content variants for `CWS-001`.

### Steps completed

1. Added campaigns with required same-workspace channels, approved statuses, ownership, constraints, indexes, and RLS.
2. Added independent content variants with language, title, transcript, tone, editing, caption, export, status, ownership, indexes, and RLS.
3. Applied migration `009` to `cws-os-staging`.
4. Passed fresh-database and managed-Supabase `CWS-001` scenarios with independent English and Spanish records.
5. Confirmed local and remote migration history through `009` and a clean database lint.

### Files changed

- `supabase/migrations/009_campaigns_content_variants.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Used the approved campaign and variant statuses without integrating the legacy publishing pipeline.
- Kept English and Spanish as independent mutable records.

### Issues discovered

- Approvals are still required before the pilot can support human review outcomes.
- Initial records cannot be seeded until a persistent owner/workspace exists.

### Next action

Implement content-variant approvals for human review of `CWS-001`.

### Reusable learning

- None added.

## 2026-07-23 — CWS-DB-APPROVALS-001

Agent: Codex

Status: Completed

### Objective

Implement and validate human approval outcomes for `CWS-001` content variants.

### Steps completed

1. Added variant-focused approvals with workspace ownership, review outcomes, feedback, provenance, constraints, indexes, and immutable history.
2. Added member read/request RLS and owner-only decision RLS with database-assigned reviewer attribution.
3. Applied migration `010` to `cws-os-staging`.
4. Passed fresh-database and managed-Supabase approval lifecycle and RLS scenarios.
5. Confirmed local and remote migration history through `010` and a clean database lint.

### Files changed

- `supabase/migrations/010_content_variant_approvals.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Kept approvals specific to content variants for the MVP.
- Preserved completed approval history and allowed a new pending cycle after a decision.
- Gave active workspace owners exclusive authority to decide outcomes.

### Issues discovered

- Initial records cannot be seeded until a persistent owner/workspace exists.
- Agent-run approvals remain deferred.

### Next action

Implement workspace-owned agent runs, or select the persistent owner identity and seed the first workspace and `CWS-001` records.

### Reusable learning

- None added.

## 2026-07-23 — CWS-DB-AGENT-RUNS-001

Agent: Codex

Status: Completed

### Objective

Implement and validate the smallest auditable workspace-owned agent-run foundation.

### Steps completed

1. Added workspace-owned agent runs with Ask/Propose command levels, structured input/output, approved statuses, lifecycle timestamps, provenance, constraints, and indexes.
2. Added active-member read/queue RLS while reserving execution results and transitions for trusted server-side code.
3. Blocked Execute runs until generalized action approvals are available.
4. Applied migration `011` to `cws-os-staging`.
5. Passed fresh-database and managed-Supabase agent-run lifecycle and RLS scenarios.
6. Confirmed local and remote migration history through `011` and a clean database lint.

### Files changed

- `supabase/migrations/011_agent_runs.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Limited the first agent-run implementation to Ask and Propose.
- Reserved status, output, error, and timing updates for trusted server-side code.
- Represented Execute for future compatibility but rejected it until approval linkage exists.

### Issues discovered

- There is no serverless execution endpoint yet.
- Initial records cannot be seeded until a persistent owner/workspace exists.

### Next action

Select the persistent owner identity and seed the first workspace and `CWS-001`, or implement the first read-only Ask API.

### Reusable learning

- None added.

## 2026-07-31 — CWS-DB-MANAGED-VALIDATION-001

Agent: Cursor

Status: Completed with limitation

### Objective

Validate workspace foundation migrations `001`–`006` against managed non-production Supabase (`cws-os-staging`) and record the outcome.

### Steps completed

1. Confirmed staging project `ddbhxqkckzpwzwvnoxqt` / `cws-os-staging` via CLI link and MCP.
2. Confirmed remote migrations include `001`–`006` (`workspace_foundation`) through `list_migrations` and `migration list --linked`.
3. Attempted `npx supabase db push`; remote already has foundation migrations, but push fails on remote-only `20260730231228`.
4. Created two staging test users (SQL, after Auth signup rate limit) and ran the authenticated membership checklist.
5. Verified owner bootstrap, tenant isolation, member add/read, owner-only membership protection, final-owner guard, and ownership transfer.
6. Cleaned up validation workspaces and test users (`leftover_workspaces=0`, `leftover_users=0`).

### Files changed

- `docs/agent-handoffs/latest-cursor.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`
- `supabase/config.toml`
- `supabase/.gitignore`
- `.env.local` (gitignored)

### Decisions

- None permanent.

### Issues discovered

- Literal `db push` fails with `LegacyDbPushMissingLocalError` for remote migration `20260730231228` (`goals_initiatives_projects_tasks_decisions_learnings`) missing locally.
- Auth `signUp` remained email-rate-limited; SQL-created confirmed users were used for client sign-in tests.
- PostgREST owner-denied UPDATE/DELETE returned HTTP 200 with zero rows; correctness was confirmed by resulting membership state.

### Next action

Pull or repair remote-only migration `20260730231228` so CLI push history is clean, then continue remaining consolidate/advisor verification.

### Reusable learning

- When validating RLS through PostgREST, assert resulting row state for denied UPDATE/DELETE; do not rely only on error objects.

## 2026-07-31 — CWS-DB-MIGRATION-RECONCILE-001

Agent: Cursor

Status: Completed with follow-up required

### Objective

Reconcile remote-only migration `20260730231228` so local history and `db push` can align safely.

### Steps completed

1. Confirmed linked migration list: `001`–`012` match; remote-only `20260730231228`.
2. Ran `npx supabase db pull remote_20260730231228_sync --linked --yes`; failed with `LegacyDbPullMigrationConflictError`.
3. Attempted `db dump`; failed because Docker Desktop is required.
4. Inspected remote schema for `goals`, `initiatives`, `projects`, `tasks`, `decisions`, and `learnings` (tables, constraints, indexes, RLS, triggers).
5. Compared against local `007`–`012` and confirmed those objects are not duplicated there.

### Files changed

- `docs/agent-handoffs/latest-cursor.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

### Decisions

- KEEP the remote migration; do not repair it as reverted.
- Do not invent a local migration file until complete DDL can be captured (Docker dump or equivalent).

### Issues discovered

- CLI pull cannot fetch a remote-only migration while histories diverge; its suggested repair is unsafe when the migration maps to real schema.
- Dump requires Docker in this environment.

### Next action

Start Docker, dump/extract goals-family DDL into
`supabase/migrations/20260730231228_goals_initiatives_projects_tasks_decisions_learnings.sql`,
then rerun `migration list --linked` and `db push`.

### Reusable learning

- Treat CLI “repair reverted” suggestions as unsafe when a remote-only migration corresponds to real schema absent from local files.

## 2026-08-03 — CWS-WEB-MARKETING-MOTION-001

Agent: Codex

Status: Completed

### Objective

Validate and publish the prepared marketing-section motion and video update to `main`.

### Steps completed

1. Audited the mixed working tree and retained the coherent marketing/video and project-memory scope.
2. Corrected three asset imports for Linux/Vercel case-sensitive resolution.
3. Added five tracked video assets used by Process and CTA sections.
4. Verified the production build and Vercel Preview admin login.
5. Confirmed Preview uses the verified staging Supabase URL and browser-safe publishable key.

### Files changed

- Marketing components and CSS under `src/components/{CtaSection,Problem,Process,Projects,Services}`
- Five MP4 files under `src/assets/video`
- `docs/agent-handoffs/latest-cursor.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/learnings.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Published the prepared scope directly to `main` as requested.
- Kept the Supabase publishable key browser-side and did not expose privileged credentials.

### Issues discovered

- Two stale admin tests fail against current behavior; 40 other tests pass.
- Existing large-bundle warnings remain.

### Next action

Reconcile remote migration `20260730231228`, then repair the stale admin tests.

### Reusable learning

- None added.

## 2026-08-03 — CWS-WEB-WORKSPACE-001

Agent: Codex

Status: Completed

### Objective

Add the first protected `/workspace` operating dashboard backed by the seeded CWS OS data.

### Steps completed

1. Added a protected read-only `/workspace` route using the existing Supabase session guard.
2. Added workspace, channel, campaign, variant, and approval summary cards with loading and error states.
3. Seeded staging with two channels, `CWS-001`, and independent English/Spanish variants.
4. Corrected case-sensitive asset imports that failed on Vercel's Linux build workers.
5. Published a ready Vercel Preview and opened draft PR #9.

### Files changed

- `src/App.jsx`
- `src/pages/workspace/WorkspacePage.jsx`
- Case-sensitive asset imports under `src/components/`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Decisions

- Kept the first workspace surface read-only and limited it to Content Operations.
- Reused existing authentication and RLS rather than introducing a new auth path.

### Issues discovered

- Two stale admin tests remain unrelated failures.
- Remote-only migration `20260730231228` still needs safe local-history reconciliation.

### Next action

Add read-only campaign/variant detail views and a small workspace navigation shell, then reconcile the remote migration history.

## 2026-08-07 — CWS-ADMIN-CONSOLIDATE-003

Agent: Codex
Status: Completed with external validation pending

### Objective

Unblock CI, harden the remaining Supabase function surface, and consolidate the CWS Operating System route tree under `/admin`.

### Steps completed

1. Ran `npm install`, synchronized the stale lockfile, and verified `npm ci` succeeds.
2. Repaired the two stale admin expectations without deleting tests.
3. Added migration `013_harden_function_security.sql` to set the trigger function search path and revoke direct authenticated execution of the two internal workspace helper functions.
4. Moved all CWS OS routes under the existing protected `/admin` parent, added redirects for every legacy `/workspace/*` path, updated dashboard/sidebar destinations, and updated internal links.
5. Moved the workspace page modules into `src/pages/admin` and updated lazy imports with the exact filename casing.

### Files changed

- `package-lock.json`
- `src/App.jsx`
- `src/components/admin/AdminLayout.jsx`
- `src/pages/admin/AdminOverview.jsx`
- `src/pages/admin/` (workspace page modules moved here)
- `src/components/admin/__tests__/KeywordsPage.test.jsx`
- `src/components/admin/__tests__/PublishedCard.test.jsx`
- `src/Hooks/useDrafts.js`
- `supabase/migrations/013_harden_function_security.sql`
- `docs/decisions.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

### Commits

- `62b3238` — `chore: sync package lockfile`
- `84d5176` — `fix: harden function security and refresh stale tests`
- `89f8680` — `refactor: consolidate workspace routes under admin`
- `4cd19e0` — `refactor: move workspace pages into admin`
- `413fe71` — `fix: clear unused legacy hook state`

### Verification

- `npm ci` — passed.
- `npm run check:imports` — passed.
- `npm run build` with staging URL and a non-secret build placeholder key — passed; Linux import-casing check passed.
- `npx vitest run` — 12 files and 42 tests passed.
- `npm run lint` — passed with one existing hook-dependency warning in `src/Hooks/useDrafts.js`; no errors or route-related lint findings.

### Database validation result and blocker

The linked staging project is `ddbhxqkckzpwzwvnoxqt` (`cws-os-staging`). Migration 013 was applied through the Supabase MCP migration tool and is recorded remotely as `20260807215908_harden_function_security` while the repository source file remains `013_harden_function_security.sql`; migration-history alignment must be checked before the next CLI push. The security advisor went from five warnings to two: the three targeted warnings for `update_updated_at`, `is_workspace_member`, and `is_workspace_owner` cleared; the intentional `create_workspace` warning and the independent leaked-password-protection warning remain.

The required RLS check then failed for both the active member and a non-member with `permission denied for function is_workspace_member`, proving that the two revokes break policy evaluation. Direct privilege inspection confirms `authenticated` has no execute privilege on either helper, `create_workspace` remains executable, and `update_updated_at` now has `search_path=public`. Per the ticket, no workaround or RLS loosening was applied. Staging is blocked pending an approved helper-access correction; no production database was touched.

### Decisions

- Added approved DEC-011 (CWS OS routes under `/admin`) and DEC-012 (markdown memory and workspace knowledge records remain separate).
- Marked DEC-005 as superseded by DEC-011 while retaining it as historical context.

### Next action

Approve a corrected helper-access design that preserves RLS policy evaluation while removing the direct RPC exposure, remediate staging, and rerun the member/non-member RLS checks. Then verify the Preview route redirects manually. Recommended follow-up after that: add a dedicated `/admin/channels` page and smoke tests.

### Permanent-memory scope

The verified RLS helper privilege behavior was added to `docs/learnings.md`; no other new permanent memory was added.

### Reusable learning

- None added.

## 2026-08-08 — CWS-VERCEL-RELIABILITY-005

Agent: Codex
Status: Completed and deployed

Confirmed two independent production failures. A cached Vite entry bundle
requested an obsolete campaign chunk, and the catch-all SPA rewrite returned
`index.html` with `text/html` for that missing JavaScript path. The client
intake function also waited on its Google Sheets webhook without an internal
deadline or structured logs, allowing Vercel to terminate it with a 504.

Added guarded `vite:preloadError` recovery, excluded assets/API/file-like paths
from the SPA fallback, and configured the intake function for a 20-second
maximum duration. Added a shared 12-second Google Sheets deadline with safe
structured logs and controlled error responses in both production and local
development. The shared helper is not exposed as a Vercel function.

Focused tests pass, the full suite passes with 19 files and 62 tests, import
casing passes, the production Vite build passes, and Vercel's production build
accepts the routing rule and function configuration. Commit `ae46c83` was
pushed to `main`; production deployment `dpl_7t6jYRVgUiWoBp6cL9qk7B8c5t2h`
is Ready and serves `cws-two.vercel.app`. Live checks confirmed a stale asset
returns `404 text/plain`, `/admin/campaigns` returns the current SPA, unknown
API routes return 404, and the intake function returns JSON 405 for a safe GET.
No production intake row was created; one intentional POST remains for Tulio.

## 2026-08-08 — CWS-PILOT-READINESS-004 approval revision follow-up

Agent: Codex
Status: Completed locally; deployment pending

Completed the smallest viable revision-resolution loop for content-variant
approvals. When the latest review is `revision_requested`, the variant detail
page now keeps the review feedback visible and offers `Re-submit for review`.
That action resolves the authenticated user and inserts a new workspace-owned
pending approval instead of modifying the immutable completed review. The
existing one-pending-per-variant constraint and workspace-member RLS policy
remain the enforcement boundaries. No schema, migration, API, service-role,
publishing, or legacy-table change was made.

Added focused interaction coverage for the re-submission payload and transition
back to pending review. The focused test passed; the full suite passed with 19
files and 63 tests. Import casing, lint, the production build, and
`git diff --check` passed. Lint retains the existing `useDrafts` dependency
warning.

Next action: add workspace decision and learning capture, then deploy and run a
complete CWS-001 edit, revision, re-submission, and approval cycle with the
owner account.

## 2026-08-09 — CWS-PILOT-READINESS-004 knowledge capture follow-up

Agent: Codex
Status: Completed locally; deployment pending

Added workspace-authorized decision and learning creation under the existing
`/admin/knowledge` surface. The Knowledge page now links to dedicated forms.
Decision creation captures title, optional context, and decision text with a
fixed `proposed` status; learning creation captures title, optional category,
and lesson body. Both flows resolve the active workspace and authenticated user,
trim submitted values, reuse the existing RLS policies, and return to the
Knowledge overview after insertion. No migration, remote mutation, service-role
credential, legacy publishing change, or permanent-memory synchronization was
introduced.

Added two interaction tests for exact ownership payloads and navigation. The
full suite passes with 20 files and 65 tests; import casing, lint, production
build, and `git diff --check` pass. Lint retains the existing `useDrafts`
dependency warning. Refreshed `docs/pilot-readiness.md` so implemented variant,
revision, decision, and learning steps no longer appear missing.

Next action: push and deploy the accumulated pilot controls, then run one live
CWS-001 edit/revision/re-submission/approval cycle and create test decision and
learning records. Campaign status control and explicit export/outcome fields
remain separate follow-ups.

### Push record

Commit `695b765 feat: complete pilot review and knowledge flows` was pushed to
`origin/main` on 2026-08-09. Deployment confirmation and the live pilot cycle
remain pending.

## 2026-08-09 — CWS-PILOT-READINESS-004 campaign lifecycle follow-up

Agent: Codex
Status: Completed locally; deployment pending

Added campaign lifecycle status control to the existing campaign detail page.
An active workspace member can select any approved campaign status and save an
update containing only `status`, filtered by both campaign ID and workspace ID.
The page disables unchanged submissions and displays persistence errors or a
successful save confirmation. The existing status constraint, ownership trigger,
explicit authenticated grant, and workspace RLS remain authoritative. No
migration, remote mutation, n8n integration, legacy-table change, or service-role
access was introduced.

Added focused interaction coverage for the status payload, campaign/workspace
filters, persisted selector value, and success message. The full suite passes
with 21 files and 66 tests; import casing, lint, production build, and
`git diff --check` pass. Lint retains the existing `useDrafts` dependency
warning. Updated the pilot readiness matrix so campaign lifecycle is now marked
WORKS.

Next action: push and deploy, then run the full CWS-001 pilot cycle. The explicit
export/outcome model remains the only definition-of-done schema gap and requires
a separately approved migration design based on the live cycle.

### Push record

Commit `5b5161a feat: add campaign lifecycle controls` was pushed to
`origin/main` on 2026-08-09. Deployment confirmation and the live pilot cycle
remain pending.

## 2026-08-09 — CWS-PILOT-READINESS-004 approval confirmation guard

Agent: Codex
Status: Completed locally; deployment pending

Investigated a report that requesting review immediately approved the variant.
A read-only staging query showed the approval was inserted pending and updated
to approved about 19 seconds later by the same owner account. The database did
not auto-approve it; the single-owner interface made submission and review feel
like one action.

Updated the variant review panel to clearly label the pending owner-review
state, label reviewer feedback, and require a second explicit confirmation
before Approve or Request revision writes to Supabase. Review controls are
disabled during persistence, and save errors are separated from approval
errors. The existing approved staging row remains unchanged.

Added regression coverage proving the first Approve click performs no update
and the confirmation performs one correctly scoped decision update. The full
suite passes with 21 files and 67 tests; import casing, lint, production build,
and `git diff --check` pass. Lint retains the existing `useDrafts` dependency
warning. No migration or remote mutation was introduced.

Next action: push and deploy, then validate a fresh approval and revision cycle
with the Spanish variant.

### Push record

Commit `0ecd8e3 fix: confirm owner review decisions` was pushed to
`origin/main` on 2026-08-09. Deployment confirmation and the fresh Spanish
approval/revision cycle remain pending.

## 2026-08-09 — CWS-VERCEL-RELIABILITY-006 background intake relay

Agent: Codex
Status: Completed locally; deployment pending

Investigated a production 504 from `/api/client-portal-intake` and invalid
regular-expression warnings on the New campaign page. The intake relay was
still holding the browser request open while Google Apps Script completed, so
its controlled 12-second deadline surfaced as a 504. The campaign code pattern
placed an unescaped hyphen in a character class, which current browsers compile
with Unicode-aware HTML pattern rules and reject.

Changed the intake endpoint to return HTTP 202 immediately and register the
Google Sheets request as managed Vercel background work. The downstream call
has a 45-second bounded deadline within a 60-second function duration, retains
structured failure logs, and keeps the webhook secret server-only. The manual
sync message now says queued. Replaced the campaign code expression with a
valid hyphen-separated pattern and removed the restrictive phone pattern.

Added tests for immediate acceptance, registered background work, contained
timeouts, and the campaign pattern. The full suite passes with 21 files and 67
tests. Lint, import casing, the production Vite build, `git diff --check`, and a
full Vercel build pass. Lint retains the existing `useDrafts` dependency
warning. No database or remote environment was changed.

Next action: push and deploy, then verify one client update reaches the workbook
without a browser 504 and create `CWS-002` without a pattern warning.

### Push record

Commit `b8206f6 fix: queue client portal sheet sync` was pushed to
`origin/main` on 2026-08-09. Deployment and live workbook/pattern verification
remain pending.

### Live verification

Production deployment `dpl_FhLADZ3XLJKZwLrSuDVdh4cBen4G` is Ready. Runtime
logs show two `client_project.updated` requests completed the Google Sheets
webhook with HTTP 200 in 12.137 and 13.016 seconds. Production serves entry
asset `index-DT1EyZI1.js` and the campaign asset contains the corrected
hyphen-separated code pattern. The user's console lines referenced the prior
`index-Ze7kvzDe.js` bundle and were retained from the old page session.

The subsequent Supabase 409 is a separate valid uniqueness rejection because
campaign codes are unique per workspace and `CWS-002` had already been
submitted. A tailored duplicate-code message remains a small UX follow-up.

## 2026-08-09 — CWS-CAMPAIGN-UX-007 duplicate-code feedback

Agent: Codex
Status: Completed locally; deployment pending

Replaced the raw Supabase uniqueness message on New campaign with a clear,
workspace-scoped explanation. The form branches on stable Postgres code `23505`
rather than version-dependent message text, tells the user the entered campaign
code already exists, preserves the form, re-enables submission, and exposes the
feedback as an accessible alert. The existing `(workspace_id, code)` constraint
remains authoritative; no preflight query, schema change, RLS change, or remote
mutation was added.

Added a focused interaction test for the `23505` response and recovery state.
The full suite passes with 22 files and 68 tests. Lint, import casing, production
build, and `git diff --check` pass. Lint retains the existing `useDrafts`
dependency warning.

Next action: push and deploy, confirm a repeated code shows the tailored
message, then resume approval history and the revision cycle.

### Push record

Commit `22c3373 fix: explain duplicate campaign codes` was pushed to
`origin/main` on 2026-08-09. Deployment verification remains pending.

## 2026-08-09 — CWS-N8N-ASSESS-006 live pipeline assessment

Agent: Codex
Status: Completed — read-only assessment

Audited the renewed n8n Cloud workspace without executing or changing any
workflow. Eight workflows exist; WF1–WF5 are published, but the global and
per-workflow execution views contain no saved executions and the Cloud account
shows zero August production executions. WF1 and WF5 have active cron triggers,
but no active workflow publishes to a social platform. The only publisher is
unpublished, uses unresolved Supabase and WhatsApp placeholders, and has no
named social OAuth credentials.

The published workflows target old Supabase project
`ugxipyozzhvqoqenygiz`, not the current CWS project
`ddbhxqkckzpwzwvnoxqt`. Live schema checks confirmed YouTube and
`youtube_ready` exist, while WF3's image fields and `ready`, WF4's
`notifications`/`review_pending`, and WF5's `scheduled_at`/`scheduled` writes
are incompatible with the current schema. Production lacks
`VITE_N8N_WF2_WEBHOOK_URL`; approval only updates Supabase; no inbound n8n API
route exists. Findings and the dependency-ordered revive checklist are in
`docs/n8n-assessment.md`.

`npm ci`, the production build, lint, and all 68 tests passed. Lint retains the
existing `useDrafts` dependency warning. No workflow, credential, database,
environment variable, application code, migration, or deployment was changed.
The assessment documentation was published on
`agent/cws-n8n-assessment-006`. Next action: Tulio decides revive or retire.

## 2026-08-09 — CWS-RETURN-PATH-007 authenticated publish record

Agent: Codex
Status: Completed, published, deployed, and UI-verified

Added staging migration 015 with the pending content-variant outcome fields and
the workspace-owned `published_posts` return log. RLS grants active members
read/outcome access, denies non-members, leaves inserts to the service role,
and protects publication identity from later mutation. The security advisor
retained the same two pre-existing warnings before and after the migration.

Added constant-time shared-secret `POST /api/published`, live-enum validation,
full raw-payload retention, and platform/external-ID retry idempotency. Explicit
endpoint-specific Supabase variables prevent the existing generic Vercel
integration from silently targeting a different database. Added the minimal
`/admin/published` table and outcome editor as a content-area tab without
expanding the sidebar.

The first local authenticated request against staging returned 201 and the
retry returned 200 with the same ID. The database contained one row, retained
the request body, and persisted a member-authenticated outcome; test data and
temporary keys were removed. `npm ci`, build, lint, all 76 tests, and whitespace
validation passed. Added approved DEC-025 and the verified return-path-first
learning.

After approval, the four endpoint-specific secrets/settings were added to the
Vercel Production environment, the complete change set was published through
PR #11, and deployment `dpl_3vvwf3TjrzRFRo2qN7YNnrDv9fif` reached Ready at
`https://cws-two.vercel.app`. A signed-in production browser check confirmed
that `/admin/published` renders the consolidated navigation and expected empty
state. No synthetic publication was retained. Next: wire the selected publisher
to the return endpoint before enabling its outbound post node, then validate one
real publish, retry, and member outcome update.

## 2026-08-09 — CWS-CHANNEL-BRIEF-008 versioned channel strategy

Agent: Codex
Status: Completed locally; staging migration applied; push prohibited

Added and applied migration 016 with `channel_brief`, independently versioned
English and Spanish strategy rows, workspace-member RLS, immutable ownership,
one-active-brief-per-language enforcement, and nullable immutable
`published_posts.brief_version`. The publish endpoint accepts an optional
positive integer version without changing authentication or retry behavior.

On staging, active English and Spanish briefs coexisted for the Cicero Web
Studio channel, a second active Spanish row failed with `23505`, the member saw
both rows, and a non-member saw zero. A publish record persisted version 1 and
rejected later identity mutation. Verification rows were removed. The security
advisor retained the same two pre-existing warnings. `npm ci`, production
build, lint, all 82 tests, and whitespace validation passed; lint retains the
existing hook warning. A live local HTTP call could not use Vercel Sensitive
values because they are intentionally non-exportable, so endpoint mapping is
covered by tests and persistence was verified directly in staging. No workflow,
UI, deployment, Production setting, or CWS-001 record changed. Next: author the
real briefs independently, then push/deploy before building generation.

### Release and first real brief record

After Tulio approved the next sequence, four independently authored active
version-1 briefs were inserted: English and Spanish for Cicero Web Studio and
English and Spanish for Drum Practice. Their source was each channel's approved
live audience, voice, formats, production, revenue, and success fields; no
language row derives from its sibling. CWS uses a 7-day target cadence and Drum
uses 3 days.

PR #12 merged as `943fdc2`, and Production deployment
`dpl_8JPoghpYSiVdMpBW1f8zEhcyPpH9` reached Ready at
`https://cws-two.vercel.app`. The unused Sensitive webhook secret was rotated
and retained only in Vercel. A signed Production publish request with
`brief_version: 1` returned 201; its identical retry returned 200 with the same
ID and `created: false`. The synthetic publish row and temporary secret files
were deleted; all four real briefs remain active. Next: review brief wording,
then build a non-publishing generation path that reads the active brief and
records its version.

## 2026-08-11 — CWS-GENERATION-TEST-009 non-publishing draft generation

Agent: Codex
Status: Completed locally; deployment pending

Added authenticated `POST /api/generate-draft` and a Cicero Web Studio English
test form on `/admin/agent-runs`. The server validates the Supabase session and
active workspace membership, loads the active channel brief, creates a
`propose` agent run, calls OpenAI Responses once, and stores either a
`needs_review` draft or a failed run. The immutable run input includes both the
brief version and exact editable brief snapshot. No campaign, variant,
approval, publishing, webhook, legacy table, or n8n path is mutated.

Created the OpenAI key through the secure Platform flow and wrote it only to
the ignored local `.env.local`. A minimal live request returned HTTP 200 from
`gpt-5.6-sol`. Focused tests pass 5/5, the full suite passes 87/87, lint passes
with the existing `useDrafts` warning, the production build passes with 432
modules, and whitespace validation passes. Next: configure the three
server-only Production variables, deploy, and verify one signed-in generated
draft and its saved `needs_review` run before designing promotion behavior.

On 2026-08-12, `OPENAI_API_KEY`, `GENERATION_SUPABASE_URL`, and
`GENERATION_SUPABASE_SERVICE_ROLE_KEY` were added as hidden Vercel Production
values without printing or exporting their contents. Deployment remains next.

PR #13 merged into `main` as `2a1e1cd`. Production deployment
`dpl_FkKgAMycjwAtKnAeVWFFT8B3YQEL` reached Ready with the new
`api/generate-draft` function and aliases including `https://cws-two.vercel.app`
and `https://cicerowebstudio.xyz`. The remaining release check is one
user-initiated signed-in generation that creates a real review-only agent run.

## 2026-08-12 — CWS-GENERATION-REVIEW-010 owner draft review

Agent: Codex
Status: Completed locally; staging migration applied; deployment pending

Added an owner-only, explicit-confirmation review path for generated proposals.
Acceptance atomically and idempotently creates one new draft content variant,
links it to the source run with workspace-consistent immutable provenance, and
completes the run. Rejection supersedes the run and creates no content. The
authenticated API validates the current user and the database function is
executable only by the service role; no approval, publish, webhook, legacy
table, or n8n path is involved.

Managed staging tests verified owner acceptance, retry idempotency, non-owner
denial, rejection without content creation, and service-role-only function
execution; all synthetic data was rolled back. The new migration
`20260812153257` matches locally and remotely. All 94 tests, lint, the
production build, import-casing, and whitespace checks pass; lint retains the
existing hook warning. The first real generated run remains `needs_review` for
Tulio's Production decision. Next: deploy, accept or reject that proposal in
`/admin/agent-runs`, and verify the resulting linked draft before designing a
separate approval-request step.

PR #14 merged into `main` as `8290694`. Production deployment
`dpl_Aa1SQQVr13pNzcs9W3pD7DpyDvEW` reached Ready with the review function.
The live endpoint returned HTTP 401 without a bearer token, and
`/admin/agent-runs` returned HTTP 200. The real proposal remains unchanged for
Tulio's explicit owner decision.

## 2026-08-12 — CWS-GENERATION-APPROVAL-011 durable approval request

Agent: Codex
Status: Completed locally; staging migration applied; deployment pending

Hardened the existing Variant Detail request-review step with an immutable
snapshot of the exact content presented for review and atomic content-variant
status synchronization. A request moves the variant to `ready_for_review`, an
approval moves it to `approved`, and revision or rejection returns it to
`draft`; review decisions remain separate and owner-only. Historical approvals
receive an honest marker that their original snapshot is unavailable rather
than copied current content.

Managed staging tests verified snapshot evidence, duplicate protection, owner
approval, immutable evidence after current-content edits, revision and
resubmission, approved-item resubmission denial, and non-member denial; all
synthetic rows were rolled back. Migration `20260812155214` matches locally
and remotely, both trigger functions are not directly executable by browser
roles, the security advisor retained the same two pre-existing warnings, and
all 95 tests, lint, build, import-casing, and whitespace checks pass. The real
accepted generated variant remains a draft with zero approvals. Next: deploy,
submit that variant for review, and verify the pending snapshot before the
separate owner decision.

PR #15 merged into `main` as `4cbf31a`. Production deployment
`dpl_DyUEfC4Gmz7oTXnDtFWf3M5cQzV7` reached Ready. The real accepted variant
remains a draft with no approval request so Tulio can initiate and verify the
first durable review cycle in Production.

## 2026-08-12 — CWS-EXPORT-HANDOFF-012 audited manual export

Agent: Codex
Status: Completed locally; staging migration applied; deployment pending

Added a separate confirmed approved-to-exported handoff that records the
authenticated actor, time, approved review, exact final content, caption, and
filename/reference without invoking publishing or n8n. Captured exports remain
immutable through publish/archive status changes; the two historical exported
rows received an honest unavailable-evidence marker without invented
attribution.

Managed staging tests verified the valid transition plus direct-publish,
missing-caption, missing-approval, non-member, and post-export mutation denials;
all synthetic rows were rolled back. Migration `20260812162351` is applied,
all 97 tests, lint, build, import-casing, and whitespace checks pass, and the
real approved variant remains unexported. Next: publish the UI, enter its final
caption and Final Cut filename/reference, then explicitly confirm the first
real handoff.

PR #16 merged into `main` as `391693d`. Production deployment
`dpl_6NdNSzSRfBViQ5zJMfaUR4sgmcMB` reached Ready and owns
`https://cws-two.vercel.app`; safe HTTP checks returned 200 for the login and
real variant routes. The real approved variant remains unchanged pending
Tulio's final caption, filename/reference, and explicit export confirmation.

Live testing then exposed a UX failure: the real filename was present but the
caption was blank, so `Mark exported` stayed silently disabled and appeared
broken. The follow-up makes the control respond with the exact missing fields
and opens confirmation after both are completed; the focused test, all 97
tests, lint, build, import-casing, and whitespace checks pass. Deployment of
this feedback fix is pending.

PR #17 merged into `main` as `53e7356`; Production deployment
`dpl_QwCuS4bhRC6nrPuR8YhmqYBxS4Ge` reached Ready and the public alias points to
it. The first real handoff recorded `CWS-AI-E0104603-v1.mp4`, owner attribution,
the approved review, and caption `test` at `2026-08-12 18:47:13.374327+00`.
A signed-in Production reload showed `Export recorded`, locked evidence, and
the explicit no-publication notice. Next: decide whether the test caption is
acceptable pilot evidence or requires a new versioned correction workflow.

## 2026-08-12 — CWS-EXPORT-REVISION-013 versioned export corrections

Agent: Codex
Status: Completed locally; staging migrations applied; deployment pending

Added append-only export versions and a confirmed correction workflow that
preserves the first real handoff exactly while permitting a new caption,
filename/reference, and reason as version 2 or later. The database derives the
version, actor, time, approved review, superseded record, and immutable content
snapshot. Workspace members may read and insert, but browser roles cannot
update or delete history or execute the trigger functions directly. No
publishing, n8n, webhook, social API, or legacy-table behavior changed.

Managed staging tests verified the unchanged real version 1, invalid and
non-member denials, a valid temporary version 2, immutable mutation privileges,
RLS visibility, and automatic version-1 capture for future exports; all
synthetic changes rolled back. Testing found and corrected both a broad default
grant risk and PostgreSQL `UPDATE OF` trigger behavior. Migrations
`20260812190342`, `20260812190521`, and `20260812190917` are applied and aligned.
All 98 tests, lint, build, import-casing, and whitespace checks pass; lint keeps
the existing hook warning. Next: push and deploy the UI, then create and verify
the real corrected version 2 without invoking publication.

PR #18 merged into `main` as `18f0957`. Production deployment
`dpl_6itez6HwyCR1Zz7mK1Mja8Rqwv7P` reached Ready and is aliased to
`https://cws-two.vercel.app`. The release build passed with 433 modules. No real
version 2, publication record, webhook call, or n8n execution was created.
Next: enter and explicitly confirm the real corrected caption, new export
reference, and correction reason, then verify versions 1 and 2 in Production.

## 2026-08-12 — CWS-PILOT-STATUS-RECONCILE-014 historical approval status

Agent: Codex
Status: Completed and pushed; staging migration applied; merge pending

Found three non-exported variants whose completed approval decisions predated
the status-synchronization trigger. Added and applied bounded migration
`20260812193142`, reconciling two stale approved rows to `approved` and one
revision-requested row to `draft`; exported evidence and all content remained
untouched. English CWS-001 is now lifecycle-consistent, Spanish remains
exported, all 98 tests pass, lint has only the existing hook warning, and the
security advisor is unchanged. Next: add an explicit approved-content
revision/re-review path before replacing the English test placeholders.

Commit `6c5d49e` was pushed to
`agent/reconcile-historical-approval-status`. Pull request, merge, and deployment
remain pending.

PR #21 merged into `main` as `3abf34a`, completing the bounded historical
reconciliation before the approved-content revision work began.

## 2026-08-12 — CWS-APPROVED-REVISION-015 approved-content re-review

Agent: Codex
Status: Completed, merged, deployed, and staging migrations applied

Added an explicit owner-confirmed revision event for approved, non-exported
content. The event preserves the completed approval, derives its owner and
source approval in the database, returns the variant to draft, and requires a
fresh pending snapshot and owner decision before the content can become
approved again. Direct approved edits, direct approval/status bypasses,
non-owner revisions, and exported-content revisions are denied. Existing
confirmed export and versioned export-correction paths remain separate, and no
publishing or n8n behavior changed.

Managed staging lifecycle probes exercised the entire revision and fresh-review
cycle inside rollback transactions; the real pilot content and evidence were
unchanged. Migrations `20260812194145` and `20260812195057` are applied. The two
older return-path/channel-brief migration filenames were aligned locally to
their existing remote versions without reverting or re-running schema. All 99
tests pass, lint has only the existing hook warning, build/import casing pass,
and the new table has RLS, minimal browser grants, non-executable trigger
functions, and complete foreign-key indexes. PR #22 merged into `main` as
`2d6ce5f`; Production deployment `dpl_CHoK2C5YctygbfbH7cbY3Ee5wbwi` reached
Ready and is aliased to `https://cws-two.vercel.app`. Next: use the control to
replace and freshly approve the English CWS-001 test content.
