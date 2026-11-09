Task ID: CWS-CEO-MONEY-20261108
Agent: Claude
Objective: Ship the graphite + glass admin PR and add money tiles to CEO Today.

Files changed:
- `api/ceo-today.js` (`money` snapshot: accounting summary + active agreement monthly revenue)
- `src/pages/admin/AdminOverview.jsx` (MoneyTiles, links to Accounting)
- `api/__tests__/ceo-today.test.js`, `src/pages/admin/__tests__/AdminOverview.test.jsx`

Findings: CEO Today already built the accounting read model for its projection, so the tiles need no new query; the Accounting endpoint adds active agreement monthly revenue to MRR, mirrored here so both pages show the same number.

Tests run: ceo-today API, src/pages/admin, server/ceo, server/accounting (266 passed); eslint clean; local browser check with stubbed data.

Not changed: Accounting page, data, write paths.

Next: owner confirms the CEO Today tiles match the Accounting page in production.
