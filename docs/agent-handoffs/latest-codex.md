Task ID: TEST-LEADS-001
Agent: Codex
Objective: Explicit owner-controlled test lead exclusion from Sales/CEO/Laya without deleting history.
Files inspected: Canonical product, role/conventions/memory, Sales queue/API/UI, CEO loader, lifecycle/deal evaluators, lead RLS/schema, owner evidence patterns; Supabase skill/docs.
Files changed: Owner flag migration/types; Sales/CEO read fields; queue/lifecycle/deal lead filtering; owner Sales TestLeadControls; UI/API/pure/DB tests; product and memory. Prior local acceptance report/memory included as verified background.
Database or API changes: leads.is_test default false + last classification reason/actor/time; private invoker trigger requires active owner JWT, derives provenance, blocks flagged insert and metadata-only rewrites. Exact migration20261022163524,77/77 parity, SQL MD5 48a71b096235a5c6e44f29b75fb36e65. Existing routes only.
Security decisions: Browser owner JWT writes with workspace/id/current-flag predicates; nonowner controls hidden and DB enforces. Service role denied even with spoofed owner sub. No new grants, RLS changes or activation path. No name-based inference.
Decisions made: Requested lead exclusion; agreement identity/finances unaffected. This is priority/advice exclusion, not a universal send block.
Assumptions: Preserve existing sends/promises/Laya response snapshots; current classification metadata reflects last transition. No historical business data edited by migration. Existing leads all remain live pending explicit classification.
Tests added: Queue classifications/promises/progress/immutability; lifecycle/CEO/deal filtering and restoration; API owner/member controls and historical responses; UI reason/owner gate/scoping/stale-write;14 DB ownership/provenance/restore assertions.
Tests run:716 tests/75 files,lint/build pass.14 rehearsal+14 postapply pgTAP and18 separate activation assertions passed, all synthetic fixtures rolled back. Security advisories unchanged.
Known issues: Separate audit's universal Laya coverage and missing real NL evidence remain; unrelated.
Recommended next task: Verify live owner controls/mark known QA record and exclusion paths without external actions; then owner reconciles real agreement evidence.
Questions requiring Tulio: None for implementation.
Project-memory files updated: Product,ledger,log,handoff; previous acceptance report retained.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No inferred business identity, activation or new strategy.
Git diff summary: Isolated codex/test-lead-exclusion; original dirty memory files/private backups untouched. Release pending.
