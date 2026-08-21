# Latest Codex Handoff

Task ID: CWS-VERCEL-CASING-029
Agent: Codex
Objective: Restore the complete Git tree and eliminate Vercel import-casing failures.

Repository:
- `/Users/tuliosalvatierra/CWS`
- Branch: `agent/n8n-dry-run-bridge`

Files changed:
- `src/pages/admin/NewVariantPage.jsx`
- `src/pages/admin/ChannelsPage.jsx`
- `src/pages/admin/WorkspacePage.jsx`
- `src/pages/admin/VariantDetailPage.jsx`
- `src/App.jsx`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

Migration:
- Adds nullable `content_variants.channel_id uuid`.
- Backfills it from each variant's workspace-scoped `campaign_id -> campaigns.channel_id` relationship.
- Fails if any row remains without a channel, then sets `channel_id` NOT NULL.
- Adds `content_variants_channel_id_workspace_id_fkey` referencing `(channels.id, channels.workspace_id)` with `ON DELETE RESTRICT`, matching the existing campaign composite-FK pattern.
- Adds `content_variants_channel_id_workspace_id_idx`.
- Drops NOT NULL from `content_variants.campaign_id`; its existing composite FK remains intact and now permits campaign-less variants.
- Does not touch campaigns, channels, published_posts, or legacy tables.

Staging verification:
- Project: `cws-os-staging` / `ddbhxqkckzpwzwvnoxqt`.
- Migration `20260820213137_content_variant_channel_id` is listed as applied.
- Staging currently contains 13 variants, not the 12 stated in DEC-027. All 13 had campaigns and resolved channels; all 13 were backfilled.
- Spot-check: `total_variants = 13`, `channel_nulls = 0`, `campaign_nulls = 0`.
- The new FK definition is present and uses `(channel_id, workspace_id) -> channels(id, workspace_id)`.
- Security advisors show only the two pre-existing warnings: callable `public.create_workspace` SECURITY DEFINER and disabled leaked-password protection. No new RLS warning was introduced.

Decisions / discrepancies:
- Used the live count of 13 as authoritative rather than the ticket's expected count of 12; no rows were modified other than the new backfill column.
- Retained existing table RLS and grants; adding a column/FK does not change row-policy intent.

Deployment:
- A clean worktree from pushed commit `1d9754222fa0cbb532b2cae90f8a97deb1a1fbc3` deployed successfully to Preview at `https://cws-5buma5s0o-t00lio-s-team.vercel.app`.
- Build and import-casing checks passed; deployment state is READY.

Implementation:
- Added `/admin/channels/:channelId/variants/new` and `/admin/variants/new` routes.
- New variant creation requires a workspace channel and permits an optional campaign filtered to that channel.
- Existing campaign-scoped creation continues to preselect its channel.
- Workspace content cards now retain campaign-less variants and show channel/campaign context.
- Variant detail includes `channel_id` and falls back to Channels when no campaign exists.

Verification:
- Focused admin tests: 23 passed.
- `npm run lint`: passed with one pre-existing exhaustive-deps warning in `src/Hooks/useDrafts.js`.
- `npm run build`: passed, including import-casing check.

Deployment:
- Production is READY at `https://cws-two.vercel.app` (deployment `dpl_FcANnh5MqnsHpfedighJpgFDY7zS`), built from commit `70bf33f`.

Verification:
- Full Vitest suite: 119 tests passed.
- Lint and build were already passed for the deployed commit.

Next:
- Confirm the live `/admin/mailing-list` route loads, then resume controlled subscriber testing.

Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: The 13-versus-12 staging count discrepancy is task-specific until the source specification is reconciled.
