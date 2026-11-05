Task ID: CWS-AGREEMENT-BILLING-START-20261104
Agent: Codex
Objective: Separate the owner-confirmed start of a client agreement billing schedule from the actual finished-site launch date.
Files inspected: AGENTS.md, product definition, technical conventions, Codex role instructions, current Accounting agreements/read model/UI/tests, Negocio Listo lifecycle/CEO readers, generated Supabase types, existing client-agreement migration, project log and task ledger.
Files changed: Additive agreement migration and rollback-only pgTAP fixture; disposable targeted PostgreSQL fixture/runner; Accounting agreement action/read model/UI; lifecycle and CEO agreement reads; generated Supabase type; focused app and database tests; project-memory records.
Database or API changes: Production migration `20261105165800_agreement_billing_start_date` added nullable `client_service_agreements.billing_start_date`, backfilled historical launch dates, and added an owner-checked server RPC to start exactly one monthly schedule. The existing launch RPC remains backward compatible and records launch separately.
Security decisions: Existing workspace/owner checks and service-only RPC execution remain. The new RPC rejects future/conflicting dates, preserves idempotent retry, and never invokes Square or another provider. The finished-site launch still requires its own owner confirmation.
Decisions made: Billing may legitimately start before a finished site launches. A billing date is not launch evidence, and a launch record after billing does not rewrite the schedule.
Assumptions: The owner will later confirm the actual billing start date and any received payment before a production write. No customer-specific record is present in source or test fixtures.
Tests added: Pre-launch billing summary/MRR; separate UI flows; owner-RPC/future-date/provider-free action; lifecycle preservation; pgTAP assertions for owner/workspace isolation, schedule dates, idempotency, conflicting-date rejection, separate launch, and legacy launch compatibility.
Tests run: Focused Vitest 43/43; full Vitest 877/877; lint; production build; 16/16 pgTAP assertions in the disposable `agreement_billing_verify` database. `git diff --check` passes.
Known issues: The full historical local Supabase replay remains intentionally blocked by the RETIRE-002 archived-export guard. The targeted fixture is the safe rehearsal path and creates only synthetic rows in a disposable container.
Recommended next task: Confirm the real finished-site launch date if it differs from the existing historical launch record; correct it only through a separately approved data-correction path.
Questions requiring Tulio: Before any new Production data entry, confirm the actual billing date and the amount/date/method of each received payment.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: Production release is recorded in repository documentation; no new user-memory request was made.
Git diff summary: [PR #69](https://github.com/tulio-salvatierra/cws/pull/69) merged as `b584eb7`. Production migration `20261105165800_agreement_billing_start_date` and deployment `dpl_FqYYue8FCEQbsntSjAEuMiEXs111` are verified. A source-only follow-up aligns the committed migration filename with the exact remote version. No Square action, customer-data entry, invoice, or payment schedule was created during release verification.
