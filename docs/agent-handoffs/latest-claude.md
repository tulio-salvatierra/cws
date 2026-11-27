Task ID: MCP-READ-001
Agent: Claude
Objective: Build the first slice of DEC-041. Give the owner's own Claude client read-only MCP access to CWS OS, starting with CEO Today. This is the dogfooding experiment that will inform future Negocio Listo features.

Files changed:
- `supabase/migrations/20261127170000_mcp_tokens.sql`: `mcp_tokens` stores only a SHA-256 hash and a short display prefix. Tokens never expire; the owner revokes them. The table is service-role only, and after issue only `last_used_at` and `revoked_at` can be updated. **Not applied yet.** Rename the file to the exact remote version after apply.
- `server/mcp/tokens.js`: generates `cws_mcp_` tokens and handles hash lookup, the active-owner recheck on every request, and owner list/create/revoke.
- `server/mcp/tools.js`: the `get_ceo_today` tool (readOnlyHint) returns a compact summary. `stripSecrets` deep-removes `*_token`, snapshots, and provider references.
- `server/mcp/handler.js`: stateless SDK `McpServer` plus a web-standard streamable HTTP transport (JSON responses). POST only; GET and DELETE return 405.
- `api/ceo-today.js`: routes `?mcp=1` to the MCP handler before session auth. Adds the owner POST actions `mcp_token_create` / `mcp_token_revoke`, the owner GET `view=mcp_tokens`, and `loadMcpCeoToday` (same next-move visibility as the admin, no signing).
- `vercel.json`: rewrite `/api/mcp` → `/api/ceo-today?mcp=1`. No new function, so we stay at 12.
- `vite.config.js`: dev middleware for `/api/mcp`.
- `src/pages/admin/McpTokens.jsx` and `AdminOverview.jsx`: a "Claude connection (MCP)" panel on CEO Today for owners. It shows the token once, gives the `claude mcp add` command, and has confirm-to-revoke.
- `server/mcp/__tests__/mcp.test.js`: 15 tests, using fixture data only.
- `package.json`: adds `@modelcontextprotocol/sdk` 1.32.2 and `zod` 4.

Tests run: full Vitest 1048/1048, eslint clean, `npm run build` passed. No live check yet, because the table does not exist in production.

Next: the owner approves applying the migration to `cws-os-staging` (production). Then check migration parity, open the PR, merge, create a token in CEO Today, run `claude mcp add`, and compare `get_ceo_today` with /admin. Record the result in `docs/verification/`. More tools (leads, promises, projects, accounting, compliance) follow in later PRs.
