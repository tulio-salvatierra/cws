# LIFECYCLE-001 verification — 2026-10-21

## Delivered behavior

- Pure Negocio Listo lifecycle projection in the existing CEO Today read, from workspace-scoped intake leads, agreement snapshots, linked installment/obligation/payment rows, and explicitly linked Operations projects/readiness.
- Intake uses the actual `negocio-listo|…` tag. Agreement inclusion uses the recorded product snapshot prefix, not customer-name/price matching. Agreement records do not prove signatures. No signed-customer count, goal pace, provider status, LLM evaluator or automatic lifecycle mutation is invented.
- Stages include prospect, setup payment pending, overdue payment, missing data/link, delivery/client/CWS waiting, paused, launch record pending, recorded launch, term completed and installment due. Future receipts do not count as received; void/missing bills require data review. Date comparisons use Chicago time and the existing launch-term calendar.
- CEO Today preserves urgent → Sales/GET MONEY → Marketing → delivery tiers and frozen Sales order. Intake enriches its existing Sales card; matching delivery/payment cards are deduplicated. A lifecycle panel keeps all stages visible beyond the top-five action limit and exposes source evidence. Lifecycle read failure does not remove other priorities.
- Operations owners explicitly link same-client/workspace agreements. Foreign keys reject wrong-client/cross-workspace links; no existing link was guessed or backfilled.
- Owner-entered whole-hour entries (work date, notes), guarded by owner-JWT RLS/triggers. Service/agent can read only. Fractional JSON, zero/negative/future entries and mutable identity are rejected. Entry IDs persist across failed retries; duplicates require reload. Explicit correction/removal recalculates the total. No timer or estimated time.
- Existing financial view/rate uses `operations_projects.actual_hours`, now a derived cache synchronized only through the private owner-checked trigger. Direct decimal/total updates are blocked. Locks serialize per-project time changes. All four production projects previously had NULL hours; the migration aborts if that precondition changes. No historical value was invented or rounded.

## Validation

- Migration `20261021182855_negocio_listo_lifecycle_hours.sql` applied atomically with exact history via the proven CLI Management API. 69/69 version parity; stored SQL matches file byte-for-byte. Generated types refreshed.
- 19 new pgTAP assertions pass in rollback rehearsal and after apply, covering grants/owner/member/service access, source FK consistency, integer JSON, dates, identity, cache/financial-view synchronization, correction/removal. Existing 18 owner-only decision-activation assertions pass after apply. All synthetic rows and writes rolled back.
- 509 Vitest tests in 63 files pass, including 15 lifecycle scenarios/ordering cases, eight owner-entry UI cases, owner link/legacy-total API cases and lifecycle-read degradation. Lint, import casing, production build and landing prerenders pass. GitHub Actions Tests run39654874692 and Vercel preview passed.
- Security advisors unchanged (existing seven server-only RLS/no-policy information items, public create_workspace warning and password-protection warning). No new exposed SECURITY DEFINER function.
- Production baseline: projects4, hours unset4, actual time rows0, NL inquiries1, NL agreements0, active decisions0, posts43/sends17. Decision hash remains `9ef3704692d721930dbd7d70cc0e1aad`.
- PR #35 merged at `9b45ac5d70f9e65a69acf0cf5f67dc6eb9b9ca2f`; production `dpl_3qDmUaeDhuCceRUkdF3tkMLvJZfk` is READY from that SHA on verified www/root aliases.
- Signed-in CEO Today shows the existing NL inquiry as prospect, enriches its existing Sales card, and exposes the lifecycle date/source disclosure. Source evidence expansion works. No duplicate Sales action was introduced.
- Existing Operations project detail loads owner Whole hours, Work date (Chicago today), Time notes and Record hours controls, plus an explicit same-client agreement selector. No hours are prefilled; existing financial rate displays Add hours and the old decimal-total control is absent. No input was saved or agreement linked.
- Final production: projects4, time rows0, entered totals0, agreement links0, active decisions0, unchanged full decision hash, posts43/sends17, migrations69. Individual CEO Today and Operations runtime-error scans for the final15-minute window found no errors.
- No LLM, social publish, email send, real time entry, agreement link, launch/payment record or decision activation performed. Persistence/synchronization was tested with rolled-back SQL fixtures; live browser verification was read-only.
