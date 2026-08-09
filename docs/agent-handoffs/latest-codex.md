# Latest Codex Handoff

Task ID: CWS-PILOT-READINESS-004
Agent: Codex
Objective: Close the CWS-001 variant revision and workspace knowledge-capture gaps using the existing schema and consolidated admin routes.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `src/App.jsx`
- `src/pages/admin/KnowledgePage.jsx`
- `src/pages/admin/VariantDetailPage.jsx`
- Existing admin creation pages and tests
- `supabase/migrations/010_content_variant_approvals.sql`
- `supabase/migrations/20260730231228_goals_initiatives_projects_tasks_decisions_learnings.sql`
- Current Supabase JavaScript insert documentation and breaking-change changelog

## Files changed

- `src/App.jsx`
- `src/pages/admin/KnowledgePage.jsx`
- `src/pages/admin/NewDecisionPage.jsx`
- `src/pages/admin/NewLearningPage.jsx`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/KnowledgeCreationPages.test.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Database or API changes

None. The implementation reuses the existing approvals, decisions, learnings,
workspace membership, grants, constraints, and RLS policies.

## Security decisions

- Approval re-submission inserts a new pending review with authenticated user,
  workspace, and variant ownership; it never overwrites completed reviews.
- Decision creation fixes status to `proposed`; the form does not expose
  sensitive decision status transitions.
- Learning and decision inserts derive `created_by` from `auth.getUser()` and
  the workspace from the active membership query.
- No service-role credential, RLS bypass, or legacy publishing access was added.

## Decisions made

- Add dedicated `/admin/knowledge/new-decision` and
  `/admin/knowledge/new-learning` creation routes.
- Treat decision context and learning category as optional fields.
- Normalize submitted text before inserting and reject whitespace-only required
  values in the client.
- Keep approved/rejected approval re-opening and decision status controls out of
  this scoped change.

## Assumptions

- The current user has one active workspace membership selected by the existing
  application convention.
- A proposed decision satisfies the pilot's capture step; owner-controlled
  approval is a separate sensitive transition.
- The existing combined `export_reference` remains adequate until explicit
  filename/version/outcome fields receive migration approval.

## Tests added

- Revision-requested approval re-submission creates a new pending row with the
  correct ownership payload and returns the UI to pending review.
- Decision creation inserts a trimmed, workspace-owned proposed decision and
  returns to Knowledge.
- Learning creation inserts trimmed content, optional category, and current-user
  ownership and returns to Knowledge.

## Tests run

- Focused knowledge, variant, and workspace tests — 3 files, 15 tests passed.
- `npm run test:run` — 20 files, 65 tests passed.
- `npm run check:imports` — passed.
- `npm run lint` — passed with the existing `useDrafts` dependency warning.
- `npm run build` — passed.
- `git diff --check` — passed.

## Known issues

- Campaign status still cannot be changed through the UI.
- Export filename, export version, outcome, and published timestamp need a
  separately approved migration design.
- The current decisions RLS allows broad member updates; DEC-009 requires a
  security follow-up before exposing sensitive decision transitions.
- The full approval-history timeline is not displayed in the UI.
- The existing `src/Hooks/useDrafts.js` dependency warning remains.
- No live CWS-001 data was mutated during automated validation.

## Recommended next task

Commit, push, and deploy these pilot controls, then manually exercise decision
and learning creation plus one real edit/revision/re-submission/approval cycle.
After that, choose between campaign status control and the explicit
export/outcome migration design.

## Questions requiring Tulio

- What should count as the recorded CWS-001 outcome for the future outcome
  fields?
- After deployment, Tulio must perform the owner-only live review actions.

## Project-memory files updated

- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Permanent decisions added

- None.

## Reusable learnings added

- None.

## Memory updates withheld

- The creation-route layout and optional field choices are scoped UI behavior,
  not permanent architectural decisions.
- The decision-transition policy mismatch is recorded as a known security
  follow-up, not a new reusable learning.

## Git diff summary

The working tree contains the approval revision loop, decision and learning
creation routes, three interaction tests across two test files, a refreshed
pilot-readiness audit, and required project-memory updates. No migration,
database mutation, commit, push, or deployment was performed.
