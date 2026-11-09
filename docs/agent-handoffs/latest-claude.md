Task ID: CWS-CEO-LEADS-20261109
Agent: Claude
Objective: Show last week's leads on CEO Today and let the owner record actions there.

Files changed:
- `server/ceo/recent-leads.js`, `server/ceo/__tests__/recent-leads.test.js` (new)
- `api/ceo-today.js` (`recent_leads` in the response)
- `src/pages/admin/RecentLeads.jsx`, `src/pages/admin/__tests__/RecentLeads.test.jsx` (new)
- `src/pages/admin/AdminOverview.jsx` (list placed under "Do next")

Findings: `update_lead_sales_state` in `server/sales/handler.js` sets phone and locality to null when they are omitted; any caller must send current values (the new list does). Production on 2026-11-09: 12 phone-only prospects from batch `cws-new-business-2026-11-09` created Nov 8, none contacted yet.

Tests run: `api/__tests__/ceo-today.test.js`, `server/ceo`, `src/pages/admin` (241 passed); eslint clean; local browser check with stubbed data.

Not changed: Sales endpoint, data model, Sales page.

Next: owner calls the Nov 8 batch and logs results from CEO Today; consider making `update_lead_sales_state` keep omitted fields instead of nulling them.
