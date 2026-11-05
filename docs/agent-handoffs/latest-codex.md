Task ID: CWS-AGREEMENT-BILLING-START-20261104
Agent: Codex
Objective: Separate the owner-confirmed start of a client agreement billing schedule from the actual finished-site launch date.
Files inspected: AGENTS.md, product definition, technical conventions, Codex role instructions, current Accounting agreements/read model/UI/tests, Negocio Listo lifecycle/CEO readers, generated Supabase types, existing client-agreement migration, project log and task ledger.
Files changed: Additive agreement migration and rollback-only pgTAP fixture; disposable targeted PostgreSQL fixture/runner; Accounting agreement action/read model/UI; lifecycle and CEO agreement reads; generated Supabase type; focused app and database tests; project-memory records.
Database or API changes: Proposed additive nullable `client_service_agreements.billing_start_date`, backfilled from historical `launch_date`; owner-only server RPC to start billing and create exactly one monthly schedule; existing launch RPC remains backward compatible and records launch separately. No migration applied.
Security decisions: Existing workspace/owner checks and service-only RPC execution remain. The new RPC rejects future/conflicting dates, preserves idempotent retry, and never invokes Square or another provider. The finished-site launch still requires its own owner confirmation.
Decisions made: Billing may legitimately start before a finished site launches. A billing date is not launch evidence, and a launch record after billing does not rewrite the schedule.
Assumptions: The owner will later confirm the actual billing start date and any received payment before a production write. No customer-specific record is present in source or test fixtures.
Tests added: Pre-launch billing summary/MRR; separate UI flows; owner-RPC/future-date/provider-free action; lifecycle preservation; pgTAP assertions for owner/workspace isolation, schedule dates, idempotency, conflicting-date rejection, separate launch, and legacy launch compatibility.
Tests run: Focused Vitest 43/43; full Vitest 877/877; lint; production build; 16/16 pgTAP assertions in the disposable `agreement_billing_verify` database. `git diff --check` passes.
Known issues: The full historical local Supabase replay remains intentionally blocked by the RETIRE-002 archived-export guard. The targeted fixture is the safe rehearsal path and creates only synthetic rows in a disposable container.
Recommended next task: Review/merge the branch, then seek explicit approval for a separate Production migration/deployment plan.
Questions requiring Tulio: None before local database verification. Before Production data entry, confirm the actual billing date and the amount/date/method of each received payment.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No production verification or release occurred.
Git diff summary: [PR #69](https://github.com/tulio-salvatierra/cws/pull/69) was rebuilt as clean commit `0ad5fb5`; GitGuardian, GitHub tests, and the Vercel preview pass. Merging to `main` will deploy code that requires the pending additive `20261104205413_agreement_billing_start_date.sql` migration, so merge/deployment awaits one explicit combined Production approval. No migration apply, deployment, Square action, or customer-data write.
