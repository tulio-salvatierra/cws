# Latest Codex Handoff

Task ID: CWS-PILOT-STATUS-RECONCILE-014
Agent: Codex
Objective: Reconcile historical approval decisions whose content-variant statuses predated the approval-status synchronization trigger, so the real CWS-001 pilot reflects its recorded review evidence.

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
- `supabase/migrations/20260812155214_sync_content_variant_approval_status.sql`
- `supabase/migrations/20260812162351_content_variant_export_handoff.sql`
- `src/pages/admin/CampaignDetailPage.jsx`
- `src/pages/admin/VariantDetailPage.jsx`
- Current managed staging campaign, variant, approval, and export-version state
- Current Supabase changelog and trigger/migration guidance

## Files changed

- `supabase/migrations/20260812193142_reconcile_historical_approval_status.sql`
- `docs/pilot-readiness.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Added and applied a one-time data migration that finds each variant's latest approval and reconciles only two observed historical stale-state shapes: approved plus `ready_for_review` becomes `approved`; revision requested/rejected plus `ready_for_review` or `approved` becomes `draft`.
- Rows with export evidence are excluded, and pending approvals, ordinary in-progress statuses, ownership, approval history, content, export versions, publishing records, legacy tables, and n8n remain unchanged.
- The migration reconciled exactly three pre-trigger rows: `CWS-001-EN-MASTER` and `CWS-003-TEST` to `approved`, and `CWS-TEST-2` to `draft`.

## Security decisions

- No RLS policy, grant, function, or browser privilege changed.
- Exported rows are excluded from the backfill so immutable handoff evidence cannot be affected.
- The Supabase security advisor retained the same two pre-existing warnings: intentional authenticated access to `create_workspace` and disabled leaked-password protection.

## Decisions made

- No permanent product decision was added.
- The one-time backfill intentionally covers only stale states observed in live data and already enforced for future approvals by the existing synchronization trigger.

## Assumptions

- The latest approval is authoritative only for historical rows still in the two proven stale lifecycle states.
- Test content and test export versions are verification evidence, not a real CWS-001 deliverable.

## Tests added

- No application test was required for the data-only migration; future approval synchronization already has trigger and UI coverage.

## Tests run

- Read-only live audit identified exactly three non-exported status mismatches.
- Rollback-only managed transaction reconciled exactly the expected three codes/statuses and asserted that no exported row was affected.
- Managed migration `20260812193142_reconcile_historical_approval_status` applied successfully.
- Post-apply verification: English CWS-001 is approved, Spanish CWS-001 remains exported with evidence, CWS-003-TEST is approved, and CWS-TEST-2 is draft after revision request.
- Full Vitest suite: 28 files, 98 tests passed.
- `npm run lint`: no errors; unchanged `src/Hooks/useDrafts.js` dependency warning remains.
- `git diff --check`: passed.

## Known issues

- The English CWS-001 content fields and recorded approval snapshot contain test placeholders. They must not be treated as a real approved deliverable.
- The current UI cannot start a fresh approval cycle after an approved item needs substantive content replacement. Editing an approved transcript and exporting it would link the old approval evidence to changed content, so the next task must add an explicit approved-content revision/re-review path before the English pilot is exported.
- Spanish CWS-001 has historical exported evidence with unavailable actor/time and test placeholder content; it remains untouched.
- The three export correction versions on `CWS-AI-E0104603` are feature-test evidence only and remain immutable by design.

## Recommended next task

Design and implement an explicit owner-confirmed “Revise approved content” transition that returns a non-exported approved variant to draft, preserves its completed approval, permits editing, and then requires a new approval snapshot before export. Validate it first on synthetic data, then use it to replace and re-review the English CWS-001 test content.

## Questions requiring Tulio

- None before designing the smallest re-review path; Tulio must provide or approve the real English content before the final review/export cycle.

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/pilot-readiness.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Lifecycle synchronization triggers require a bounded historical backfill because triggers do not repair rows created before they existed.

## Memory updates withheld

- The exact approved-content revision transition, confirmation wording, eligible statuses, and whether old approvals become superseded remain unapproved task-level design choices.
- Publishing and n8n integration remain deferred.

## Git diff summary

Commit `6c5d49e` is pushed on `agent/reconcile-historical-approval-status`. The migration is applied to staging and aligned to remote version `20260812193142`. No application code, approval evidence, export evidence, publishing record, legacy table, or n8n workflow changed. Pull request, merge, and deployment remain pending.
