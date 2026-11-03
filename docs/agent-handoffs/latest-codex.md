Task ID: CWS-SEO-CANONICAL-20261103
Agent: Codex
Objective: Diagnose and correct sitemap/canonical redirects without changing legitimate redirects or private review routing.
Files inspected: AGENTS.md, role instructions, product definition, technical conventions, decisions/learnings/log/ledger/latest handoff; sitemap, robots, index, routes, SEO helpers, bilingual data and prerender, package/build/test configuration; live production responses for all20 sitemap URLs and four protocol/hostname variants.
Files changed: index.html, package.json, both robots files, public/sitemap.xml, src/lib/seo.ts, Layout.tsx, negocioListo.js, vercel.json; canonical-pages build helper and regressions; bilingual metadata expectations; report, log, ledger and this handoff.
Database or API changes: None. Existing API/review/fallback rewrites retained.
Security decisions: No private routes added to sitemap or generated shells; review disallow retained. No authenticated reads/writes or external publishing.
Decisions made: Align source URLs to confirmed existing production HTTPS www. Do not change domain redirects/DNS.
Assumptions: Existing page content and sitemap membership retained; no claim that HTTP200 proves rendered content quality.
Tests added: Four canonical regressions; existing bilingual expectations updated.
Tests run:857 tests/85 files;lint;import check/build;20 built canonical/og URL checks;diff check. Local build used fake client settings, not production credentials.
Known issues: Not deployed; production still old.18 raw HTML shells lack content/H1 and inherit homepage titles/descriptions. Full Ahrefs access blocked by plan. Review-root robots meta/header absent, existing robots disallow retained. Unrelated pre-existing untracked asset left untouched.
Recommended next task: After exact release approval, commit/push/merge, verify production and rerun audit; separately assess rendered public content.
Questions requiring Tulio: Approve release of this exact correction?
Project-memory files updated: report,log,ledger,latest-codex.
Permanent decisions added:None.
Reusable learnings added:None.
Memory updates withheld:No unapproved permanent decisions; no claim of production resolution.
Git diff summary:12 code/config/test files plus4 documentation files. No unrelated tracked edits. See cws-seo-canonical-20261103.md for evidence and release checks.
