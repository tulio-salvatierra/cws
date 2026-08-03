# Latest Codex Handoff

Task ID: CWS-WEB-WORKSPACE-001
Agent: Codex
Objective: Add the first protected `/workspace` operating dashboard backed by the seeded CWS OS data.
Files inspected:
- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-claude.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `src/App.jsx`
- `src/lib/supabase.js`
- `src/Hooks/useAuth.js`
- `src/components/admin/AdminGuard.jsx`
- `supabase/migrations/008_channels.sql`
- `supabase/migrations/009_campaigns_content_variants.sql`
- `supabase/migrations/010_content_variant_approvals.sql`
Files changed:
- `src/App.jsx`
- `src/pages/workspace/WorkspacePage.jsx`
- `src/components/Projects/Projects.tsx`
- `src/components/Problem/Problem.tsx`
- `src/components/Services/Services.tsx`
- `src/components/Footer/Footer.tsx`
- `src/components/Header/Header.tsx`
- `src/components/Loader/Loader.tsx`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
Database or API changes:
- Added a lazy-loaded `/workspace` route protected by the existing Supabase session guard.
- Added a read-only dashboard that loads the authenticated user's active workspace, channels, campaigns, content variants, and approvals through Supabase RLS.
- Added loading and error states and a link back to the legacy `/admin` system.
- Seeded `cws-os-staging` with two channels, `CWS-001`, and independent English/Spanish variants; no production database or migration history changed.
- Fixed case-sensitive `assets/Images` imports that passed on macOS but failed on Vercel's Linux build workers.
Security decisions:
- The dashboard requires an authenticated session through the existing `AdminGuard`.
- Data access remains RLS-enforced; the browser receives only the public Supabase key.
- The dashboard is read-only; no new mutations or publishing behavior were introduced.
- Legacy `/admin` and n8n publishing behavior remain untouched.
Decisions made:
- The first workspace surface is intentionally read-only and focused on the seeded Content Operations records.
- The initial dashboard reuses the existing authentication guard rather than introducing a second auth flow.
- No permanent decision was added.
Assumptions:
- The first active workspace returned by RLS is the workspace to display for the solo owner account.
- The existing staging owner account is used for Preview testing.
- Approval rows are shown as the latest row per variant for this first read surface.
Tests added:
- No automated repository tests were added.
Tests run:
- `npm run build` — passed locally with 408 modules transformed.
- `npm run lint` — passed with one existing `useDrafts.js` hook-dependency warning and no errors.
- Vercel Preview build — passed after correcting Linux case-sensitive asset imports.
- Staging verification — 2 channels, 1 campaign, and 2 content variants confirmed.
- Preview admin login — previously verified with zero Supabase console errors.
Known issues:
- The current test suite still has two stale admin expectation failures unrelated to this dashboard.
- Approval actions, campaign editing, tasks, goals, and the rest of the workspace navigation remain future work.
- The remote-only Supabase migration `20260730231228` still requires safe local-history reconciliation.
Recommended next task:
- Add a focused workspace navigation shell and read-only detail views for campaigns and variants, then reconcile the remote migration history before additional database work.
Questions requiring Tulio:
- None for this read-only dashboard.
Project-memory files updated:
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
Permanent decisions added:
- None.
Reusable learnings added:
- None.
Memory updates withheld:
- Workspace dashboard information architecture beyond the initial read surface remains intentionally deferred.
- Legacy admin data copying and approval mutations remain deferred.
Git diff summary:
- Added the protected `/workspace` dashboard and route.
- Corrected six case-sensitive asset imports for Linux/Vercel compatibility.
- Recorded the staging seed and validation in the project memory files.
- No production data, legacy publishing table, n8n workflow, or Supabase migration file changed.
