# Latest Codex Handoff

Task ID: CWS-PILOT-READINESS-004
Agent: Codex
Objective: Make the first CWS-001 cycle auditable and human-runnable by adding render smoke coverage and documenting the exact UI/schema gaps. No pilot data, feature fixes, or migrations were added.

## Files inspected

- `docs/product-definition.md`
- `docs/decisions.md`
- `docs/technical-conventions.md`
- `docs/agent-handoffs/latest-codex.md`
- All relocated `src/pages/admin/*` workspace pages
- Campaign, content-variant, approval, task, and knowledge migrations
- Current staging rows and CWS-001 records

## Files changed

- `src/pages/admin/__tests__/WorkspacePagesSmoke.test.jsx`
- `docs/pilot-readiness.md`
- `docs/learnings.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/agent-handoffs/latest-codex.md`

## Database or API changes

None. Staging was queried read-only. No rows were inserted or updated, and no
migration was created. The existing private-schema RLS helper correction and
admin/channels deployment were not changed.

## Phase 1 — smoke tests

Added 11 render smoke assertions, one for each relocated workspace page:
Workspace, Campaigns, Campaign detail, New campaign, New variant, Variant
detail, Tasks, Planning, New goal, Knowledge, and Agent runs. Supabase is
mocked; each assertion checks only the page’s primary heading. Committed as:

- `cbc9186` — `test: add workspace page render smoke coverage`

## Phase 2 — readiness audit

Added `docs/pilot-readiness.md` with WORKS/PARTIAL/MISSING findings and exact
file/line evidence for 14 cycle steps. The current staging state is:

- 1 workspace, 1 member, 2 channels, 2 campaigns, 3 variants
- 1 task and 1 unrelated approval; no approval is attached to CWS-001
- 4 goals, 2 initiatives, 1 project
- 0 decisions, 0 learnings, 0 agent runs
- CWS-001 is `editing`
- EN and ES variants are both `recorded` with no transcript, caption text,
  editing notes, or export reference

The UI can create campaigns and variants, request/review a pending approval,
create a campaign-linked task, and complete that task. It cannot drive campaign
or variant status transitions, edit variant lifecycle fields, resolve a
revision-requested approval, write decisions or learnings, or record an
outcome. The schema has no outcome or `published_at` field; this was reported
as expected and not changed.

## Tests run

- `npm ci` — passed.
- `npx vitest run` — 16 files, 57 tests passed.
- `npm run check:imports` — passed through the build.
- Production Vite build with staging URL and a non-secret placeholder key — passed.
- `npm run lint` — passed with the existing one-line `useDrafts` dependency
  warning; no errors.

## Decisions and security

- No new decision was added. DEC-013 and above were not extended by this task.
- No schema, RLS, publishing, OAuth, Final Cut, AI, or channel mutation work
  was performed.

## Recommended next task

Prioritize the smallest workflow set needed for a real pilot run:

1. Variant editor and lifecycle status controls.
2. Approval revision resolution loop.
3. Decision and learning capture forms.
4. A separately approved future migration for export filename/version,
   outcome, and `published_at` fields.

## Questions requiring Tulio

- Should variant editing/status controls come before decision/learning forms?
- Should revision resolution create a new approval record or use another
  approved lifecycle model?
- What outcome should be recorded after export once the future schema is
  approved?

## Project-memory files updated

- `docs/pilot-readiness.md`
- `docs/learnings.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/agent-handoffs/latest-codex.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Added the verified learning that schema status enums and fields do not
  guarantee UI lifecycle coverage.

## Memory updates withheld

- No decisions about editor design, approval-record modeling, outcome fields,
  migrations, or future automation were recorded.

## Git diff summary

- Phase 1 is committed locally as `cbc9186`.
- Phase 2 audit and memory updates are ready for a separate local commit.
- No push was performed.
