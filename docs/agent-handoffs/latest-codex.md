# Latest Codex Handoff

Task ID: CWS-PILOT-READINESS-004
Agent: Codex
Objective: Make the first CWS-001 cycle auditable and human-runnable, then close the smallest high-value UI gap identified by the readiness audit.

## Work completed

The baseline audit and render smoke coverage remain documented in
`docs/pilot-readiness.md`. This follow-up adds an independent content-variant
editor to `VariantDetailPage` using the existing schema and RLS policies.

Each variant can now edit and save its own:

- transcript/script
- tone
- editing notes
- caption text
- existing export reference
- lifecycle status (`draft` through `archived`)

The update is scoped by both `id` and `workspace_id`, so changing one language
variant does not change its campaign or sibling variants. Approval state remains
separate from content lifecycle state, and no publishing or outcome behavior was
added.

## Files changed in this follow-up

- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `docs/pilot-readiness.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/agent-handoffs/latest-codex.md`

## Database or API changes

None. The editor uses the already-approved `content_variants` columns and
existing workspace-member update policy. No migration, seed, publishing
integration, outcome field, or RLS change was made.

## Validation

- `npm run test:run` — 17 files, 58 tests passed.
- `npm run check:imports` — passed.
- Production Vite build with the staging URL and a non-secret placeholder key — passed.
- `npm run lint` — passed with the existing `useDrafts` dependency warning; no errors.
- `git diff --check` — passed.

## Remaining pilot gaps

1. Campaign status control is still read-only in the UI.
2. Revision resolution still needs a new pending approval workflow while
   preserving completed-approval immutability.
3. Decision and learning capture forms are still missing.
4. Export filename/version, outcome, and `published_at` require a separately
   approved future schema migration.

## Next recommended task

Implement the approval revision-resolution loop: after a revision is requested,
allow a member to create a new pending approval for the same variant and review
that new record without mutating the completed approval history.

## Decisions and learnings

- No new permanent decision was added.
- No new learning was added; the existing verified learning that schema status
  enums do not guarantee UI lifecycle coverage remains applicable.
- No migration, commit, or push was performed for this follow-up.

## Git state

The branch remains `main`, two commits ahead of `origin/main` from the prior
smoke-test and audit work. The variant editor, focused test, and documentation
updates are local and uncommitted; no push was performed.
