# Latest Codex Handoff

Task ID: CWS-CHANNEL-BRIEF-008
Agent: Codex
Objective: Add independent, versioned channel briefs before any generation workflow and let publish records identify the brief version that produced them.

## Files inspected

- `.agents/codex-project-instructions.md`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/n8n-assessment.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `supabase/migrations/008_channels.sql`
- `supabase/migrations/015_published_posts_return_path.sql`
- Existing migration filenames and live staging migration history
- `api/published.js`
- `api/__tests__/published.test.js`
- Live staging channels, active workspace membership, security advisor, RLS behavior, constraints, and persistence

## Files changed

- `supabase/migrations/20260809195932_016_channel_brief.sql`
- `api/published.js`
- `api/__tests__/published.test.js`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Applied staging migration `20260809200028` (`016_channel_brief`).
- Added `public.channel_brief`, one independently authored row per channel, language, and version, with workspace/channel ownership, optional strategy fields, active state, authorship, and timestamps.
- Enforced `en`/`es`, positive versions, unique `(channel_id, language, version)`, and at most one active row per `(channel_id, language)`.
- Added the requested active workspace/channel/language index and a nullable-creator index.
- Kept identity fields immutable while allowing members to update editable brief content and active state.
- Added nullable positive `published_posts.brief_version` and made it immutable with the other publication identity fields.
- `POST /api/published` now accepts an optional positive integer `brief_version`, retains it in `raw_payload`, and persists it to `published_posts`. Absent remains valid.
- English and Spanish have no parent, translation, inheritance, or defaulting relationship.

## Security decisions

- `channel_brief` follows migration 015's access model: `anon` receives no access; active workspace members may select and update; inserts and deletes remain service-role/SQL operations.
- RLS uses `private.is_workspace_member(workspace_id)` under `TO authenticated`, with both `USING` and `WITH CHECK` on update.
- Composite `(channel_id, workspace_id)` ownership prevents cross-workspace channel references.
- Identity protection prevents moving a brief between workspaces/channels/languages/versions and prevents changing a recorded post's `brief_version` after publication.
- The security advisor reported the same two pre-existing warnings before and after migration 016; no new warning was introduced:
  - [Authenticated SECURITY DEFINER function executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) for the intentional `create_workspace` RPC.
  - [Leaked password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Decisions made

- No permanent decision was added.
- Applied existing DEC-007, DEC-008, and DEC-025 without expanding them.
- Kept English and Spanish briefs as independent siblings, as required by the product definition and ticket.

## Assumptions

- `channel_brief` is singular because the ticket names the table explicitly.
- `created_by` remains nullable for SQL/service-authored setup rows, matching the ticket.
- Brief content may be edited in place while active, but channel/language/version ownership and any post's recorded brief version are historical identity.

## Tests added

- Optional `brief_version` absent: request remains valid and the insert omits the column.
- Optional `brief_version` present: a positive integer is persisted.
- Invalid versions: zero, negative, fractional, string, and null values return HTTP 400 before a database client is created.

## Tests run

- `npm ci` — passed.
- Focused API test — 1 file, 12 tests passed.
- Production build with valid placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — passed; import casing passed and 432 modules transformed.
- `npm run lint` — passed with the existing `src/Hooks/useDrafts.js` dependency warning.
- `npx vitest run` — 24 files, 82 tests passed.
- Pre-migration security advisor — two existing warnings.
- Post-migration security advisor — the same two warnings; no new findings.
- Staging migration history — `20260809200028 016_channel_brief` is applied after migration 015.
- Manual staging briefs — active English version 1 and active Spanish version 1 coexisted for the Cicero Web Studio channel.
- Duplicate active Spanish brief — rejected by `channel_brief_one_active_language_uidx` with Postgres `23505`.
- RLS — the active member saw both verification briefs; a fabricated non-member saw zero.
- Persistence — staging stored and returned `published_posts.brief_version = 1`; a member attempt to change it afterward was rejected as immutable.
- Cleanup — all temporary brief and published-post rows were deleted and confirmed at zero.

## Ready-to-run brief insert template

Create English and Spanish rows separately. Replace every placeholder with independently authored content; do not copy or derive one language from the other.

```sql
insert into public.channel_brief (
  id,
  workspace_id,
  channel_id,
  language,
  version,
  audience,
  geography,
  tone,
  topics_allowed,
  topics_forbidden,
  cta,
  example_good,
  example_bad,
  target_cadence_days,
  is_active,
  created_by,
  created_at,
  updated_at
)
values (
  uuid_generate_v4(),
  '<workspace-uuid>'::uuid,
  '<channel-uuid>'::uuid,
  '<en-or-es>'::text,
  1,
  '<independently authored audience>'::text,
  '<geography>'::text,
  '<tone>'::text,
  array['<allowed topic 1>', '<allowed topic 2>']::text[],
  array['<forbidden topic 1>']::text[],
  '<call to action>'::text,
  '<good example>'::text,
  '<bad example>'::text,
  7,
  true,
  '<creator auth user uuid>'::uuid,
  now(),
  now()
);
```

Before activating a later version for the same channel and language, deactivate the current row in the same transaction; the partial unique index deliberately rejects two active versions.

## Known issues

- Vercel correctly does not export Sensitive Production values through `env pull` or `env run`. Therefore the updated undeployed local handler could not complete an end-to-end authenticated HTTP request with Production credentials. The 12 endpoint tests prove request validation/mapping, and a privileged staging insert separately proved database persistence and immutability.
- The endpoint change is local only because this ticket says not to push. Production does not accept `brief_version` until these commits are later pushed and deployed.
- Migration 015 already added the `content_variants` outcome columns referenced by the ticket. This task did not modify them.
- Migration 014, UI, workflow, cadence, generation, publishing, CWS-001, and retired n8n assets remain untouched.
- The existing hook, build chunk-size, and third-party `eval` warnings remain unchanged.

## Recommended next task

Author and insert the real English and Spanish briefs independently for each approved channel, then push/deploy this ticket before any generation workflow is built.

## Questions requiring Tulio

- What independently authored English and Spanish strategy content should populate the first real Cicero Web Studio brief rows?
- Should the Drum Practice channel receive its first briefs in the same content-authoring pass?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None. DEC-021 through DEC-024 and DEC-026 remain unratified; DEC-025 was already recorded.

## Reusable learnings added

- Create the strategy table before any generation workflow so strategy cannot begin as an unversioned, hardcoded prompt that later becomes impossible to reconstruct.

## Memory updates withheld

- No brief wording, audience definition, cadence, topic list, generation contract, workflow choice, or publishing scope was added to permanent memory because none was approved or verified by this task.
- No new decision was added.

## Git diff summary

Two local commits only: migration 016, followed by the endpoint/tests/project-memory update. Migration 016 is applied to staging. No push, deployment, workflow, UI, Production environment, social credential, CWS-001 record, or retired n8n asset was changed.
