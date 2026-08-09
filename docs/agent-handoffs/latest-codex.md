# Latest Codex Handoff

Task ID: CWS-N8N-ASSESS-006
Agent: Codex
Objective: Audit the renewed n8n Cloud instance, reconcile it with the current application and live Supabase schema, and produce a read-only operational checklist.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/pilot-readiness.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `src/components/admin/GenerateButton.jsx`
- `src/components/admin/ContentQueue.jsx`
- `src/pages/admin/SettingsPage.jsx`
- `src/Hooks/useDrafts.js`
- Legacy analytics, calendar, and published-card status consumers
- All serverless routes under `api/`
- `vite.config.js`
- `.env.example`
- All five `n8n/*.md` setup documents
- Relevant legacy Supabase migrations and the live schema/migration history
- Live n8n workflow, execution, trigger, node configuration, and credential-name views
- Production Vercel environment-variable names

## Files changed

- `docs/n8n-assessment.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

None. Live Supabase queries were read-only. No workflow, credential, environment variable, Vercel route, migration, or database row was changed.

## Security decisions

- No workflow was triggered, tested, published, unpublished, enabled, disabled, edited, duplicated, or exported.
- Credential names and visible error indicators were inspected; credential values were never opened or copied.
- Unauthenticated browser-facing n8n webhooks were recorded as a risk. A future server-side relay and signed inbound return route are recommendations only.
- No service-role key or secret was exposed.

## Decisions made

- None. DEC-004 remains the governing boundary.
- Revive versus retire, database authority, WF4/WF5 identity, and approved publishing platforms remain Tulio decisions.

## Assumptions

- A workflow showing `Published` is treated as active configuration, not as evidence of successful operation.
- Because execution retention is seven days and no records remain, exact 90-day counts and last success/failure timestamps are unavailable.
- Compatibility checks compare live n8n payloads with current project `ddbhxqkckzpwzwvnoxqt`; the workflows' target project `ugxipyozzhvqoqenygiz` could not be accessed through the connected Supabase account.

## Tests added

None. This was an assessment ticket.

## Tests run

- `npm ci` — passed.
- Production `npm run build` with valid placeholder client Supabase variables — passed; 430 modules transformed.
- `npm run lint` — passed with one existing `src/Hooks/useDrafts.js` dependency warning.
- `npx vitest run` — 22 files, 68 tests passed.
- Live n8n and Supabase inspections — read-only.

## Known issues

- Five workflows are published but have no retained execution evidence.
- Nothing active publishes to social platforms.
- The active workflows target an older, inaccessible Supabase project.
- WF3, WF4, and WF5 contain schema/status writes incompatible with the current live database.
- The unpublished publisher contains unresolved placeholders and lacks named social OAuth credentials.
- Production lacks `VITE_N8N_WF2_WEBHOOK_URL`.
- Approval only updates Supabase and does not invoke n8n.
- The Settings page shows hardcoded healthy labels.
- Seven-day execution retention prevents a reliable 90-day operational history.

## Recommended next task

Tulio first decides revive or retire. If reviving, run a separately authorized contract-recovery task that chooses the authoritative database, exports the selected live workflows, ratifies WF4/WF5 identities, and designs schema/status alignment before any credential or execution testing.

## Questions requiring Tulio

- Revive or retire the legacy n8n pipeline?
- Recover `ugxipyozzhvqoqenygiz` or retarget a revived pipeline to `ddbhxqkckzpwzwvnoxqt`?
- Keep live WF4 compiler and WF5 scheduler, or implement the documented publisher and keyword roles?
- Which social platforms remain in scope, and are sandbox accounts available?
- Authorize workflow export in a follow-up ticket?
- Retain execution outcomes for at least 90 days outside n8n?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

None.

## Reusable learnings added

- Operational status must come from an observed signal; otherwise show `Unknown`.
- Verify live schema and applied migrations before acting on documentation-based schema claims.

## Memory updates withheld

- Revive versus retire is unapproved.
- Database authority is unresolved.
- WF4/WF5 canonical identities are unresolved.
- Publishing platform scope and workflow-export authorization are unresolved.

## Git diff summary

Read-only assessment documentation only: one new n8n assessment, refreshed Codex handoff, one appended project-log entry, one task-ledger row, and two verified reusable learnings. No application code, SQL, migration, dependency, workflow, credential, environment, or remote system was changed. The assessment package was committed and pushed on `agent/cws-n8n-assessment-006`; no unrelated changes were included.
