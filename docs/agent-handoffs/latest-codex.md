Task ID: CWS-EVERGREEN-BRAND-REQUESTS-20261112
Agent: Codex
Objective: Connect existing Evergreen New Generation requests to the canonical branding guides; prepare a review PR only.
Files inspected: Product definition, technical conventions, decisions, learnings, current records; AGENTS/role guidance; both branding guides; creative API, prompt builders and tests; MarketingPage; image presets/output validator; Vercel config/ignore and CI workflow.
Files changed: server/marketing/brand-guidance.js and its tests; creative.js and tests; API creative tests; MarketingPage help text; vercel.json; branding guides, root/role discovery guidance; three project records.
Database or API changes: No schema, routes, request contract or extra model calls. Existing requests carry both Markdown guides as server instructions before their authoritative task rules.
Security decisions: Fixed local paths only; no request-controlled guide content; missing/empty/oversized files fail before provider access. Owner-only draft creation and separate publication confirmation unchanged. Brand suggestions cannot authorize text/logo overlays or override the selected preset/reference composition.
Decisions made: Read canonical Markdown directly instead of duplicating brand rules; package the two files explicitly in the creative function. Disable auto-deploy only for codex/evergreen-branding-integration using git.deploymentEnabled; main and other branches retain defaults.
Assumptions: Guide edits take effect after deployment. Generated images remain subject to visual owner review, not a guarantee of model adherence.
Tests added: Canonical file inclusion and invalid/missing guide cases; actual idea request payload and input isolation; provider/upload suppression on missing guidance; existing tests now verify both guides on all 11 formats and four remake cases. Server tests run in Node, matching runtime.
Tests run: 1006 tests / 98 files passed; lint passed; full production build/prerender passed with non-secret placeholders. Relocated server-module/guide copy loads outside repo cwd. git diff --check passed. Initial restricted prerender could not bind localhost; permitted local rerun passed.
Known issues: Existing dependency advisories and large client chunk warning unchanged. No live model request or Vercel deployment performed. Explicit file inclusion and relocated-loader check do not substitute for deployed-function verification after release approval.
Recommended next task: Review PR; after authorization, merge/deploy and verify one private branded generation, without publication.
Questions requiring Tulio: None for PR preparation.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md. Prior PR #93 release result recorded from this session.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No new brand policy; existing suggestions retain their status.
Git diff summary: Isolated branch codex/evergreen-branding-integration from main 7696188. Original CWS checkout untouched. No merge/deploy authorized for this integration.
