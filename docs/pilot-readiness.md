# CWS-PILOT-READINESS-004 — CWS-001 Cycle Readiness

Date: 2026-08-08  
Agent: Codex  
Environment: staging project `ddbhxqkckzpwzwvnoxqt`  
Scope: baseline audit of the existing `/admin` UI and current CWS OS schema,
plus follow-up implementation of campaign and variant lifecycle controls,
revision resolution, and decision/learning capture.

The audit snapshot below records what a human could do before the follow-up.
The follow-up does not run the CWS-001 pilot or change the database schema/data.

## Follow-up implementation

`src/pages/admin/VariantDetailPage.jsx` now provides an independent editor for
each content variant. An active workspace member can save the existing
transcript/script, tone, editing notes, caption text, export reference, and any
allowed variant lifecycle status. The update is constrained by the variant ID
and workspace ID, so sibling language variants remain independent.

This closes the baseline audit gaps for variant content editing and variant
status transitions without adding migrations, publishing behavior, outcome
fields, or approval-history mutations.

`VariantDetailPage` now also creates a new pending approval after a completed
revision request, preserving immutable completed review history. The Knowledge
page links to workspace-authorized decision and learning forms. Decisions enter
as `proposed`; owner-only status transitions are not exposed. Campaign status
can now be changed from the campaign detail page using the approved lifecycle
values. A pending approval is explicitly labeled as submitted for owner review,
and Approve or Request revision requires a separate confirmation before the
database update occurs. Outcome recording remains the open definition-of-done
gap below.

## Current staging state

Verified by read-only queries on 2026-08-08:

- Workspaces: 1
- Workspace members: 1
- Channels: 2
- Campaigns: 2
- Content variants: 3
- Tasks: 1
- Approvals: 1, but none attached to `CWS-001`
- Goals: 4
- Initiatives: 2
- Projects: 1
- Decisions: 0
- Learnings: 0
- Agent runs: 0

The pilot rows are currently:

- Campaign `CWS-001`: status `editing`
- `CWS-001-EN-MASTER`: status `recorded`, with no transcript, caption text,
  editing notes, or export reference
- `CWS-001-ES-MASTER`: status `recorded`, with no transcript, caption text,
  editing notes, or export reference
- Approvals attached to CWS-001: none

## Cycle audit

Status meanings:

- WORKS — a human can complete the step through the current `/admin` UI.
- PARTIAL — the UI supports part of the step, but a required transition or
  field is unavailable.
- MISSING — the UI cannot perform the step.

| # | Path step | Result | Evidence | Human fallback |
|---:|---|---|---|---|
| 1 | Move `CWS-001` through campaign statuses toward `published` | WORKS | `CampaignDetailPage` exposes every approved campaign status and saves the selected value using both campaign ID and workspace ID. | None required. |
| 2 | Move EN and ES variants independently | WORKS | Variants are separate rows, and each detail page saves its own status and content fields using both variant ID and workspace ID. | None required. |
| 3 | Edit a variant transcript | WORKS | `VariantDetailPage` exposes and saves the existing `transcript` field independently per variant. | None required. |
| 4 | Edit caption text and set caption status | WORKS | The variant editor exposes `caption_text` and every allowed lifecycle status. | None required. |
| 5 | Record editing notes | WORKS | The variant editor exposes and saves `editing_notes`. | None required. |
| 6 | Record export filename and export version | PARTIAL | The variant editor saves the existing `export_reference`, but the schema has no separate filename or version fields. | Record a combined reference until a future schema decision adds explicit fields. |
| 7 | Advance a variant through `rough_cut` → `fine_cut` → `captions_pending` → `ready_for_review` → `approved` → `exported` | WORKS | `VariantDetailPage` saves any allowed content-variant lifecycle status on the independently selected variant. | None required. |
| 8 | Create an approval on a variant | WORKS | `VariantDetailPage` inserts a pending approval and clearly separates submission from the later owner decision. | None required, assuming the user is an active workspace member. |
| 9 | Request a revision | WORKS | The pending approval controls require an explicit second confirmation before recording either revision requested or approved. | None required for the first revision request. |
| 10 | Resolve the revision and approve | WORKS | A `revision_requested` review exposes `Re-submit for review`, which inserts a new pending approval while preserving the completed review; the new pending row can then be approved. | None required. |
| 11 | Create a campaign-linked task and complete it | WORKS | `TasksPage` loads campaigns, inserts a task with `campaign_id`, and exposes the `completed` status (`src/pages/admin/TasksPage.jsx:6-12`). | None required. |
| 12 | Write a decision from the UI | WORKS | `NewDecisionPage` creates a workspace-owned decision with the current user and fixed `proposed` status. | None required for capture; sensitive status transitions remain separate. |
| 13 | Write a learning from the UI | WORKS | `NewLearningPage` creates a workspace-owned learning with optional category and current-user attribution. | None required. |
| 14 | Record an outcome after a variant reaches `exported` | MISSING | `content_variants` has no outcome or `published_at` field; its current columns end with `export_reference`, `status`, and timestamps (`supabase/migrations/009_campaigns_content_variants.sql:42-88`). | Nothing possible in the current schema. This requires a future migration and is intentionally not added here. |

## What is runnable today

A human can log in, open the workspace and campaign, create campaigns and
variants, request an approval, approve or request a revision while an approval
is pending, create a campaign-linked task, and mark that task complete. EN and
ES records are independently addressable. After the follow-up implementation,
each variant can also be edited and moved through its allowed lifecycle statuses
from its own detail page.

The cycle can now advance the campaign, edit and advance each variant, complete
a real approval revision loop, and capture decisions and learnings. It cannot
yet record the full definition-of-done outcome.

## Live approval diagnosis

A read-only staging check on 2026-08-09 found that the English approval was
created pending and updated to approved about 19 seconds later by the same owner
account. This ruled out database auto-approval and identified an ambiguous
single-owner interaction. The existing approved row remains unchanged. Use the
Spanish variant or a new review cycle to validate the confirmation guard.

## Remaining recommended changes

The campaign and variant lifecycle controls, approval revision loop, and
knowledge-capture items are implemented in the follow-up section above. The
remaining changes are:

1. **Explicit export/outcome model — L and future migration.** Add separately
   approved fields for export filename, export version, outcome, and published
   timestamp. This is required for the definition-of-done outcome record and is
   intentionally outside this ticket.
2. **Decision transition enforcement — schema/security follow-up.** Before
   exposing approved, reversed, superseded, or archived controls, align the
   current broad decision update policy with DEC-009 owner-only transitions.

The task path already works and does not need a readiness blocker fix.

## Definition-of-done gap

The pilot definition requires both variants to reach `exported` independently,
an approval with a real revision requested and resolved, at least three
learnings from what broke, and at least one decision from a mid-cycle choice.
The current staging state has not begun that run: both variants are still
`recorded`, no CWS-001 approval exists, and decisions/learnings are empty.

## Questions requiring Tulio

- What should count as the CWS-001 outcome once the future outcome fields are
  approved?
- Which export filename, version, outcome, and publication fields should be
  approved for the final migration design?
