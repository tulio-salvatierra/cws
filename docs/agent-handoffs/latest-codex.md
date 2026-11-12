Task ID: CWS-NL-NOTIFY-20261112
Agent: Codex
Objective: Extend owner inbox notifications to Negocio Listo popup and inline forms.
Files inspected: Repository guidance, product definition/conventions, current handoff/log/ledger, lead endpoint, shared form/transport and notification helper/tests.
Files changed: Public lead handler, notification helper and tests, product definition and project records.
Database or API changes: No migration. All new public leads get server-generated UUIDs before insert. NL notifications happen only after successful insert/merge.
Security decisions: Fixed owner recipient, configured verified sender, plain text, optional validated Reply-To. No email to visitors. Bot/validation/write failures never send. Existing workspace scoping retained.
Decisions made: Use stable lead ID plus payload hash for NL notifications, so identical retries deduplicate while popup-to-inline enrichment produces a new alert. Existing contact email payload/key unchanged. Failed email preserves lead and allows retry.
Assumptions: Existing production Resend configuration verified by prior contact release remains valid.
Tests added: Popup Spanish and inline English payloads, phone-only and email details, exact retry versus changed payload, send-after-insert/merge, failed writes and recovery.
Tests run: 1032 tests across 100 files passed; lint passed. Excluded four pre-existing untracked duplicate files ending in " 2" from test collection; left untouched and unstaged. CI/release pending.
Known issues: Existing bounded 30-minute lead merge window and no durable background retry worker; concurrent submissions are not protected by a new uniqueness constraint.
Recommended next task: Finish CI and release verification.
Questions requiring Tulio: None at implementation stage.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md, product-definition.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: None.
Git diff summary: Isolated feat/negocio-listo-lead-notifications from released b706bb1. Includes prior contact release verification notes. Existing unrelated duplicate files untouched.
