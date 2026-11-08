Task ID: CWS-ADMIN-UI-20261108
Agent: Claude
Objective: Audit the live admin dashboard and apply the owner-selected UI fixes (1, 2, 5, 9).

Files changed:
- `src/components/admin/AdminLayout.jsx` (sticky desktop sidebar, admin tab title)
- `src/App.jsx` (skip intro loader on /admin)
- `server/laya/deal-fit.js` (dollars instead of cents in check text)
- `src/lib/adminFormat.js`, `src/lib/__tests__/adminFormat.test.js` (new: Chicago date-time, key humanizer)
- `src/pages/admin/LayaResponseHistory.jsx`, `src/pages/admin/LayaOwnerResponse.jsx` (readable timestamps; disclaimer behind toggle)
- `src/pages/admin/MarketingPage.jsx` (shared provider error shown once)
- `src/pages/admin/__tests__/LayaOwnerResponse.test.jsx`, `src/pages/admin/__tests__/MarketingPage.test.jsx`

Findings (live audit, 2026-11-08): sidebar scrolled away on long pages; intro loader and public SEO title on /admin; raw cents, ISO timestamps and UUIDs in Laya text; Friday Post B showed one Instagram aspect-ratio error under all four channels.

Tests run: `src/pages/admin`, `src/components/admin`, `server/laya`, `adminFormat` (395 passed); eslint clean. Full suite not run against a complete checkout (trimmed copy lacked `public/`).

Not changed: accent colors, CEO Today layout, Sales card density, history filter layout, publishing behavior when one channel rejects the post.

Next: owner pushes `claude/admin-ui-fixes`, checks the Vercel preview, merges; then chooses among deferred items.
