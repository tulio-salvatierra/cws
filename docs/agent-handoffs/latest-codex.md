Task ID: RETIRE-001
Agent: Codex
Objective: Remove dormant v1 application dependencies without changing production tables.
Files inspected: Supplied retirement ticket/audit/SQL; canonical product definition; conventions, decisions, learnings, ledger, project log, relevant handoffs; admin routes/pages; APIs; Laya helpers/transport; local service; Vite/Vercel config; database and application tests.
Files changed: Dormant UI/endpoints/tests removed; live assessment queries use retained channels; publication webhook drops obsolete relation fields; Vite/Vercel routes cleaned; back links fixed; mixed pgTAP test retains live publication/decision checks; product scope, ledger, project log, verification record, this handoff updated.
Database or API changes: No migration or database change. Removed generate-draft and review-generated-draft APIs. Existing assessment response shape retained; context IDs now identify workspace channels and new snapshots cite channels. History/review receipts are unchanged.
Security decisions: Exact-resource owner confirmation unchanged; no posts, emails, or provider actions. Original homepage changes untouched in the primary checkout. No secrets committed.
Decisions made: Follow DOCS-V3 (#28), with RETIRE-001 as a separate stacked PR. Keep existing Laya wire field for service compatibility; it is not a database reference.
Assumptions: This is code retirement only, not DECISIONS-001 or LAYA-001. Missing channel guidance remains unspecified; it is not translated or invented.
Tests added: Retired relationship fields cannot become publication columns; pasted-draft API uses workspace channel context; assessment GET only loads channel context/history. Updated snapshot and UI tests.
Tests run: Full Vitest 406 tests in 53 files passed. ESLint passed. Import casing, test-mode Vite build, production build with existing public client configuration, and git diff --check passed. Production build has existing chunk-size/lottie warnings. Database tests were edited but not executed.
Production verification: #28 merged, #29 retargeted/merged; 23b5aea deployed READY with custom domains. All six authenticated surfaces and Marketing overview/LinkedIn previews loaded. Four destinations verified; both current slots already Posted/locked. No publishing, sending, record edits, SQL, or table drops. Found and corrected a residual Sales Workspace backlink.
Known issues: Sales backlink correction prepared for release. Literal protocol field channel_brief remains in transport/local service/tests; zero retired database queries remain. The app still uses pre-existing advisory behavior; v3 evaluator implementation is separately scoped.
Recommended next task: Release the small Sales backlink correction and retain the production verification record. Do not execute RETIRE-002.
Questions requiring Tulio: None for these two PRs; production table retirement is explicitly deferred by the user.
Project-memory files updated: Product definition, task ledger, project log, this handoff; docs/verification/retire-001.md records audit and release checks.
Permanent decisions added: None in this code PR.
Reusable learnings added: None.
Memory updates withheld: No export, SQL execution, or table drops.
Git diff summary: Separate code PR based on docs PR; approximately 4,000 lines of dormant code/tests removed. No migration files changed.
