Task ID: CWS-LAYA-DECISION-RULES-V1-20261101
Agent: Codex
Objective: Implement the requested deterministic rules in the existing CWS OS CEO Today dashboard; owner clarified that the separate Apps Script dashboard is not the target.
Files inspected: Repository instructions, product definition, technical conventions, decisions/learnings/log/ledger/handoff; CEO API, priority projection and evaluators, response tokens/history, dashboard components/tests, migrations/types. Earlier read-only inspection also identified the separate Apps Script source and Sheets.
Files changed: Exact task-owned list in docs/verification/laya-decision-rules-v1.md. Includes existing API/dashboard/projection integration; new next-move helpers, signed choice storage and controls; focused tests; one migration, types, disposable SQL test and documentation.
Database or API changes: Existing POST accepts next_move_choice. Adds laya_move_choices append-only owner-readable/server-insert table. Migration 20261101181750 applied to production after explicit owner approval.
Security decisions: Active ownership; owner/workspace-bound signed 15-minute card review; retry identity; immutable events; unknown data stays unknown. No provider/client/department mutation. GET is read-only. New controls unavailable on incomplete/failed history.
Decisions made: Follow explicit owner request for Top 3 and primary lane/date/oldest order. Preserve lower Accounting/Compliance tiers and existing department queues. Not yet keeps a recommendation available; latest closing outcome supersedes prior pending outcome. Close affects recommendation only, not business-source records.
Assumptions: Two days means two Chicago calendar dates. Acceptance counts recorded Do/Drop clicks. Existing Act/Dismiss records are not reinterpreted as new event types. Only-open-task claims require a complete verified count absent from current projections; that template falls back.
Tests added: Pure rules/templates/scope/review/deferral tests; signed choice persistence tests; UI-to-save integration and CEO route owner/read-only tests; standalone disposable PostgreSQL access/immutability test.
Tests run: Baseline 798/79 passed. Isolated release 822 tests/82 files passed; company-context excluded. Lint, production bundling with local placeholder client settings, import-case check and git diff --check passed. PostgreSQL owner/member/anonymous/cross-workspace/browser-write/append-only checks passed. Actual CEO components exercised in a browser using synthetic local data: accept, Later/backfill, More, close prompt, Not yet and review counts.
Known issues: Application deployment and live verification pending. All-history read fails explicitly at 1,000 events; pagination is needed at larger volumes. Build has pre-existing chunk warnings. Types are additive handwritten schema representation, not regenerated from production. Owner explicitly authorized this release.
Recommended next task: Deploy isolated release and verify authenticated production.
Questions requiring Tulio: None to review local implementation. Release approved.
Project-memory files updated: Verification report, product-definition pending addendum, task ledger, project log, task-specific handoff and pointer in latest-codex.
Permanent decisions added: None; no production behavior claimed.
Reusable learnings added: None.
Memory updates withheld: Company-context work excluded from release; original shared checkout preserved.
Git diff summary: Shared checkout also contains company-world-model module/migration/tests and shared API/types/docs edits from another task. Those were preserved and excluded from this task's ownership. Production schema applied; code release pending; no client contact.
