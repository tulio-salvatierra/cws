# RETIRE-001 — code retirement

2026-10-17. Review after DOCS-V3 (#28). No database changes, data exports, or production table drops.

## Scope

Removed dormant planning/knowledge/content pages, the old agent-run page, unused channel overview, keyword hook, review/archive widgets, and their tests. Removed their route redirects, both draft-generation endpoints, Vercel function entries, and the local Vite generation handler. Updated remaining back links to CEO Today.

Live Laya paths depended on the retiring brief table. They now use workspace-scoped `channels` audience/voice with source ID and update timestamp in each new snapshot. Historical `agent_runs` snapshots and review receipts remain intact. New context has no invented language, brief version, geography, topics, or examples; absent fields display Not specified. The existing advisory protocol and authority behavior are unchanged; this is not LAYA-001.

The publication webhook no longer copies either old planning relationship ID into `published_posts`. The full original webhook payload remains historical provider evidence, not a relational write. No runtime code writes either retired relationship column on `outreach_sends`.

## Reference audit

Searched all 20 retiring table names, the topic view, and draft-review RPC across source, APIs, server helpers, scripts, tools, and Supabase tests. No database access remains to these objects outside historical migrations/generated types. Removed obsolete topic pgTAP tests and the learning assertions from the mixed publication/decision pgTAP test; retained live publication and `decisions` checks (plan reduced from 22 to 12).

Literal word matches remain in public marketing prose, SEO keywords, ordinary project/task variable names, and historical documentation. `channel_brief` remains only as the existing Laya HTTP protocol field in the transport, its test, and the local service/example. It no longer names a database dependency. Preserving this wire key avoids breaking the separately configured Laya service.

## Validation

- Full Vitest suite: 406 tests passed across 53 files after removal of obsolete tests.
- ESLint passed.
- Import casing and Vite test-mode build passed.
- Production build passed with existing local public Supabase client configuration (no credential values logged or committed).
- Targeted coverage exercises workspace-scoped channel context, immutable snapshot creation, retained history/review, no inference from GET, Marketing caption preview/confirmation, and rejection of retired relationship writes.
- No pgTAP execution: no local database was started; production was not used as a test database.
- Production browser baseline: authenticated CEO Today loaded. This does not verify the pending branch deployment.

## Remaining release checks

Merge DOCS-V3 first, retarget this PR to main, review and merge RETIRE-001, then verify the deployed commit, all six authenticated surfaces, and one Marketing publish preview without confirming a post. RETIRE-002 remains out of scope; do not apply the supplied drop SQL.
