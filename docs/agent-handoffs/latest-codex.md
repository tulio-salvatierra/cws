Task ID: CWS-BASICO-ARTWORK-20261026
Agent: Codex
Objective: Correct Básico artwork price/readability and preview across all four Marketing channels without publishing.
Files inspected: Product definition, role instructions, conventions, decisions, learnings, memory, MarketingPage ChannelPanel, offer selector, current media path, original PNG.
Files changed: New public/images/negocio-listo/en-02-basico-150-v2.png and three memory files. Original image untouched.
Database or API changes: None. Current local-source media still points to en-02-basico.png. Release needs switch to versioned path after deployed asset verification.
Security decisions: Local fixture has no production connection or publishing handler. No posts, no data changes, no credentials used.
Decisions made: Keep black/white/orange identity; larger benefits; remove tiny other-plan strip and carousel numbering; include approved setup/term; preserve originals and both captions.
Assumptions: Existing $150/month approved offer terms remain canonical.
Tests added: None; static artwork only.
Tests run: Visual inspection in actual production ChannelPanel across LinkedIn/Facebook/Instagram/Google local fixture; full caption retained at 315 characters and within all limits. Google website CTA visible. PNG 1122×1402, approx4:5. No application tests rerun because runtime unchanged.
Known issues: Owner explicitly approved commit/push/deploy and live selection; release in progress. Local preview harness is untracked scratch and must not be committed. Existing separate checkout work/cws-offer-library has file-read stalls; fresh clone used here.
Recommended next task: On owner authorization commit only asset and memory, push/merge/deploy, verify asset URL, update existing media storage_path guarded by old path, reload and inspect four live previews. Do not publish posts.
Questions requiring Tulio: None; explicit release authorization received.
Project-memory files updated: latest-codex, project-log, task-ledger.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No production claims or release completion.
Git diff summary: One new PNG plus three memory files. No runtime code/config/schema changes. Original dirty checkout untouched.
