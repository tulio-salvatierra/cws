Task ID: CANSPAM-FIX-001
Agent: Codex
Objective: Fix the P1 CANSPAM-AUDIT findings together while preserving exact-draft owner confirmation; test without sending real emails and push.
Files inspected: Product definition, Codex instructions, conventions, decisions, learnings, memory, Sales/templates/send/draft/mailing-list/webhook routes, UI, migrations, env registry, tests.
Files changed: Outreach compliance/preferences/unsubscribe/owner opt-out handlers and tests; Sales draft/send/mailing-list/webhook/leads; outreach route map; public unsubscribe page and Leads controls; migration 20261021152507; env registry/example; lockfile peer entries; scope and verification/memory docs.
Database or API changes: Production migration 20261021152507 adds service-only RLS email preferences, backfills known suppressions and appends footer placeholders to four templates. No sends or provider mutations. POST opt-out endpoints use the existing outreach function. Production-only postal address configured using the exact owner-supplied value; no address committed.
Security decisions: Persistent non-expiring random opt-out bearer tokens; no browser table access; workspace/email suppression cannot be cleared by draft upserts or delayed delivery events. GET is read-only. Reviewed footer is part of the signed exact draft; all sends remain owner-confirmed. Legacy mailing-list API hardened to require exact owner confirmation and durable pre-provider attempts.
Decisions made: Follow authorized P1 scope; use existing function routing and Supabase only. No new product surface, language, or automation.
Assumptions: Owner supplied the valid postal address for commercial emails.
Tests added: Handler integration tests with actual confirmation signing, in-memory database and mocked provider; public unsubscribe UI tests.
Tests run: 430 tests across 57 files pass; lint, import casing, production build/prerender, diff checks pass. Clean npm install verified after repairing missing lockfile peer entries. See docs/verification/canspam-fix-001.md.
Known issues: Production UI checks pending release. Retired mailing-list screen remains redirected; safe retained API requires prepare/send draft tokens. Existing build warnings and security advisor findings unchanged.
Recommended next task: Verify deployed synthetic opt-out/legacy-link flows and zero new sends, then freeze this fix.
Questions requiring Tulio: None.
Project-memory files updated: This handoff, project log, task ledger; product definition documents commercial-email behavior.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No real customer fixtures or owner postal address committed; no real email sent.
Git diff summary: Focused CAN-SPAM fix plus necessary test lockfile repair and required project memory. No pre-existing changes.
