# CANSPAM-FIX-001 — commercial email and opt-out verification

2026-10-21. Follow-up to the read-only CANSPAM-AUDIT.

## Implemented

- Every commercial Sales draft gets the business disclosure, server-configured owner postal address, and persistent recipient unsubscribe URL before confirmation. Re-review canonicalizes the footer; send verifies it without changing reviewed text. Missing configuration, unresolved fields, suppression-storage errors, stale configuration, changed recipient/text, or invalid/expired confirmation fail closed.
- `outreach_email_preferences` stores normalized workspace/email preferences. UUID bearer tokens do not expire or depend on signing-key rotation. RLS is enabled; browser/anonymous table access and deletion are not granted. Existing subscriber opt-outs and recorded bounces/complaints are backfilled. Draft upserts never reset preferences.
- Public `/unsubscribe` supports new tokens and original `subscriber_id` links. Only an explicit recipient POST records the opt-out; GET, reload, and previews never mutate. No login or email entry is needed. The API exposes no recipient address.
- Owner-authenticated `POST /api/outreach/suppress` and the existing Leads page let the owner record opt-outs received by reply. Sales and mailing-list sends enforce the same email preference across duplicate records. Signed bounce/complaint webhooks now preserve shared suppression independently of mutable delivery status.
- The retained mailing-list API requires owner preparation and exact recipient/draft confirmation, uses stable idempotency, and reserves attempts before provider calls. The retired mailing-list screen remains redirected; it was not revived.
- Routes use the existing outreach function, keeping the Vercel function count unchanged. The postal address is configured only as a production server variable, not committed to this public repo.

## Local checks

- Full Vitest: 430 tests across 57 files passed. Flow tests use an in-memory database and a mocked Resend sender; no real email is sent.
- Coverage includes full reviewed footer and exact outgoing text; edits, expiration, missing confirmation, recipient changes, old address, unresolved fields, missing configuration, storage failure; no-op GET; repeated opt-out preserving timestamp; legacy links; duplicate email/casing; owner auth/workspace boundaries; signing-key rotation; mailing-list prepare/confirm and retry deduplication; public page success/error/retry states.
- ESLint, import casing, production build/prerender, and diff checks passed. Existing lottie eval and bundle-size warnings remain.
- Fixed missing peer packages in the lockfile so `npm ci --ignore-scripts` succeeds without changing dependency versions in package.json.

## Production database

Migration `20261021152507_canspam_outreach_preferences` applied; all 65 local/remote versions match. Four live templates include the footer placeholders. Existing one unsubscribed address backfilled. RLS enabled and `anon`/`authenticated` SELECT denied. Security advisor findings unchanged (seven existing INFO findings and two existing warnings). Baseline: 17 outreach send rows.

## Production release and no-email verification

Runtime commits `47af36d` and `ff32084` pushed to main. Final deployment `dpl_B2ZBMep71nV9cHSkDRhT6SK6YjWy` (`ff32084`) READY, with the public custom domain confirmed assigned to it. A delayed Git deployment of the earlier seed-only commit (`018b457`) briefly replaced the release during checks; promoted the verified final production deployment and rechecked the custom-domain API and draft output. No Git state was lost or rewritten.

Using temporary synthetic `.invalid` recipients only:

- Authenticated production draft preview showed the explicit advertisement notice, exact configured postal address and resolved persistent unsubscribe link before confirmation. No Confirm/send button was used.
- Public token GET returned success without changing `unsubscribed_at`. Explicit browser Unsubscribe showed the success state and persisted `recipient_opt_out`.
- Re-review of the already-prepared synthetic draft was refused after opt-out.
- The original subscriber link worked; repeated token and legacy requests preserved the first opt-out timestamp.
- On the final runtime, prepared a second synthetic address and verified the explicit advertisement wording. The owner action then persisted `owner_recorded_opt_out`, with the owner recorded; Leads showed “Opted out of marketing”.
- Synthetic lead, subscriber and two preference rows were removed afterward. Outreach send count remained **17** throughout; zero emails sent and zero synthetic rows remain.
- Screenshot of the synthetic public success state saved outside the repository. No customer data, bearer tokens or owner address committed.

No new security findings. The retired mailing-list UI remains retired; its retained API now requires the safe prepare/confirm contract.
