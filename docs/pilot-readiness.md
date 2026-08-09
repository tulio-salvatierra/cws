# CWS-PILOT-READINESS-004 — CWS-001 Cycle Readiness

Date: 2026-08-08  
Agent: Codex  
Environment: staging project `ddbhxqkckzpwzwvnoxqt`  
Scope: read-only audit of the existing `/admin` UI and current CWS OS schema.

This report does not run the CWS-001 pilot and does not add UI, migrations, or
data. It records what a human can do today and where the cycle stops.

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
| 1 | Move `CWS-001` through campaign statuses toward `published` | PARTIAL | Campaign status values exist in `supabase/migrations/009_campaigns_content_variants.sql:17-30`, but `CampaignsPage` only reads campaigns (`src/pages/admin/CampaignsPage.jsx:10-25`) and `CampaignDetailPage` only reads the campaign (`src/pages/admin/CampaignDetailPage.jsx:5-11`). | Direct table edit or SQL update of `campaigns.status`. |
| 2 | Move EN and ES variants independently | PARTIAL | Variants are separate rows and are opened by separate IDs (`src/pages/admin/CampaignDetailPage.jsx:8-11`, `src/pages/admin/VariantDetailPage.jsx:5-25`). No status mutation exists. | Direct table edit or SQL update of each `content_variants.status`. |
| 3 | Edit a variant transcript | MISSING | The schema stores `transcript` (`supabase/migrations/009_campaigns_content_variants.sql:59-60`), and the detail page only displays it (`src/pages/admin/VariantDetailPage.jsx:16-37`). | Direct table edit or SQL update. |
| 4 | Edit caption text and set caption status | MISSING | `caption_text` and the lifecycle statuses exist (`supabase/migrations/009_campaigns_content_variants.sql:62-78`), but the detail page has no edit or status control (`src/pages/admin/VariantDetailPage.jsx:26-37`). | Direct table edit or SQL update. |
| 5 | Record editing notes | MISSING | `editing_notes` exists in the schema (`supabase/migrations/009_campaigns_content_variants.sql:61-62`); no current page reads or writes it. | Direct table edit or SQL update. |
| 6 | Record export filename and export version | MISSING | The schema has one `export_reference` text field (`supabase/migrations/009_campaigns_content_variants.sql:63-64`), with no separate filename or version fields; no UI control exists. | A single reference can be written by SQL, but filename/version cannot be recorded separately without a future schema decision. |
| 7 | Advance a variant through `rough_cut` → `fine_cut` → `captions_pending` → `ready_for_review` → `approved` → `exported` | MISSING | The allowed statuses exist (`supabase/migrations/009_campaigns_content_variants.sql:64-78`), but `VariantDetailPage` only updates approvals, not `content_variants.status` (`src/pages/admin/VariantDetailPage.jsx:26-37`). | Direct table edit or SQL update for each transition. |
| 8 | Create an approval on a variant | WORKS | `VariantDetailPage` calls `approvals.insert` with `status: 'pending'` (`src/pages/admin/VariantDetailPage.jsx:26-29`) and exposes `Request review` (`src/pages/admin/VariantDetailPage.jsx:37`). | None required, assuming the user is an active workspace member. |
| 9 | Request a revision | WORKS | The pending approval review controls call `review('revision_requested')` (`src/pages/admin/VariantDetailPage.jsx:31-37`); the approval schema allows that status (`supabase/migrations/010_content_variant_approvals.sql:7-9`). | None required for the first revision request. |
| 10 | Resolve the revision and approve | MISSING | After an approval leaves `pending`, the page renders no review controls (`src/pages/admin/VariantDetailPage.jsx:37`). The database trigger also makes completed approvals immutable (`supabase/migrations/010_content_variant_approvals.sql:74-84`). | Insert a new pending approval directly by SQL/table edit, then approve it through the UI. |
| 11 | Create a campaign-linked task and complete it | WORKS | `TasksPage` loads campaigns, inserts a task with `campaign_id`, and exposes the `completed` status (`src/pages/admin/TasksPage.jsx:6-12`). | None required. |
| 12 | Write a decision from the UI | MISSING | `KnowledgePage` only selects and displays decisions (`src/pages/admin/KnowledgePage.jsx:5-8`); there is no create form or mutation. | Direct table edit or SQL insert. |
| 13 | Write a learning from the UI | MISSING | `KnowledgePage` only selects and displays learnings (`src/pages/admin/KnowledgePage.jsx:5-8`); there is no create form or mutation. | Direct table edit or SQL insert. |
| 14 | Record an outcome after a variant reaches `exported` | MISSING | `content_variants` has no outcome or `published_at` field; its current columns end with `export_reference`, `status`, and timestamps (`supabase/migrations/009_campaigns_content_variants.sql:42-88`). | Nothing possible in the current schema. This requires a future migration and is intentionally not added here. |

## What is runnable today

A human can log in, open the workspace and campaign, create campaigns and
variants, request an approval, approve or request a revision while an approval
is pending, create a campaign-linked task, and mark that task complete. EN and
ES records are independently addressable.

The cycle cannot currently reach a trustworthy exported/published state through
the UI because campaign and variant status transitions, content editing,
revision resolution, decisions, learnings, and outcome recording are missing or
partial.

## Smallest recommended changes

These are recommendations only; none are implemented by this ticket.

1. **Variant editor and lifecycle controls — M.** Add editing for transcript,
   tone, editing notes, caption text, status, and the existing export reference;
   keep each variant scoped by its own ID.
2. **Campaign status control — S.** Add a controlled status transition surface
   for the campaign lifecycle through `published`.
3. **Approval revision loop — S.** Let a revision-requested variant create a new
   pending approval, then review that pending approval. Preserve the existing
   completed-approval immutability rule.
4. **Decision and learning capture — S/M.** Add workspace-authorized forms for
   one decision and one learning, with the current ownership fields.
5. **Explicit export/outcome model — L and future migration.** Add separately
   approved fields for export filename, export version, outcome, and published
   timestamp. This is required for the definition-of-done outcome record and is
   intentionally outside this ticket.

The task path already works and does not need a readiness blocker fix.

## Definition-of-done gap

The pilot definition requires both variants to reach `exported` independently,
an approval with a real revision requested and resolved, at least three
learnings from what broke, and at least one decision from a mid-cycle choice.
The current staging state has not begun that run: both variants are still
`recorded`, no CWS-001 approval exists, and decisions/learnings are empty.

## Questions requiring Tulio

- Should the next implementation prioritize the variant editor/status surface
  or the decision/learning capture forms?
- What should count as the CWS-001 outcome once the future outcome fields are
  approved?
- Should revision resolution create a new approval record or use another
  approved lifecycle model?
