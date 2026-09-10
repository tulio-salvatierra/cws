Task ID: CWS-MARKETING-M6
Agent: Codex
Objective: Add owner-controlled handling for weekly Marketing slots whose local scheduled day passed without a successful publication, without altering frozen M5 publishing behavior or creating external activity.
Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `src/marketing/weeklySlots.js`
- `src/pages/admin/MarketingPage.jsx`
- `api/marketing-linkedin.js`
- Existing Marketing migrations and tests
Files changed:
- `src/marketing/weeklySlots.js`
- `src/marketing/__tests__/weeklySlots.test.js`
- `src/pages/admin/MarketingPage.jsx`
- `src/pages/admin/__tests__/MarketingPage.test.jsx`
- `api/marketing-linkedin.js`
- `api/__tests__/marketing-linkedin.test.js`
- `supabase/migrations/20260909034637_marketing_missed_slot_resolutions.sql`
- `supabase/tests/marketing_missed_slot_resolutions_test.sql`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`
- `docs/learnings.md`
Database or API changes:
- Applied Production migration `20260909034637_marketing_missed_slot_resolutions`; it has RLS, no browser grants/policies, and only `SELECT, INSERT` for `service_role`.
- GET returns a narrow read-only missed-slot signal and decision history. It continues to reconcile only non-terminal pre-existing publish attempts.
- POST `move` and `skip` are owner-authenticated internal decisions that bypass provider verification and create no provider request. Publish now stays on the pre-existing M5 exact-slot signed-capability publishing path.
Security decisions:
- DEC-029 approved: derive missed state from calendar/outcomes and persist only explicit immutable owner decisions.
- Move/Skip require the same owner/slot/asset signed capability and are restricted to the oldest unresolved missed occurrence. A unique target-slot index prevents two moves occupying a target.
Decisions made:
- M6 takes effect from the current Marketing calendar and does not retroactively classify frozen M0–M5 history as missed.
Assumptions:
- Existing `America/Chicago` calendar behavior is the CWS business timezone.
Tests added:
- Date-boundary, reload, oldest-first, move/skip preservation, rotation, historical-record, UI, exact-slot authorization, and no-provider-mutation M6 coverage.
- SQL security/constraint coverage for the new immutable resolution table.
Tests run:
- `npm run test:run` — 155 tests passed.
- `npm run lint` — zero errors; existing unrelated `src/Hooks/useDrafts.js` warning remains.
- `npm run build` — passed, including import-casing validation.
Known issues:
- None for M6. Existing lint warning and Vite bundle-size warnings are unrelated to this scope.
Recommended next task:
- None. M6 is complete and frozen; any new Marketing capability requires a separate scoped task.
Questions requiring Tulio:
- None.
Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`
- `docs/learnings.md`
Permanent decisions added:
- DEC-029 — Marketing missed occurrences are calendar-derived and owner-resolved.
Reusable learnings added:
- Derive time-based state; persist only the owner decision.
Memory updates withheld:
- None.
Git diff summary:
- M6 adds isolated Marketing missed-slot calculation, immutable resolution storage, owner-facing decision controls, focused tests, and the documentation above. Pre-existing M5 implementation, asset, migration, test, and documentation changes remain in the working tree and were preserved.
