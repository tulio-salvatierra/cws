# Cicero Web Studio brand guide

Canonical agent-readable brand reference for Evergreen creative work. Verified
against repository sources on 2026-11-12; this is not a new visual identity.
Read [Evergreen generation instructions](evergreen-generation.md) next.
These files guide agents; the application does not automatically load Markdown.
Runtime behavior and product authority remain defined by the linked code and
[product definition](../docs/product-definition.md). Update this guide when its
sources change; do not copy competing brand rules into other agent files.

## Verified identity and positioning

- **Cicero Web Studio (CWS)** creates clear, mobile-friendly websites for Chicago
  small businesses, with useful service information and clear next actions:
  call, request a quote, book, or find the business. Source:
  [Chicago page](../src/components/ChicagoWebDesignPage/ChicagoWebDesignPage.tsx).
- **Negocio Listo** addresses contractors and local businesses in Cicero, Berwyn
  and Chicago, with English/Spanish website and local online-presence services.
  Source: [offer copy](../src/data/negocioListo.js). Verify current offer details
  for each brief; prices and promises are not permanent brand rules.
- The homepage headline is “Presence that WORKS!”:
  [Hero](../src/components/Hero/Hero.tsx). It is reference copy, not required image text.
- English and Spanish are independent, separately reviewed artifacts; do not
  assume that bilingual services mean every image or workflow is bilingual.
  See [product language rules](../docs/product-definition.md#5-language).

## Verified visual sources

These are existing values with distinct roles, **not one unified color-token system**.

| Source / role | Verified values |
| --- | --- |
| [Public CSS](../src/index.css): link accent, body background, headings | `#FE7018`, `#000000`, `#FFFFFF` respectively |
| [Header logo SVG](../src/assets/images/header/cws-logo.svg): path fills | `#D4610E`, `#F5F5F5`, `#413D3D` |
| [Hero CSS](../src/components/Hero/Hero.css): headline gradient | `#ffffff`, `#f5892f`, `#5a5454` |
| [Admin theme](../src/components/admin/admin-theme.css): scoped background/accent | `--cws-bg: #0b0d10`, `--cws-accent: #f08a45`; admin UI only |

Do not substitute the public accent for the logo's baked-in colors, or promote
admin tokens to a new social palette. Suggested creative starting point: dark
neutrals, readable light contrast and restrained public-site orange accents;
photographic scenes need not use only these colors.

**Typography:** public CSS registers the family as `Clash` from the bundled
[clash.woff2](../src/assets/fonts/clash.woff2). Both `font-main` and
`font-secondary` use `Clash`, then Arial/sans-serif in
[Tailwind](../tailwind.config.js). Preserve that verified family name; do not
infer a different font family or available weights from appearance.

**Logo assets:**

- [Header SVG](../src/assets/images/header/cws-logo.svg), used by
  [Header.tsx](../src/components/Header/Header.tsx): scalable existing mark.
- [Problem-section WebP](../src/assets/images/problem/cicero-web-studio-problem.webp),
  used by [Problem.tsx](../src/components/Problem/Problem.tsx): existing raster artwork.
- Other existing PNG assets: [source PNG](../src/assets/images/logo.png) and
  [public PNG](../public/images/logo.png). Their existence alone does not make
  them the preferred master; inspect the chosen asset before use.

Reuse the actual asset without redrawing, recoloring, stretching or cropping it.
No formal logo clear-space/minimum-size specification was verified. Check
legibility and contrast at the intended display size; do not invent official rules.

## Voice and visual direction — suggested defaults

These are editorial suggestions derived from the public copy, not a separately
approved brand policy. An explicit owner brief can refine them.

- Write plainly, directly and helpfully; focus on a concrete business problem and
  useful next step. Prefer approachable, locally grounded language over jargon.
- Show believable small-business settings, people and practical website work.
  Favor natural light, one clear focal subject and uncluttered composition.
- Avoid generic robots, sci-fi dashboards, excessive effects and visual clutter
  unless the brief specifically calls for them. Existing website gradients do
  not require every social image to have a gradient.
- Do not present invented customers, testimonials, results, rankings or metrics
  as evidence. Illustrative scenes are not client case studies.
- Keep factual claims and current offer details grounded in supplied sources.
  Do not fabricate a Chicago location, customer identity or platform endorsement.

For text-free generation, logo handling, formats and validation, use the
[generation guide](evergreen-generation.md); do not add a competing prompt here.
