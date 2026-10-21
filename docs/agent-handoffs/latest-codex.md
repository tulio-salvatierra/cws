Task ID: RETIRE-002
Agent: Codex
Objective: Complete owner-authorized retirement with a private verified archive and existing Marketing-assessment exception.
Files inspected: Canonical product scope, AGENTS and role guidance, conventions/decisions/learnings, supplied SQL/audit, newer main and compliance/email migrations, private archive/manifest, current schema/history, live department pages.
Files changed: Guarded migration renamed to 20261021155615; regenerated src/types/supabase.ts; corrected three pgTAP files; product §6/§9a, DEC-039, AGENTS, conventions, ledger/log/verification, this handoff; gitignore prevents accidental archive inclusion. Retained prior RETIRE-001 final verification updates.
Database or API changes: Applied retire_v1_dormant_layer on production ddbhxqkckzpwzwvnoxqt. Dropped exactly 20 dormant tables, topic_performance and 15 dedicated functions; detached four live-parent FKs. Kept live columns (all NULL), agent_runs, channels, decisions, update_updated_at(), and newer compliance/email objects. No application endpoint change in this ticket.
Security decisions: Exact data archive kept only in owner-approved Documents/CWS-backups, outside GitHub. A clean branch excludes the rejected archive-bearing history. Directory/file modes 0700/0600. No publish, send, owner-review action, credential exposure or Auth/permission change.
Decisions made: Existing Marketing advisory assessment grandfathered under §9a/DEC-039; new in-app AI features remain gated. Private backup destination overrides the original public archive instruction.
Assumptions: Preserve current main and both newer compliance/email migrations. Export filenames retain the original 2026-10-17 ticket identifier; capture timestamp is disclosed in the private manifest.
Tests added: None. Corrected unsupported pgTAP policy assertion and reversed privilege arguments; no runtime grants changed.
Tests run: Fresh private-folder restore and checksum; all 20 production row hashes/counts match (87 rows). 46 pgTAP assertions before/after drop with fixture/extension rollback. 430 Vitest tests in 57 files, ESLint, production build, both landing prerenders, diff checks. 66/66 migration versions match; remote history SQL equals the local migration byte-for-byte. Advisors unchanged. All six authenticated production surfaces plus Marketing overview/LinkedIn image-caption previews load.
Known issues: Existing build chunk/lottie warnings and existing security advisor baseline remain. Export method is exact typed MCP snapshot -> native pg_dump from verified local replica, because direct IPv6 access timed out and pooler rejected CLI credentials; not a full schema backup. Historical migrations and private inspection schema support recovery. No archive content is included in the public branch.
Recommended next task: Separately scope DECISIONS-001; no additional lifecycle or Laya work is authorized by this retirement.
Questions requiring Tulio: None.
Project-memory files updated: Product definition, decisions, technical conventions, AGENTS, ledger, log, RETIRE-001/002 verification and this handoff.
Permanent decisions added: DEC-039 from direct owner instruction.
Reusable learnings added: None.
Memory updates withheld: No inference of a social publish or email delivery test; none was performed.
Git diff summary: Archive-free branch based on current main. Only migration/types/tests/docs/ignore changes; original user checkout untouched. PR records release merge/deployment disposition.
