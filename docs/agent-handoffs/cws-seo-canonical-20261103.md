# CWS sitemap and canonical correction — 2026-11-03

Status: implemented locally; not committed, pushed, merged or deployed. Production remains unresolved pending owner release approval and live verification.

## Confirmed cause

HTTP apex → HTTPS apex → HTTPS www (308 each); HTTP www → HTTPS www (308). HTTPS www homepage returns 200. Every one of the 20 sitemap entries returns 308 to the identical path on www; all 20 preferred URLs return 200 with no further redirect. This confirms hostname selection as the sitemap redirect cause. All article slugs and landing IDs exist in current source; HTTP 200 alone is not proof of rendered content.

18 pages inherit the homepage canonical from the SPA shell. Only the two Negocio Listo snapshots have route-specific canonicals. All 20 canonical declarations use apex and therefore point to a redirect. These are overlapping findings, not 40 independent broken pages.

## Correction

Use the already-live HTTPS www origin in sitemap, both robots sources, homepage canonical/social URL, shared SEO/schema origin and Negocio Listo canonical/hreflang/schema/image origin. Add static canonical shells for the 17 non-home, non-Negocio Listo sitemap routes using the existing app template, with exact rewrites before the SPA fallback. Preserve the richer bilingual snapshots. Update canonical/social URL on Layout navigation. No content, pricing, DNS, subscriptions, API handlers or business records changed.

## Checks

857 tests across 85 files pass; ESLint passes; import-casing check and production-mode build pass. Local build uses explicitly fake Supabase client settings solely to satisfy the existing env-presence guard; it does not verify authenticated admin connectivity and must not be deployed. Vercel must build source with its existing production environment. Build retains existing large-chunk warning. All 20 built sitemap URLs have exactly one matching canonical and og:url and resolve to generated files through the rewrite table. Regression tests cover route mappings, API/review/fallback preservation, review sitemap exclusion, SPA navigation, and invalid canonical hosts/private paths.

## Remaining audit findings

- Missing H1 / low word count (18 each): current raw responses contain zero H1 on the 18 SPA-shell pages, versus one on each bilingual snapshot. Several source components already contain H1. Confirm rendered crawling before rewriting copy or adding headings. Public-page prerendering/content delivery is a separate task; the canonical shells intentionally do not claim to solve it.
- Homepage-shared title/description remain on the SPA shells: assess page-specific metadata separately, using actual content.
- Large JS bundle: existing 2.19 MB index chunk (about 528 KB gzip) merits a separate loading/performance review.
- /review/ remains disallowed by public robots and absent from sitemap; proxy unchanged. A read of /review/ found no X-Robots-Tag or robots meta. Check individual review-page responses separately before asserting robust noindex coverage; no private page URLs were enumerated.
- Full remaining Ahrefs issue list unavailable: connector returned Insufficient plan. Use an existing audit export/UI; no subscription purchase proposed.

## Release and verification

Owner approval needed to commit/push/merge this exact correction and publish to production. Then verify HTTP/HTTPS apex/www redirects remain intact; fetch robots and sitemap; require all 20 sitemap URLs to return 200 without redirects and exactly one self-canonical; verify bilingual hreflang; verify rendered canonical after internal navigation; check existing review exclusion and API/admin availability read-only. Request a fresh Ahrefs crawl afterward; do not infer a new Health Score before it finishes.

## Live URL evidence before release

| Path | Apex | www | Canonical before correction |
| --- | --- | --- | --- |
| `/negocio-listo` | 308 → same path on www | 200 | Own path on apex |
| `/en/negocio-listo` | 308 → same path on www | 200 | Own path on apex |
| `/` | 308 → same path on www | 200 | Homepage on apex |
| `/about` | 308 → same path on www | 200 | Homepage on apex |
| `/services` | 308 → same path on www | 200 | Homepage on apex |
| `/blog` | 308 → same path on www | 200 | Homepage on apex |
| `/contact` | 308 → same path on www | 200 | Homepage on apex |
| `/policy` | 308 → same path on www | 200 | Homepage on apex |
| `/blog/future-of-web-development-ai-tools` | 308 → same path on www | 200 | Homepage on apex |
| `/blog/mobile-first-website-design-why-it-matters` | 308 → same path on www | 200 | Homepage on apex |
| `/blog/seo-strategies-that-work-2024` | 308 → same path on www | 200 | Homepage on apex |
| `/blog/scalable-ecommerce-lessons` | 308 → same path on www | 200 | Homepage on apex |
| `/blog/choose-right-web-design-package` | 308 → same path on www | 200 | Homepage on apex |
| `/blog/why-lead-capture-forms-high-performing-website-chicago` | 308 → same path on www | 200 | Homepage on apex |
| `/landing/cicero-web-design` | 308 → same path on www | 200 | Homepage on apex |
| `/landing/chicago-digital-marketing` | 308 → same path on www | 200 | Homepage on apex |
| `/landing/berwyn-ecommerce` | 308 → same path on www | 200 | Homepage on apex |
| `/landing/oak-park-seo` | 308 → same path on www | 200 | Homepage on apex |
| `/landing/elmwood-park-maintenance` | 308 → same path on www | 200 | Homepage on apex |
| `/landing/website-refresh-redesign` | 308 → same path on www | 200 | Homepage on apex |
