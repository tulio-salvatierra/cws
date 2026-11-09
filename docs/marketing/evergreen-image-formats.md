# Evergreen social image formats

Implemented locally on 2026-11-09 in the existing Marketing Creative Studio.
Task: CWS-EVERGREEN-FORMATS-20261109.

## Presets

| Channel | Placement | Export |
| --- | --- | --- |
| Instagram / Facebook | Square feed | 1080 × 1080 |
| Instagram / Facebook | Portrait feed | 1080 × 1350 |
| Instagram / Facebook | Story | 1080 × 1920 |
| Instagram / Facebook | Reel cover, static image | 1080 × 1920 |
| LinkedIn | Square feed | 1200 × 1200 |
| LinkedIn | Portrait feed | 1080 × 1350 |
| LinkedIn | Landscape feed | 1200 × 628 |

Every preset exports sRGB JPEG with a conservative 5,000,000-byte cap. These are
application export presets, not a promise that a platform will accept every post.
Account permissions, captions, media content and provider behavior remain separate.
LinkedIn has no Story/Reel picker options. Reel covers are not videos.

## Existing flow and changes

The existing flow generated ideas, requested an image with a hard-coded
1024x1280 size, stored unchecked PNG bytes, and allowed owner approval into the
shared feed library. It uses the Responses API and existing server configuration.

- `src/marketing/imageFormats.js`: shared allowlisted destination presets.
- `src/pages/admin/MarketingPage.jsx`: channel/format picker, last-used preference,
  dimensions, per-format draft selection, private image link and padding feedback.
- `server/marketing/creative.js`: selected destination and ratio in the composition
  instructions and structured brief; idea generation no longer fixes the ratio.
- `api/marketing-creative.js`: validates preset before generation, records selection,
  binds replays/retries to that selection, stores checked JPEG bytes and metadata,
  and refuses non-shared-feed or unvalidated JPEG library approval.
- `server/marketing/image-output.js`: bounded raster decode, EXIF orientation,
  transparency flattening, sRGB conversion, contain resizing and white padding.
  No crop or stretch. Compliant JPEG bytes are retained unchanged. Compression
  tries quality 92, 85, 75, then 65; output that still exceeds the cap fails closed.
- `api/marketing-linkedin.js`: existing generated-media reader accepts PNG/JPEG and
  uses the actual extension for upload MIME and filename. Publishing gates remain.
- `src/types/supabase.ts`: new format and validation fields reflected in types.
- `package.json` / lockfile: pinned server-side `sharp` 0.35.5. No new paid service.

The existing mainline model setting is preserved. Because it does not identify the
underlying image tool's resolution capabilities, requests use the conservative
supported sizes 1024x1024, 1024x1536 and 1536x1024. The desired destination ratio
is also supplied before generation. Thus a 9:16 export may need padding from a
2:3 model image. This deliberately does not assume that arbitrary pixel sizes are
supported by every configured model; exact custom-ratio generation would require
verifying and explicitly configuring the underlying image model.

Story and Reel-cover drafts remain private and downloadable. LinkedIn's
1200x628 landscape also remains download-only because its ratio slightly exceeds
the conservative 1.91 shared-feed ceiling. Square/portrait feeds can use the
existing owner approval flow. This does not add Story/Reel publishing.

## Migration and release dependency

`supabase/migrations/20261109172902_evergreen_image_formats.sql` is prepared,
**applied to production on 2026-11-09**. Its remote version is preserved exactly. It:

- Adds `format_id` and nullable `image_validation` to private creative assets.
- Preserves legacy PNGs with default Instagram portrait classification and no
  invented validation record.
- Changes uniqueness from one asset per idea to one asset per idea and preset.
- Permits `.jpg` alongside `.png` in private asset/catalog references and permits
  JPEG MIME in the existing private bucket.
- Leaves ownership, grants, RLS, publication confirmation and existing rows intact.

Production's migration history must be checked and the committed local version
must match the actual applied version, per repository conventions. The owner subsequently authorized migration, merge, deployment and a private live-generation test. Release verification is recorded below.

## Verification

- Full Vitest suite: **949 tests passed across 97 files** (28 additional tests).
- ESLint: passed.
- Full build, import casing and public-page prerender: passed with non-secret,
  build-only Supabase placeholders. This does not verify live admin authentication.
- Isolated PostgreSQL (PGlite): original creative migration plus new migration
  applied to synthetic supporting tables. Verified legacy PNG preservation, JPEG
  insertion/catalog reference, MIME allowlist, per-format uniqueness and rejection
  of invalid formats/extensions. No production database used.
- Dependency audit: 40 advisories both before and after (1 low, 10 moderate,
  29 high); no newly affected packages and no Sharp advisory. Existing advisories
  are outside this change.
- Existing build bundle-size warning remains.

Live authenticated generation/storage verification and the production migration
are outstanding release checks. Tests exercise actual image decoding/resizing
with synthetic raster fixtures and mocked network/storage; none spend API credits
or submit content. Old library images are not retroactively resized.

## Documentation checked

- [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation)
  — supported standard sizes and JPEG output; newer models have additional sizes.
- [LinkedIn photo requirements](https://www.linkedin.com/help/linkedin/answer/a527229)
  — 5 MB upload limit and supported image ratios.
- [Supabase bucket restrictions](https://supabase.com/docs/guides/storage/buckets/creating-buckets)
  — private bucket MIME restrictions.
- Meta's content-publishing documentation returned HTTP 429 during direct retrieval.
  Conservative Instagram feed presets were retained; live provider acceptance was
  not tested. This feature does not claim universal posting success.
