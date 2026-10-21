Task ID: LIFECYCLE-001
Agent: Codex
Objective: Negocio Listo lifecycle items in CEO Today and owner-entered whole project hours, preserving decision activation and external-action boundaries.
Files inspected: Canonical product, role guidance, conventions/decisions/learnings/handoff/ledger/log, historical supplied ticket for context, current CEO/Sales intake/Operations/Accounting schema/code/tests, production schema/counts, Supabase/Vercel skills.
Files changed: Lifecycle projection/fixtures; CEO read/order/UI/tests; Operations read/link route/readmodel/UI/tests; ProjectTime component/tests; migration20261021182855, pgTAP/types; product/conventions/DEC038 implementation note, verification/ledger/log/handoff.
Database or API changes: Explicit same-client/workspace project-agreement FK. Owner-JWT integer project_time_entries; server SELECT only. Non-exposed owner-checked sync trigger maintains guarded actual_hours cache for financial views, with per-project locking. Existing decimal-total route rejects; owner agreement link uses existing Operations route. Existing CEO read derives lifecycle without writes. 69/69 exact migration parity/SQL equality.
Security decisions: No service/AI time insertion, inferred hours, fuzzy name linkage, signature/provider-state inference, LLM/external calls or decision activation. Identity/provenance protected; owner corrections/removal recalculate cache. Migration guards all prior NULL-hours precondition; no backfill. Existing owner activation guards untouched and retested.
Decisions made: Implement approved DEC038 and current lifecycle scope. No additional permanent decision; recorded implementation under DEC038.
Assumptions: Lifecycle uses actual intake source/product snapshot prefixes and explicit agreement links; a recorded agreement is not a signed contract. No NL agreement currently exists; one existing NL inquiry should appear. Remaining Laya evaluators/goal pace are separately scoped. Work dates/notes are owner-entered; positive whole entries only, no fractional rounding.
Tests added: 15 lifecycle scenarios/ordering checks, eight time UI cases, owner link and legacy-total API checks, optional lifecycle-read failure; 19 pgTAP assertions.
Tests run: 509 app tests/63 files, lint/build/prerenders; 19 new DB assertions rehearsal/after apply plus18 activation after apply, rolled back; 69/69 exact parity; advisors unchanged. CI/live verification pending.
Known issues: Existing build/advisor warnings. No signed_at source exists, so no signed-count claim. Private cache trigger is SECURITY DEFINER only to update the derived financial field; no direct execution grants and repeated authenticated owner check. Existing project actual_hours API now fails with guidance to the ledger.
Recommended next task: Owner records actual hours and links a real NL agreement/project when available; separately scope goal pace/remaining evaluators.
Questions requiring Tulio: None.
Project-memory files updated: Product, conventions, DEC038 implementation note, ledger/log, verification, handoff.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No invented signature, client conversion, historical hours, subscription/provider activity or strategy activation.
Git diff summary: Isolated codex/lifecycle-001; original checkout and private archive untouched. No production-record contents/secrets in branch. Release pending.
