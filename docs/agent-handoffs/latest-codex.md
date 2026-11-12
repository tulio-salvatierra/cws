Task ID: CWS-CONTACT-20261112
Agent: Codex
Objective: Implement approved contact page and connect it to existing capture flow on a review-only branch.
Files inspected: AGENTS.md, .agents/codex-project-instructions.md, product definition, conventions, decisions, learnings, current handoff; Contact/Layout/Header/Footer/CustomButton, public-lead and Negocio Listo client/form, Sales read/queue/UI, lead schema/types and tests.
Files changed: Contact.tsx; new ContactLeadForm.tsx and TrustindexReviews.tsx; shared public-lead transport; public-lead handler/tests; Sales handler/queue/UI; lead types; additive migration; project records.
Database or API changes: Existing POST /api/outreach/public-lead accepts form=contact, required email, optional US phone, allow-listed service and bounded message. Migration 20261112191440_contact_page_inquiry_details.sql adds nullable inquiry_service and inquiry_message to leads. NOT APPLIED. Must apply before deploying because Sales queries and public lead capture use the new columns. Preserve exact remote migration version at release.
Security decisions: Server owns workspace/created_by; no client database keys or new grants. Existing RLS remains. Honeypot and fill-time guard retained. Contacts only deduplicate identical recent inquiries, never rewrite a different inquiry or authenticated Sales fields. NL duplicate lookup excludes contact inquiries. No email or external business action triggered.
Decisions made: Reuse current capture endpoint and site components. Render vendor widget in its own document to isolate loader globals across React remounts. Preserve approved pricing/commitments.
Assumptions: Existing owner/environment configuration will serve this endpoint after deployment. Existing 15-minute audit copy and /30min booking URL remain unchanged for owner review.
Tests added: Contact API validation, optional phone, workspace ownership, exact retry, insert failure; form confirmed-success and failed-submit retry tests. Existing NL regressions retained.
Tests run: 1001 tests / 98 files pass; lint pass; isolated PGlite migration validation passes (valid insert, invalid service/empty/oversized message rejected, existing RLS stays enabled). Full production build and all public-page prerenders pass with placeholder client environment. Desktop/mobile branch inspected locally; Trustindex badge rendered. No production submission performed.
Known issues: Migration unapplied; live persistence intentionally not exercised. Client timeout + recent identical-inquiry match provides normal retry behavior, not a database uniqueness guarantee for concurrent requests. Existing chunk-size build warning.
Recommended next task: Owner authorized commit, push and review PR on 2026-11-12. Review implementation; do not merge or apply migration yet. Release separately requires migration before deployment and controlled end-to-end verification.
Questions requiring Tulio: Resolve existing audit duration mismatch before changing either copy or scheduling configuration.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md, product-definition.md capture-flow description.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: None.
Git diff summary: Fresh checkout at a1afa67, local branch feat/contact-page-lead-capture. Committed and pushed; draft PR #94 is open. Rebased onto current main 22eb6f2, preserving concurrent project log and ledger entries. Merge and migration remain prohibited. No pre-existing changes in isolated checkout; original checkout has unrelated image edits and is untouched.
