# Latest Codex Handoff

Task ID: CWS-ADMIN-CONSOLIDATE-003
Agent: Codex
Status: Completed locally; external staging validation pending

## Objective

Unblock CI, harden the remaining Supabase function surface, and consolidate the CWS Operating System route tree under `/admin` without changing the legacy n8n publishing subsystem.

## Commits

1. `62b3238` — `chore: sync package lockfile` (package-lock only; `npm ci` now passes).
2. `84d5176` — `fix: harden function security and refresh stale tests`.
3. `89f8680` — `refactor: consolidate workspace routes under admin`.
4. `4cd19e0` — `refactor: move workspace pages into admin`.
5. `413fe71` — `fix: clear unused legacy hook state` (behavior-neutral lint cleanup).

All five commits are on local `main` and have not been pushed.

## Files changed

- `package-lock.json`
- `src/App.jsx`
- `src/components/admin/AdminLayout.jsx`
- `src/pages/admin/AdminOverview.jsx`
- `src/pages/admin/` (all former `src/pages/workspace/*` page modules moved here)
- `src/components/admin/__tests__/KeywordsPage.test.jsx`
- `src/components/admin/__tests__/PublishedCard.test.jsx`
- `src/Hooks/useDrafts.js`
- `supabase/migrations/013_harden_function_security.sql`
- `docs/decisions.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Route result

The existing `/admin` parent now owns the single `AdminGuard` and suspense boundary. CWS OS pages are children of that parent:

- `/admin/workspace`
- `/admin/campaigns`, `/admin/campaigns/new`, `/admin/campaigns/:campaignId`
- `/admin/campaigns/:campaignId/variants/new`, `/admin/variants/:variantId`
- `/admin/tasks`
- `/admin/planning`, `/admin/planning/new-goal`, `/admin/planning/new-initiative`, `/admin/planning/new-project`
- `/admin/projects/:projectId`
- `/admin/knowledge`
- `/admin/agent-runs`

The legacy `/workspace`, campaigns, variants, tasks, planning, projects, knowledge, and agent-runs paths redirect to their `/admin` equivalents. Admin overview cards, sidebar navigation, and internal page links use the new paths. No collision was found with legacy queue, keywords, calendar, analytics, clients, or settings routes.

## Security migration

`supabase/migrations/013_harden_function_security.sql`:

- sets `search_path = public` on `public.update_updated_at()`;
- revokes authenticated execute on `public.is_workspace_member(uuid)`;
- revokes authenticated execute on `public.is_workspace_owner(uuid)`;
- leaves `public.create_workspace(text, text)` executable by authenticated users.

The linked staging project is `ddbhxqkckzpwzwvnoxqt` (`cws-os-staging`). Migration 013 was applied through the Supabase MCP migration tool and is recorded remotely as `20260807215908_harden_function_security` while the repository source file remains `013_harden_function_security.sql`; migration-history alignment must be checked before the next CLI push. The security advisor went from five warnings to two: the three targeted warnings for `update_updated_at`, `is_workspace_member`, and `is_workspace_owner` cleared; the intentional `create_workspace` warning and the independent leaked-password-protection warning remain.

The required RLS check then failed for both the active member and a non-member with `permission denied for function is_workspace_member`, proving that the two revokes break policy evaluation. Direct privilege inspection confirms `authenticated` has no execute privilege on either helper, `create_workspace` remains executable, and `update_updated_at` now has `search_path=public`. Per the ticket, no workaround or RLS loosening was applied. Staging is blocked pending an approved helper-access correction; no production database was touched.

## Verification

- `npm ci` — passed.
- `npm run check:imports` — passed.
- `npm run build` with staging URL and a non-secret placeholder client key — passed; import-casing check passed.
- `npx vitest run` — 12 test files, 42 tests passed.
- Targeted stale admin tests — 9 tests passed.
- `npm run lint` — passed with one existing hook-dependency warning in `src/Hooks/useDrafts.js`; no errors or route-related lint findings.

## Decisions and memory

- Added approved DEC-011 (CWS OS routes use `/admin` with legacy redirects).
- Added approved DEC-012 (repository markdown memory and workspace knowledge tables are separate and never automatically synchronized).
- Marked DEC-005 superseded by DEC-011; retained its historical text.
- Closed `CWS-DB-CONSOLIDATE-001` with follow-up status and backfilled recent workspace UI commits in the ledger.
- Added the verified RLS helper privilege behavior to `docs/learnings.md`; no other new reusable learning was added.

## Next actions

1. Approve a corrected helper-access design that preserves RLS policy evaluation while removing direct RPC exposure, remediate staging, and rerun the member/non-member RLS checks.
2. Confirm the remaining intentional advisor warnings are either accepted or separately remediated.
3. Manually verify Preview login, every `/admin` route, and one `/workspace` redirect after staging is healthy.
4. Recommended next feature: dedicated `/admin/channels`, followed by workspace smoke tests.

## Git handoff

Working tree should remain clean after documentation updates. Do not push from this handoff.
