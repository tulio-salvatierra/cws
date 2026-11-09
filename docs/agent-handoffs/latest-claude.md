Task ID: CWS-NL-SIGNED-20261109
Agent: Claude
Objective: One "Signed" action that puts a Negocio Listo deal into Accounting and Square under DEC-040.

Files changed:
- `server/accounting/negocio-listo-signing.js`, `server/accounting/square.js` (new), `server/accounting/handler.js` (route)
- `supabase/migrations/20261109163646_schedule_agreement_billing.sql` (applied to production; version verified)
- `src/pages/admin/SignNegocioListoForm.jsx` (new), `RecentLeads.jsx` ("Signed…"), `ClientAgreements.jsx` + `AccountingPage.jsx` ("Record Negocio Listo signing")
- `env.keys.js`, `.env.example` (`SQUARE_ACCESS_TOKEN`)
- Tests: `server/accounting/__tests__/negocio-listo-signing.test.js`, `src/pages/admin/__tests__/SignNegocioListoForm.test.jsx`

Findings: Square already had per-client static plans (Upholstery $150, 12 periods then ongoing) and a relative-price Carolina plan; the new flow creates one plan per tier and reuses it. Subscriptions are created without a card, so Square emails an invoice each month; a card the client saves in Square takes over automatically.

Tests run: server/accounting + src/pages/admin (188 passed); eslint clean. Not run against live Square (no test charge made).

Not changed: existing manual agreement flow, Sherry's records (her written terms differ; owner deciding).

Next: first real signing verifies the Square path end to end; build Square → Accounting payment sync (webhook) when ready.
