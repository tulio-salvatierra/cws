Task ID: CWS-ALIGN-20261016
Agent: Claude
Objective: Align the repo and its docs with the system that actually runs in production, so future work stops second-guessing.

Files inspected:
- `docs/` (product definition, decisions, ledger, project log, learnings, conventions, handoffs), `AGENTS.md`, `.agents/*`, `src/App.jsx`, `src/components/admin/AdminLayout.jsx`, `api/ceo-today.js`, `vercel.json`
- All remote branches
- Production Supabase: table row counts, `supabase_migrations.schema_migrations`

Files changed:
- `main` fast-forwarded to `codex/ceo-today-integration` (`9f799c7`). Production was already running that code.
- `docs/product-definition.md`: rewritten as v2 (approved).
- `docs/decisions.md`: added an index, normalized DEC-027 and closed its follow-ups, fixed the phantom DEC-021 reference (now DEC-030), added DEC-032 and DEC-033.
- `docs/technical-conventions.md`: corrected the stack, added environments, migration-parity, and definition-of-done sections.
- `AGENTS.md`, `README.md`, `.agents/*-project-instructions.md`: removed stale n8n and "no tests" claims.
- `supabase/migrations/`:
  - Renamed 20 files to their exact remote versions. Content was verified identical to the applied SQL by whitespace-normalized MD5.
  - Recovered `20260820213137_content_variant_channel_id.sql` (exact applied SQL).
  - Recovered `20261011194152_client_projects.sql` as schema only; the real client seed row was omitted because the repo is public.
- Updated migration file references in two migration tests and two verify scripts.
- Task ledger: backfilled 12 milestones from Sep 10 to Oct 11.

Tests run:
- Local versions compared with remote history: 62 of 62, zero differences.
- `npm run test:run` — see the project log entry.

Decisions made:
- DEC-032 (owner-approved): v2 scope. Content Operations is frozen, the live system is English-only, CWS-001 ships as a Marketing creative asset, and the authority model is AUTO/PREPARE/CONFIRM.
- DEC-033: one new destination proven end-to-end before adding another.

Not merged on purpose:
- `agent/n8n-dry-run-bridge` (retired, DEC-030).
- Old `agent/*` branches. Their changes already landed through squash PRs, or they belong to the frozen layer.

Problems discovered:
- `client_projects` has no `workspace_id`, which breaks DEC-007. Every authenticated user can read every row. It is acceptable for a solo owner but must be fixed before any second user exists.
- The applied `client_projects` migration seeded real client data. Keep seed data out of migrations in this public repo.
- Applying a migration through MCP assigns a new timestamp. Rename the local file afterwards (now a convention).

Recommended next actions (owner):
1. Finish the CWS-001 English master in Final Cut Pro.
2. Confirm Post A, the first four-channel post.
3. Resume 5 outreach emails a day.

Recommended next ticket: OFFER-CREATIVE-001 (link the offer catalog to Marketing slots).
