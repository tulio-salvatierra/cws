# Latest Codex Handoff

Task ID: CWS-PILOT-READINESS-004
Agent: Codex
Objective: Add the final migration-free CWS-001 blocker control by making campaign lifecycle status editable from the consolidated admin dashboard.

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
- `src/pages/admin/CampaignDetailPage.jsx`
- Existing admin smoke and interaction tests
- `supabase/migrations/009_campaigns_content_variants.sql`
- Current Supabase JavaScript update documentation and breaking-change changelog

## Files changed

- `src/pages/admin/CampaignDetailPage.jsx`
- `src/pages/admin/__tests__/CampaignDetailPage.test.jsx`
- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Database or API changes

None. The campaign update reuses the existing status constraint, immutable
ownership trigger, explicit authenticated grant, and workspace-member RLS
policies.

## Security decisions

- The update changes only `campaigns.status`.
- The mutation is filtered by both campaign ID and the active membership's
  workspace ID.
- The UI exposes only the status values already approved in the database and
  product definition.
- No service-role credential, RLS bypass, publishing integration, or legacy
  table access was introduced.

## Decisions made

- Use a select-and-save lifecycle control on the existing campaign detail page.
- Disable saving until the selected status differs from the persisted status.
- Keep transitions reversible within the existing allowed status set; no new
  transition graph or database rule was introduced.

## Assumptions

- Active workspace members may manage ordinary campaign records under DEC-009.
- The existing campaign status constraint remains the authoritative allowed set.
- Changing the CWS OS campaign to `published` does not invoke or synchronize the
  separate n8n publishing pipeline.

## Tests added

- Campaign lifecycle status can be changed and saved.
- The update payload contains only the selected status.
- The update applies both campaign ID and workspace ID filters.
- Successful persistence produces a visible confirmation and updated selector.

## Tests run

- Focused campaign and workspace tests — 2 files, 12 tests passed.
- `npm run test:run` — 21 files, 66 tests passed.
- `npm run check:imports` — passed.
- `npm run lint` — passed with the existing `useDrafts` dependency warning.
- `npm run build` — passed.
- `git diff --check` — passed.

## Known issues

- Export filename, export version, outcome, and published timestamp need a
  separately approved migration design.
- The current decisions RLS allows broad member updates; DEC-009 requires a
  security follow-up before exposing sensitive decision transitions.
- Campaign statuses are constrained to approved values but do not enforce a
  one-direction transition graph.
- The full approval-history timeline is not displayed in the UI.
- The existing `src/Hooks/useDrafts.js` dependency warning remains.
- No live campaign data was mutated during automated validation.

## Recommended next task

Push and deploy the campaign status control, then run the full CWS-001 pilot
cycle. After the live run, design the explicit export/outcome migration using
the actual information the pilot needed.

## Questions requiring Tulio

- What should count as the recorded CWS-001 outcome?
- Which fields should be separate: export filename, version, publication URL,
  publication timestamp, performance notes, and outcome summary?

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

- The select-and-save interaction is scoped UI behavior, not a permanent
  architectural decision.
- A transition graph was not inferred or added without explicit approval.

## Git diff summary

The working tree contains the workspace-scoped campaign lifecycle control, one
focused interaction test, the refreshed readiness audit, and required project
memory updates. No migration, database mutation, commit, push, or deployment was
performed.
