# Latest Codex Handoff

Task ID: CWS-DB-VALIDATION-001
Agent: Codex
Objective: Validate the workspace foundation on managed Supabase, establish a dedicated CWS staging project, and verify workspace RLS and owner protections.
Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `supabase/migrations/001_schema.sql`
- `supabase/migrations/002_rls.sql`
- `supabase/migrations/003_add_youtube_platform.sql`
- `supabase/migrations/004_add_youtube_ready_status.sql`
- `supabase/migrations/005_keywords_status.sql`
- `supabase/migrations/006_workspace_foundation.sql`
- Supabase CLI linked-project and migration metadata
Files changed:
- `.gitignore`
- `supabase/migrations/006_workspace_foundation.sql`
- `supabase/migrations/007_allow_workspace_member_cascade.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/decisions.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`
- Disposable validation scripts and packages were created only under `/tmp`.
Database or API changes:
- Created the non-production Supabase project `cws-os-staging` (`ddbhxqkckzpwzwvnoxqt`) in `us-east-2` with nano compute.
- Stored its generated database password in macOS Keychain under service `supabase-cws-os-staging-db-password`.
- Linked this repository to `cws-os-staging`.
- Applied migrations `001` through `006`.
- Managed validation found that final-owner protection blocked administrative workspace deletion cascades.
- Updated migration `006` for clean installs and added forward migration `007_allow_workspace_member_cascade.sql`.
- Applied migration `007` to staging.
- Deleted the explicitly approved unrelated project `ayuda-terremoto-venezuela` (`zcfgemblwfkcnnshjqmw`). This deletion is irreversible.
- No application API or legacy publishing behavior changed.
Security decisions:
- Created and targeted only a clearly named non-production CWS project.
- Performed a dry run before each remote migration push.
- Used temporary managed-database users and workspaces for RLS testing, then removed them.
- Kept the final-owner guard for direct membership changes while allowing trusted parent-workspace deletion cascades at nested trigger depth.
- Authenticated users still receive no workspace `DELETE` permission.
- Kept database credentials out of repository files and chat output.
Decisions made:
- `cws-os-staging` is the dedicated non-production Supabase target for CWS migration and RLS validation.
- Administrative workspace deletion must be able to cascade through membership rows; direct removal of the final active owner remains prohibited.
Assumptions:
- Nano compute is sufficient for MVP staging and migration validation.
- `us-east-2` is an appropriate U.S. staging region for the current owner.
Tests added:
- No repository test harness was added.
- Disposable embedded-PostgreSQL and managed-Supabase validation scripts were created under `/tmp`.
Tests run:
- Supabase project creation — passed; replacement reported `ACTIVE_HEALTHY`.
- Supabase project deletion — passed for exact ref `zcfgemblwfkcnnshjqmw`.
- `supabase db push --dry-run` — confirmed only migrations `001` through `006`, followed later by only migration `007`.
- Managed `supabase db push` — passed for migrations `001` through `007`.
- Disposable embedded PostgreSQL run — passed for fresh migrations `001` through `007`, including administrative workspace cleanup.
- Managed two-user Supabase RLS suite — passed.
- Verified atomic workspace/owner bootstrap.
- Verified pre-membership tenant isolation and post-membership visibility.
- Verified owner-only workspace and membership mutation.
- Verified creator-spoofing and immutable identity protections.
- Verified direct workspace insertion, anonymous bootstrap, and invalid slugs are rejected.
- Verified final-owner suspension/demotion is rejected.
- Verified ownership transfer succeeds when another active owner exists.
- Verified trusted workspace deletion cascades to memberships and validation records are cleaned up.
- `supabase migration list --linked` — local and remote histories match for `001` through `007`.
- `supabase db lint --linked --level warning` — passed with no schema errors.
- Final project list — only linked, healthy `cws-os-staging` remains.
Known issues:
- The validation scripts are temporary and not reproducible through a checked-in repository command.
- The Supabase CLI link metadata is local and ignored by Git.
Recommended next task:
- Implement the approved first-class `channels` migration against the validated workspace foundation, including same-workspace constraints and RLS.
Questions requiring Tulio:
- None.
Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/decisions.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`
Permanent decisions added:
- `DEC-010`: Use `cws-os-staging` as the dedicated non-production Supabase validation target.
Reusable learnings added:
- Guard triggers on child rows must explicitly test trusted parent-delete cascades as well as direct user mutations.
Memory updates withheld:
- None.
Git diff summary:
- Updated migration `006` so clean installations allow trusted membership cascades.
- Added forward migration `007` for already-migrated databases.
- Ignored local `supabase/.temp/` link metadata.
- Replaced the latest Codex handoff and updated the existing validation task records.
- Added `DEC-010` and a reusable cascade-trigger testing learning.
- Pre-existing uncommitted schema-design and foundation work remains in the working tree.
- No application source, legacy publishing file, n8n workflow, or repository test file changed.
