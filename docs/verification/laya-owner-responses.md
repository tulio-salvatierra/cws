# Laya owner responses — 2026-10-21

Task: LAYA-RESPONSES-001 (owner's Act/Dismiss request).

## Behavior and authority

- CEO Today GET computes evaluations and issues an in-memory signed 15-minute review for each owner-visible decision. It stores no evaluation or response.
- Opening Act/Dismiss asks for a required reason. Cancel writes nothing. Save posts `action=laya_response` to the existing route.
- The server verifies the user's current active owner membership and verifies the signature, owner, workspace, purpose and expiration. Snapshot/evaluation are taken only from the signed review; body-supplied actor/evaluation/input fields are ignored.
- A response records intent/feedback only. It never activates, edits, rejects, supersedes or performs the decision/advice. Decision activation remains the separate existing owner-JWT flow, with its guards unchanged. No new LLM or provider calls.
- The record preserves the exact full decision input, evaluation clock/date/timezone and full output, response, trimmed reason, actual actor and server timestamp. A decision changing later does not rewrite this historical snapshot.
- Review ID is unique. An identical retry returns the existing response; changed response/reason for that same review returns 409. Failed inserts remain retryable. Expired/tampered reviews require reload.
- Saved responses are displayed with their original snapshot/evaluation. GET loads the latest 30 workspace responses for owners only; these are history, not suppression of live reviews. An unavailable history read leaves other priorities available.

## Schema and validation

- Production migration `20261021180810_laya_owner_responses.sql`: new `laya_evaluations`, indexed FKs/history, RLS owner SELECT, server SELECT/INSERT only, no anonymous or browser write privileges, append-only trigger, actual-owner actor/source/snapshot/evaluation consistency checks. No change to business_decisions grants/triggers.
- Trusted server holds the insert privilege; only the owner-authenticated/signed-review route invokes it. The database also checks the recorded actor is an active owner. No public SECURITY DEFINER function or new API route.
- 68/68 migration versions match; stored migration SQL is byte-identical to the committed file. Applied DDL/history atomically through the proven CLI Management API (earlier MCP apply request-state failures are documented in prior tickets).
- All 17 new pgTAP assertions pass in rollback rehearsal and after apply; the existing 18 decision-activation assertions also pass after apply. Synthetic evidence, users and fixtures are rolled back. Tests cover grants, member/outsider denial, required reason, source identity, duplicate reviews, immutable history and no activation via responses.
- 483 Vitest tests in 61 files pass; lint, import casing, production build and landing prerenders pass. Added 10 token/persistence cases, five API cases, and five UI response cases. API tests exercise successful owner Act/Dismiss, denied member access, body-forgery rejection and activation-action rejection. UI tests cover reason/cancel/save/failure retry and separate activation.
- Security advisor findings unchanged from baseline. Generated types refreshed.
- Baseline/follow-up decision fingerprint: `9ef3704692d721930dbd7d70cc0e1aad`; one proposed/zero active. Posts43/sends17. New response table starts empty.
- PR #34 merged at `54d9d82e9f8b12ba0254f6cb1ca7f746895bee4a`. GitHub Actions Tests [run39651224644](https://github.com/tulio-salvatierra/cws/actions/runs/39651224644) and Vercel preview passed.
- Production deployment `dpl_B8nNJEacxmqJ8JSuoNmqy2XZqdtR` is READY from that SHA on verified www/root aliases. Signed-in CEO Today shows separate Act/Dismiss and activation controls. Both response forms display the required Reason and explicit no-decision-change explanation. Opening/canceling each form and reload were verified without saving.
- Final production: response rows0, one proposal/active0, same full decision hash, posts43/sends17, migrations68. No CEO Today runtime errors in the final15-minute scan.
- No owner response was fabricated on the real proposal. Save/persistence paths are verified by API tests and rolled-back production SQL fixtures; live browser verification covers controls/cancel/reload only.
