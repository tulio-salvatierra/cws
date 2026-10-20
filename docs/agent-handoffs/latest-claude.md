Task ID: CWS-NL-LANDING
Agent: Claude
Objective: Add a bilingual Negocio Listo landing page with a video hero, a timed lead popup and an inline lead form, using the site's existing styles, with SEO-friendly URLs.

Files changed:
- `src/data/negocioListo.js` (new): all ES/EN copy, plan data, FAQ, video transcripts, URLs and the JSON-LD graph (ProfessionalService, Service + three Offers, VideoObject, FAQPage). Plain ESM so the build script can import it.
- `src/components/NegocioListo/` (new): `NegocioListo.jsx` (page + SEO hook), `NegocioListoLeadForm.jsx` (popup/inline variants), `NegocioListoPopup.jsx` (portal dialog), `NegocioListo.css`.
- `src/lib/negocioListoLead.ts` (new): submit helper, UTM capture, popup suppression (session dismiss, lead sent).
- `server/outreach/public-lead.js` (new) and `api/outreach.js`: unauthenticated `POST /api/outreach/public-lead`.
- `scripts/prerender-negocio-listo.mjs` (new), `package.json` build, `vercel.json` rewrites for both routes.
- `src/App.jsx`: two routes; intro loader skipped on these paths.
- `public/videos/negocio-listo-{es,en}.mp4`, `public/images/negocio-listo/{poster-es,poster-en,og}.jpg`, `public/sitemap.xml`, `public/llms.txt`.
- `docs/product-definition.md` §2: one sentence on the public lead path.
- Tests: `server/outreach/__tests__/public-lead.test.js`, `scripts/__tests__/prerender-negocio-listo.test.js`.

Tests run: `npm run test:run` (414 passed), `npm run lint`, `npm run build` with placeholder client env. Playwright against `vite preview` (desktop 1440, mobile 390): popup at 3 s on desktop, bottom sheet only after scroll on mobile, both forms post the expected payload (API mocked), no horizontal overflow, title/lang/hreflang correct.

Decisions (implementation, not DEC entries):
- Leads go to the existing `leads` table as `sales_classification = inbound`, `created_by` = the active workspace owner. Business type, plan, website and UTM are packed into `source` (≤200 chars) to avoid a migration.
- A second submission from the same phone within 30 minutes updates that row instead of inserting.
- Spam: hidden honeypot field and a 1 s minimum fill time; both return a silent 202 with no write.
- Section backgrounds use `nl-bg-*` class names because `index.css` forces `main section:not([class*="bg-"])` transparent.

Not verified:
- The live endpoint against production Supabase (no service-role key in this environment). Needs one real test submission on the preview deploy.
- Vercel serving `/negocio-listo` from the prerendered file via the new rewrites (verify on the preview deploy with "view source").

Open owner questions:
- Reels say "$150/mes"; the site and graphics say $149.
- Setup fee shown as "según el plan" (graphics) while the product definition says $300.
