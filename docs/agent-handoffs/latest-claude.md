Task ID: CWS-ADMIN-GLASS-20261108
Agent: Claude
Objective: Apply the owner-approved graphite + glass admin look and make the side panel sticky.

Files changed:
- `src/components/admin/admin-theme.css` (new, scoped to `.cws-admin`)
- `src/components/admin/AdminLayout.jsx` (new shell, sticky sidebar / phone top bar)
- `src/pages/admin/AdminOverview.jsx` (date line, "Do next", Laya sections folded)
- `src/pages/admin/SalesPage.jsx` (compact lead rows, secondary actions in a "…" menu)

Findings: `overflow-x: hidden` on both html and body (src/index.css) disables sticky positioning site-wide; admin overrides it with `overflow-x: clip` via `:has(.cws-admin)`. Public `article h2/h3/p/a` styles leak into admin cards; reset with `:where(.cws-admin)` so page Tailwind classes still win.

Tests run: `src/pages/admin`, `src/components/admin` (146 passed); eslint clean on changed files; local browser check with stubbed auth and data (CEO Today, Sales desktop + 390px, Accounting).

Not changed: API, data, behavior; other pages restyled only through the theme layer. Design mock lives on the owner's Design canvas (CEO Today + Sales).

Next: owner checks the Vercel preview and merges; optional follow-up: money tiles on CEO Today from Accounting data.
