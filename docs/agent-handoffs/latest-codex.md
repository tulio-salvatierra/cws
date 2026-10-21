Task ID: RETIRE-002
Agent: Codex
Objective: Grandfather existing advisory Marketing assessment; export-first retirement of dormant v1 tables.
Files inspected: Canonical scope, conventions, decisions, current main and role instructions; supplied SQL/audit; archive/manifest; current migrations and tests; production schema.
Files changed: Archive committed locally in 2727276; guarded migration and pgTAP corrections committed locally; current main merged preserving newer compliance/email work. §6/§9a, DEC-039, ledger, log, verification record, this handoff updated.
Database or API changes: No production retirement migration or table drop. pgTAP fixtures/extension changes fully rolled back. All 20 tables intact after interrupted rehearsal.
Security decisions: No public archive push after automatic approval rejection; waiting for explicit destination approval. No credentials, live Auth rows, client-linked project, email, or phone found in archive review. No publishing or sending.
Decisions made: Owner authorized existing Marketing advisory assessment exception, recorded as DEC-039; no expansion/new AI capabilities.
Assumptions: Preserve newer main and both additional compliance/email migrations.
Tests added: None; corrected unsupported pgTAP assertion and reversed privilege argument order.
Tests run: 46 pgTAP assertions pass; 430 Vitest tests in 57 files pass; ESLint and diff checks pass. Fresh archive restore matches 20 tables/87 rows; SHA-256 and production row hashes match. Production build and both landing-page prerenders passed.
Known issues: Automatic review rejected pushing internal archive records to public repository. Private backup destination or explicit public publication approval is pending. Direct IPv6 database access timed out; session pooler rejected CLI temporary login; Docker test runner unavailable. Verified export uses exact typed MCP snapshot and local native pg_dump; method disclosed in archive manifest/README.
Recommended next task: Resolve archive destination, then apply guarded retirement; match exact remote migration version/content; regenerate types; verify live counts, retained objects, advisors and all six surfaces without publishing.
Questions requiring Tulio: Approve exact public archive publication or specify private backup destination.
Project-memory files updated: Product definition, decisions, ledger, log, RETIRE-001 final checks, RETIRE-002 verification and this handoff.
Permanent decisions added: DEC-039 from direct owner instruction.
Reusable learnings added: None.
Memory updates withheld: No claim of applied retirement, merge, or post-drop verification.
Git diff summary: Isolated retirement branch; original user checkout untouched. Archive and preparatory commits remain local; rejected push did not run.
