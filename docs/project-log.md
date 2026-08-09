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
