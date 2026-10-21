Task ID: DEAL-FIT-EVIDENCE
Agent: Codex
Objective: Owner-entered complete labor/cost budgets and dated capacity evidence for verified deal fit.
Files inspected: Product/role/conventions/decisions/learnings/memory; CEO/goal/deal-fit/Accounting/time/schema/tests; Supabase skills/docs, live advisors/schema/safety baseline.
Files changed: Migration20261021201429,26-assertion pgTAP/types; canonical budget snapshot/evaluator/fixtures; CEO reads and UI budget form/tests; product/conventions/memory.
Database or API changes: Owner-JWT append-only negocio_listo_deal_budgets, exact client/workspace agreement FK, private invoker snapshot/guard. Existing CEO GET reads budgets and project costs.72/72 exact migration version parity and SQL equality. App/database snapshot equality verified against live read data.
Security decisions: No agent/service/anonymous/member writes, history edits or deletes. Exact displayed snapshot/day, explicit completeness/source and owner provenance enforced. Budget >= actual hours/costs; physical calendar bound. No decision/response write, LLM, publish/send, acceptance or reservation.
Decisions made: Direct user scope implemented; no permanent architecture decision added.
Assumptions: Budgets are owner forecasts across setup plus every term month; actual ledger remains separate. Capacity window is current/future and covers only those dates; other committed work excludes this deal and includes off-system work. Owner attests completeness. Same-content other-plan rechecks do not create circular invalidation.
Tests added: Verified threshold/exact capacity/do/revise/hold/missing/stale/changed prices/plans/projects/hours/costs; explicit complete UI/zero/fractions/nonowner/failures;26 DB assertions.
Tests run:583 app tests/69 files,lint/build passed including final API failure assertion;26 pgTAP rehearsal+postapply and18 activation checks rolled back,72/72 parity,advisors unchanged. Release pending.
Known issues: Real budget table intentionally empty. Owner first records an agreement and exact project link, then complete budget/capacity. No forecast guarantee or capacity reservation. Existing build/advisor warnings; 1,000-row read caps fail closed.
Recommended next task: Owner records/reconciles real agreement/project budgets and capacity when ready.
Questions requiring Tulio: None.
Project-memory files updated: Product, conventions, ledger/log/handoff.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No production budgets, availability, costs, completeness or decision activation invented.
Git diff summary: Isolated codex/deal-fit-evidence; original checkout's three dirty memory files and private archive untouched. Public code/schema/synthetic fixtures only; release pending.
