Task ID: CWS-LANDING-TRUST-CLEANUP-20261104
Agent: Codex
Objective: Clean up public landing-page trust claims, pricing, titles and structured data.
Files inspected: AGENTS.md, Codex role instructions, product and memory docs, PR #61 handoff, landing data/types/components, route metadata, Layout and shared SEO utilities.
Files changed: Landing data/types/components, SEO hook and schema builder, canonical metadata, regression tests, project memory and two verification screenshots.
Database or API changes: None.
Security decisions: Removed unsupported public review and pricing claims.
Decisions made: Applied D1–D4. Used Site Maintenance in Elmwood Park to keep the full title within 60 characters.
Assumptions: PR #61 was verified merged, so the cleanup branch starts from updated main.
Tests added: Schema shape, removed data fields, organization script identity across navigation and landing title length.
Tests run: 869 tests, lint, build, generated titles and Chrome checks on all six landing routes at 1440×900 and 390×844.
Known issues: The build reports the existing bundle-size warning.
Recommended next task: Review draft PR #62.
Questions requiring Tulio: None for this draft.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: Production verification.
Git diff summary: Landing-page changes and verification evidence in [draft PR #62](https://github.com/tulio-salvatierra/cws/pull/62). Work isolated from the original checkout.
