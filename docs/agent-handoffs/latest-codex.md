Task ID: CWS-VERCEL-CLEANUP-034
Agent: Codex
Objective: Record cleanup of the accidental Vercel project created during the clean archive deployment attempt.

Files inspected:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md
- docs/learnings.md
- git status
- Vercel project inspection output for `cws-publish-guard-prod`

Files changed:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Database or API changes:
- None.

Security decisions:
- Deleted only the verified accidental Vercel project `cws-publish-guard-prod` after Tulio explicitly approved cleanup.
- Verified deletion by inspecting the same project name and receiving `project_not_found`.
- Did not touch the real Vercel project `cws`, production alias `https://cws-two.vercel.app`, Supabase data, n8n workflows, or secrets.

Decisions made:
- Treat the accidental Vercel project as cleaned up and remove it from the active known-issues list.

Assumptions:
- Tulio's approval message authorized deletion of `cws-publish-guard-prod`, the exact accidental project named in the prior handoff.

Tests added:
- None.

Tests run:
- `npx vercel@59.6.2 project inspect cws-publish-guard-prod`: first verified the project existed and belonged to `t00lio's Team`.
- `printf 'y\\n' | npx vercel@59.6.2 project remove cws-publish-guard-prod`: removed the project successfully.
- `npx vercel@59.6.2 project inspect cws-publish-guard-prod`: returned `project_not_found` after removal.

Known issues:
- Production LinkedIn publish remains intentionally blocked until `N8N_PUBLISH_WEBHOOK_URL` and `N8N_PUBLISH_WEBHOOK_SECRET` are configured for a separately approved publishing workflow.
- The local working tree still contains unrelated pre-existing dirty files.
- `src/Hooks/useDrafts.js` still has the pre-existing exhaustive-deps lint warning.

Recommended next task:
- Run controlled Resend suppression verification for `CWS-OUTREACH-SUPPRESSION-031`, or configure the real n8n LinkedIn publish webhook only after confirming the workflow is approved to publish and report through `/api/published`.

Questions requiring Tulio:
- Are the real n8n LinkedIn publish webhook URL and shared secret ready to configure in Production?

Project-memory files updated:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Permanent decisions added:
- None.

Reusable learnings added:
- None.

Memory updates withheld:
- No new publish workflow approval or env values were inferred from the cleanup approval.

Git diff summary:
- Documentation-only housekeeping update records that accidental project `cws-publish-guard-prod` was deleted and verified gone.
