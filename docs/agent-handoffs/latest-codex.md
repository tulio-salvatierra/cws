Task ID: MANUAL-BUSINESS-CARD-LEADS-001
Agent: Codex
Objective: Expose the existing authenticated manual lead form directly from Sales for owner-held business cards.
Files changed: `src/pages/admin/SalesPage.jsx`; `src/pages/admin/__tests__/SalesPage.test.jsx`; task ledger and this handoff.
Database or API changes: None. The existing `/api/outreach/leads` authenticated lead-create path is reused unchanged.
Security decisions: This is navigation only. The new link does not create a lead, inspect a website, call AI, send email, place a call, or invoke a provider. Saving a lead remains an explicit action in the existing form.
Tests added: Sales UI regression verifies the named link targets `/admin/leads` and existing queue loading remains read-only.
Tests run: 788 tests across 77 files pass; lint and production build pass; `git diff --check` passes.
Known issues: The existing manual lead form still carries its legacy `/admin/leads` presentation. This ticket deliberately adds no new lead model, endpoint, schema, migration, or outreach behavior.
Recommended next task: Merge to `main`, verify the link live without entering data, then the owner may manually save real business-card leads through the form.
Questions requiring Tulio: None.
Project-memory files updated: Task ledger and handoff.
Permanent decisions added: None.
Reusable learnings added: Existing functionality should be surfaced from the owning department before creating another workflow.
Memory updates withheld: None.
