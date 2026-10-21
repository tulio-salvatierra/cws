Task ID: GOAL-EVIDENCE
Agent: Codex
Objective: Owner-entered NL signature dates/subscription statuses and completeness for verified goal counts.
Files inspected: Canonical product, role instructions, conventions, decisions/learnings and memory; CEO/Accounting/goal/time code/schema/tests; Supabase skills/docs/changelog and live schema/advisors.
Files changed: Additive migrations20261021192155/20261021192448, pgTAP/generated types; goal projection/fixtures, CEO reads/tests, goal/evidence UI/tests; product/conventions/memory.
Database or API changes: Two append-only owner-JWT evidence tables; exact same-client/workspace agreement FK; private invoker guard/snapshot helpers. CEO GET reads evidence/completeness; no new endpoint. 71/71 exact migration parity and SQL md5 equality.
Security decisions: Authenticated owner writes only, service/anonymous read/write grants restricted, immutable history and owner provenance, DB-generated completeness snapshot/date. No inferred signatures, subscription provider mutations, auto completeness, activation, LLM or external actions.
Decisions made: Implement direct owner request; no permanent architecture decision added.
Assumptions: One core subscription per client; owner explicitly excludes add-ons/replaced agreements. Owner attests all real contracts/subscriptions are recorded; software cannot prove off-system completeness. Current active count requires status verification and completeness on current Chicago date. No on-track forecast baseline inferred.
Tests added: Verified/zero/unknown/changed/stale/workspace/duplicate/excluded/checkpoint fixtures, owner forms/explicit confirmation/failure/no writes/nonowner controls,27 pgTAP assertions.
Tests run: 531 tests/65 files, lint/build.27 evidence assertions rehearsal and after migration,18 owner activation after apply (all rolled back).71/71 version parity and exact new SQL; security advisors unchanged. Release pending.
Known issues: Real evidence/completeness tables intentionally empty; counts unknown until owner records facts and checks full register. No forecast. Read cap1000 fails closed; history retained. Existing advisor/build warnings.
Recommended next task: Owner records/reconciles real NL agreements and evidence, then confirms complete register for today.
Questions requiring Tulio: None.
Project-memory files updated: Product, conventions, ledger/log/handoff.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No production facts or completeness fabricated; no strategy activation.
Git diff summary: Isolated codex/goal-evidence; original three dirty memory files untouched. Public schema/code and synthetic fixtures only; private archive untouched. Release pending.
