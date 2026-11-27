Task ID: MCP-READ-002
Agent: Claude
Objective: Finish the v1 tool set from the MCP-READ-001 spec (DEC-041). Every tool is read-only.

Files changed:
- `server/mcp/reads.js` (new): reads scoped to the workspace, SELECT only.
  - `readLeads`: excludes `is_test`. Email and phone are left out unless `include_contact` is passed.
  - `readPromisedActions`: open promises with Chicago-date state (overdue, due_today, upcoming, no_date). Promises on test leads are dropped.
  - `readProjects` / `readProject`: use `buildOperationsReadModel`. No client contact info. Completed and paused projects are hidden by default.
  - `readAccounting`: uses `buildAccountingReadModel`. Receipt `reference_note` is never selected. The note explains that the CEO Today MRR tile also counts agreements.
  - `readComplianceDue`: active items that are overdue, due, approaching, unverified, or inside the window (1–90 days, default 30).
- `server/mcp/tools.js`: registers the six new tools with zod input validation and `readOnlyHint`. Every result passes through `stripSecrets`.
- Tests: `server/mcp/__tests__/reads.test.js` (12 new, fixture data only); `mcp.test.js` now expects 7 tools.
- `docs/verification/mcp-read-001-2026-11-27.md`: live production check of MCP-READ-001 (`get_ceo_today`). All checks passed.
- `docs/task-ledger.md`, `docs/mcp-read-001-spec.md`: status updates.

Tests run: full Vitest 1060/1060, eslint clean, build passed. No migration needed.

Notes: the owner pasted the plaintext token into the conversation. It was used for the read-only live check. Recommend revoking it and issuing a new one.

Next: merge, then a live check of each new tool with the owner's token.
