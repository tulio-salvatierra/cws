# Latest Codex Handoff

Task ID: CWS-DB-CONSOLIDATE-001
Agent: Codex
Objective: Consolidate the validated migrations 007–011 onto the current integration branch and close unnecessary API-role execution grants on CWS OS SECURITY DEFINER functions through migration 012.

Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/task-ledger.md`
- `docs/agent-handoffs/latest-codex.md`
- `supabase/migrations/006_workspace_foundation.sql`
- `supabase/migrations/007_allow_workspace_member_cascade.sql`
- `supabase/migrations/008_channels.sql`
- `supabase/migrations/009_campaigns_content_variants.sql`
- `supabase/migrations/010_content_variant_approvals.sql`
- `supabase/migrations/011_agent_runs.sql`

Files changed:
- `supabase/migrations/012_lock_down_function_grants.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

Database or API changes:
- Added a forward-only migration that explicitly revokes EXECUTE from `anon` for `create_workspace`, `is_workspace_member`, and `is_workspace_owner`, while retaining authenticated execution.
- Explicitly revoked EXECUTE from both `anon` and `authenticated` for trigger-only `protect_workspace_membership`, `protect_approval_lifecycle`, and `protect_agent_run_lifecycle`.
- Migrations 006–011 were not rewritten.
- No legacy publishing table, policy, or n8n integration was modified.

Security decisions:
- End-user workspace helper functions remain callable only by authenticated users.
- Trigger-only guard functions are not directly callable by API roles.
- The grant correction is implemented as migration 012 because migrations 006–011 are already applied to staging.

Decisions made:
- No new permanent product or architecture decision was required; this ticket implements the explicitly approved security correction.

Assumptions:
- PostgreSQL trigger execution does not require direct EXECUTE grants to `anon` or `authenticated` on the trigger functions.
- The `agent/agent-runs` tip contains the validated linear history for migrations 007–011.

Tests added:
- No repository test harness was added.

Tests run:
- Static audit of every SECURITY DEFINER function introduced by migrations 006–011.
- Confirmed the relevant functions are the three authenticated helpers and three trigger-only guards listed above.
- Confirmed migrations 008 and 009 ownership-preservation functions are not SECURITY DEFINER and are outside the reported grant warning set.
- Managed Supabase migration application and Security Advisor verification remain pending because this execution environment has GitHub access but no Supabase CLI/session connector.

Known issues:
- Migration 012 has not yet been applied to project `ddbhxqkckzpwzwvnoxqt` from this environment.
- Security Advisor warning clearance therefore cannot yet be claimed.

Recommended next task:
- Apply migration 012 only to `cws-os-staging`, rerun the Security Advisor, and verify the six function warnings are cleared before customer-facing use.

Questions requiring Tulio:
- None for repository work. Managed Supabase execution requires running the linked CLI workflow in the repository environment that already has access to `cws-os-staging`.

Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

Permanent decisions added:
- None.

Reusable learnings added:
- None yet; add only after managed Supabase confirms the explicit role revokes clear the advisor warnings.

Memory updates withheld:
- A reusable learning about Supabase default function grants was withheld until managed verification is complete.

Git diff summary:
- Added `012_lock_down_function_grants.sql`.
- Updated the latest Codex handoff and task ledger.
- Appended the consolidation ticket to the project log.
- No legacy publishing migration, legacy table definition, `auth_all` RLS policy, application source, or n8n workflow changed.
- No unrelated/pre-existing changes were introduced on the consolidation branch.
