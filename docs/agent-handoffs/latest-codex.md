# Latest Codex Handoff

Task ID: CWS-ADMIN-CONSOLIDATE-003
Agent: Codex
Objective: Unblock CI, harden the Supabase function surface, and consolidate the CWS Operating System route tree under `/admin` without changing the legacy n8n publishing subsystem.

## Files inspected

- `.agents/codex-project-instructions.md`
- Product, technical-convention, decision, learning, handoff, log, and ledger docs
- `src/App.jsx`, admin/workspace pages, tests, and import-casing script
- Existing Supabase migrations and staging policies/functions

## Files changed

- `package-lock.json`
- `src/App.jsx`
- `src/components/admin/AdminLayout.jsx`
- `src/pages/admin/AdminOverview.jsx`
- `src/pages/admin/` (former workspace page modules moved here)
- `src/components/admin/__tests__/KeywordsPage.test.jsx`
- `src/components/admin/__tests__/PublishedCard.test.jsx`
- `src/Hooks/useDrafts.js`
- `supabase/migrations/20260807215908_harden_function_security.sql`
- `supabase/migrations/20260808203339_move_workspace_rls_helpers_to_private.sql`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

## Database or API changes

Staging project `ddbhxqkckzpwzwvnoxqt` now has the approved helper-access
correction recorded as remote migration `20260808203339_move_workspace_rls_helpers_to_private`.
It creates a non-exposed `private` schema, moves the workspace membership and
ownership helpers there, grants `authenticated` only the schema usage and
function execution required by RLS, repoints all 47 affected policies, updates
the approval trigger, and drops the old public helper functions. The earlier
security migration source was renamed locally to
`20260807215908_harden_function_security.sql` to match remote history.

Legacy publishing tables, routes, and n8n integration were not changed.

## Security decisions

- RLS helpers are private-schema `SECURITY DEFINER` functions with an empty
  search path and explicit `public.workspace_members` references.
- Direct public RPC endpoints for `is_workspace_member` and
  `is_workspace_owner` no longer exist.
- `public.create_workspace(text, text)` remains intentionally callable by
  authenticated users and is the only remaining targeted advisor warning.
- Leaked-password protection remains a separate Auth warning and was not
  changed in this task.

## Route result

The existing `/admin` parent owns the single session guard, suspense boundary,
and navigation shell. CWS OS pages now use `/admin/workspace`, campaigns,
tasks, planning, projects, knowledge, and agent-runs routes. Legacy
`/workspace/*` URLs redirect to the corresponding `/admin/*` paths. Admin
overview cards, sidebar navigation, and internal links use the consolidated
paths. No legacy publishing route or table was changed.

## Tests run

- `npm ci` — passed.
- `npm run check:imports` — passed.
- `npx vitest run` — 12 files, 42 tests passed.
- Production Vite build with staging URL and a non-secret placeholder key — passed.
- `npm run lint` — passed with one existing hook-dependency warning in
  `src/Hooks/useDrafts.js`; no errors.
- Staging RLS check — active owner sees workspace data; non-member sees zero
  rows for workspaces, memberships, campaigns, and goals.
- Staging privilege check — private helpers are executable by authenticated,
  not anonymous/public; no public helper functions remain; all 47 policies use
  private references.
- Security advisor — targeted helper/search-path warnings are cleared; only the
  intentional `create_workspace` and independent leaked-password warnings remain.

## Decisions made

- DEC-011: consolidate CWS OS routes under `/admin`.
- DEC-012: repository markdown memory and workspace knowledge records remain
  separate.
- DEC-013: keep RLS helpers in a non-exposed schema while preserving policy
  evaluation privileges.

## Assumptions

- Staging remains non-production and contains no production client data.
- The remote migration versions are authoritative; local filenames now match
  the versions recorded by staging.

## Known issues

- The intentional `create_workspace` security-advisor warning remains.
- Supabase leaked-password protection remains disabled.
- No Vercel deployment or manual browser smoke test was performed in this turn.
- Local `main` is ahead of `origin/main`; nothing was pushed.

## Recommended next task

Decide whether to accept or separately remediate the two remaining advisor
warnings, then commit/push the validated local changes and smoke-test Preview
login, `/admin` pages, and legacy `/workspace` redirects.

## Questions requiring Tulio

- Should leaked-password protection be enabled in the staging Auth settings?
- Should the intentional authenticated `create_workspace` RPC warning remain
  accepted for the MVP?
- When ready, should the local commits be pushed to `main` and deployed?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/decisions.md`
- `docs/learnings.md`

## Permanent decisions added

- DEC-013 was added after explicit approval of the private-schema helper design.

## Reusable learnings added

- The existing RLS helper learning was extended with the verified private-schema
  pattern and member/non-member results.

## Memory updates withheld

- No decision was recorded about enabling leaked-password protection,
  accepting the remaining advisor warnings permanently, pushing, or deploying.

## Git diff summary

- Existing implementation commits remain local and unpushed.
- Local migration history is aligned with the two timestamped remote migrations.
- One new corrective migration and the required project-memory updates are
  currently uncommitted.
