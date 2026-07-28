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
Status: Approved

### Decision

The new CWS Operating System interface will use `/workspace` as its route namespace.

### Reason

The existing `/admin` route namespace is already occupied by the current social-content system.

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
