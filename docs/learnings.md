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
