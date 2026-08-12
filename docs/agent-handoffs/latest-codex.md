# Latest Codex Handoff

Task ID: CWS-APPROVED-REVISION-015
Agent: Codex
Objective: Add an explicit owner-confirmed revision and fresh-review path for approved, non-exported content without weakening approval or export evidence.

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
- Existing approval, export, revision, and workspace Supabase migrations
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- Current managed staging variants, approvals, memberships, migration history, grants, RLS, and database advisors
- Current Supabase trigger, RLS, migration, and security guidance

## Files changed

- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `supabase/migrations/20260812194145_content_variant_approved_revisions.sql`
- `supabase/migrations/20260812195057_index_content_variant_revision_event_foreign_keys.sql`
- `supabase/migrations/20260809191332_015_published_posts_return_path.sql` (filename aligned to its existing remote version)
- `supabase/migrations/20260809200028_016_channel_brief.sql` (filename aligned to its existing remote version)
- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Database or API changes

- Added and applied `content_variant_revision_events`, an append-only workspace-owned ledger that derives the authenticated owner, latest completed approval, reason, and timestamp before returning an approved, non-exported variant to `draft`.
- Added database guards that prevent direct transitions into `approved`, in-place changes to approved reviewed content, unrecorded approved-to-draft transitions, and revisions of exported content.
- Preserved the existing confirmed export path: reviewed fields stay locked while caption and export reference can still be finalized through the export handoff.
- Added covering indexes for both new composite foreign keys after the staging performance advisor identified the gaps.
- Reconciled two older local migration filenames with their already-applied remote timestamps. No old migration was reverted or re-run.
- No publishing, n8n, webhook, social API, or legacy publishing table changed.

## Security decisions

- Only active workspace owners can insert revision events; active members can read the ledger.
- Browser roles cannot update or delete revision history or directly execute its trigger functions.
- The database derives approval and actor evidence rather than trusting browser-supplied values.
- RLS is enabled. `authenticated` has only `SELECT` and `INSERT`; `anon` has neither.
- The security advisor retains only the same two pre-existing warnings: intentional authenticated access to `create_workspace` and disabled leaked-password protection.

## Decisions made

- No permanent product decision was added.
- The implementation uses the smallest reversible event-ledger model and keeps completed approvals immutable.

## Assumptions

- Substantive edits after approval require a fresh approval snapshot before export.
- Only non-exported approved content may enter this revision path; exported content continues through the separate versioned export-correction workflow.
- The existing single-owner workspace is the pilot authorization model.

## Tests added

- Added a UI test covering the approved-content lock, owner-only revision control, required reason, explicit confirmation, derived insert payload, return to draft, editable content, and fresh-review action.

## Tests run

- Focused variant-detail suite: 8 tests passed.
- Full Vitest suite: 28 files, 99 tests passed.
- `npm run lint`: no errors; unchanged `src/Hooks/useDrafts.js` dependency warning remains.
- `npm run build`: passed, including import-casing validation.
- `git diff --check`: passed.
- Supabase dry run showed only the intended migrations after local/remote history reconciliation.
- Managed staging lifecycle probe verified direct approved edit denial, direct status-transition denial, active-member revision denial, owner revision, derived immutable evidence, draft editing, fresh pending snapshot, fresh owner approval, preservation of the old approval, direct draft-to-approved denial, and exported-content denial. The probe transaction rolled back and left zero revision events.
- Staging grants verified: authenticated `SELECT`/`INSERT` only, no browser `UPDATE`/`DELETE`, no anon access, and no direct browser trigger-function execution.
- Post-index performance advisor reports no unindexed foreign key on `content_variant_revision_events`; remaining findings predate this task.

## Known issues

- The English CWS-001 content and prior approval snapshot still contain test placeholders. The new workflow is ready, but Tulio must supply or approve the real replacement content before its fresh review/export cycle.
- Spanish CWS-001 remains exported with historical unavailable-evidence markers and test content; this task intentionally leaves it untouched.
- Fresh indexes are reported as unused until the pilot begins recording revision events; this is expected.
- Existing project-wide lint, advisor, bundle-size, and third-party `eval` warnings remain outside this task.

## Recommended next task

Use the new owner-confirmed revision control on `CWS-001-EN-MASTER`, replace the test transcript and related reviewed fields with real pilot content, save, request a fresh review, approve the new immutable snapshot, and only then perform the confirmed export handoff. This should be a human-driven production test; it must not publish or invoke n8n.

## Questions requiring Tulio

- What final English transcript, tone, and editing notes should replace the current test placeholders?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/pilot-readiness.md`

## Permanent decisions added

- None.

## Reusable learnings added

- None; the migration-history rule was already recorded, and the approved-content workflow remains a task-scoped implementation pending production use.

## Memory updates withheld

- The exact approved-content revision UX and ledger model were not added to permanent decisions because they have not received separate architecture ratification.
- The legacy UUID helper failure was corrected locally but not added as a reusable learning because existing migrations still depend on project-specific extension placement.
- Publishing and n8n integration remain deferred.

## Git diff summary

PR #22 merged into `main` as `2d6ce5f`. Production deployment `dpl_CHoK2C5YctygbfbH7cbY3Ee5wbwi` reached Ready and is aliased to `https://cws-two.vercel.app`. Two older migration files are represented as filename-only renames to match the versions already present in staging. No pilot content, approval, export evidence, publishing record, legacy table, or n8n workflow was changed by validation or deployment.
