# Latest Codex Handoff

Task ID: CWS-EXPORT-HANDOFF-012
Agent: Codex
Objective: Add the smallest explicit, audited, non-publishing handoff from an approved content variant to an externally exported artifact.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `supabase/migrations/009_campaigns_content_variants.sql`
- `supabase/migrations/010_content_variant_approvals.sql`
- `supabase/migrations/20260808203339_move_workspace_rls_helpers_to_private.sql`
- `supabase/migrations/20260812153257_generated_draft_review.sql`
- `supabase/migrations/20260812155214_sync_content_variant_approval_status.sql`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- Current Supabase RLS, function-security, and platform-change guidance

## Files changed

- `supabase/migrations/20260812162351_content_variant_export_handoff.sql`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Added `content_variants.exported_by`, `exported_at`, and `export_snapshot` so a confirmed handoff records the authenticated actor, time, approved review, and exact final content and delivery reference.
- Added a security-invoker update trigger that permits a new export only from `approved`, requires an approved review plus nonblank caption and export reference, blocks direct `published` bypasses, and makes captured export evidence and content immutable.
- Preserved the two historical exported records with an explicit unavailable-evidence marker instead of inventing an actor or timestamp.
- The Variant Detail page now provides a separate confirmation step, removes approval/export/publication states from ordinary manual selection, locks captured exports, explicitly states that no publishing or n8n action occurs, and names missing required fields when export confirmation is attempted.
- No endpoint, webhook, social API, legacy table, n8n workflow, or outbound publication behavior was added or changed.

## Security decisions

- Existing workspace RLS remains the authorization boundary; non-members affect zero rows.
- The export trigger runs as the caller and cannot be executed directly by anonymous or authenticated roles.
- Export evidence is derived in the database from `auth.uid()`, current row values, and the latest approved approval rather than trusted from browser input.
- The Supabase security advisor retained the same two pre-existing warnings: intentional authenticated access to `create_workspace` and disabled leaked-password protection.

## Decisions made

- No permanent decision was added.
- The task-level handoff requires an approved review, final caption, filename or delivery reference, and a separate explicit confirmation.
- Recording export is evidence of an external file handoff only; it does not mean published.

## Assumptions

- The existing Variant Detail page remains the smallest usable place for export confirmation.
- A filename, folder, or delivery reference is sufficient for the first manual Final Cut handoff; file upload and storage are deferred.
- Caption and delivery reference may be finalized during the explicit export confirmation; the export snapshot preserves those final values separately from the earlier approval snapshot.

## Tests added

- Approved export requires a separate confirmation and records the final caption/reference without publishing.
- Captured exported fields render locked.
- A missing caption/reference produces visible validation without opening the confirmation; completing both fields then opens it.

## Tests run

- Managed staging transaction verified approval-to-export, authenticated attribution, trimming, final snapshot capture, direct-publish denial, blank-caption denial, missing-approved-review denial, non-member denial, immutable exported content, allowed exported-to-published/archive status progression, and immutability after archive; all synthetic rows were rolled back.
- Direct function privileges: anonymous false and authenticated false.
- Historical-data check: both existing terminal rows received only the explicit historical-evidence marker.
- Real variant check: `CWS-AI-E0104603` remains `approved` with no export actor, timestamp, or snapshot.
- Focused Variant Detail tests: 1 file, 6 tests passed.
- Full Vitest suite: 28 files, 97 tests passed.
- `npm run lint`: no errors; unchanged `src/Hooks/useDrafts.js` dependency warning remains.
- `npm run build`: passed; import-casing passed and 433 modules transformed.
- `git diff --check`: passed.
- Managed migration list: `20260812162351_content_variant_export_handoff` is applied.

## Known issues

- The real variant `CWS-AI-E0104603` is now exported with authenticated attribution, linked approved review, filename `CWS-AI-E0104603-v1.mp4`, and immutable caption `test` recorded at `2026-08-12 18:47:13.374327+00`.
- Live verification found that a silently disabled export button looked nonfunctional when the filename existed but the caption was blank. PR #17 merged as `53e7356`, and Production deployment `dpl_QwCuS4bhRC6nrPuR8YhmqYBxS4Ge` contains the actionable validation fix.
- PR #16 merged into `main` as `391693d`, and Production deployment `dpl_6NdNSzSRfBViQ5zJMfaUR4sgmcMB` is Ready at `https://cws-two.vercel.app`.
- File upload, checksum, storage URL, export version modeling, and outbound publishing remain deferred.
- Existing chunk-size, third-party `eval`, dependency-audit, and `useDrafts` lint warnings remain unchanged.
- Existing historical local/remote migration naming mismatches remain unchanged.

## Recommended next task

Confirm whether the immutable `test` caption represents acceptable pilot evidence. If it was only temporary, design a versioned correction/re-export path that retains this first handoff rather than rewriting it; do not add publishing behavior yet.

## Questions requiring Tulio

- Is the recorded `test` caption acceptable pilot evidence, or should the next task add an explicit versioned correction/re-export workflow?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Terminal artifact handoffs need immutable final evidence and honest markers for unreconstructable history.
- Required-action controls must respond with visible prerequisite guidance rather than silently staying disabled.

## Memory updates withheld

- Required caption/reference, latest-approved-review selection, allowed terminal status transitions, field locking, and exact UI wording remain task-level implementation choices rather than approved permanent decisions.
- File storage, checksums, export versions, publication wiring, and n8n behavior remain deferred and were not added to permanent memory.

## Git diff summary

PR #16 merged as `391693d`; the feedback fix in PR #17 merged as `53e7356`, and Production deployment `dpl_QwCuS4bhRC6nrPuR8YhmqYBxS4Ge` is Ready. The real variant completed the first audited handoff and renders locked with its actor, time, approval, filename, and final snapshot retained. No publication action occurred and no unrelated pre-existing local changes were present.
