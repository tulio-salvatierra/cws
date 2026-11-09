Task ID: CWS-PUBLIC-PRERENDER-20261105
Agent: Codex
Objective: Deliver crawlable HTML for public sitemap routes and link four previously unlinked pages.
Files inspected: Product and technical conventions, canonical and intake builds, Vercel routing, public navigation and footer.
Files changed: Public prerender build, homepage rewrite, Services, Footer, Contact, animation hooks, project memory.
Database or API changes: None.
Security decisions: Capture only public sitemap paths and block external requests during prerender.
Decisions made: Use a separate homepage snapshot to keep the existing app shell available to admin and intake.
Assumptions: Existing React startup replaces static snapshots.
Tests added: Build assertions for rendered headings, links and application errors.
Tests run: 912 tests, lint, build and generated HTML assertions covering all 20 pages, four incoming links and the fallback shell.
Known issues: Existing bundle size warning.
Recommended next task: Verify CI, preview and production. Recheck Ahrefs after release.
Questions requiring Tulio: None.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: Remote verification until checks finish.
Git diff summary: Public SEO and build changes based on current main in an isolated worktree.
