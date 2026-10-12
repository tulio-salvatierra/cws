# Google Business Profile and Marketing channel tabs

Implemented locally on 2026-10-12. Not deployed; no posts were sent.

## Scope

- Weekly overview plus LinkedIn, Facebook, Instagram, and Google Business Profile tabs.
- Shared captions and assets; tabs preview each channel and show its delivery result/link.
- One explicit confirmation names all four channels. Older confirmation tokens cannot authorize the expanded audience.
- Google STANDARD updates use the API schema's `text`, `uploadIds`, `languageCode`, `callToActionType`, and `callToActionUrl` fields. The Learn more button uses the site's canonical `https://cicerowebstudio.xyz/` URL.
- Shared publishing captions are limited to 1,500 characters. Images over 5 MB are rejected before upload. Existing media approval remains in place; provider acceptance still determines publication.
- Verify the selected Google location, not merely the Google user account name.
- Store required platforms per attempt; historical three-channel posts remain complete. Missing Google results on new posts cannot count as complete or safe to close.
- CEO Today consumes the persisted required-platform set.

## Release order

1. Apply `supabase/migrations/20261012110804_marketing_google_business.sql` to the verified target database before deploying code. It expands channel storage and the published-post enum, adds an immutable required-platform set, and preserves existing defaults/history. No RLS/grant expansion.
2. Deploy the application.
3. Verify the connected Google location is Cicero Web Studio and all four destinations show verified.
4. Open each tab, edit a shared caption in Weekly overview, and verify the previews retain it. Check the Learn more URL and the 1,500-character validation.
5. A real publication still requires the owner's approval in the app. Check each channel's result and durable published-post write-back after an approved post.

## Verification and limits

- Full suite: 66 files / 428 tests passed on the final pre-push run; lint also passed.
- Lint and production build passed (existing large-chunk warning).
- Migration executed in isolated PGlite PostgreSQL: historical defaults, four-channel inserts, Google enum cast used by published-post write-back, immutable platform identity, and invalid-set rejection passed.
- Live bundle.social discovery using local environment credentials returned HTTP 401. The actual selected location and live publishing remain unverified. Do not infer a disconnected production account from this local credential failure.
- Sample-data browser verification passed at desktop and 390px mobile width, with no horizontal page overflow. Locally saved previews (not included in the commit): `output/playwright/marketing-google-desktop.png` and `output/playwright/marketing-google-mobile.png`. These show simulated connection status, not live verification.
- No live database migration or deployment was performed.

## Measuring results next

Delivery status is connected by this change; performance analytics are not.

For other channels, fetch supported per-post metrics by provider post ID, persist dated snapshots, and show unavailable values as unavailable rather than zero. Use unique campaign/post/channel tracking links for website visits and tie captured attribution to inquiries and won business. Instagram feed captions do not provide an ordinary clickable website link; use an appropriate link-in-bio or supported placement and label attribution limits.

bundle.social currently documents Google profile-level metrics (including website clicks/calls/directions) but no individual Google post analytics. Use a tracked Google CTA link for per-post website attribution; keep profile-level totals clearly separate.

Sources: https://info.bundle.social/api-reference/platforms/google-business and https://api.bundle.social/swagger-json (checked 2026-10-12).
