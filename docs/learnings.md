# Reusable Learnings

## Supabase migrations require database-level validation

Date: 2026-07-23

Verified by: CWS-DB-FOUNDATION-001

Static SQL and security review, application tests, and a successful Vite build do not verify that a migration applies cleanly or that RLS behaves correctly for authenticated users. Before treating a Supabase migration as deployment-ready, run it against a disposable or linked PostgreSQL environment and test tenant isolation and role transitions.

When Docker is unavailable, an embedded PostgreSQL runtime can exercise migrations, roles, RLS, triggers, and constraints without modifying a remote project. Runtime-specific compatibility shims must remain outside repository migrations and be disclosed. This does not replace final managed-Supabase validation for extensions, Auth integration, grants, and platform-specific behavior.

## Test parent-delete cascades around child guard triggers

Date: 2026-07-23

Verified by: CWS-DB-VALIDATION-001

A trigger that prevents deletion of the final privileged child row can also intercept a legitimate parent-table cascade. Test both direct child deletion and trusted parent deletion. When ordinary users cannot delete the parent, nested trigger depth can distinguish the trusted cascade while retaining the direct-mutation guard.

## PostgREST RLS denials can look like successful empty writes

Date: 2026-07-31

Verified by: CWS-DB-MANAGED-VALIDATION-001

Under workspace-authorized RLS, a non-owner UPDATE or DELETE through PostgREST may return HTTP 200 with an empty result set and no error. Treat that as a denial only after confirming the target rows are unchanged. Prefer state assertions over error-message assertions for membership and ownership checks.

## Do not repair-revert meaningful remote-only migrations

Date: 2026-07-31

Verified by: CWS-DB-MIGRATION-RECONCILE-001

When `db pull` fails because a remote migration version is missing locally, the CLI may suggest `migration repair --status reverted`. Inspect the remote schema first. If that version created real tables/policies absent from local history, keep the version and add a matching local file; repairing as reverted orphans applied schema and can make a later push recreate existing objects.

## RLS helper functions need execution privilege during policy evaluation

Date: 2026-08-07

Verified by: CWS-ADMIN-CONSOLIDATE-003

Workspace RLS policies that call `SECURITY DEFINER` helper functions still require the querying role to have `EXECUTE` on those functions. Revoking `authenticated` execution from `is_workspace_member(uuid)` or `is_workspace_owner(uuid)` can block both members and non-members with `permission denied for function ...`, even though it removes the direct RPC surface. Protect these helpers through a non-exposed schema or another tested access pattern rather than removing the privilege required by policy evaluation.

Validated on 2026-08-08: moving both helpers to the non-exposed `private`
schema, granting `authenticated` only schema usage and function execution, and
repointing all 47 policies preserves member access and returns zero rows to a
non-member while removing the public helper endpoints.

## Schema status enums do not guarantee UI lifecycle coverage

Date: 2026-08-08

Verified by: CWS-PILOT-READINESS-004

The CWS OS schema contains the campaign and content-variant status enums and
fields for transcripts, captions, editing notes, and export references, while
the current admin pages mostly read those values and do not expose mutation
controls. A readiness audit must trace each required status transition and
field through the UI instead of treating schema support as operational support.

## SPA fallbacks must preserve missing-asset failures

Date: 2026-08-08

Verified by: CWS-VERCEL-RELIABILITY-005

A catch-all SPA rewrite can turn a missing hashed JavaScript chunk into a 200
HTML response, which browsers reject as a module MIME-type error after a new
deployment replaces old chunk names. Keep SPA navigation fallbacks for
extensionless application routes, let missing assets and API routes return real
404 responses, and handle Vite's `vite:preloadError` with a guarded one-time
reload so users move from an old entry bundle to the current deployment without
entering a refresh loop.

## Single-owner reviews need an explicit decision boundary

Date: 2026-08-09

Verified by: CWS-PILOT-READINESS-004

When the same account can submit work and act as the only owner-reviewer,
showing review controls immediately after submission can make a later approval
look automatic. Verify the audit timestamps and actor IDs before diagnosing a
database transition, then require a separate confirmation before recording an
approval or revision decision. Preserve completed approval history rather than
rewriting the evidence.

## Non-critical external side effects should not hold the UI response open

Date: 2026-08-09

Verified by: CWS-VERCEL-RELIABILITY-006

When a browser action succeeds independently of a slow external webhook, return
an honest accepted/queued response and register the side effect with the
serverless platform's background-work mechanism. Keep the downstream call
bounded, log its eventual result, and do not use an unmanaged fire-and-forget
promise. A longer synchronous timeout only delays the same visible failure.

## Translate database failures using stable error codes

Date: 2026-08-09

Verified by: CWS-CAMPAIGN-UX-007

When converting a Supabase/PostgREST failure into user-facing feedback, branch
on the stable Postgres error code rather than matching message text that may
change across database or API versions. Keep the database constraint as the
enforcement boundary, preserve unknown errors for diagnosis, and make the
translated feedback accessible in the form.

## Operational status must come from an observed signal

Date: 2026-08-09

Verified by: CWS-N8N-ASSESS-006

The Settings page displayed hardcoded `active` labels for n8n workflows it
never contacted, so a suspended and dormant workspace appeared healthy for the
entire idle period. Operational status indicators must derive from an observed
signal such as publication state, a recent execution heartbeat, or a checked
dependency. When no signal is available, display `Unknown` rather than a
synthetic healthy state. Keep enabled and recently executed as separate facts.

## Verify live schema before acting on documentation claims

Date: 2026-08-09

Verified by: CWS-N8N-ASSESS-006

A documentation-based audit reported YouTube missing from the platform enum
even though applied migrations `003` and `004` had already added `youtube` and
`youtube_ready`. Before proposing a schema change, query the live database and
confirm applied migration history, columns, constraints, and enum values. Treat
repository documentation as design context, not proof of current database
state.

## Build the return path before publishing capability

Date: 2026-08-09

Verified by: CWS-RETURN-PATH-007

Build and verify the authenticated, idempotent publication return path before
adding or reviving any outbound publishing capability. The previous pipeline
published without recording and left no usable history, which made its true
state impossible to determine from within the system. A durable return record
gives every later manual or automated publisher a common evidence contract from
its first execution.

## Create versioned strategy before generation workflows

Date: 2026-08-09

Verified by: CWS-CHANNEL-BRIEF-008

Create the strategy table before any generation workflow exists so no workflow
can begin by hardcoding strategy into an unversioned prompt. The retired
pipeline's operating strategy could not be reconstructed after the fact;
independent, versioned channel-and-language briefs make the strategy that
produced each recorded post durable and traceable from the start.

## Persist prompt-source snapshots when referenced records remain editable

Date: 2026-08-11

Verified by: CWS-GENERATION-TEST-009

A version reference does not reconstruct the exact prompt context when the
referenced version's editable fields can still change. Persist the exact source
snapshot in an immutable agent-run input alongside its record ID and version.
This preserves generation provenance without freezing ordinary strategy edits
or duplicating the source as another mutable business record.

## Promote generated proposals atomically with workspace-consistent provenance

Date: 2026-08-12

Verified by: CWS-GENERATION-REVIEW-010

When a human promotes generated output into a durable business record, create
the record and close the review run in one idempotent database operation. Link
the promoted record to its source run with a workspace-consistent composite
foreign key, and make that provenance immutable. This prevents partial review
states, duplicate promotion on retry, and cross-workspace attribution even if
an API or client validation regresses.
