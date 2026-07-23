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
