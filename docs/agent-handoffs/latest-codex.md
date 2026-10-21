Task ID: DECISIONS-001
Agent: Codex
Objective: Reshape decisions into business_decisions, preserve the existing proposal, and surface owner-controlled reviews in CEO Today.
Files inspected: Product scope, AGENTS/role instructions, conventions/decisions/learnings, ledger/log/handoff, live decision schema/row/policies, CEO API/readmodel/UI/tests, workspace auth/helpers, historical migrations, Supabase and Vercel skills/docs.
Files changed: Migration 20261021161456, generated types, decision review projection/fixtures, CEO API and tests, embedded BusinessDecisions UI and tests, legacy pgTAP test, product definition, ledger/log/verification and this handoff.
Database or API changes: Production table renamed in place; review fields, activation evidence, strict lifecycle trigger and RLS/grants added. 67/67 exact migration parity. CEO GET adds workspace-scoped decisions and verified owner controls; no new route.
Security decisions: Only owner-JWT writes can activate; service role cannot update or insert active. Actual actor/time stamped by database. Active terms, activation evidence and identity/provenance protected. No delete grant. Optimistic writes require the exact reviewed updated_at. No production decision activated, publishing or sending.
Decisions made: Implement approved DEC-036; no additional permanent architecture/business decision. Existing legacy row stays proposed with all prior values intact.
Assumptions: Free-text conditions are owner-observed rather than guessed. Due dates derive in Chicago time; reviews sit outside unchanged department ordering. Strategy activation remains an owner task; no strategy row invented. Candidate creation screen and Laya evaluator are outside this ticket.
Tests added: Five projection fixtures, five UI authority/staleness tests, two API scope/degradation tests, 18 pgTAP assertions.
Tests run: 18 pgTAP before/after, 46 existing database assertions, full app suite plus new API cases, lint, placeholder-env build/prerenders, row hash preservation and exact migration SQL/version parity, security advisors unchanged.
Known issues: MCP migration tool twice returned expired requestState; CLI Management API applied schema and history atomically. Existing build warnings remain. Live release verification pending.
Recommended next task: Owner reviews existing proposal/strategy before any activation. Separate lifecycle/Laya work remains separately scoped.
Questions requiring Tulio: None.
Project-memory files updated: Product definition, ledger, log, verification, this handoff.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No automatic strategy activation or arbitrary free-text condition evaluator inferred.
Git diff summary: Isolated codex/decisions-001 from main; original user checkout untouched. No private archive, production record contents or secrets included. Merge/deployment pending.
