# Latest Codex Handoff

Task ID: CWS-TEST-DATA-ARCHIVE-016
Agent: Codex
Objective: Keep pilot/test records and their immutable lifecycle evidence available while removing archived test data from normal operating views.

## Files inspected

- `.agents/codex-project-instructions.md`
- Product, technical, decision, learning, pilot-readiness, project-log, task-ledger, and prior handoff documentation
- Existing campaign, content-variant, approval, revision, export, membership, and RLS migrations
- Workspace, campaign, variant, task, and admin overview UI and tests
- Managed staging schema, migration history, grants, data, and database advisors
- Current Supabase RLS, grants, trigger, and Data API guidance

## Files changed

- `supabase/migrations/20260812220705_add_test_data_archive.sql`
- `src/components/admin/TestDataControls.jsx`
- `src/components/admin/__tests__/TestDataControls.test.jsx`
- `src/pages/admin/AdminOverview.jsx`
- `src/pages/admin/CampaignDetailPage.jsx`
- `src/pages/admin/CampaignsPage.jsx`
- `src/pages/admin/TasksPage.jsx`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/WorkspacePage.jsx`
- `src/pages/admin/__tests__/CampaignsPage.test.jsx`
- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Database and UI changes

- Added explicit `is_test` and reversible `test_archived` classification to campaigns and content variants, with database-derived archive actor/time and integrity checks.
- Added owner-only database enforcement for labeling, archiving, restoring, and removing labels. Active members retain their existing record access but cannot change classification.
- Added workspace/filter and actor foreign-key indexes. Direct browser execution of the trigger function is revoked.
- Added reusable controls and clear test/archive badges on campaign and variant detail pages.
- Archived tests are hidden by default from campaign lists, workspace activity/counts, overview counts, and task campaign selection. Campaign and variant views include an explicit reveal control for recovery.
- Archive/restore does not change lifecycle status, approvals, revisions, export snapshots, or export versions. No publishing, n8n, webhook, social API, or legacy publishing table changed.

## Staging state and validation

- Migration `20260812220705` is applied to managed staging.
- No existing campaign or variant was automatically labeled or archived; both classified counts remain zero.
- A rollback-only lifecycle probe verified non-owner denial, unlabeled-archive denial, owner label/archive/restore for campaigns and exported variants, derived/protected attribution, and preservation of exported status plus both immutable export versions.
- All four new indexes and both archive integrity constraints are present. `anon` and `authenticated` cannot directly execute the trigger function.
- The security advisor retains the same two pre-existing warnings: intentional authenticated execution of `create_workspace` and disabled leaked-password protection. No new relevant performance finding was reported.
- The release branch was rebased onto the merged publication-recorder change. A server-only webhook secret that briefly appeared in the unmerged branch's example environment file was removed from reachable branch history, rotated in Vercel Production, and verified after redeployment. The replacement value is not stored in Git, and the authenticated endpoint reached its expected 400 validation response.

## Tests run

- Focused classification/list/detail/smoke suites: 5 files, 23 tests passed.
- Full combined Vitest suite after rebase: 31 files, 106 tests passed.
- `npm run lint`: no errors; unchanged `src/Hooks/useDrafts.js` dependency warning remains.
- `npm run build`: passed, including import-casing validation.
- `bash -n scripts/record-published.sh`: passed.
- `git diff --check`: passed.
- Managed staging migration alignment, schema/grant inspection, and rollback-only security/lifecycle probes: passed.

## Decisions and learnings

- No permanent decision or reusable learning was added. This owner-only reversible classification is an approved task implementation, but its exact archive UX and fields remain task-scoped until production use confirms the model.

## Known issues and deferred scope

- Existing test rows remain visible until an owner deliberately labels and archives them; the migration intentionally performs no heuristic data mutation.
- Restore clears current archive attribution. A permanent history of repeated archive/restore events would require a separate append-only event table and is deferred.
- The real English replacement-content and re-review cycle remains outstanding. Archiving must not substitute for correcting the actual pilot deliverable.
- Existing hook, bundle-size, third-party `eval`, advisor, and leaked-password warnings remain outside this task.

## Recommended next task

Deploy the UI, then use the owner controls to label/archive only the clearly temporary test campaign and variants. Verify normal lists are clean and archived records can be revealed/restored. After that, complete the real `CWS-001-EN-MASTER` revision, fresh review, approval, and confirmed export without invoking publication or n8n.

## Questions requiring Tulio

- Which currently visible campaign/variant records should be classified as temporary test data after deployment?

## Git state

- Branch: `agent/test-data-archive`
- Release validation is complete on top of `origin/main`; push, pull request, merge, and Production verification are the remaining release actions.
