Task ID: CWS-MIGRATION-001
Agent: Codex
Objective: Read-only audit of the current CWS OS and safe Marketing V1 migration path against the frozen product-reset brief.

Files inspected:
- User-supplied CWS OS Migration Task 001 brief
- Application routes, admin shell, authentication, legacy queue, workspace, channel, campaign, variant, published-post, planning, knowledge, client, lead, and mailing-list views
- Vercel API handlers, outreach server handlers, n8n definitions, client-portal Google Sheets integration, environment key registry, and Vercel configuration
- Every repository Supabase migration, relevant SQL test, existing product/technical/decision/learning documentation, prior n8n assessment, project log, and task ledger
- Linked Supabase CLI migration-list capability and Vercel environment variable names (without reading values)

Files changed:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Database or API changes:
- None. No migration, database request, API request with side effects, external message, publish, or configuration update was made.
- A read-only linked Supabase migration-list attempt timed out while creating the login role, so live database contents and applied-history state were not asserted.

Security decisions:
- Did not expose or read secret values; only configuration names and environment scopes were inspected.
- Flagged the client portal's source-embedded client, project, and payment information as data that must be preserved and removed from browser-shipped static fixtures before future operational use.

Decisions made:
- None. The supplied frozen Marketing V1 brief was treated as authoritative audit scope; no existing architecture was extended.

Assumptions:
- CWS-MIGRATION-001 denotes the supplied Migration Task 001.
- Earlier n8n live findings are historical evidence only; no current n8n instance state was claimed without a new external inspection.

Tests added:
- None.

Tests run:
- npm run test:run — 38 files and 136 tests passed.
- npm run lint — no errors; existing useDrafts exhaustive-deps warning remains.
- npx supabase migration list --linked — read-only attempt blocked by a connection timeout while initializing the login role.

Known issues:
- The current product definition and much of the admin navigation still describe the suspended Channels/Campaigns/Variants/Approvals model.
- Legacy n8n workflow documentation is stale and historical n8n evidence shows no operational social publisher; no bundle.social code or configuration exists.
- Vercel Preview has browser Supabase configuration but not the server-side generation/publishing database credentials, so Preview cannot exercise the current server-side Marketing flow.
- The live Supabase schema/data snapshot remains unverified in this audit because of the CLI connection timeout.

Recommended next task:
- CWS-MARKETING-M0: perform a no-publish bundle.social vendor/media/quota/callback preflight and create a protected inventory of one existing English CWS graphic. Do not build a Campaign, Variant, Approval, n8n, or generic workflow dependency.

Questions requiring Tulio:
- Provide or confirm a bundle.social test workspace/account and one explicitly permitted test social destination before a real-publish milestone is started.

Project-memory files updated:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Permanent decisions added:
- None.

Reusable learnings added:
- None.

Memory updates withheld:
- The product-reset brief was not converted into a repository decision record during this investigation-only task.

Git diff summary:
- Only the three required project-memory files changed. No application code, migration, environment file, provider configuration, or business data changed.
