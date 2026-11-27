# MCP-READ-001 — Read-only CWS OS MCP server (sketch)

Status: **draft sketch, not approved.** Governed by DEC-041 (Proposed) and the
proposed §3 rule in the product definition; build waits for approval.

Reference pattern: [lydiahallie/issue-tracker-mcp](https://github.com/lydiahallie/issue-tracker-mcp)
(Express + `@modelcontextprotocol/sdk` + zod, stateless streamable HTTP). That repo has
no license, so we copy the *pattern*, not its code.

## Goal

Let the owner ask Claude (Desktop, Code, or the Claude Project) questions about live
CWS OS state — "what's on CEO Today?", "which leads owe a follow-up?", "which projects
are blocked on the client?" — without pasting screenshots or exports.

## Authority (why this fits v3)

- Every tool is **AUTO**: it reads and derives through the same read models the admin
  uses. No tool writes, drafts, sends, publishes, or persists anything.
- No PREPARE or CONFIRM tools in v1. Laya responses, sends, publishing, and decision
  activation stay in the admin UI with their existing owner confirmations.
- This is not an in-app LLM call (§9a). The LLM runs in the owner's Claude client; the
  server only returns data. §9a already says strategy conversation happens in Claude.
- Privacy note for the DEC entry: tool results (client names, emails, amounts) go to
  Anthropic through the owner's Claude account. Owner's choice, but it should be
  written down.

## Shape

```
Claude client ──POST /api/mcp──▶ vercel.json rewrite ──▶ /api/ceo-today?mcp=1
                                                           │
                                          server/mcp/handler.js (stateless)
                                                           │
                        authenticateMcpToken() → { client, workspaceId, user }
                                                           │
                      existing read models: loadCeoToday, buildOperationsReadModel,
                      buildAccountingReadModel, buildComplianceReadModel, ...
```

- **No new function.** We are at 12 `api/*.js` files (Hobby cap). Add a rewrite
  `{"source": "/api/mcp", "destination": "/api/ceo-today?mcp=1"}` and branch at the
  top of `api/ceo-today.js` into `server/mcp/handler.js`. CEO Today already imports
  most read models, so the bundle barely grows.
- **Stateless transport**, like the reference repo: a new `McpServer` +
  `StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })`
  per request. Vercel Node functions pass Node `req`/`res`, which the SDK accepts.
  Only `POST` is served; `GET`/`DELETE` on `/api/mcp` return 405 (no SSE stream needed).
- New dependency: `@modelcontextprotocol/sdk` (zod comes with it or is added).
- Dev: add a `server.middlewares.use('/api/mcp', …)` entry in `vite.config.*`, like
  the existing laya-assess / intake ones.

## Auth

Supabase session JWTs expire in about an hour, which is useless in an MCP client
config. v1 uses an **owner-issued personal token**:

- New table `mcp_tokens` (migration with the exact remote version):
  `id, workspace_id, user_id, token_hash (sha256), label, scopes text[] default '{read}',
  created_at, last_used_at, revoked_at`. RLS on, no client policies (service role only).
- The owner creates and revokes tokens in CEO Today settings (POST, owner check, same
  as existing owner actions). The plaintext is shown once and never stored.
- `authenticateMcpToken(req)`: read `Authorization: Bearer cws_mcp_…`, hash it, look
  up an unrevoked row, re-check that the user is still an active **owner** of that
  workspace, then return the same `{ client, user, workspaceId }` context the handlers
  already use. Updating `last_used_at` is the only write. It is auth bookkeeping, not
  business data.
- Later option: Supabase OAuth server / MCP OAuth flow, so Claude.ai custom connectors
  work without pasting a token. Not v1.

## Tools (v1, all `readOnlyHint: true`)

| Tool | Input (zod) | Returns | Source |
| --- | --- | --- | --- |
| `get_ceo_today` | — | Ordered priorities, next moves, goal pace (no tokens) | `loadCeoToday` + same decoration minus `review_token` / `move_token` |
| `list_leads` | `status?`, `response_state?`, `limit≤100` | Live (non-test) leads with last contact | `leads` (`is_test = false`) |
| `list_promised_actions` | `overdue_only?` | Open Sales promises with due dates | `sales_promised_actions` |
| `list_projects` | `status?` | Projects with readiness and blocked-on-client requirements | `buildOperationsReadModel` |
| `get_project` | `project_id` (uuid) | One project, requirements, hours | same, filtered |
| `get_accounting_summary` | — | Open obligations, receipts, recurring revenue | `buildAccountingReadModel` |
| `list_compliance_due` | `within_days≤90` | Requirements due or overdue | `buildComplianceReadModel` |

Rules for every tool:

- Always scope by `context.workspaceId`; never accept a workspace id as input.
- Never return signing tokens, service keys, provider references, or raw evidence
  snapshots. Strip `review_token`, `move_token`, and `*_token` fields before serializing.
- Exclude test leads everywhere, matching CEO Today.
- Return compact JSON text content. Errors become `isError: true` with a short
  message, never a stack trace.
- Server `instructions`: "Read-only view of CWS OS. Call get_ceo_today first. Nothing
  here can send, publish, or change records; do those in /admin."

## Explicitly out of scope

Creating or updating leads, drafting emails, Laya Act/Dismiss, publishing, decision
activation, hours entry. Any of these would need its own DEC, and CONFIRM-tier actions
can never be exposed to an AI caller (§3).

## Tests (Vitest, fixture data only; the repo is public)

- Auth: missing, unknown, revoked, and non-owner tokens → 401/403. A valid token →
  context for the right workspace.
- Each tool returns only rows for the token's workspace (two-workspace fixture).
- No `*_token` key appears anywhere in any tool's output (deep scan).
- `tools/list` advertises exactly the v1 tools, all with `readOnlyHint: true`.
- GET / DELETE `/api/mcp` → 405; GET `/api/ceo-today` behaves as before.

## Build order

1. DEC entry + §3 note (read-only MCP access, privacy note).
2. Migration `mcp_tokens` + owner token create/revoke action + UI.
3. `server/mcp/handler.js` with `get_ceo_today` only; rewrite; dev middleware; tests.
4. Remaining tools, one PR each or together.
5. Live check: `claude mcp add --transport http cws https://cicerowebstudio.xyz/api/mcp --header "Authorization: Bearer …"`,
   ask for CEO Today, compare with /admin. Record in `docs/verification/`.

## Why: experiment first, product second

The website is an extension of the business. We run this on CWS first to learn what
an owner actually asks an assistant about their business. The tools that earn
repeat use become candidate Negocio Listo features or add-ons, sold the same way
Contenido is sold today.

What to watch during the experiment (owner notes in `docs/learnings.md`, weekly):

- Which tools you reach for more than once a week, and which you never use.
- Questions you asked that no tool could answer. These are the next tools, or the next product ideas.
- Moments where you wished it could *do* something. Log them; don't build them.
  Those become PREPARE or CONFIRM candidates for a future DEC.

How internal tools could map to a client's business (hypotheses to test, not commitments):

| CWS internal tool | Client version (small business) |
| --- | --- |
| `get_ceo_today` | "My business today": new website inquiries, reviews to answer, what's due |
| `list_leads` | Inquiries from the site's contact and quote forms, with who hasn't been answered |
| `list_promised_actions` | Follow-up reminders: "you said you'd call the Ramirez family Friday" |
| `list_compliance_due` | License, permit, insurance, and inspection renewal dates |
| `get_accounting_summary` | Unpaid invoices and deposits (e.g. from Square) |
| Marketing slots (not in v1) | Planned posts and Google Business Profile updates |

Before any of this reaches a client, a separate DEC has to cover:

- multi-client data isolation (each client's own workspace or project);
- consent and data-handling wording in the agreement;
- whether in-app AI is involved (§9a gate);
- add-on pricing;
- who handles support when the assistant gets something wrong.

## Open questions

- ~~Owner-only or member scope?~~ Resolved: owner-only.
- Token lifetime: no expiry plus manual revoke, or a 90-day expiry?
- Is CEO Today the right host handler, or Operations (smaller bundle)?
