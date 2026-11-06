Task ID: CWS-INTAKE-20261106 (local tracking ID)
Agent: Codex
Objective: Config-driven public client intake in the CWS website, combining website essentials and the service picker.
Files inspected: AGENTS.md; .agents/codex-project-instructions.md; product-definition, technical-conventions, decisions, learnings, current project log/ledger/handoff; App.jsx; global styles/fonts; Vite and Vercel routing; existing client-portal handler and Resend helper; environment registry; build scripts and canonical tests.
Files changed: Config, schema/model, intake UI/styles, Vite API/404 plugin, server intake handler/config loader, build generation, App routes/loader exception, existing API dispatch, Vercel headers/rewrites/bundling, env example/registry, focused tests, docs/client-intake.md and these handoff/log/ledger records.
Database or API changes: New logical POST /api/intake through the existing serverless function. No database or Google Sheets writes. Existing intake path unchanged.
Security decisions: Env-only recipient/sender; schema and byte validation; honeypot; bounded expiring per-instance hashed-IP rate limit; server-derived subject/summary; deterministic email idempotency; no answer logging. Noindex is not authorization.
Decisions made: Follow Vite/React Router and existing bundled Clash font; all client prompts in src/content/intake/sherry.json. Generate only configured HTML pages; exclude intake from SPA catch-all and sitemap. Twelve candidate services; only two supplied presets; all statuses initially unanswered.
Assumptions: User's request to mix the two proposals includes optional service candidates from the picker. These are not capabilities or approved public marketing claims. A separate production-wide rate limit is not configured.
Tests added: 20 intake schema/model/email/UI tests, including failure/fallback, autosave, reset, order, unknown slug and honeypot/rate/size validation. Provider calls mocked.
Tests run: Lint passed. 899 tests across 91 files passed. Production build with local placeholder client env passed. Built HTML/noindex/canonical/sitemap assertions passed. Local HTTP known 200 / unknown 404 passed. Browser checked at 390 and 1280px without horizontal overflow; inspected mobile targets at least 44px.
Known issues: Live email delivery and deployed Vercel routing/headers remain unverified. INTAKE_NOTIFY_EMAIL and existing Resend variables must be configured in the chosen target. Rate limit is per warm process. Existing CWS dependency audit warnings are outside scope. No full assistive-technology certification claimed.
Recommended next task: Owner review of https://cws-pah0j4d4t-t00lio-s-team.vercel.app/intake/sherry; configure the intake recipient and authorize a delivery test separately.
Questions requiring Tulio: Exact INTAKE_NOTIFY_EMAIL destination for the chosen preview/production environment.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No system memory update. No production setup or delivery claim.
Git diff summary: Isolated /private/tmp/cws-client-intake checkout, branch codex/client-intake based on 0900711. Original CWS dirty checkout and Cherry repository untouched. Implementation pushed as cc486e47bf9de158035c3c1038effcb433a6dc11; preview dpl_YAwkVE4YSCpxKeBano3vvxmtAGJ4 is READY. Main and production unchanged.

Preview release receipt (2026-11-06): Owner authorized branch push and preview only. GitHub branch codex/client-intake contains cc486e4. Vercel Git integration built that exact commit; READY and no alias error verified via deployment API. No production promotion, domain change or real email send. Browser behavior and hosted route headers are not reverified in this release turn. Preview access may require Vercel sign-in.
