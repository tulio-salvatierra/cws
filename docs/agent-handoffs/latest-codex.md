Task ID: LAYA-HISTORY-FILTERS
Agent: Codex
Objective: Add Act/Dismiss and saved-response date filters while retaining owner-only history, pagination and exact saved evidence.
Files inspected: Product/role/conventions/decisions/learnings/memory; history helper/API/UI/fixtures; Supabase skill/docs.
Files changed: History helper/API/UI and corresponding fixtures; product/conventions/memory.
Database or API changes: Existing CEO GET history view adds response/from/to. No migration/new endpoint. Combined filters apply before31-row lookahead/30page; same created_at+id keyset.
Security decisions: Active ownership/workspace checks unchanged before history reads. Allowlisted response, strictly validated real dates/open ranges; reversed ranges rejected before SELECT. Cursors bind workspace/type/response/from/to. Legacy cursors valid only for unfiltered response/dates. Reads only; activation separate.
Decisions made: User-requested scope; no permanent decision.
Assumptions: Date range refers to saved-response created_at on inclusive Chicago calendar days, not evaluation date. Next-day exclusive bound preserves microseconds and DST23/25-hour days. Date drafts apply explicitly; header reflects applied criteria. Successful filter changes reset page1; failure/retry preserves exact attempted criteria and displayed page. Refresh resets.
Tests added: Combined filters through older pages, cursor mismatch, impossible/leap/reversed/array/injected dates, open bounds, DST/year/leap-day boundaries, owner API validation/filter forwarding; UI apply/clear/Act/Dismiss/paging/retry/reversed range and existing exact evidence/stale refresh.
Tests run:643 app tests/72files,lint/build passed. Production precheck0responses/0active decisions/43posts/17sends/74migrations,decision fingerprint unchanged. Release pending.
Known issues: Production has no saved responses; populated filtering verified with synthetic fixtures only.
Recommended next task: Owner may review actual responses when recorded.
Questions requiring Tulio: None.
Project-memory files updated: Product/conventions,ledger/log/latest handoff.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: No fabricated owner responses or activation.
Git diff summary: Isolated codex/laya-history-filters; original three dirty memory files/private backup untouched. Release pending.
