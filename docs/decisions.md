## DEC-004 — Existing social publishing pipeline remains separate during MVP

Date: 2026-07-21
Status: Approved

### Decision

The existing n8n-based social publishing pipeline will remain operational as a legacy execution subsystem.

The new CWS Operating System will initially provide planning, work management, decisions, approvals, and content operations without replacing or extending the existing publishing pipeline.

### Consequence

No existing n8n workflow, publishing route, or legacy content table will be modified during the first CWS OS implementation phase.

---

## DEC-005 — New workspace routes use `/workspace`

Date: 2026-07-21
Status: Superseded by DEC-011

### Decision

The new CWS Operating System interface will use `/workspace` as its route namespace.

### Reason

The existing `/admin` route namespace is already occupied by the current social-content system.

This decision is retained as historical context. DEC-011 supersedes it for the consolidated admin surface.

### Consequence

Initial routes will follow the pattern:

- `/workspace`
- `/workspace/work`
- `/workspace/content`
- `/workspace/tasks`
- `/workspace/decisions`
- `/workspace/learnings`
- `/workspace/ai-runs`

---

## DEC-006 — Existing publishing integration is deferred

Date: 2026-07-21
Status: Approved

### Decision

The Ask → Propose → Execute architecture will govern new CWS OS behavior first.

Integration with the existing n8n publishing pipeline is deferred until approvals, action validation, and execution auditing are implemented.

### Consequence

The initial MVP must not trigger or modify existing publishing workflows.

---

## DEC-007 — New CWS OS tables use explicit ownership

Date: 2026-07-21
Status: Approved

### Decision

New CWS Operating System tables will use explicit workspace and user ownership rather than copying the legacy blanket-authenticated RLS policy.

### Consequence

Workspace-owned records should include:

- `workspace_id`
- `created_by`
- `created_at`
- `updated_at`

RLS policies must validate authorized workspace access.

---

## DEC-008 — Channels are first-class workspace records

Date: 2026-07-23
Status: Approved

### Decision

The CWS Operating System will store channels as first-class, workspace-owned records before campaigns are implemented.

### Reason

The product definition gives the Cicero Web Studio and Drum Practice channels independent audiences, voices, formats, production requirements, revenue goals, and success metrics. Campaigns such as `CWS-001` must be assigned to the correct channel without relying on loose text.

### Consequence

The database foundation must include a minimal `channels` table before `campaigns`, and campaign records must reference a channel in the same workspace.

---

## DEC-009 — Owners control sensitive workspace transitions

Date: 2026-07-23
Status: Approved

### Decision

Active workspace members may manage ordinary workspace records. Only workspace owners may manage memberships, set approval outcomes, and approve, reverse, or archive decisions.

### Consequence

RLS and trusted server-side validation must enforce owner-only sensitive transitions while preserving ordinary member access within the workspace.

---

## DEC-010 — Use a dedicated CWS Supabase staging project

Date: 2026-07-23
Status: Approved

### Decision

Use `cws-os-staging` as the dedicated non-production Supabase project for CWS schema migrations, RLS validation, and pre-production database testing.

### Consequence

Database changes must be validated in `cws-os-staging` before any future production rollout. The project must not contain production client data, and destructive validation data must be cleaned up after testing.

---

## DEC-011 — Consolidate CWS OS routes under `/admin`

Date: 2026-08-07
Status: Approved

### Decision

The CWS Operating System and the existing administrative tools share one protected `/admin` route tree. CWS OS pages use `/admin/workspace`, `/admin/campaigns`, `/admin/tasks`, `/admin/planning`, `/admin/knowledge`, `/admin/agent-runs`, and their related detail/create routes. The existing `/admin` page remains the unified dashboard index.

Legacy `/workspace/*` URLs redirect to their `/admin/*` equivalents so existing Preview links and bookmarks continue to work.

### Consequence

The parent `/admin` route owns the session guard, suspense boundary, and navigation shell. New CWS OS pages must be added as children of that route rather than as separate protected route trees. Legacy publishing routes and tables remain unchanged.

---

## DEC-012 — Markdown project memory and workspace knowledge records are separate

Date: 2026-08-07
Status: Approved

### Decision

Repository markdown files such as decisions, learnings, handoffs, logs, and the task ledger are agent/project memory. The CWS OS `decisions` and `learnings` tables are workspace knowledge records for product and delivery work. They are separate records and are never synchronized automatically.

### Consequence

An agent may reference or summarize approved project context in a workspace record only through an explicit, reviewed action. Database knowledge changes do not rewrite repository memory, and repository updates do not silently create database rows.

---

## DEC-013 — Keep workspace RLS helpers in a non-exposed schema

Date: 2026-08-08
Status: Approved

### Decision

Workspace membership and ownership helpers used by RLS policies live in the
non-exposed `private` schema. The `authenticated` role retains only the schema
usage and function execution privileges required for policy evaluation. The
old public helper RPC endpoints are removed.

### Reason

Revoking `authenticated` execution from a helper called by an RLS policy blocks
both authorized and unauthorized queries before the policy can return a result.
Keeping the helpers outside the Data API removes direct RPC exposure without
removing the privilege required by RLS evaluation.

### Consequence

Future workspace RLS policies must reference `private.is_workspace_member` or
`private.is_workspace_owner`. Any new helper used by RLS must be kept out of the
exposed API schemas and validated with both member and non-member tests.

---

## DEC-025 — Every publish records to the CWS Operating System

Date: 2026-08-09
Status: Approved

### Decision

Every publish, whether performed manually or by any current or future
pipeline, must record the publish event in the CWS Operating System at publish
time. No pipeline may publish without recording the result.

### Reason

The previous publishing pipeline did not retain a durable publication history,
so its real operational state and outcomes could not be established from
within the system.

### Consequence

All future publishers must call the authenticated return path and successfully
record the platform, publication time, source, and available external identity
before the pipeline is considered complete. Publishing capability remains out
of scope until that contract is wired and tested.

---

## DEC-026 — Revive n8n through an isolated authenticated dry-run bridge

Date: 2026-08-13
Status: Approved

### Decision

The first revived CWS-to-n8n path uses a separate authenticated workflow and
the current CWS Supabase project as its authoritative operating record. The
initial path is acknowledgement-only: it may accept an exported archived test
handoff and record an agent run, but it may not call a social platform or create
a publication record.

The failing legacy WF1 and WF5 schedules remain unpublished while their
definitions and execution history are preserved.

### Reason

The legacy workflows target an obsolete database and can spend external API
resources before failing. An isolated dry run proves authentication, payload,
correlation, and durable CWS evidence without restoring uncontrolled publishing.

### Consequence

New n8n integration work must originate from the CWS app through a server-side
secret and must preserve an auditable `agent_runs` record. Outbound publishing
remains disabled until a separately approved workflow implements `DEC-025`,
including the authenticated publication return path and idempotent verification.


# DEC-027 — Channel-Centric Restructure of Content Operations

**Status:** approved
**Date:** 2026-08-20
**Scope:** Content Operations / Channels module only. Does not govern Goals, Initiatives, or Projects navigation — that IA is being defined separately by Tulio.

## Context

Publishing infrastructure work has produced capability without moving `published_posts` off zero across multiple tickets (see prior handoffs). Part of the root cause: the app's navigation and data model are Campaign-first, but a large share of real content (routine social posts, text content) doesn't originate from a campaign and doesn't fit the video-oriented Content Variant status ladder.

A UI flow proposal for a Channels menu (per-platform pages: LinkedIn, YouTube, Instagram, Facebook) surfaced this directly: `content_variants.campaign_id` is NOT NULL and `content_variants` has no `channel_id` at all, so a variant can only reach its channel by way of a campaign. Making channel posting genuinely campaign-optional requires a schema change, not just a UI change.

Separately, Tulio clarified this is a solo-operator workspace — the operator drafts and publishes their own content — so an approval gate between the operator and themselves adds process without adding value.

## Decision

1. **`content_variants.channel_id`** — new column, NOT NULL. Every content variant belongs to a channel directly, independent of whether it also belongs to a campaign.
2. **`content_variants.campaign_id`** — becomes nullable. Campaigns become an optional grouping across variants, not a mandatory container.
3. **Approvals decouple from publish, for all content types (video and social).** Clicking Post fires the publish action directly — nothing blocks on approval status. A row is still auto-written to `approvals` (status `approved`, `reviewed_by` = operator, timestamped) at publish time, purely as a self-tracking log. This preserves DEC-025 ("every publish must be recorded") without a review cycle.
4. **Channels becomes the top-level nav spine for Content Operations.** All existing features — video pipeline and social/text — move to live under their channel, side by side, rather than under separate Campaign-first flows.
5. **Shell-first build order.** The Channels nav and routing ship first, with real data reads wherever the underlying table already exists (post history, channel brief, topics) and an honest "not built yet" state for anything that isn't (analytics, AI generation, trend recommendations, scheduling). Each later ticket replaces one stub with a real feature.
6. **Testing is owned by each feature ticket, not the shell ticket.** The shell ticket has no functional feature to test beyond routing/data-read correctness.
7. **Legacy n8n-era tables (`media_assets`, `content_drafts`, `research_topics`, `keywords`) are out of scope for this restructure.** They belong to the retired n8n pipeline (DEC-021) and are candidates for later cleanup, not touched here.

## Explicit Non-Goals

- No video file upload or storage in CWS OS at any point in this workflow. Final Cut Pro remains the sole editing environment; the dashboard continues to store only references (`export_reference`, `transcript`, `editing_notes`, `caption_text`), per the existing Final Cut Pro constraints in product-definition.md. This was already the design, not a new restriction.
- No change to Goals / Initiatives / Projects navigation structure. That is being worked separately by Tulio and this decision does not presume where Channels docks relative to it.
- DEC-026 (one platform fully working before starting a second) still applies to feature-polish tickets after the shell exists — this decision unifies the navigation, not the platform build sequence.

## Consequences

- Two schema migrations required before the shell ticket can be built: add `content_variants.channel_id` (NOT NULL), alter `content_variants.campaign_id` to nullable.
- product-definition.md requires a scoped patch: Core Structure tree, approval-model note, and moving "social publishing" / "social OAuth integrations" from "Do not build yet" to "Build now" (already true in practice, doc is catching up).
- Content Variant status ladder needs a `type` split (short ladder for text: `draft → ready_for_review → approved → published`; full ladder retained for video) — tracked as follow-up, not blocking this decision.
- Approval bypass is scoped to this solo-operator context. If CWS OS is ever used by more than one person, or extended to client-facing use where a second reviewer matters, this decision should be revisited rather than assumed to still hold.

## Follow-ups

- [ ] Migration ticket: `content_variants.channel_id` + nullable `campaign_id`
- [ ] product-definition.md patch (Core Structure, approval model, scope-list correction)
- [ ] Shell-nav ticket (Channels menu, per-channel routing, stub states) — blocked on migration ticket and on Tulio confirming where Channels docks in the higher-level nav
- [ ] Content Variant `type` field / short status ladder for text content — separate ticket, not blocking