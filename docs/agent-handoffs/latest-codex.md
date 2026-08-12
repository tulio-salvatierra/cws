# Latest Codex Handoff

Task ID: CWS-GENERATION-TEST-009
Agent: Codex
Objective: Add the first protected, non-publishing content-generation test for the Cicero Web Studio English channel brief.

## Files inspected

- `.agents/codex-project-instructions.md`
- `.env.example`
- `.gitignore`
- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `api/published.js`
- `api/__tests__/published.test.js`
- `src/pages/admin/AgentRunsPage.jsx`
- `src/pages/admin/__tests__/WorkspacePagesSmoke.test.jsx`
- `src/lib/supabase.js`
- `src/Hooks/useAuth.js`
- `src/components/admin/AdminLayout.jsx`
- `supabase/migrations/008_channels.sql`
- `supabase/migrations/011_agent_runs.sql`
- `supabase/migrations/20260809195932_016_channel_brief.sql`
- `package.json`
- `vercel.json`
- Current OpenAI GPT-5.6/Responses guidance and Supabase Auth/Data API guidance

## Files changed

- `.env.example`
- `api/generate-draft.js`
- `api/__tests__/generate-draft.test.js`
- `src/pages/admin/AgentRunsPage.jsx`
- `src/pages/admin/__tests__/AgentRunsPage.test.jsx`
- `vercel.json`
- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Database or API changes

- Added authenticated `POST /api/generate-draft` as a Vercel function with a 60-second maximum duration and a 45-second outbound model timeout.
- The endpoint validates the Supabase access token, requires an active workspace membership, resolves the workspace-owned channel and active language brief, and never trusts a client-supplied workspace ID.
- Each request creates an immutable `propose` agent run, transitions it from `queued` to `running`, then to `needs_review` or `failed`.
- The run input records the channel, language, topic, brief ID, brief version, and exact brief snapshot used. The output records the draft, model, OpenAI response ID, channel identity, language, brief identity/version, and generation timestamp.
- OpenAI Responses uses `gpt-5.6-sol` by default with low reasoning, `store: false`, a hashed safety identifier, and no tools.
- No schema migration, campaign mutation, content-variant mutation, approval mutation, publish call, webhook, or n8n integration was added.

## Security decisions

- `OPENAI_API_KEY` and the Supabase service-role key remain server-only and are never exposed through `VITE_` variables or returned to the browser.
- The OpenAI key named `CWS content generator` was created through the secure Platform flow for Tulio's Default project and stored only in the ignored local `.env.local` file.
- Authentication uses `supabase.auth.getUser(accessToken)` server-side; authorization then checks the user's active `workspace_members` row before any service-role database action.
- The client sends only its current bearer token, channel/language selection, and topic. Workspace ownership is resolved server-side.
- Model instructions explicitly define the result as a proposal and prohibit claims of approval, scheduling, or publication.

## Decisions made

- No permanent decision was added.
- Task-level defaults are the existing `cicero-web-studio` channel, English, `gpt-5.6-sol`, low reasoning, and a human-review terminal state.
- The first implementation persists the proposal in `agent_runs.output` only; it does not promote the text into a content variant or approval record.

## Assumptions

- The signed-in pilot account has one relevant active workspace membership and the Cicero Web Studio channel slug remains `cicero-web-studio`.
- The existing `agent_runs` lifecycle is the smallest safe persistence boundary for a first generation test.
- A later ticket will decide whether reviewed generated text becomes a content variant, approval request, or another first-class record.

## Tests added

- Missing bearer token is rejected before a Supabase client is created.
- An authenticated user without active membership is denied and OpenAI is not called.
- A successful request records a brief-grounded `propose` run, exact brief snapshot, low-reasoning Responses request, and `needs_review` output.
- An OpenAI rejection records a terminal failed run and safe error message.
- The Agent Runs UI sends the current access token and displays the generated draft with its brief version.

## Tests run

- Focused generation tests: 2 files, 5 tests passed.
- Full Vitest suite: 26 files, 87 tests passed.
- `npm run lint`: passed with the unchanged `src/Hooks/useDrafts.js` dependency warning.
- `npm run build`: passed; import casing passed and 432 modules transformed.
- `git diff --check`: passed.
- Live OpenAI smoke request: HTTP 200 from `gpt-5.6-sol` with the expected `CWS generation ready` response.

## Known issues

- Production has `OPENAI_API_KEY`, `GENERATION_SUPABASE_URL`, and `GENERATION_SUPABASE_SERVICE_ROLE_KEY` configured as hidden Vercel values.
- PR #13 is merged into `main`, and Production deployment `dpl_FkKgAMycjwAtKnAeVWFFT8B3YQEL` is Ready at `https://cws-two.vercel.app` with the new function included.
- Signed-in generation remains a user validation step because it intentionally creates a real `needs_review` agent run under the user's account.
- The visible first-cycle form is intentionally fixed to Cicero Web Studio English. Channel/language selection can be added after this path is live-verified.
- A generated proposal can be reviewed in Agent Runs but cannot yet be promoted, approved, or copied into a content variant through this workflow.
- Existing build chunk-size, third-party `eval`, dependency audit, and `useDrafts` lint warnings remain unchanged.

## Recommended next task

Run one signed-in Cicero English generation, verify the saved `needs_review` run and brief snapshot, then decide the reviewed-proposal promotion path.

## Questions requiring Tulio

- After live verification, should an accepted generated draft create a new content variant, update a selected existing variant, or remain a reviewed agent-run proposal until a later workflow is designed?

## Project-memory files updated

- `docs/agent-handoffs/latest-codex.md`
- `docs/project-log.md`
- `docs/task-ledger.md`
- `docs/learnings.md`

## Permanent decisions added

- None.

## Reusable learnings added

- Persist an immutable snapshot of editable prompt-source records in the agent run; a version reference alone cannot reconstruct the exact generation context when that version's content can still change.

## Memory updates withheld

- The model choice, reasoning effort, hard-coded first channel/language, prompt wording, and future promotion behavior remain task-level implementation choices rather than approved permanent decisions.
- No automatic publishing, n8n integration, variant promotion, or approval behavior was added to permanent memory.

## Git diff summary

PR #13 merged as `2a1e1cd`; Production deployment `dpl_FkKgAMycjwAtKnAeVWFFT8B3YQEL` is Ready and aliased to `https://cws-two.vercel.app`, `https://cicerowebstudio.xyz`, and their companion aliases. The release adds one protected generation endpoint, five focused API/UI tests, the non-publishing Agent Runs form and result display, server-only environment documentation, a bounded function duration, and required project-memory updates. No migration, seed, legacy table, n8n workflow, or publishing route changed.
