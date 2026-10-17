Task ID: CWS-BIZ-MODEL-20261017
Agent: Claude
Objective: Give agents durable business-model context (offer, pricing, go-to-market) without bloating the product definition.

Files changed:
- `docs/business-model.md` (new): one-line model, target customer, positioning, offer and pricing table, fee rules, ownership and promises, client acquisition, economics and targets, price-change rules, agent rules.
- `AGENTS.md`: one pointer to `docs/business-model.md` for Sales, Marketing, offer, pricing, and proposal work.
- `docs/task-ledger.md`, `docs/project-log.md`: entries for this task.

Files inspected: `AGENTS.md`, `.agents/claude-project-instructions.md`, `docs/product-definition.md`, `docs/task-ledger.md`, `docs/project-log.md` (tail), `docs/agent-handoffs/latest-claude.md`, `docs/accounting/profitability-and-catalog.md`.

Tests run: none (docs only).

Decisions:
- Business model lives in its own doc, referenced from `AGENTS.md`, instead of expanding the product definition (which stays the CWS OS scope document).
- Content is limited to owner-approved terms from the October 2026 offer work. No client names, contacts, or financials (public repo).

Not done / follow-ups:
- The `offers` catalog draft descriptions (2026-10-11) may still describe the earlier waived setup fee. Sync them to §4 in a separate ticket.
- No `docs/decisions.md` entry was added; the pricing terms are recorded in the business-model doc only.

Memory updates withheld:
- A DEC entry for "business model doc is the pricing source of truth" — needs Tulio's explicit approval.

Recommended next step (owner): review and merge the PR.
