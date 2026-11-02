Task ID: CWS-LAYA-SALES-WHY-20261102
Agent: Codex
Objective: Explain the two Sales cards using actual contact opportunity and timing, preserving ranking.
Files inspected: CEO/Sales projection, priority evaluator, next-move helpers/tests, prior handoff; live lead/contact/send/promise records and dashboard.
Files changed: server/laya/priority-review.js, server/laya/next-move.js, server/laya/__tests__/next-move.test.js; log, ledger and this handoff.
Database or API changes: Add derived sales_opportunity to existing evaluation for eligible new-prospect commands with complete scoped reads. No schema change or business-data write.
Security decisions: Bind lead/command/workspace; no absence claims from incomplete reads; do not equate missing email history to never contacted. No external actions.
Decisions made: Explain opportunity without inventing urgency; acknowledge recorded past contact and response; completed promises are not due. No ranking/queue code changed.
Assumptions: Existing Sales command eligibility is preserved, including phone-only prospects; this correction does not redesign that policy.
Tests added: Seven regressions covering first/prior contact, Chicago date, completed/due promises, read failures, successful intro and closed leads.
Tests run: 853 tests/84 files, lint, build/import check and diff check passed; existing decoration test asserts order and priority fields are unchanged. Live source records checked read-only.
Known issues: Existing unrelated limits unchanged; deployed wording verification pending.
Recommended next task: Verify both rendered explanations and unchanged Top3 after deployment.
Questions requiring Tulio: None.
Project-memory files updated: Log, ledger and latest-codex.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: Company-context work remains separate.
Git diff summary: Three code/test files and three docs; no ranking, scheduling or source-record edits.
