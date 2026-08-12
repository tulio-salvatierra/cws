# Latest Codex Handoff

Task ID: CWS-GENERATION-APPROVAL-011
Agent: Codex
Objective: Harden the separate request-approval step so each review has durable content evidence and the approval and content-variant lifecycles stay synchronized.

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
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- Current Supabase changelog, Data API, RLS, function, and security guidance

## Files changed

- `supabase/migrations/20260812155214_sync_content_variant_approval_status.sql`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/pages/admin/__tests__/VariantDetailPage.test.jsx`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Added required `approvals.content_snapshot` JSON evidence. Existing approvals receive an explicit marker that their historical snapshot is unavailable; each new request captures the exact code, locale, title, transcript, tone, editing notes, caption, export reference, and source status.
- Added a security-invoker before-insert trigger that derives the snapshot from the workspace-consistent content variant and accepts only editable/reviewable source statuses.
- Added a security-invoker status trigger that atomically moves the content variant to `ready_for_review` when requested, `approved` when approved, and `draft` after a revision request or rejection.
- Made the captured snapshot immutable in the existing approval lifecycle guard.
- The Variant Detail UI now explains the request boundary and immediately reflects the database-managed variant status after request and review actions.
- No new API endpoint, browser secret, approval auto-decision, publish action, webhook, legacy-table mutation, or n8n integration was added.

## Security decisions

- Snapshot and status trigger functions are security invokers, remain protected by existing workspace RLS, and cannot be executed directly by anonymous or authenticated roles.
- The request still derives `created_by` from the authenticated Supabase user and the existing insert policy requires active workspace membership.
- Owner-only approval outcomes remain enforced by the existing lifecycle trigger and private owner helper.
- The Supabase security advisor reported the same two pre-existing warnings before and after the migration: intentional authenticated access to `create_workspace` and disabled leaked-password protection.

## Decisions made

- No permanent decision was added.
- Task-level lifecycle mapping is request to `ready_for_review`, approval to `approved`, and revision/rejection to `draft`.
- Approved variants cannot be submitted into a new pending approval without first entering a future explicitly designed revision lifecycle.

## Assumptions

- Approval evidence must preserve the exact mutable content presented to the reviewer.
- Existing approval records cannot be reconstructed historically, so an honest unavailable marker is safer than copying current variant content into old approvals.
- The existing Variant Detail page remains the correct place for the separate request and owner-review controls.

## Tests added

- The UI reflects `ready_for_review` after requesting review.
- The UI reflects `approved` after owner approval.
- The request explanation states that content is snapshotted and not approved or published.

## Tests run

- Managed staging transaction verified snapshot capture, request-to-review status synchronization, duplicate-pending denial, owner approval, snapshot immutability after current-content edits, approved-variant resubmission denial, revision-to-draft, a new snapshot on resubmission, and non-member denial; all synthetic rows were rolled back.
- Direct function privileges: anonymous false and authenticated false for both trigger functions.
- Focused Variant Detail tests: 1 file, 4 tests passed.
- Full Vitest suite: 28 files, 95 tests passed.
- `npm run lint`: passed with the unchanged `src/Hooks/useDrafts.js` dependency warning.
- `npm run build`: passed; import-casing passed and 433 modules transformed.
- `git diff --check`: passed.
- `npx supabase migration list`: migration `20260812155214` matches locally and remotely.

## Known issues

- The real accepted generated variant `5cf97ebf-54fa-4277-ac13-c51d4862e436` remains `draft` with zero approvals so Tulio can perform the first real request after deployment.
- The first staging apply attempt rolled back because an UPDATE backfill correctly hit completed-approval immutability. The final migration uses a constant default marker for legacy history and applied successfully without rewriting completed approvals.
- Existing migration-history mismatches for local `015`, remote `20260809191332`, local `20260809195932`, and remote `20260809200028` remain unchanged.
- Existing chunk-size, third-party `eval`, dependency-audit, and `useDrafts` lint warnings remain unchanged.

## Recommended next task

Deploy the request-approval hardening, then have Tulio open the accepted variant and click Request review. Verify the pending snapshot and `ready_for_review` status before making the separate owner approval or revision decision.

## Questions requiring Tulio

- After deployment, review the accepted variant content and decide when it is ready to submit for owner review.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Approval records for mutable artifacts must capture an immutable review snapshot or freeze the artifact; a foreign key alone cannot prove what was reviewed.

## Memory updates withheld

- The exact snapshot fields, lifecycle status mapping, approved-item resubmission rule, and UI wording remain task-level choices rather than approved permanent decisions.
- No automatic approval, publishing, n8n integration, or execution behavior was added to permanent memory.

## Git diff summary

The task adds one applied migration, immutable approval snapshots, atomic approval/variant status synchronization, one UI regression test, updated Variant Detail feedback, and required project-memory updates. The real accepted draft and all publishing paths remain untouched pending deployment and Tulio's explicit request.
