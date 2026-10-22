Task ID: RETIRE-COLUMNS
Agent: Codex
Objective: Remove four empty retirement columns, verify parity and production; activation separate.
Changes: Migration20261022152513; regenerated matching type shape; §6 cleanup complete;18 publication/write-back pgTAP assertions including absent columns, valid outcome update and immutable retained identity.
Database: Guarded ACCESS EXCLUSIVE locks with5s timeout, abort on any non-NULL retiring value, no CASCADE. Retired two indexes removed with columns. Trigger retains all remaining protections.76/76 version parity; SQL MD5 bbe6a7f21744dfb88787651f375792e2.43 posts/17 sends identical retained JSON hashes before/after; decisions unchanged.
Validation:703 tests/74files,lint/build pass.18 publication +18 owner-activation pgTAP checks pass and roll back fixtures. Initial rehearsal requests expired and CLI temporary credentials lacked lock permission; production migration applied through migration tool; postapply checks passed. No successful preapply rehearsal claimed.
Security: No grant, RLS, Laya response or activation changes. Existing security advisories unchanged. No LLM calls/publish/send. Production contains an existing owner response recorded independently since prior release; do not erase or fabricate history.
Release: #47 merged b1b441d; CI39805133276 passed. READY dpl_3KHmQqK9q12nW4FXdN9DmfFok4kY assigned www alias. Six surfaces and Marketing live preview verified read-only; fresh preview reload after release. No runtime errors in15m. See retire-columns-verification-2026-10-22.md.
Memory: Product/ledger/log/handoff updated. No permanent decision. Original dirty checkout and private backup untouched.
