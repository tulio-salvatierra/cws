Task ID: CWS-MARKETING-GBP-20261013
Agent: Codex
Objective: Release Google Business Profile as a fourth owner-confirmed Marketing destination and verify the live channel tabs.
Files inspected:
- `api/marketing-linkedin.js`, `api/__tests__/marketing-linkedin.test.js`, `src/marketing/channels.js`, Marketing UI and tests, the Google migration, project conventions, and project memory.
Files changed:
- `api/marketing-linkedin.js`, `api/__tests__/marketing-linkedin.test.js`, `docs/agent-handoffs/latest-codex.md`, `docs/project-log.md`, `docs/task-ledger.md`.
Database or API changes:
- Production migration `20261012110804_marketing_google_business.sql` was applied. It adds Google destination support and per-attempt required platforms without changing historical three-channel attempts.
- The owner-only Marketing API recognizes the observed sole CWS Google location when bundle.social omits `providerPageId`, pins verification to its exact Google location ID, and records that ID in destination identity.
Security decisions:
- A missing selected-location ID is accepted only for one available location with the exact CWS Google ID and matching account/location names. Other locations, multiple locations, or identity mismatches fail closed. Publishing still requires the existing exact-slot owner confirmation.
Decisions made:
- No social post was submitted during release verification.
Assumptions:
- The Google location returned by the connected production bundle.social team is the intended CWS destination.
Tests added:
- Verified missing-selection single-location case and wrong/ambiguous Google location cases; confirmed persisted identity on a simulated publish.
Tests run:
- `npm run test:run` — 433 passed; `npm run lint` and `npm run build` passed.
- Authenticated, read-only Production UI check showed all four destinations verified, tabs present, Post A reviewable, and Post B awaiting the prior slot.
Known issues:
- No real four-channel post was sent, so provider publication and per-channel result ingestion remain unproven until an owner confirms a real post.
Recommended next task:
- Owner reviews Post A caption/image and uses Confirm Post A when ready; then inspect provider results and permalinks for all four channels.
Questions requiring Tulio:
- None for deployment. Actual posting remains an explicit owner action.
Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`, `docs/project-log.md`, `docs/task-ledger.md`.
Permanent decisions added:
- None.
Reusable learnings added:
- None.
Memory updates withheld:
- None.
Git diff summary:
- Targeted Google account verification/tests and project memory changed. Existing unrelated dirty files under tools, artifacts, output, client-project types, and a separate migration were left untouched.
