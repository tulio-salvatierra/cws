Task ID: LAYA-PAID-SETUP-001
Agent: Codex
Objective: Remove missing-due-date requirement only forfully paid setup,retain unpaid checks.
Files inspected: Canonical/role instructions,lifecycle projection/evaluator/tests,policy history references,memory.
Files changed: Pure evaluator,regression fixtures,product/log/ledger/handoff.
Database or API changes: None. New output policy lifecycle-v2;historical v1 snapshots unchanged.
Security decisions: Receipt scope stays explicit;onlyvalid nonfuture same-obligation receipts withsafe integer sum establish coverage. Unpaid/monthly andmalformed supplied dates still fail validation. No activation/LLM/publish/send/payment/history writes.
Decisions made: Allow absent setup due_date only aftervalid coverage;no dates fabricated. Existing priority projection/order unchanged.
Assumptions: Existing statuses/currency/amount/term/source guards remain authoritative.
Tests added:14 regressions including paid/overpaid/multiple receipts,partial/future/unrelated/cross-workspace/invalid/overflow,malformed supplied dates,monthly dates andvalid unpaid advice;exact inputs retained.
Tests run:766 tests/77 files pass;lint pass;build pass (existing dependency/chunk warnings only).
Known issues: Public release/deployment pending;no production data orschema changes required.
Recommended next task: Release narrow change andread-only verify real paid-setup lifecycle becomes source-backed hold/do asappropriate;preserve financial/history hashes.
Questions requiring Tulio: Approval to push/merge/deploy this specific narrow fix;role instructions require explicit commit/push authorization.
Project-memory files updated: Product,log,ledger,latest handoff.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No fabricated dates/business facts;no historical snapshots modified.
Git diff summary: Isolated codex/laya-paid-setup-date;prior local audit notes/original dirty checkout preserved. Public payload contains policy/code/synthetic fixtures only.
