Task ID: CWS-LOCATION-MAP-AND-GOOGLE-SHARE-20261104
Agent: Codex
Objective: Add the owner-supplied key-free studio map to the public site and accept current Google Share profile links in Sales.
Files inspected: AGENTS.md, product definition, public Home/Contact map components, Lead Google Profile normalizer, Sales editor/handler/tests, task ledger, project log and latest handoff.
Files changed: LocationSection component/CSS/test; Home; StudioMap; Maps client environment/type cleanup; Google profile normalizer and tests; Sales editor, handler and tests; required project documentation.
Database or API changes: None. No migration.
Security decisions: The map uses a normal Google share/embed iframe with no Maps JavaScript/API key. Sales retains a narrow HTTPS Google-host allowlist; `share.google` is accepted, but non-Google and non-HTTPS URLs remain rejected. No link resolution, Google API call, enrichment, or provider connection occurs.
Decisions made: One canonical full map appears after the homepage CTA and remains on the existing Contact surface; it is not duplicated across every service page. Rejected Sales saves are displayed in the open dialog.
Assumptions: The user-provided `share.google` reference is a Google-owned profile-share URL and is only an outbound owner-entered reference.
Tests added: Key-free location embed/directions test; Google Share normalizer assertion; Sales dialog error visibility regression.
Tests run: PR #63/#64: 870 tests, lint, build; PR #65: 871 tests, lint, build. GitHub tests, GitGuardian and Vercel previews passed for all three PRs. Live public visual verification confirmed the map/marker fills the full frame.
Known issues: The Google embed was supplied in a Spanish locale, so Google’s own map controls may display Spanish. This is an upstream iframe presentation choice, not CWS copy. The pre-existing large JavaScript-chunk warning remains non-blocking.
Recommended next task: Owner can reload `/admin/sales`, reopen the lead editor and paste `https://share.google/E0cmvTR2hRiaIXGQ2`; saving should now succeed if all other fields are valid. If a save fails, the dialog now shows the server reason directly.
Questions requiring Tulio: None.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: One canonical public location map; no browser Maps API key for this use case.
Reusable learnings added: Percent-height embeds require an explicit parent height, not only a minimum height.
Memory updates withheld: No new durable product-rule memory requested.
Git diff summary: Three verified application releases already merged to main: `0b1810a`, `192b411`, and `adb4767`; this documentation-only update records their scope and verification.
