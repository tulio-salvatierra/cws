Task ID: CWS-MARKETING-CHANNEL-CAPTIONS
Agent: Claude
Objective: Let each Marketing destination receive its own caption (Meta, LinkedIn, Google) while keeping the shared caption as the fallback and the exact-slot owner confirmation unchanged.

Files changed:
- `src/marketing/platformCaptions.js` (new): per-destination limits, catalog channel map, effective-text and validation helpers.
- `server/marketing/offer-catalog.js`: shared rotation excludes channel variants; per-channel LRU defaults on each asset.
- `src/marketing/weeklySlots.js`: `slot.platformCaptions` comes from the attempt record, or from catalog defaults for an open slot.
- `api/marketing-linkedin.js`:
  - validates and normalizes `platform_captions`;
  - persists the immutable per-destination record before the provider call;
  - sends each platform's own text to bundle.social;
  - catalog captions accept `platform`;
  - serializers expose the texts.
- `src/pages/admin/MarketingPage.jsx`:
  - each channel tab has its own caption editor with a limit counter and a "Use shared caption" button;
  - the overview shows chips for which channels use their own text;
  - the confirmation dialog names the channels with custom text;
  - the catalog caption form has a Channel select.
- `supabase/migrations/20261016142931_marketing_platform_captions.sql`: applied to production.
- Tests: the new `platformCaptions.test.js`, plus additions to the API, catalog, and Marketing page tests.

Tests run: `npm run test:run` (451 passed), `npm run lint`, and the build with placeholder env.

Decisions:
- Confirmation stays bound to owner + slot + asset (DEC-028). The owner's authenticated Confirm request carries every text, and those texts are persisted before any provider call. So what was confirmed is exactly what is recorded and sent.
- An offer still needs an active shared English caption to enter rotation. Channel variants only replace it on their own channel.
- Moving a missed slot carries only the shared caption. Channel defaults are not carried into a moved slot.

Not done / follow-ups:
- Carousel (multi-image) posts are not supported. Each post is a single image.
- Per-post analytics are still not connected.

Recommended next step (owner): add Básico channel captions in the catalog, preview each tab, and Confirm Post A.
