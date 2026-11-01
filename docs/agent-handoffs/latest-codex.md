Task ID: CWS-LAYA-MARKETING-WHY-20261101
Agent: Codex
Objective: Correct the live Marketing why line using actual schedule and publishing records.
Files inspected: Existing instructions and release handoff; CEO projection; priority evaluator; next-move templates; weekly schedule; production attempt/resolution records and authenticated dashboard.
Files changed: server/laya/priority-review.js, server/laya/next-move.js, server/laya/__tests__/next-move.test.js, project log, ledger and this handoff.
Database or API changes: Add derived marketing_occurrence evidence to existing priority evaluation only for an established missed slot with complete same-workspace reads. No schema or business writes.
Security decisions: Unknown/incomplete reads cannot prove absence. Require exact slot/date/workspace match. Retain full signed source evidence and policy provenance. Do not claim publication outside CWS.
Decisions made: Correct an explanation defect without changing ranking, actions, schedule, company context or provider state.
Assumptions: Existing weekly policy remains authoritative for scheduled occurrences; CWS register absence is not external provider absence.
Tests added: Six regressions covering correct slot, unrelated source rows, capped/failed reads, attempts/resolutions and mismatches.
Tests run: 846 tests/84 files (after preserving the separate company-context release), lint, production build/import check, diff check pass. Production records inspected read-only.
Known issues: Existing history cap and legacy oversized evaluation restriction unchanged. Deployed code 8b152da; dpl_HtnKqG6S5WxMyNVwizjt6wP5wHb9 READY. Authenticated live card and source disclosure verified; browser/runtime error scans empty.
Recommended next task: No further work for this correction.
Questions requiring Tulio: None; this corrects the previously authorized release.
Project-memory files updated: This handoff, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No company-context changes included.
Git diff summary: Two implementation files, one test file, three documentation files; clean starting checkout at 4e146aa.
