# Client intake

Implementation prepared on `codex/client-intake`, based on `origin/main` at `0900711`. No database changes and no production release.

## Add a client

Create `src/content/intake/<slug>.json`. Rebuild; no component, router, sitemap or rewrite edit is needed. The JSON filename must exactly match its lowercase slug. Configs are public source content: include only owner-approved prompts/prefills, never private answers or credentials.

Required top-level fields:

- `slug`, `clientName`, `greeting`, `intro`: strings.
- `sections`: `{ id, title, fields }[]` for business details and other questions.
- `serviceFields`: field definitions reused for every service. Begin with a radio field with `id: "status"`; its options are configured, not hardcoded in the component.
- `services`: `{ id, name, presets: { [fieldId]: string[] } }[]`. Presets replace a choice field's options for that service. Checkbox presets are initially checked suggestions that clients review/uncheck. Radio statuses start unanswered unless explicitly prefilled.
- `allowAddService`: boolean. New services have a blank name and the base service fields, without another service's presets.

Field definitions: `{ id, type, label, help?, options?, allowOther?, allowNotSure?, allowAdd?, ordered?, columns?, rows?, prefill? }`.

- Types: text, textarea, email, tel, radio, checkbox, repeater.
- `options`: string array for radio/checkbox. `allowNotSure` defaults to true for both; selecting it clears conflicting choices. `allowOther` adds a free-text option.
- `allowAdd`: enables custom choice entries or repeater rows. `ordered` enables keyboard-accessible move controls; selected/custom steps retain order in the summary and attachment.
- `columns`: field definitions with text/textarea/email/tel types, required for repeaters. Prefill is an array of objects keyed by column ID. No nested repeaters.
- `rows`: textarea height (1–20); not the repeater data.
- `prefill`: string for text/radio, string array for checkbox, row objects for repeater.
- IDs must be safe lowercase identifiers; duplicate IDs within a collection fail validation. Bounds include 30 services, 40 user rows/additions, 60 configured options and 5,000 characters per answer.

`npm run build` validates before compilation; Vite's build hook validates too. Errors identify the config and invalid field. Only existing configs get `dist/intake/<slug>.html`. Unknown slugs are excluded from the marketing SPA catch-all and return 404. The local Vite middleware mirrors the 404 and noindex headers. The React unknown-slug view also protects client navigation.

## Sherry content

`sherry.json` combines the two exact supplied service presets, the existing industrial service, and the nine optional services from the picker. Only hood and duct have suggested steps/equipment. Other services are questions, not claims. No status is assumed. Names are prefilled exactly as requested; experience years are blank. Phone/email are text fields with separate Not set up yet checkboxes. Website essentials cover branding, customers, materials, quote handling and domain preferences.

The repo currently bundles a single Clash font (`src/assets/fonts/clash.woff2`); the page reuses it rather than introducing an unverified font asset. Black surfaces, #FF5000 actions with black AA-contrast text, lighter orange text, visible focus, large labels/targets and native details/fieldset controls follow CWS conventions. No marketing navigation/footer link is added.

## Submission and privacy

`POST /api/intake` rewrites to the existing `api/client-portal-intake.js?intake=1` function, which dispatches to `server/intake/handler.js`. Existing Google Sheets intake behavior is unchanged; this new branch does not call Sheets, Supabase or any database. The config directory is included in that function's bundle.

Set these server-only variables in the target environment:

- `INTAKE_NOTIFY_EMAIL`: Tulio's exact destination address; never accepted from the browser.
- Existing `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: reuse the established verified sender.

The server validates the slug and answer shape against its own config, limits body size to 100,000 bytes, rejects unknown fields/options, derives the subject and plain-text summary on the server, and sends raw validated answers as a base64 JSON attachment through `api/lib/resend.js`. It never sends on GET. Errors retain answers and expose copy/download fallbacks. Identical submissions reuse a deterministic Resend idempotency key; no automatic retry loop is added.

A honeypot and a five-attempt/15-minute IP limit guard POST. The rate limit stores only hashed IPs and counters in a bounded, expiring in-process map. It is best-effort per warm serverless instance, not a globally shared quota; cold starts and parallel instances have separate counters. Stronger production-wide rate limiting would require a separately configured platform rule/store. It does not persist answers.

Drafts use localStorage key `cws:intake:<slug>:v1` with guarded reads/writes and validation on restore. A changed/incompatible config or malformed draft falls back to defaults. Start over requires confirmation. Drafts remain after a successful send so clients can copy their record; start over clears/replaces them. The form works if localStorage or clipboard permission is unavailable.

Noindex is present in the built HTML, React metadata and Vercel X-Robots-Tag header. Intake paths are absent from the sitemap. These are indexing controls, not access control: the intake link and prompt config are public.

## Verification and release

- `npm run lint` passes.
- `npm run test:run`: 899 tests / 91 files pass, including 20 new intake tests; all Resend calls are mocked.
- Production build passes using non-production Supabase placeholder values solely for local compilation.
- Built output contains only the configured Sherry intake; no inherited homepage canonical or sitemap entry.
- Browser review: 390px and 1280px layouts have no horizontal overflow; inspected mobile inputs/buttons/summary targets meet 44px height.
- Local HTTP: Sherry 200; unknown slug 404 plus noindex header.

Not verified: real email delivery, deployed Vercel routing/headers, and assistive-technology audit. No real email sent, credentials read/changed, production mutation, commit, push or deployment performed. CWS dependency audit reports pre-existing vulnerabilities; no dependency manifest/lockfile version upgrades are part of this change.

Before release, configure the destination and verify a deliberately authorized test delivery in a preview environment. Review the completed intake content before publishing any claims on the client's cleaning website.
