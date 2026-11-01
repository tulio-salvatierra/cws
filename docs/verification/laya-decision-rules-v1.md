# Laya Decision Rules V1 — CWS OS release

Date: 2026-11-01
Base: `f271fa3` (fresh checkout of `tulio-salvatierra/cws`).
Status: released to production and verified. Code 5e2eac27c8d06a9ab4421e68ac45d54103186344; Vercel dpl_A9HhyKC9QKqcPNAne3yV4MoLtwVE READY on www.cicerowebstudio.xyz; migration 20261101181750 applied.

## Target and preserved behavior

The owner clarified that this change targets **CWS OS /admin (CEO Today)**, not the separate Apps Script Next Move dashboard. The current CWS OS baseline had five priorities, Act/Dismiss evaluation history and session-only Not now. The requested three-card layout, two-day deferral and closing outcomes are therefore additions to this existing surface.

Existing department source records, project cards/readiness, lifecycle, goal pace, deal fit, business decisions, Marketing confirmation flows and existing evaluation history remain. No new dashboard, scheduler, messaging integration or AI call is introduced. Apps Script code, its Sheets and check-ins are untouched.

## Behavior

- Existing priority projection now shows three cards. The four primary lanes keep Urgent → GET MONEY → Marketing → DELIVER, then available due/eligibility date, oldest source timestamp and stable ID. Existing lower Accounting/Compliance tiers and their internal ordering remain. The Sales department's own queue is unchanged.
- Up to four classifications: actual due urgent deadline, actual due money follow-up, scheduled Marketing action, recorded delivery blocker. A generated Sales eligibility date alone is not described as a task deadline. Unsupported or incomplete records remain unclassified rather than invented.
- Five evidence templates are implemented with required-field checks. Unknown fields fall back to another usable template or explicit missing evidence. The “only open task” template requires a verified complete count; current CWS OS projections do not supply that count, so it is not inferred. Source fields are under More. Stored notes are not parsed into facts.
- Do it now records owner intent; Later hides until the Chicago calendar date two days later, across daylight-saving boundaries. More contains Hand to Claude (copyable draft only), Close task and Drop. Close asks Yes/No/Not yet/Skip. These actions affect recommendations, never invoice, project, provider or client state. Not yet keeps the card available so the owner can later record an outcome. Changed source evidence reopens a closed/dropped recommendation; Later remains until its date.
- Owner-recorded agreement reference, requested addition/revision, revision allowance/use and optional estimated hours/fee support the scope check. New scope or exhausted revisions flag likely scope change. The recorded fee/effort check protects $50/hour without suggesting a quote or making commitments. Changed card evidence requires scope re-review.
- Last 30 days groups recorded clicks by type and rule version. Acceptance is Do / (Do + Drop), unavailable when the denominator is empty. Later is separate. Latest closing outcome per card/rule supersedes earlier Not yet; Skip is excluded from outcome judgment. No automatic rule changes. Existing Act/Dismiss history is retained and not silently reclassified.

## Data and safety

The existing CEO endpoint handles `next_move_choice`. Active owner verification precedes signed-token validation; tokens bind exact card/evidence, owner, workspace, expiration and unique review ID. Identical retries return the saved result; conflicting reuse is rejected. GET does not write.

`laya_move_choices` is an append-only, owner-readable table with server-only inserts, active-owner trigger checks, outcome/deferral constraints and workspace RLS. The migration is applied to production as 20261101181750. Failed or 1,000-row-capped history reads report unavailable and retain the existing read-only card controls rather than fabricate totals. A larger historical volume will require pagination before the new controls can remain available beyond that cap.

## Changed files for this task

- `api/ceo-today.js`, `api/__tests__/ceo-today.test.js`
- `server/ceo/today.js`, `server/ceo/__tests__/today.test.js`
- `server/laya/next-move.js`, `server/laya/move-responses.js`
- `server/laya/__tests__/next-move.test.js`, `server/laya/__tests__/move-responses.test.js`
- `src/pages/admin/AdminOverview.jsx`, `src/pages/admin/NextMoveControls.jsx`
- `src/pages/admin/__tests__/NextMoveControls.test.jsx`
- `src/types/supabase.ts` (only the `laya_move_choices` entry belongs to this task)
- `supabase/migrations/20261101181750_laya_move_choices.sql`
- `scripts/test-laya-moves.sql`
- This verification report, product-definition addendum, task ledger, project log and Codex handoff.

Concurrent company-world-model changes appeared in the shared checkout during this task. They were preserved; their modules, migration and tests are not this task's implementation. The isolated release excludes all company-context modules, migrations, API branches and types.

## Validation

- Unchanged baseline: 798 tests / 79 files passed.
- Isolated release tree: 823 tests / 82 files passed; company-context code and tests excluded.
- Focused fixtures cover all templates and fallback, actual versus generated dates, four types, revision limits, exact floor, time window, acceptance denominator, pending/skipped outcomes, Chicago DST, top-three backfill, owner/workspace/expiry binding, tampering, invalid input, duplicate/conflicting retries and unavailable history.
- React → signed save-path tests cover intent, deferral, outcome prompt/cancel, Not yet, handoff and failed saves. API tests verify ownership and mutation-free GET.
- Disposable PostgreSQL 17: migration applied locally; owner read/service insert allowed; member/anonymous access, browser insert, update/delete, and close without outcome rejected. `scripts/test-laya-moves.sql` is for an empty disposable database only, not production.
- Lint and production build passed. Build uses local placeholder Supabase values, so it verifies bundling, not production connectivity. Existing large-chunk warnings remain.
- Real browser with actual CEO Today components and a synthetic local adapter: concise three-card view, acceptance, Later removal/backfill, More, outcome prompt, Not yet remaining visible and separate review counts verified. This is local UI validation, not live Supabase/Vercel end-to-end verification.

## Release authorization and verification

Owner explicitly authorized deployment, migration and live verification on 2026-11-01, with company-context work separate. Release commits 856c5dc and 5e2eac2 contain only Decision Rules changes. Migration 20261101181750 applied successfully. Production RLS enabled, authenticated SELECT only, service-role SELECT/INSERT only. Rolled-back production transaction verified service insertion, owner reads, nonowner isolation, denied browser inserts and update/delete, and rejection of a close without outcome; no QA rows retained.

Live authenticated CEO Today GET returned 200 with three cards and available review data. Live verification initially found duplicated source evidence exceeded the Marketing signed-review limit. Fixed with a SHA-256 source-version fingerprint while retaining the complete signed evaluation; regression test covers large evidence and changed source binding. All three move tokens and controls now available. Existing legacy Marketing Act/Dismiss remains subject to its pre-existing oversized-evidence limit; new choice controls are independent.

Verified More, Close task prompt (Yes/No/Not yet/Skip), cancel, scope fields and $50/hour explanation. One real Marketing handoff was generated through the UI: POST 200, refreshed GET 200, copyable draft and saved notice visible, database contains exactly one handoff with null outcome. This retained verification event does not count as accepted, dropped, deferred, Yes or No. The 30-day review returns zero decision/outcome counts and null acceptance, not an invented rate. No acceptance/outcome/scope answers or deferrals were fabricated in production; those branches were covered by automated UI/API tests and the database checks rather than persisted live choices. No message was sent to Claude or clients.

Existing evaluation count remains 3; Marketing publish-attempt count remains 18 and published-post count remains 51 across the handoff check. Browser error log empty; released deployment error/fatal scan returned no logs. The existing project lifecycle card and department links remain visible. Daily Apps Script check-in is outside this clarified CWS OS release and was not changed.

All 82 migration versions in this isolated release exist remotely. During verification, separate work applied company-world-model version 20261101182102 (remote total 83). That migration and its application code were not applied, copied, committed or deployed by this task; no rollback or modification was attempted. This is an explicit concurrent-work difference, not full-tree parity.
