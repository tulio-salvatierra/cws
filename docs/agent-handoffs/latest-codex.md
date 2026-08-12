# Latest Codex Handoff

Task ID: CWS-EXPORT-REVISION-013
Agent: Codex
Objective: Add the smallest audited correction and re-export workflow while preserving the first export handoff as immutable version 1 and keeping publishing and n8n out of scope.

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
- `supabase/migrations/20260812155214_sync_content_variant_approval_status.sql`
- `supabase/migrations/20260812162351_content_variant_export_handoff.sql`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- Current managed staging export data, grants, RLS behavior, migrations, and security-advisor results
- Current Supabase RLS, privilege, and platform-change guidance

## Files changed

- `supabase/migrations/20260812190342_content_variant_export_versions.sql`
- `supabase/migrations/20260812190521_lock_content_variant_export_version_grants.sql`
- `supabase/migrations/20260812190917_fix_initial_export_version_capture_trigger.sql`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Added append-only `content_variant_exports` records with workspace ownership, sequential version, caption, unique export reference, correction reason, approved-review evidence, superseded-version link, immutable content snapshot, actor, and export time.
- Backfilled every existing export snapshot as version 1. The audited `CWS-AI-E0104603` handoff retains caption `test` and `CWS-AI-E0104603-v1.mp4`; older unavailable evidence remains explicitly historical without invented actors or timestamps.
- Added a security-invoker insert trigger that serializes version assignment against the parent variant, derives the authenticated actor and approved review, requires a reason and new reference for corrections, and captures the corrected immutable snapshot.
- Added automatic version-1 capture for future approved-to-exported transitions. A follow-up migration corrects the trigger to watch the old/new row transition because `UPDATE OF` does not include columns populated only by another trigger.
- Explicitly revoked platform/default table grants before granting only `SELECT` and `INSERT` to authenticated users and the service role. Browser roles cannot update or delete export history or execute the trigger functions directly.
- Added Variant Detail export history, current-version display, corrected-caption/reference/reason form, validation, and a separate append-only confirmation dialog.
- No endpoint, webhook, legacy table, n8n workflow, social API, outbound publication action, or existing version-1 evidence was changed.

## Security decisions

- Active workspace membership remains the read and insert boundary; a non-member reads zero rows and cannot insert.
- The database assigns versions, actor, timestamps, superseded row, approval, and snapshot instead of trusting those fields from the browser.
- Existing export versions are immutable to authenticated users by both absent mutation policies and explicit privilege revocation.
- Direct execution of both trigger functions is denied to anonymous and authenticated roles.
- The Supabase security advisor retained exactly the same two pre-existing warnings: intentional authenticated access to `create_workspace` and disabled leaked-password protection.

## Decisions made

- No permanent decision was added.
- Task-level behavior requires a nonblank corrected caption, a new export filename/reference, a correction reason, and explicit confirmation.
- Corrections are available only while the variant remains `exported`; they append evidence and never rewrite the original content-variant handoff fields.
- Versioning records external handoffs only and does not imply publication.

## Assumptions

- The existing Variant Detail page remains the smallest usable correction surface.
- A new filename, versioned filename, folder, or delivery reference distinguishes the corrected external artifact.
- Existing historical exports must be represented honestly even when their actor, time, caption, or reference is unavailable.

## Tests added

- The correction form displays version 1, rejects reuse of its filename/reference, requires confirmation, inserts only user-editable correction fields, then renders version 2 as current while preserving version 1 and its correction reason.

## Tests run

- Managed staging correction transaction verified unchanged real version 1, blank-reason denial, reused-reference denial, non-member denial, valid temporary version 2 derivation and trimming, approval/supersession/snapshot evidence, update/delete denial, and two-version visibility; the transaction rolled back.
- Managed staging initial-capture transaction verified that a temporary approved-to-exported variant automatically created audited version 1 with the expected actor, approval, caption, reference, and timestamp; the transaction rolled back.
- Post-rollback real check: `CWS-AI-E0104603` still has exactly version 1 with caption `test`, reference `CWS-AI-E0104603-v1.mp4`, its original actor/time, and approved approval.
- RLS check: a non-member sees zero export-version rows.
- Privilege check: authenticated `SELECT`/`INSERT` true, authenticated `UPDATE`/`DELETE` false, anonymous `SELECT` false, and both trigger-function execute privileges false.
- Focused Variant Detail tests: 1 file, 7 tests passed.
- Full Vitest suite: 28 files, 98 tests passed.
- `npm run lint`: no errors; unchanged `src/Hooks/useDrafts.js` dependency warning remains.
- `npm run build`: passed; import-casing passed and 433 modules transformed.
- `git diff --check`: passed.
- Managed migrations applied and locally aligned: `20260812190342`, `20260812190521`, and `20260812190917`.

## Known issues

- The real corrected version 2 has not been created; the first handoff remains current until Tulio supplies and confirms the actual corrected caption, a new reference, and the reason in Production.
- The UI is deployed, but the real correction still requires Tulio's explicit caption, reference, reason, and confirmation.
- Existing chunk-size, third-party `eval`, dependency-audit, and `useDrafts` lint warnings remain unchanged.
- The two pre-existing Supabase security-advisor warnings remain unchanged.
- Existing historical local/remote migration naming mismatches remain unchanged.

## Recommended next task

Use the real Variant Detail correction dialog to create version 2 with the final caption and a new Final Cut filename/reference. Verify that Production renders version 2 as current, version 1 unchanged, and no publication record or n8n execution was created.

## Questions requiring Tulio

- What is the final corrected caption, new filename/reference, and concise correction reason for real export version 2?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Narrow grants require an explicit revoke-first migration when older/default grants may already be broad.
- `UPDATE OF column` does not fire merely because a separate `BEFORE UPDATE` trigger changes that column; transition-driven capture must inspect `OLD` and `NEW` on the broader update event.

## Memory updates withheld

- Required correction fields, exported-only eligibility, version numbering, new-reference enforcement, and exact UI wording remain task-level implementation choices rather than approved permanent decisions.
- Publishing, n8n integration, storage uploads, checksums, and automatic re-rendering remain deferred and were not added to permanent memory.

## Git diff summary

PR #18 merged into `main` as `18f0957`. Production deployment `dpl_6itez6HwyCR1Zz7mK1Mja8Rqwv7P` is Ready and aliased to `https://cws-two.vercel.app`. Three migrations are applied to staging and aligned with remote history; the UI now includes an append-only correction dialog and export history. Nothing was published or sent to n8n, no real version 2 was created, and version 1 remains unchanged.
