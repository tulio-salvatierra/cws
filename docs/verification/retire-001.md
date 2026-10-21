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

## Production verification — 2026-10-17

- #28 merged first as `0050cfe`; #29 retargeted to main and merged as `23b5aea`.
- Vercel CWS production deployment `dpl_9DSAm9GvXzXrgTGqJno7tur3grhw` is READY for `23b5aea70f2fc062829059eeba24a54c9863946f`, with the cicerowebstudio.xyz and www aliases assigned.
- Authenticated Chrome verification on www.cicerowebstudio.xyz: CEO Today priorities/history loaded; Sales queue/prospect review loaded; Operations readiness projects loaded; Accounting summary/registers loaded; Compliance requirements/history loaded; Marketing slots, destination verification, assessment history and channel context loaded.
- Marketing overview showed image/caption preview; LinkedIn tab showed both slot image/caption previews and existing delivery results. All four destinations were verified. Both current slots were already Posted with Slot locked controls. No new action was confirmed; no caption, asset, business record, or owner review was changed.
- Found and corrected one residual Sales back link to the removed Workspace route via #30. Follow-up production commit `8af573974ce717affaa3d91ebe941bbf2784f58d` is READY; authenticated Sales loaded and clicking the corrected link reached `/admin`.
- No provider publish/send, export, SQL execution, migration, or table drop was performed.
- Separate cws-laya-release project lacks its public Supabase client variables; no configuration or credentials changed.

RETIRE-002 remains explicitly deferred. The supplied drop SQL must not be applied.
