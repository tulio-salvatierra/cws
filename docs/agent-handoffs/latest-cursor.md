# Latest Cursor Handoff

Task ID: CWS-DB-MIGRATION-RECONCILE-001
Agent: Cursor
Objective: Safely reconcile remote-only migration `20260730231228` with local history so `npx supabase db push` can become clean. Migration-history work only.

Files inspected:
- `.agents/cursor-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/agent-handoffs/latest-cursor.md`
- `supabase/migrations/001_schema.sql` through `012_lock_down_function_grants.sql`
- Remote staging schema via MCP (`goals`, `initiatives`, `projects`, `tasks`, `decisions`, `learnings`)

Files changed:
- `docs/agent-handoffs/latest-cursor.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

UI behavior added:
- None

Data integration added:
- None

Architecture alignment:
- Linked project remains `cws-os-staging` / `ddbhxqkckzpwzwvnoxqt`.
- Local `001`–`012` match remote.
- Remote-only `20260730231228` (`goals_initiatives_projects_tasks_decisions_learnings`) is real product-schema state for Goals → Initiatives → Projects/Tasks plus Decisions/Learnings, not covered by local `007`–`012`.
- Migration `012` is already applied on staging; reconcile does not need to re-apply it.

Decisions made:
- Choose KEEP, not repair.
- Do not run `supabase migration repair --status reverted 20260730231228`.
- Do not invent or commit a reconstructed migration file in this ticket because CLI pull did not produce one and Docker-based dump is unavailable.

Assumptions:
- The remote history row name accurately describes the applied schema objects inspected on staging.
- Reconstructing a local file with the exact remote version/name is the correct keep-path once DDL can be captured completely.

Tests added:
- None

Tests run:
1. `npx supabase migration list --linked` — `001`–`012` aligned; remote-only `20260730231228`.
2. `npx supabase db pull remote_20260730231228_sync --linked --yes` — failed: `LegacyDbPullMigrationConflictError` (suggests repair reverted).
3. `npx supabase db dump --linked --schema public` — failed: Docker Desktop required (`LegacyDockerRunError`).
4. MCP schema inspection — confirmed tables/columns/constraints/indexes/policies/triggers for goals-family objects exist on staging and are absent from local migration SQL.

Known issues:
- CLI `db pull` cannot retrieve a remote-only migration while history is divergent; it recommends repair, which is unsafe here.
- CLI `db dump` requires Docker Desktop in this environment.
- Bare shell command `db pull` is invalid; use `npx supabase db pull ...`.

Deferred future work:
- Capture complete DDL for the goals-family migration into local file
  `supabase/migrations/20260730231228_goals_initiatives_projects_tasks_decisions_learnings.sql`
  (exact remote version + name), then re-check list/push.
- Optional follow-up: owner-only decision transitions vs current member CRUD policies on `decisions`.

Recommended next command sequence:
1. Start Docker Desktop (required for dump), then:
   ```bash
   npx supabase db dump --linked --schema public -f /tmp/cws_staging_public.sql
   ```
2. Extract from that dump only the objects for `goals`, `initiatives`, `projects`, `tasks`, `decisions`, and `learnings` (tables, constraints, indexes, RLS enable/policies, grants, updated_at triggers) into:
   ```bash
   supabase/migrations/20260730231228_goals_initiatives_projects_tasks_decisions_learnings.sql
   ```
3. Verify:
   ```bash
   npx supabase migration list --linked
   npx supabase db push
   ```
   Expect local+remote match for `20260730231228` and a clean/no-op push on staging.

Do not run:
```bash
npx supabase migration repair --status reverted 20260730231228 --linked
```
Reason: the migration is meaningful remote schema, not redundant with `007`–`012`. Reverting history would orphan applied tables and risk a later push trying to recreate existing objects.

Questions requiring Tulio:
1. Approve a follow-up ticket to add the kept local migration file from dump/reconstruction (Docker available), then confirm clean `db push`.
2. Optional: confirm whether `decisions` policies should later be tightened to owner-only for sensitive transitions (DEC-009), separately from history reconcile.

Project-memory files updated:
- `docs/agent-handoffs/latest-cursor.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

Permanent decisions added:
- None

Reusable learnings added:
- Do not treat CLI “repair reverted” suggestions as safe when a remote-only migration maps to real schema absent from local history.

Memory updates withheld:
- None

Git diff summary:
- Docs/memory updates only
- No migration SQL added (pull produced no file; dump blocked by Docker)
- No app/UI/legacy publishing changes
