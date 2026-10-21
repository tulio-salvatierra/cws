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

Migration `20261021152507_canspam_outreach_preferences` applied. Four live templates include the footer placeholders. Existing one unsubscribed address backfilled. RLS enabled and `anon`/`authenticated` SELECT denied. Security advisor findings unchanged (seven existing INFO findings and two existing warnings). Baseline: 17 outreach send rows.

Deployment and synthetic opt-out verification: pending release.
