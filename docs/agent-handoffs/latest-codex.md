# Latest Codex Handoff

Task ID: CWS-DB-AGENT-RUNS-001
Agent: Codex
Objective: Implement and validate the smallest auditable workspace-owned agent-run foundation.
Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-claude.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `supabase/migrations/006_workspace_foundation.sql`
- `supabase/migrations/007_allow_workspace_member_cascade.sql`
- `supabase/migrations/008_channels.sql`
- `supabase/migrations/009_campaigns_content_variants.sql`
- `supabase/migrations/010_content_variant_approvals.sql`
Files changed:
- `supabase/migrations/011_agent_runs.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- Disposable validation scripts under `/tmp` were updated but are not repository files.
Database or API changes:
- Added workspace-owned `agent_runs` for traceable Ask and Propose requests.
- Added approved lifecycle statuses, structured JSON input/output, agent identity, error details, start/finish times, creator provenance, and timestamps.
- Added lifecycle validation and automatic start/finish attribution.
- Added workspace/status, command-level, creator, and queued-work indexes.
- Added active-member read and queue policies.
- Granted authenticated users no update or delete permission; trusted server-side code owns execution results and lifecycle transitions.
- Applied migration `011_agent_runs.sql` to `cws-os-staging`.
- No serverless execution API, application UI, autonomous loop, or legacy publishing behavior was added.
Security decisions:
- Members may queue only `ask` or `propose` runs for their own active workspace identity.
- Members cannot fabricate execution status, output, errors, or lifecycle timestamps.
- `execute` inserts are rejected at the database trigger until a generalized action approval can be linked.
- Agent-run request identity, workspace ownership, command level, agent key, input, creator, and creation time are immutable.
- Completed, failed, and superseded runs are immutable.
- Outsiders cannot read or queue workspace runs.
Decisions made:
- The first agent-run foundation records Ask and Propose work only.
- The `execute` command level is represented for forward compatibility but remains disabled.
- No permanent decision was added because blocking unapproved execution directly follows `DEC-006` and the product command model.
Assumptions:
- `agent_key` is a stable lowercase slug identifying the responsible agent boundary.
- Inputs and outputs are JSON objects so later APIs can add structured fields without changing the base table.
- Trusted Vercel serverless functions or equivalent service-role workers will perform lifecycle updates in a later ticket.
Tests added:
- No repository test harness was added.
- Disposable fresh-PostgreSQL and managed-Supabase agent-run scenarios were added under `/tmp`.
Tests run:
- Disposable fresh PostgreSQL run — migrations `001` through `011` passed.
- Managed `supabase db push --dry-run` — confirmed only migration `011`.
- Managed migration application — passed for `011_agent_runs.sql`.
- Managed agent-run lifecycle and RLS suite — passed.
- Verified active members can queue Ask and Propose runs.
- Verified member lifecycle updates affect no rows and trusted updates succeed.
- Verified creator spoofing, outsider requests, outsider reads, and unapproved Execute requests are blocked.
- Verified queued-to-running-to-completed timestamps and structured output.
- Verified invalid transitions and terminal-run mutation are rejected.
- Verified queued runs can be superseded and workspace cleanup cascades to runs.
- `supabase migration list --linked` — local and remote histories match through `011`.
- `supabase db lint --linked --level warning` — passed with no schema errors.
- `git diff --check` — passed.
Known issues:
- There is no serverless agent execution endpoint yet.
- Generalized action approvals are not modeled, so Execute runs remain blocked.
- Initial `CWS-001` records are not seeded because no persistent owner/workspace row has been selected.
- Validation scripts remain temporary rather than checked into the repository.
Recommended next task:
- Select the persistent owner identity and seed the first workspace/channel/campaign/variants, or implement the first read-only Ask API against `agent_runs`.
Questions requiring Tulio:
- A persistent Supabase user identity is required before seeding the first real workspace and `CWS-001` records.
Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
Permanent decisions added:
- None.
Reusable learnings added:
- None.
Memory updates withheld:
- The exact agent-key vocabulary and executor implementation remain deferred until the first serverless agent ticket.
- Generalized action approvals, Execute runs, autonomous loops, and publishing integration remain deferred.
Git diff summary:
- Added migration `011_agent_runs.sql`.
- Replaced the latest Codex handoff.
- Appended the `CWS-DB-AGENT-RUNS-001` project-log entry.
- Added the `CWS-DB-AGENT-RUNS-001` task-ledger row.
- No application source, legacy migration, publishing table, n8n workflow, decision, or learning changed.
