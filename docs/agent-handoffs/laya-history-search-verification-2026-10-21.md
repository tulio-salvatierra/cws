# Laya saved-history search verification — 2026-10-21

PR #45 merged as `0c0e96975c90090e5b94d9ebb20dae6a8271c2e9`. CI39680222130 passed. Production `dpl_9QQcDPfPAYdwfm8SRqg2jehRWVcR` READY and assigned www alias.

663 tests/72files, lint and production build passed. Fixtures verify reasons and each historical subject field, literal punctuation/Unicode, combined filtered older pages, search-bound cursors, malformed search rejection, owner/workspace gating and no current source joins. UI tests cover explicit apply, blank removal, all-clear, combined type/response/date/search/page/retry and exact saved subject/snapshot display. Lint's control-regex rule was resolved by checking code points; final suite/lint passed.

Search uses the existing owner-verified history GET and applies before fixed30-row pagination. Trimmed scalar input max80 characters; control characters rejected. JSON-quoted PostgREST imatch with PostgreSQL literal mode treats wildcard and regex characters as text. Installed client confirms multiple OR groups append; search and cursor groups remain ANDed with workspace and other criteria. No migration, new endpoint or write path. Read-only production SQL confirmed case-insensitive literal behavior without executing user patterns.

Authenticated production browser applied `100%_terms*, "saved" (review)\path`, confirmed exact applied search in page1 summary with a successful empty response, selected Deal fit and confirmed search retained, then Clear filters restored All types/All responses/open dates/blank search/page1. Paging controls disabled correctly for empty history. No API history error was reported, and runtime error query found none in15m.

Production has zero saved responses; populated matches/older pages verified with synthetic fixtures only. No fabricated owner response or business record. Final read-only counts: responses0,active decisions0,posts43,sends17,migrations74,decision fingerprint unchanged. Activation separate and owner-only; no new LLM calls, publishing or sending. Original checkout's three dirty memory files and private backup untouched. No permanent decisions or reusable learnings added.
