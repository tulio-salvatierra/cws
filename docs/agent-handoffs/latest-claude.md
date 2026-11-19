Task ID: CWS-SEO-REDIRECT-LINKS-20261119
Agent: Claude
Objective: Stop the CWS site from pointing Google at redirecting (non-www) URLs after Search Console reported the "Page with redirect" validation as failed (Nov 16) and Ahrefs Site Audit reported 4 redirects (Nov 17).

Files changed:
- `src/data/landingPagesData.ts`: the six landing pages' Service JSON-LD `imageUrl` pointed at `https://cicerowebstudio.xyz/images/*.png` (apex 308 to www, and the files are not in `public/images`); now `https://www.cicerowebstudio.xyz/og-image.jpg`.
- `src/marketing/channels.js`: `GOOGLE_BUSINESS_CTA_URL` now `https://www.cicerowebstudio.xyz/` (Google Business post "Learn more" link).
- Tests updated to the new URL: `src/pages/admin/__tests__/MarketingPage.test.jsx`, `api/__tests__/marketing-linkedin.test.js`.

Findings: Vercel domain config sends apex to www with 308 (intentional). Sitemap, canonicals, robots.txt and internal nav links already use https://www with no trailing slash. The http/apex "Page with redirect" entries in Search Console are expected and will not validate. Ahrefs URL-level data was not available (plan does not include API access), so the exact four URLs were not confirmed.

Tests run: full Vitest suite 1032/1032 passed; eslint on changed files clean; import-casing check passed. Production build not run.

Not changed: oversized images (blog article images such as profile.png ~32 MB, Palette.png, Arrow.png, video.png ~3 MB each, website.jpg 381 KB); `/images/sd.png` is referenced on landing pages but exists only in `src/assets/images`.

Next: owner reviews and merges the branch (production deploys from main); then compress blog images and decide on sd.png.
