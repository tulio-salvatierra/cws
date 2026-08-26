Task ID: CWS-PUBLISH-CONFIG-GUARD-033
Agent: Codex
Objective: Harden the LinkedIn publish endpoint configuration guard after production verification showed missing n8n publish env variables.

Files inspected:
- .agents/codex-project-instructions.md
- docs/product-definition.md
- docs/technical-conventions.md
- docs/decisions.md
- docs/learnings.md
- docs/agent-handoffs/latest-codex.md
- docs/task-ledger.md
- docs/project-log.md
- docs/n8n-assessment.md
- vercel.json
- api/publish-linkedin.js
- api/__tests__/publish-linkedin.test.js
- api/__tests__/publish-linkedin-rewrite.test.js
- server/outreach/webhook.js
- api/outreach-webhook.js

Files changed:
- api/publish-linkedin.js
- api/__tests__/publish-linkedin.test.js
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md
- docs/learnings.md

Database or API changes:
- Split the LinkedIn publish endpoint configuration checks into Supabase-auth prerequisites and n8n-publish prerequisites.
- Unauthenticated production POST requests now stop at `401 Authentication required` instead of exposing missing server environment variable names.
- Authenticated requests still fail closed with `503 LinkedIn publishing is not configured` when the n8n publish webhook URL or secret is absent.
- No database schema, n8n workflow, Resend webhook, or Supabase data changed.

Security decisions:
- Did not trigger a production LinkedIn publish POST with credentials or a signed-in browser because DEC-026 still requires outbound publishing to remain disabled until a separately approved workflow implements the return path.
- Used only safe unauthenticated production probes for publish-route verification.
- Did not pull production Vercel secrets into a local file after the approval reviewer correctly rejected the broad secret download.

Decisions made:
- Keep missing server variable names out of unauthenticated publish responses.
- Keep production publish blocked until the n8n publish workflow URL/secret are intentionally configured.

Assumptions:
- The missing `N8N_PUBLISH_WEBHOOK_URL` and `N8N_PUBLISH_WEBHOOK_SECRET` in Production are a readiness blocker, not an invitation to point publish traffic at the dry-run workflow.
- `https://www.cicerowebstudio.xyz/api/outreach/webhook` is the active Resend webhook endpoint because the Resend connector lists it as enabled for delivered, bounced, and complained events.

Tests added:
- Two publish endpoint tests covering unauthenticated missing-env non-disclosure and authenticated missing-publish-config behavior.

Tests run:
- `npm run test:run -- api/__tests__/publish-linkedin.test.js api/__tests__/publish-linkedin-rewrite.test.js`: passed, 2 files and 8 tests.
- `npm run lint`: passed with the existing `src/Hooks/useDrafts.js` exhaustive-deps warning.
- `npm run build`: passed, including import-casing validation.
- Production safe `GET /api/publish/linkedin`: returned `405 Method not allowed`.
- Production safe unauthenticated `POST /api/publish/linkedin`: returned `401 Authentication required` after hardening.
- Resend-configured production webhook invalid-signature probe: returned `400 Invalid Resend webhook signature`, confirming route/env readiness without changing data.

Known issues:
- Production LinkedIn publish remains intentionally blocked until `N8N_PUBLISH_WEBHOOK_URL` and `N8N_PUBLISH_WEBHOOK_SECRET` are configured for a separately approved publishing workflow.
- A failed temp-directory deploy created an accidental Vercel project named `cws-publish-guard-prod`; deletion was not attempted after approval review rejected remote project removal without explicit user approval.
- The local working tree still contains unrelated pre-existing dirty files.
- `src/Hooks/useDrafts.js` still has the pre-existing exhaustive-deps lint warning.

Recommended next task:
- Either explicitly approve deletion of the accidental Vercel project `cws-publish-guard-prod`, or configure the real n8n LinkedIn publish webhook and secret only after confirming the workflow is approved to publish and report through `/api/published`.

Questions requiring Tulio:
- Do you want me to delete the accidental Vercel project `cws-publish-guard-prod`?
- Are the real n8n LinkedIn publish webhook URL and shared secret ready to configure in Production?

Project-memory files updated:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md
- docs/learnings.md

Permanent decisions added:
- None.

Reusable learnings added:
- Clean Vercel archive deploys must include `.vercel/project.json` or explicitly target the existing project to avoid creating a new project from the archive directory name.

Memory updates withheld:
- No publish workflow approval or env values were inferred from the production-testing preference.

Git diff summary:
- Committed `aa5b397` to harden the LinkedIn publish configuration guard.
- Production deployment `dpl_5dZc1myaaqgBtnuJeRk3MVpBtPyv` is READY and aliased to `https://cws-two.vercel.app`.
- The exact Resend webhook endpoint configured in Resend is enabled and reaches the production handler, but a real signed suppression event was not generated from Codex.
