# Latest Codex Handoff

Task ID: CWS-DB-CONTENT-001
Agent: Codex
Objective: Implement and validate workspace-owned campaigns and independent content variants for `CWS-001`.
Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `supabase/migrations/006_workspace_foundation.sql`
- `supabase/migrations/007_allow_workspace_member_cascade.sql`
- `supabase/migrations/008_channels.sql`
Files changed:
- `supabase/migrations/009_campaigns_content_variants.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- Disposable validation scripts under `/tmp` were updated but are not repository files.
Database or API changes:
- Added workspace-owned `campaigns` with required channel, workspace-unique code, title, description, approved status workflow, creator provenance, and timestamps.
- Enforced same-workspace channel ownership with a composite foreign key.
- Added workspace-owned `content_variants` with campaign ownership, workspace-unique code, locale, independent title, transcript, tone, editing notes, caption text, export reference, approved status workflow, creator provenance, and timestamps.
- Enforced same-workspace campaign ownership with a composite foreign key.
- Added foreign-key, workflow-list, locale, and creator indexes.
- Added automatic `updated_at` handling and immutable ownership-field protection.
- Added active-member CRUD RLS for campaigns and content variants.
- Required authenticated creator provenance on inserts.
- Applied migration `009_campaigns_content_variants.sql` to `cws-os-staging`.
- No application API or legacy publishing behavior changed.
Security decisions:
- Active workspace membership is required for all campaign and content-variant access.
- Campaigns cannot reference a channel in another workspace.
- Content variants cannot reference a campaign in another workspace.
- Creator spoofing and workspace reassignment are blocked.
- Deleting a channel with campaigns is restricted.
- Deleting a campaign cascades to its variants; workspace administrative cleanup cascades through the full hierarchy.
Decisions made:
- Campaign and variant codes are uppercase, hyphenated, and unique per workspace.
- Campaign statuses and content-variant statuses exactly match the approved product definition.
- English and Spanish are independent rows; no translation linkage or shared mutable content was introduced.
- Project linkage, analytics, version history, publishing integration, and Final Cut automation remain deferred.
Assumptions:
- Campaigns can exist without a project until the projects schema is implemented.
- MVP locale identifiers use two- or three-letter language codes with an optional uppercase region.
- `working_title` represents the variant's independent title until broader title/version modeling is needed.
Tests added:
- No repository test harness was added.
- Disposable embedded-PostgreSQL and managed-Supabase campaign/variant scenarios were added under `/tmp`.
Tests run:
- Disposable fresh PostgreSQL run — migrations `001` through `009` passed.
- Managed `supabase db push --dry-run` — confirmed only migration `009`.
- Managed migration application — passed for `009_campaigns_content_variants.sql`.
- Managed workspace/channel/campaign/variant RLS suite — passed.
- Verified `CWS-001` can be created in editing status under its same-workspace channel.
- Verified `CWS-001-EN-MASTER` and `CWS-001-ES-MASTER` are independent records.
- Verified updating the English transcript/status does not alter Spanish content/status.
- Verified members can read and update campaigns and variants.
- Verified outsiders cannot read campaigns or variants.
- Verified cross-workspace channel and campaign references are rejected.
- Verified duplicate campaign codes, creator spoofing, invalid statuses, and ownership reassignment are rejected.
- Verified a channel with campaigns cannot be deleted directly.
- Verified administrative workspace cleanup removes campaigns and variants.
- `supabase migration list --linked` — local and remote histories match through `009`.
- `supabase db lint --linked --level warning` — passed with no schema errors.
- `git diff --check` — passed.
Known issues:
- Initial `CWS-001` records are not seeded because no persistent owner/workspace row has been created.
- Variant approvals are not yet available because the approvals schema remains deferred.
- Validation scripts remain temporary rather than checked into the repository.
Recommended next task:
- Implement variant-focused `approvals` so `CWS-001` can move from review to approved while preserving human control.
Questions requiring Tulio:
- None.
Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
Permanent decisions added:
- None. This implementation follows the approved product definition and `DEC-004` through `DEC-010`.
Reusable learnings added:
- None.
Memory updates withheld:
- Project linkage, generalized entity targets, translations, analytics, and version history remain deferred.
Git diff summary:
- Added migration `009_campaigns_content_variants.sql`.
- Replaced the latest Codex handoff.
- Appended the `CWS-DB-CONTENT-001` project-log entry.
- Added the `CWS-DB-CONTENT-001` task-ledger row.
- No application source, legacy migration, publishing table, n8n workflow, decision, or learning changed.
