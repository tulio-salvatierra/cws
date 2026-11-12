# Project Log

Entries from 2026-10-25 on. Older entries: `docs/archive/project-log-2026-07-21-to-2026-10-24.md` (history only; read only when a task needs it).

## 2026-10-26 — CWS-MARKETING-CAPTION-EDITOR-20261026

Added saved-caption text/language/channel/status display and inline editing to each offer using the existing owner-only catalog endpoint. Editing submits the original caption ID, retains edits on failure, supports cancel, enforces channel limits, and performs no provider/publish action. Rotation-readiness display now requires a shared English caption, matching server selection. Direct owner-requested production correction changed only Básico caption locale from en to es, retaining text/status; verified by read-back. No translation or Spanish publishing expansion. 770 tests/77 files, lint, import-case check and production build pass (placeholder public build settings); local browser preview save verified with synthetic state. No schema changes or actual publication. Source original dirty checkout preserved; implementation isolated in work/cws-offer-library on codex/marketing-caption-editor. Commit/push/deploy pending explicit owner approval under role instructions.

## 2026-10-26 — Caption editor production release

Owner authorized commit/push/deploy. PR #54 merged as 110580c; Vercel production dpl_3iiePisW1gHEAmH5w3x5ngq6ZP2p READY with custom domains assigned. Live authenticated offer library displays saved Spanish Básico text and metadata. Cancel discarded an unsaved test edit; Save through the live owner-only endpoint updated the existing record with identical text, es locale and active status. Reload retained the exact text; one caption remains (no duplicate). Database body hash unchanged; publish attempts stayed 16 and published posts stayed 43. No posts published. Production runtime error/fatal log scan returned no entries. All 770 app tests, lint/build and remote checks passed before release.

## 2026-10-26 — Básico artwork revision prepared

Created a versioned English Básico image with $150/month, larger benefit text, visible $300 setup and 12-month initial term, preserving the original asset. Inspected the revised image in all four channel layouts using the unmodified production ChannelPanel renderer in an isolated local fixture, with the saved 315-character English caption. No production writes or provider actions. Image is 1122×1402 pixels (approximately 4:5). Commit/push/deploy await explicit authorization under role instructions; after deployment switch the existing Básico media path to the versioned image and verify live. No runtime code/schema changes.

Owner explicitly approved committing, pushing, deploying and verifying the revised artwork across four live channels, retaining both captions and publishing nothing. Release baseline: 17 publish attempts, 43 published posts.

Release verified: abeb491 pushed to main; production dpl_5hgG9vfdnHfWpnfRhwdGvLzwdoZm READY with custom domains. Deployed PNG SHA-256 matches local. Guarded update changed only the existing Básico local media path to en-02-basico-150-v2.png; original asset retained. All four authenticated live channel previews show the revised image and 315-character shared English caption, with no browser errors. Both caption IDs/statuses/body hashes unchanged. Publish attempts stayed 17: no new publishing request. A pre-existing October 26 delivery completed reconciliation during verification (published records 43→47), using the old artwork; those posts were untouched. Build/import casing pass; runtime source unchanged.

## 2026-10-27 — Existing Google Básico post corrections

Owner authorized editing only the two existing Google posts from October 21/26. Replaced old artwork with approved $150 PNG on both using native Google owner editor, preserving original post IDs and links. Corrected October 21 description to the saved 315-character English Básico caption; October 26 caption retained. Reopened each original post to verify persisted image/text. Google reports edits pending review. No post creation/deletion, no other-channel actions. CWS publication counters unchanged at 17 attempts/47 records; no database writes. Browser extension upload remained unavailable; native file picker succeeded. No code/schema changes, commits or deployments.

Final fresh owner-list verification shows both corrected post cards as Publicada (original ages retained), with $150 artwork and Básico copy; neither is pending anymore.

## 2026-10-27 — October 21 social caption corrections

Owner authorized updating only existing Facebook, Instagram and LinkedIn October 21 captions. Saved the approved 315-character English Básico copy ($150/month, $300 setup, 12-month term) through native published-post editors. Verified original public links show corrected text; LinkedIn after reload and Instagram with Edited indicator. Same post identities, dates and images retained. No new posts/stories or deletions; Facebook story toggle stayed off. CWS counters remain 17 attempts/47 records. No code, database writes, commits or deployments.

## 2026-10-27 — Laya recommendation readability prepared

CWS-LAYA-READABILITY-20261027: Updated existing CEO Today recommendation cards with plain-language status labels, prominent next-step text, visible missing-data box, and expandable reasoning/source records. Shortened visible response help while retaining full explanation, exact review-token behavior and Act/Dismiss semantics. Scoped spacing overrides prevent public article styles from crowding admin cards. Backend text/ranking/API unchanged; no production writes. Added five regression cases; all 775 tests/77 files, lint and production build pass. Actual-component local synthetic browser preview verified evidence and Act/Cancel without saving. Release awaits explicit commit/push authorization; no posts published.

Owner approved commit, push, deployment and live verification of Laya readability changes. No post publication authorized.

Release verified: 51855d34f753ecf02236484753fd872efa21851d pushed to main; production dpl_FrvLYnDfGbzi1JNjXvVn7zcymWhV READY with main custom domains. Authenticated live CEO Today verifies Recommended/Needs more information/Wait for now, next steps, visible Marketing missing evidence, expandable source records/help and Act/Cancel. No saved response, post publication or data mutation. Browser error log empty; deployment error/fatal scan returned no logs. Live screenshot saved in task outputs.

## 2026-10-27 — Laya feedback capture audit

CWS-LAYA-FEEDBACK-AUDIT-20261027: Read-only production aggregate/schema and code inspection confirms one goal-pace Act response (October21 Chicago time), 214-character required reason and nonempty exact input/evaluation snapshots. Records also retain owner/workspace, subject, policy version and timestamp. Save is explicit and append-only; review token expires after15minutes, repeat retry is idempotent per token. Not now only hides locally. No outcome linkage, structured rationale/corrected recommendation, dataset curation/export or automatic learning consumer found. Recommend ordinary explicit feedback first, optional reason/alternative fields next, outcome linkage later. No production writes, source changes, model training, publication or release.

## 2026-10-27 — Optional Laya response feedback prepared

CWS-LAYA-RESPONSE-FEEDBACK-20261027: Added optional category/preferred alternative to shared and business-decision response forms, API persistence/validation/retry comparison, item/global history and types. Eight shared categories; blankfields remainnull; required reason/exact evidence/owner boundary unchanged. Additive migration20261027173612 prepared with no backfill/grant/trigger changes.788tests/77files, lint/build/import-case pass. Exact SQL rehearsed on isolated PostgreSQL17 fixture for preservation, compatibility and constraints; browser synthetic preview verified. No production writes, learning or publication. Release awaits explicit commit/push authorization; schema must precede code deployment.

Owner authorized release. Applied additive migration20261027173612 before application push. Existing response hash unchanged; new fieldsnull, RLS enabled and append-only guard hash unchanged. Counters remain17attempts/47posts. Local filename aligned to exact remote timestamp.

Release verified: implementation2a70111 and migration alignment5f365cb pushed to main. Deployment dpl_HT1EhwoNDNb6TDxhMCeyXupD59Jf READY with custom domains. Live shared and decision Act/Dismiss forms expose optional categories/alternative; selection, text, null defaults,2000character limit and cancel/reset verified. Existing history still1response and exact original-content hash unchanged.80migration versions match; RLS, grants and immutable guard retained. Browser error log empty; deployment error/fatal scan no logs. No fabricated feedback saved, no automatic learning, publishing counters unchanged17/47. Existing unrelated Supabase advisor notices retained without scope expansion.

## 2026-10-29 — Manual business-card lead entry released

Exposed the existing authenticated `/admin/leads` form from Sales with one **Add business-card lead** link beside prospect research. The change adds no API route, schema, migration, provider/AI call, ranking change, or outreach behavior. PR #55 merged to `main` at `eca76f54664886c60c52e55678852d4873b4b864`; Vercel Production deployment `dpl_56EiMMXdUYiWGGnUpzK63Jb8AQxM` is READY. Authenticated live Sales shows exactly one link resolving to `/admin/leads`. The form was not opened or saved; no lead record or external action occurred.

## 2026-10-29 — Lead Google Business Profile reference released

Released an optional owner-entered `google_business_profile_url` on existing workspace-scoped Leads. The additive migration accepts only trimmed HTTPS Google Maps/Profile/share hosts; server-side creation and owner Sales edits independently normalize the same narrow set. The Leads table and Sales command card show a safe outbound reference link only when the stored value passes validation. An omitted field from an older Sales editor request cannot clear an existing reference. This is not a Google connection, ownership check, enrichment source, publishing target, provider call, queue-ranking input, or outreach trigger. Commit `6f4b72a92af6c4fd20bc56df0b8f05e9f2af62c1` merged to `main`; Supabase applied `20261029155243_lead_google_business_profile_reference`; Vercel Production deployment `dpl_4rUpGAjzGtyUboH4zsxxttuVxqhV` is READY. The live authenticated Leads form shows the optional URL field, explanatory reference-only copy, and Google-profile table column; Sales remains available and unchanged. There are currently zero populated profile references, and no Production Lead was created or modified during release verification. 798 tests, lint, import-case check, and production build pass.

## 2026-10-29 — Lead Google Business Profile reference release receipt

The optional Lead Google Business Profile reference shipped to Production from
`6f4b72a92af6c4fd20bc56df0b8f05e9f2af62c1`. Migration
`20261029155243_lead_google_business_profile_reference` is recorded in the
Production history, and Git deployment `dpl_4rUpGAjzGtyUboH4zsxxttuVxqhV`
is READY on the verified CWS aliases. A read-only authenticated check confirmed
the Leads input, the reference-only explanation, the new table column, and the
unchanged Sales queue. No stored reference existed yet, so no outbound profile
link was opened; no Lead record or external provider action occurred.

## 2026-11-01 — Laya Decision Rules V1 release

Owner authorized deployment and migration with company-context excluded. Isolated release adds Top 3, evidence-only recommendations, explicit owner choices/outcomes, scope checks and 30-day review in CEO Today. 822 tests/82 files, lint and build pass. Production migration 20261101181750 applied with owner-only reads/server-only append; zero choices and no company profiles. Application deployment and live verification pending.

Release receipt: 856c5dc + 5e2eac2 pushed to main; deployment dpl_A9HhyKC9QKqcPNAne3yV4MoLtwVE READY on production aliases. Live verification found and fixed duplicate evidence inflating Marketing tokens. 823 tests/82 files, lint/build pass. Authenticated three-card GET, all enabled controls, outcome prompt/cancel, scope form and review verified. Handoff POST/GET200 persisted one retained handoff-only event; no acceptance/outcome values fabricated. Production access/constraint checks passed under rollback; legacy responses3 and publishing counts18/51 unchanged; browser/runtime error scans clear. All82 local migration versions applied; separate company task applied20261101182102 during verification, excluded from this release. Detailed limits in verification report.

## 2026-11-01 — Company World Model database verification and release

Resolved local Docker path/access blocker. Applied exact World Model and released Next Move migrations in a disposable PostgreSQL 17 database: 53 SQL assertions and real-loader smoke pass; combined 839 tests, lint and configured production build pass. Production World Model migration 20261101182102 applied; RLS/grants and unchanged security-advisor baseline verified. Application release/live verification blocked: automatic approval review rejected direct main push for lack of explicit authorization for this exact production release. No application push/deployment occurred; tested commit remains local. Builds on concurrent main commit 856c5dc without duplicating Next Move schema.

## 2026-11-01 — Marketing why-line source correction

Fixed the Decision Rules missed-Marketing explanation using the existing deterministic occurrence projection, with explicit schedule-policy provenance and complete same-workspace attempt/resolution reads. Generic task-field selection had fallen back to an unrelated publishing record. The corrected template states the scheduled slot/date and absence of a CWS attempt or owner resolution; it makes no claim about publication outside CWS. Six regressions cover unrelated posts, incomplete reads, existing attempt/resolution and mismatched evidence. 846 tests/84 files (after preserving the separate company-context release), lint/build and diff check pass. No migration, business-data writes, ranking change, or company-context changes. Deployment/live verification follows this commit.

Marketing why-line release receipt: 8b152da deployed; dpl_HtnKqG6S5WxMyNVwizjt6wP5wHb9 READY on production aliases. Live authenticated card shows the exact scheduled-slot explanation; More confirms derived schedule provenance, matching slot/date, complete reads and null attempt/resolution. All three choice controls remain enabled; no choice or publishing action was performed. Browser/runtime error checks clear.

## 2026-11-02 — Sales why lines grounded in contact opportunity

Replaced update-date-only explanations for eligible new-prospect queue cards with complete, same-workspace contact/response/send/promise evidence. Prior contact is acknowledged in Chicago time; an existing contact is not called a first contact. First-contact wording is limited to new status with no contact date or successful intro recorded. No due promise is stated only when incomplete-free reads find none; completed promises are excluded. Existing queue/ranking and all business records unchanged. Seven regressions added;853 tests/84 files,lint/build pass. Production wording verification follows release.

Sales why-line release receipt: 088fc99, deployment dpl_4qqwtPytTrHGMvVW2S6xV61vjkUX READY. Authenticated rendered contact-opportunity explanations verified; ordered Top3 titles identical before and after rollout. No choice, outreach or business-record mutation performed; browser/runtime error checks clear.

## 2026-11-03 — Sitemap/canonical correction prepared

Confirmed all20 apex sitemap URLs308 to same paths on www, all preferred URLs200. Corrected local SEO origins, generated route-specific canonical shells and SPA navigation synchronization while retaining API/review/fallback routing.857 tests/85 files,lint,build and20 built canonical checks pass. Production release awaits exact owner approval; no commit/push/deploy. Detailed evidence and remaining rendering/audit limits in agent-handoffs/cws-seo-canonical-20261103.md.

## 2026-11-03 — Services motion prepared locally

Integrated the five supplied references on local `services-motion` from `654cf9c`: procedural three.js scene, scroll-driven desktop transitions, mobile card, reduced-motion and cleanup corrections. Existing data/assets/background and other components preserved; no new dependencies. Build (placeholder local client settings), lint and 857 tests pass; no Services type errors, nine pre-existing diagnostics elsewhere remain. Browser checks cover five selections, four mobile widths, static reduced motion, offscreen pause and route remount. No commit/push/deploy/merge; owner review pending. See latest-codex.md.

Services release authorization: Tulio reviewed the local preview and explicitly approved pushing to main. Remote main remains 654cf9c with no intervening commits. The approved three-file implementation and required handoff/log updates are being committed for the main-triggered deployment; production verification follows.

## 2026-11-03 — Portfolio refresh prepared

Updated the shared desktop/mobile project list with Clean and Shiny, Upholstery of Chicago, Dominó de Barrio, refreshed Kike Vivaldy, and explicitly Upcoming Drum Chart AI without a launch link. Removed TAMM/community resources; no separate Social entry exists. Preserved four other projects and styling; captured four current site screenshots. Lint/build and 857 tests passed, desktop/mobile browser checks passed. Local branch only; release approval pending. See `agent-handoffs/cws-portfolio-20261103.md`.

Portfolio release authorized: owner approved commit, merge, deploy and live verification. Rebased onto ec739cf, preserving the separately released Services motion implementation; documentation-only conflicts resolved by keeping both task records.

## Release verification — 2026-11-03

Owner-approved PR #59 merged as `287c8c8a16cba4e9bcaf7f856c18eb70aab29e26`. GitHub test and security checks passed. Vercel production deployment `dpl_6YDo1dibPeDhXd4ddjLURRgxtvZh` reached READY and owns both `www.cicerowebstudio.xyz` and `cicerowebstudio.xyz` aliases. Build duration: approximately 35 seconds.

Live Chromium verification at 1440×900 and 390×844 passed: exact nine-project list; all image assets decode; four new/refreshed destination URLs match verified sources; removed entries absent; Upcoming label and no link for Drum Chart AI on desktop/mobile; mobile carousel navigates to the final project without horizontal overflow. Screenshots visually reviewed. Browser console contained informational messages only. Vercel error/fatal runtime-log scan for this deployment over the preceding ten minutes returned no logs. This is point-in-time verification, not a continuous monitoring claim. No business-data writes or form submissions.

## 2026-11-03 — Retired personal portfolio removal

Owner confirmed TulioSalvatierra.com is officially retired and requested its removal as a follow-up to the approved portfolio release. Removed the Portfolio Website entry from the shared desktop/mobile list; eight projects remain and numbering/carousel dots derive automatically from the data. Other projects and Upcoming behavior remain unchanged. Build and live checks follow this change.

## 2026-11-04 — Portfolio corrections prepared

Corrected Carolina's project link to https://carolinaskincentre.com and removed Intermezzo Sound Studio from the shared desktop/mobile project array. Seven projects remain; other entries, order, Upcoming status and assets preserved. Based on main 3a3bb8a after inspecting existing open PRs and portfolio branch history. Parsed-data comparison passed. Execution environment became unavailable before lint/build/browser checks; CI pending. Isolated draft branch; no merge or production deployment authorized or performed.

## 2026-11-04 — Site health check + local SEO setup sprint (own site)

Health check on main 8615e89 (= production dpl_FEnsaVLpYsW5JHHwefobeR4WbUum): deploys READY, 0 runtime errors/7d, redirects/HSTS/robots/sitemap/canonicals OK. Prepared local branch `seo/route-meta-schema-fixes`: per-route title/description/og/twitter for all 17 shell routes from one plain data file (`src/data/route-meta.json`, read by the build script and by Layout on navigation; build throws on missing tags/entries); removed self-served aggregateRating from LocalBusiness and unverified rating/review data from landing-page Service JSON-LD; deduplicated homepage LocalBusiness; schema logo → /images/logo.png; availableLanguage EN+ES; og/twitter image → self-hosted /og-image.jpg (crop of existing site art, interim); sitemap lastmod refreshed; `lead_click` dataLayer event on tel/mailto links. Page copy drafted for about/services/blog/contact/policy meta (owner review); blog and landing meta reuse existing text verbatim. 862 tests/85 files, lint, build pass; built shells verified unique; headless SPA navigation verified titles/schema, no page errors. Not pushed; owner approval pending. Open: GBP address (schema says Cicero, IL), money services, landing-page visible testimonials/ratings/prices/client lists need owner review, landing SEO hook overwrites site-wide schema (follow-up), Search Console data, GTM trigger for lead_click. Drive SEO profile: Clients/Cicero Web Studio/05 SEO.

## 2026-11-04 — CWS-LANDING-TRUST-CLEANUP-20261104

- D1–D4 applied across all six landing routes. Removed reviews, ratings and testimonials. Replaced starting prices with a link to `/negocio-listo`. Kept Carolina Skin Centre, Upholstery of Chicago and Clean and Shiny in the trust section. Synced titles between landing data and static metadata, with descriptions unchanged.
- Added scoped Service JSON-LD linked to the existing LocalBusiness and removed landing keyword meta writes. Regression tests cover landing data, schema fields, navigation cleanup and title parity.
- 869 tests, lint and build passed. Checked the six generated HTML titles and verified the pricing link, trust section, console and persistent LocalBusiness script on all six pages at 1440×900 and 390×844 in Chrome. The draft includes screenshots of the Cicero Web Design pricing section. [Draft PR #62](https://github.com/tulio-salvatierra/cws/pull/62)

## 2026-11-04 — Agreement billing-start separation prepared locally

Prepared a narrow Accounting correction so owner-confirmed monthly billing can start before a finished website launches. The proposed additive `billing_start_date` preserves the old `launch_date` as a separate delivery fact, backfills historical launched agreements from their existing launch date, and creates the fixed monthly obligation schedule only when the owner records a billing start. The existing launch action remains compatible for older callers, but will no longer recreate a schedule after billing has already begun. UI copy now makes the distinction explicit, and the Accounting read model uses the billing start for term/MRR while showing the finished-site launch independently. The Negocio Listo lifecycle retains delivery state until an actual launch is recorded; a due payment remains genuine Accounting evidence. Focused tests 43/43, full suite 877/877, lint, import-case check and production build pass. The historical local Supabase replay stops intentionally at the RETIRE-002 archived-export guard, so a targeted disposable PostgreSQL fixture was used instead: all 16 pgTAP assertions passed and rolled back. GitGuardian originally flagged a generic static password in that disposable test runner; it now generates a local-only password at runtime, and rebuilt [PR #69](https://github.com/tulio-salvatierra/cws/pull/69) passes GitGuardian, GitHub tests, and the Vercel preview. Merge/deployment remains deliberately pending a single explicit approval to apply the additive migration and release the dependent code together. No migration was applied, no Production business data was changed, no Square call was made, and no deployment occurred.

## 2026-11-05 — Agreement billing-start release receipt

Owner authorized the combined release. PR #69 merged as `b584eb7ab16dae609dca88149a921567ddebfe21`; Production deployment `dpl_FqYYue8FCEQbsntSjAEuMiEXs111` is READY on `cicerowebstudio.xyz` and `www.cicerowebstudio.xyz`. The platform recorded the migration as `20261105165800_agreement_billing_start_date`; the local filename is aligned to that exact remote version in a source-only follow-up. Read-only schema verification confirmed the nullable date column, date/launch consistency constraints, `SECURITY INVOKER` RPC with empty search path, and execute grants only for `postgres` and `service_role`. One historical launched agreement received the deterministic `billing_start_date = launch_date` backfill; no obligation, receipt, invoice, Square action, or new schedule was created. Authenticated live checks confirmed both Accounting and CEO Today load successfully from the deployed merge commit. The existing durable agreement currently records the same date for billing start and finished launch; this release does not infer or change that historical delivery fact.

## 2026-11-05 — Ahrefs Analytics tag prepared

Added the owner-supplied Ahrefs Analytics loader as one asynchronous static script in the public document head, next to the existing Google Tag Manager setup. This is present on all public routes because they share the Vite document shell; no admin route, database state, marketing publication, provider action, or server credential changes. Lint and production build pass, and the built document contains the analytics script exactly once. Deployment remains pending explicit owner approval.

## 2026-11-06 — Config-driven website intake prepared locally

CWS-INTAKE-20261106 adds `/intake/<slug>` from validated JSON configs, starting with `sherry.json`, in isolated branch `codex/client-intake` at `/private/tmp/cws-client-intake`. Combines website essentials with twelve candidate services, supplied hood/duct presets, ordered/addable steps and rows, guarded local drafts, reset confirmation, text export and a Resend email/JSON attachment path via the existing intake function. No database writes. Unknown configs are 404; generated pages have noindex metadata/headers and stay outside the sitemap. Lint, 899 tests across 91 files and local production build pass; mobile/desktop layout and local 200/404 checked. Email tests are mocked; actual delivery and hosted headers/routing remain unverified. Server env destination setup and explicit review/release remain pending. No commit, push or deployment occurred.

## 2026-11-06 — Intake branch and preview released

Owner authorized GitHub push and a preview, explicitly excluding production. Implementation commit `cc486e47bf9de158035c3c1038effcb433a6dc11` is on `codex/client-intake`. Vercel deployment `dpl_YAwkVE4YSCpxKeBano3vvxmtAGJ4` reports READY with no alias error at https://cws-pah0j4d4t-t00lio-s-team.vercel.app/intake/sherry. Main remains unchanged. No production/domain/provider-email action occurred. Delivery remains unverified pending recipient setup and an authorized test.

## 2026-11-06 — Intake production and delivery receipts

PR #73 merged as f205349 and deployed to production. Live route returned 200, unknown slug 404, noindex headers/meta and sitemap exclusion verified. Owner then confirmed notification recipient; production env configured and unchanged commit redeployed as dpl_JB2dbX3gdTz78ao5w2kZCzBtz6gX (READY). Authorized synthetic POST returned 200 and Resend confirmed delivered at 19:17:47 UTC. No client answers or database writes used. Inbox placement/attachment retrieval not independently checked.

## 2026-11-06 — Sherry intake simplification

Owner requested focusing on team, certifications, availability, customers and service selection; removed premature business setup, assets, quotes and domain questions. Tulio handles ZIP codes from the supplied locations. All service cards remain intact. Browser draft restoration now retains remaining answers when retired questions exist, without relaxing API validation. Targeted 21 tests, lint, build and local browser checks passed; full suite passed (900 tests/91 files); authorized publication pending.

## 2026-11-06 — CWS-SKILLS-20261106 shared agent skills
Added `skills/` as the single source for agent skills used by Claude and ChatGPT/Codex (open SKILL.md format). `.claude/skills` and `.agents/skills` are symlinks to it; `skills/` is added to `.vercelignore`. Three draft-only skills chosen from the CWS operations map: `cws-follow-up` (warm replies, call recaps, stalled proposals; explicitly not the CWS OS Day 0/4/10 cold sequence, which `server/sales/queue.js` already derives), `negocio-listo-proposal` (reads plans/prices from `src/data/negocioListo.js`; setup fee only as the owner states), `client-update` (from the client's Drive `00 STATUS.md`). No app code, database, provider or deployment change. Open: owner notes say $150/mo + $300 setup while the public page lists $149/$249/$349 tiers with setup by plan; the proposal skill follows the page and asks for the setup fee until the owner confirms.

## 2026-11-06 — CWS-NL-PRICING-20261106 Negocio Listo prices set to $150 / $250 / $350

Owner set Básico / Crecer / Destacado to $150 / $250 / $350 per month across the site. Updated `src/data/negocioListo.js` (ES/EN plan cards, SEO titles and descriptions, FAQ answers, JSON-LD offers and `priceRange`), the hero "from" price in `src/components/NegocioListo/NegocioListo.jsx`, `public/llms.txt`, and the prerender test expectations. Full suite 899/899, lint, and production build with placeholder client env pass; the built `/negocio-listo` and `/en/negocio-listo` pages contain only $150/$250/$350 and schema offers 150/250/350. Not changed: Accounting draft catalog offers in the database (still $149/$249/$349; production data, owner edit in Accounting), and the plan graphics in `public/images/negocio-listo/` (prices baked into images; not used by the page). Setup fee remains unpublished. Not merged or deployed; merging to `main` releases it to production.

## 2026-11-08 — CWS-NL-SETUP-ARCHIVE-20261108 setup fee, plan graphics, memory archive

Merged PR #74 (shared skills) and PR #75 (Negocio Listo $150/$250/$350) to `main` on owner instruction. Owner set the Negocio Listo setup fee to a one-time $300: published in the ES/EN fine print and FAQ answers in `src/data/negocioListo.js` and in `public/llms.txt`; `skills/negocio-listo-proposal` now reads the setup fee from the page instead of asking. Updated the six plan graphics in `public/images/negocio-listo/` (ES/EN Básico, Crecer, Destacado; big price plus the three-price strip) from $149/$249/$349 to $150/$250/$350 by redrawing only the price text in Clash Display Bold fitted to the original size and tracking (92–97% pixel overlap with the original glyphs before replacement); the graphics are social assets and not used by the page. Archived memory: project-log entries before 2026-10-25 moved to `docs/archive/project-log-2026-07-21-to-2026-10-24.md` (162 KB → 30 KB live) and 74 completed ledger rows older than the latest 40 moved to `docs/archive/task-ledger-completed-to-2026-11-08.md` (47 KB → 23 KB live); verified every original entry header, log line and ledger row is present in the live file or archive. `AGENTS.md` and `docs/agent-memory-workflow.md` now say the archive is history only and when to archive again.

## 2026-11-08 — CWS-ADMIN-UI-20261108 admin dashboard UI fixes

Audited the live `/admin` pages (CEO Today, Sales, Marketing, Operations, Accounting, Compliance) with real data; owner chose four fixes. Sidebar is now sticky on desktop (nav and Sign out stay visible) and the tab title reads "CWS OS · Admin" (`src/components/admin/AdminLayout.jsx`); the public intro loader is skipped on `/admin` routes (`src/App.jsx`); deal-fit text shows dollars instead of raw cents (`server/laya/deal-fit.js`); Laya history and saved responses show Chicago time instead of ISO timestamps, with record ids moved to the hover title (`src/lib/adminFormat.js`, `LayaResponseHistory.jsx`, `LayaOwnerResponse.jsx`); the owner-response disclaimer moved inside "What happens when I respond?"; Marketing shows an identical provider error once with the channel list instead of under every channel (`MarketingPage.jsx`). Admin, components and Laya tests pass (395/38 files, incl. new `adminFormat.test.js`); lint clean. Full-suite run in a trimmed copy failed only tests that read `public/` assets left out of the copy. Pushed as PR #78; Vercel preview build READY. Deferred audit findings: one accent color across pages, shorter CEO Today (Laya sections folded), compact Sales queue rows, history filters inline, and whether one Instagram ratio error should block every channel.

## 2026-11-08 — CWS-ADMIN-GLASS-20261108 admin graphite + glass restyle

Owner approved the graphite + glass direction from the Design canvas mock (CEO Today + Sales) and asked for a sticky side panel. Added `src/components/admin/admin-theme.css`, scoped to `.cws-admin`: graphite background with a soft orange glow, frosted panels, one accent (CWS orange) remapped over the admin pages' indigo/sky/gray utilities, and resets for the public blog-article styles that leaked into admin `<article>` cards. Rebuilt `AdminLayout.jsx` (logo mark, dot nav, glass sidebar). Sticky fix: the public site's `overflow-x: hidden` on html and body turned body into a scroll container and silently disabled `position: sticky`; admin pages now use `overflow-x: clip`, so the sidebar stays pinned on desktop and the nav is a sticky top bar on phones. CEO Today: date line, "Do next" heading, Laya sections folded into one "Laya reviews" panel. Sales: one compact row per lead with one primary action and a "…" menu for Call/Log call/Google profile/Edit/Not now. Admin tests 146/146 and lint pass; checked CEO Today, Sales (desktop and phone) and Accounting in a local browser with stubbed data. No API, data or behavior change.

## 2026-11-08 — CWS-CEO-MONEY-20261108 money tiles on CEO Today

Merged PR #79 (graphite + glass) on owner instruction. Added read-only money tiles to CEO Today: Monthly recurring, Received, Outstanding, Overdue, each linking to Accounting. `/api/ceo-today` now returns `money` built from the accounting read model it already loads, with monthly recurring including active Negocio Listo agreements the same way the Accounting endpoint does (`agreementSummary(...).activeMonthly`); `money.available` is false when obligations, receipts, recurring revenue or agreements fail to load, and the page says so instead of showing zeros. No extra request from the page. Tests: ceo-today API, admin pages, ceo and accounting servers (266 passed); lint clean; checked in a local browser with stubbed data.

## 2026-11-09 — CWS-CEO-LEADS-20261109 leads this week on CEO Today, with recordable actions

Owner asked to see last week's leads on CEO Today and record actions there. `/api/ceo-today` now returns `recent_leads` (`server/ceo/recent-leads.js`): leads added or contacted in the last 7 Chicago days, excluding test, won and lost leads, with the opportunity hypothesis and address parsed from the license-batch `source` JSON. New `RecentLeads.jsx` lists them under "Do next" with Call (tel link), Email (existing lead page), Log call, Replied, Follow-up… (dated promised action) and Not interested. Actions post to the existing Sales endpoint (`/api/command-queue`: `record_call`, `update_lead_sales_state`, `create_promised_action`); no new write path, nothing is sent. `update_lead_sales_state` overwrites phone, locality and classification, so the list sends the current values back. At build time production had 12 phone-only license-batch prospects added Nov 8 plus 8 leads contacted Nov 4–6. Tests: ceo-today API, server/ceo, admin pages (241 passed, incl. new recent-leads and RecentLeads tests); lint clean; checked in a local browser with stubbed data.

## 2026-11-09 — CWS-NL-BILLING-RULE-20261109 Negocio Listo billing starts 14 days after setup

Owner set one payment shape for every Negocio Listo agreement (DEC-040): $300 setup at signing (setup only), monthly plan starts 14 days after the setup payment and is timed to the first design preview, 12-month term from the first monthly payment, launch timing does not move billing. `skills/negocio-listo-proposal` now states it in EN/ES. Checked the Sherry group's written agreement (owner email Oct 27, accepted Oct 28, $300 setup paid Oct 28): it says $149/month starting at launch and a 12-month term from launch, so their billing changes only with their written OK. Only one client agreement exists in Accounting (Upholstery of Chicago); Sherry's is not recorded yet. App automation ("Signed" → agreement, bills, Square subscription) is planned and waits on `SQUARE_ACCESS_TOKEN`.


## 2026-11-09 — CWS-PUBLIC-PRERENDER-20261105 public HTML and incoming links

Generate HTML with existing headings, content, navigation and structured data for the 20 sitemap URLs. Serve the homepage snapshot as the default document and preserve a separate app shell for fallback routes. The Services page links to Chicago Digital Marketing, Berwyn E-commerce and Website Refresh and Redesign. The public footer links to Privacy Policy. Local build, lint, 912 tests and generated HTML checks passed.

## 2026-11-09 — CWS-NL-SIGNED-20261109 "Signed" records a Negocio Listo deal in Accounting and Square

Implements the DEC-040 follow-up. New owner action `sign_negocio_listo` on `/api/accounting` (`server/accounting/negocio-listo-signing.js`): finds or creates the client, creates the agreement (`Negocio Listo — <plan>`, $300 setup, plan price from `src/data/negocioListo.js`, 12 months), records the $300 setup receipt on its setup bill, schedules the 12 monthly bills from setup date + 14 days, and marks the linked lead won. Optional Square step (`server/accounting/square.js`, needs `SQUARE_ACCESS_TOKEN`): finds or creates the Square customer by email, finds or creates a static-price plan per tier ("Negocio Listo — <plan> ($<price>/mo)", 12 monthly periods then ongoing, same shape as the existing Upholstery plan), creates the subscription starting on the billing date (Square emails each invoice), and saves its id in `square_subscription_reference`. A Square failure never undoes Accounting; the response says what to fix. Migration `20261109163646_schedule_agreement_billing` (applied to production, version matches) adds `schedule_client_service_agreement_billing`, which allows a start up to 31 days ahead; the manual start function keeps its today-or-earlier rule. UI: "Signed…" on CEO Today's lead rows and "Record Negocio Listo signing" in Accounting share `SignNegocioListoForm`. Tests: server/accounting, admin pages (188 passed incl. new signing and form tests); lint clean. Payment sync from Square back to Accounting is not built yet.


## 2026-11-09 — CWS-EVERGREEN-FORMATS-20261109 social image format picker

Implemented locally in the existing Creative Studio: Instagram/Facebook feed, Story and static Reel cover plus LinkedIn feed presets; remembered selection; format-bound generation/retries; supported model sizes and destination composition briefs; bounded Sharp JPEG validation/conversion/contain resizing without cropping. Separate private variants per idea/format; non-shared-feed drafts remain downloadable, not scheduler inputs. Prepared migration 20261109172902 for JPEG storage and format/validation metadata, not applied. 949 tests, lint, placeholder-env full build/prerender and isolated PostgreSQL migration checks pass. Existing 40 dependency advisories unchanged. No live model/storage writes, posting, deployment, commit or push. Details: docs/marketing/evergreen-image-formats.md. Release waits on migration and live verification.

Release continuation: owner authorized production migration, merge, deployment and private generation verification. Applied migration 20261109172902 and verified format columns, private JPEG bucket, variant uniqueness, RLS and no browser INSERT grant. Full remote/local migration parity confirmed before apply; exact remote version retained.

## 2026-11-09 — CWS-SEO-PLAN-20261109 Sherry SEO plan, billing ask, per-client SEO files

Wrote the client-facing SEO plan for the Sherry group (first 90 days, keyword findings, seasonal prep, how we measure, monthly rhythm on the 3rd/5th, report layout, GBP care, client asks) using Tulio's Nov 4 keyword research (Google Keyword Planner, Chicago metro: ~900 relevant searches/month; "hood cleaning" 140). Gmail draft to Cher (not sent) shares the plan and asks to start the $149/month plan on Nov 14 instead of at launch; her written terms (Oct 28) say launch, so it needs her OK. Saved `seo-plan-2026-11-09` and `keywords-2026-11-04` as Google Docs in her Drive `05 SEO` folder. Standard for every client: SEO files live in `Clients/<Business>/05 SEO/` with dated names; new versions are new files. New account skills `client-seo-plan` (writes and saves the plan) and an update to `local-seo-sprint` (reads keywords and plan). Proposed `lead-angle-check` skill (first-match sales angle per lead) for owner review.

## 2026-11-09 — CWS-LEAD-ANGLES-20261109 lead angles on CEO Today

Ran the `lead-angle-check` skill on the 12 Nov 8 license-batch leads (batch `cws-new-business-2026-11-09`) by opening each Google Maps listing: website field, rating and review count, hours. Results saved to each lead's `source` JSON (`angle`, `website_status`, `website`, `angle_facts`, `angle_opener`, `angle_upsell`, `angle_checked_at`); status, contact fields and classification unchanged. Outcome: 1 rebrand fix (Fade by Nick, Google still says Fade Inn), 5 no website (2 Facebook-only, 1 ordering page only), 2 unlinked (Pedro's Google Sites page not on Google; Top Notch links to a financing page), 3 reviews (Third City Café and Madea's do have own sites, correcting the Nov 8 notes), 1 no clear angle (Revival Wellness Spa). Own-site quality not checked (browser blocked those domains). CEO Today "Leads this week" now shows the angle and website status as chips, the facts and the opener line, and sorts best openers first (`server/ceo/recent-leads.js`, `RecentLeads.jsx`). Tests 245 passed; lint clean.


## 2026-11-09 — CWS-LEAD-MENU-LAYER-20261109 lead "…" menu shows above the next card

Owner reported the "…" menu on Sales lead rows opened behind the next lead card. Cause: glass cards use `backdrop-filter`, which gives each card its own stacking layer, so the menu's `z-20` only counted inside its own card. Fix in `src/components/admin/admin-theme.css`: an admin card with an open `<details>` menu is lifted (`position: relative; z-index: 40`). CSS only; no behavior change.

## 2026-11-09 — CWS-LEAD-ANGLES-OCT30-20261109 angles for the remaining unchecked leads

Ran `lead-angle-check` on the 7 open leads that never had one (5 from batch `cws-new-business-2026-10-30`, 2 manual from Nov 4) by reading each Google Maps listing. Saved angle fields to each lead's `source` JSON (the 2 manual leads' `source` text "manual" kept as `provider`); status, contact fields and classification unchanged. Outcome: 1 rebrand fix (Mini Super Maravatio: Google still shows Carniceria Favela at the address; the lead's phone is Taqueria Maravatio's, a likely sister business), 2 no website (Breakfast Social has only a Toast ordering page; Taqueria El Olvido, already warm), 1 unlinked (Sage Event Studio's Google link goes to Peerspace first), 2 weak Google profiles (J&R Dance Lab and Common Friends Coffee have no phone on Google), 1 no clear angle (Boop Dog Wash, recheck around Feb 9). Own-site quality not checked (browser blocks those domains). Breakfast Social and Common Friends were never contacted, so they don't appear in CEO Today's 7-day list.
PR #85 merged as 484006a after green CI/preview; production deployment dpl_GHbfn7fLBb6EDFLWdaNo6RXLXSiU READY with live domain aliases. Merged CI passed. Authenticated admin displays the new picker, and unauthenticated creative GET returns 401 (runtime loads). Live generation is pending because Chrome repeatedly switches to concurrent work; requested a brief CWS-tab availability window. No generation, library approval or publishing action performed in this continuation yet.


## 2026-11-10 — CWS-EVERGREEN-FORMATS-20261109 live verification complete

Authenticated production UI generated one Instagram Story from an existing idea. Preview decoded at 1080x1920; private storage independently confirmed image/jpeg and 430901 bytes. Validation records source 1024x1536, padding true and cropping false. Asset ready, run needs_review, approval references null. Before/after published-post count 59, publish-attempt count 21 and approved-asset count 1 unchanged; private creative count increased 4 to 5. Migration, merge/deployment and live generation/storage verification complete. No content published or library approval performed. Other presets remain automated-test coverage rather than separate paid live generation checks.


## 2026-11-10 — CWS-STORY-FULL-FRAME-20261110 borderless Story generation

Owner requested native Story aspect ratio without white borders and with composition preserved. Story/Reel presets explicitly select gpt-image-2 at 1152x2048 and export proportionally to 1080x1920. Wrong-ratio output fails rather than padding. Added reference-image remake for unapproved padded tall drafts, fresh object path, original restoration on failure, and natural-aspect preview without white surround. No schema change or publication action. 954 tests, lint and full production build/prerender passed. Live remake follows deployment.

Release verified: PR #90 merged as f7d9bce; production dpl_5Geb1sh1Nd1x1Wn7rTYwaxmR4NDX READY. Live reference-based Story remake generated 1152x2048, exported 1080x1920 JPEG (505977 bytes), padded false/cropped false. Private storage and original object retained, ready/needs_review, null approval references. Preview visually verified without borders and with subject/composition retained. Published posts 59, publish attempts 21 and approved assets 1 unchanged. No blocker.


## 2026-11-10 — CWS-FEED-FULL-FRAME-20261110 all feed ratios

Extended explicit gpt-image-2 native-ratio generation to square/portrait feeds across Instagram, Facebook and LinkedIn, plus LinkedIn landscape. Exact-ratio exports reject mismatched output rather than padding. Landscape uses 1200x624 (25:13), within LinkedIn photo limits and exactly generatable at 1600x832; prior 1200x628 cannot meet the model edge grid within its maximum edge. Legacy/unvalidated and padded unapproved drafts can be remade with their original image as a reference. Approved assets remain protected. 990 tests, lint and full build pass. Release/live private check in progress. No migration or publishing.

Release verified: PR #91 merged as a1afa67; production dpl_GKiXWiCGUS3k3HTnYq2nhw2EW1gu READY. Live portrait reference remake exported 1080x1350 JPEG (410134 bytes) from 1152x1440, original retained. Fresh LinkedIn landscape exported 1200x624 JPEG (274764 bytes) from 1600x832. Both padded false/cropped false, private storage, ready/needs_review, null approvals, loaded previews visually checked. Published posts 59, publish attempts 21, approved assets 1 unchanged. No blocker; remaining presets have automated coverage.

## 2026-11-12 — Saved Evergreen slot drafts

Added owner-only save_draft handling before provider access, a private workspace-scoped draft table, and an approved library selector with persistent shared/channel captions. Reloaded previews and publication resolve the exact saved asset; unavailable saved assets fail closed. Attempted/resolved slots remain immutable. Generated private PNG/JPEG paths are now accepted by slot resolutions so all-error attempts can be closed without retries. Unknown actions cannot fall through to publishing. Migration 20261112192039 applied. 998 full-suite tests plus one new UI save/preview regression pass; lint and full production build checked before release. Production release and Friday assignment verification pending. No publication authorized.

Release verified: PR #92 merged as 22eb6f2; production dpl_gq7d96suN2Ad2WkgaNLFATZo9oqS READY. Earlier failed occurrence closed and Tuesday skipped using normal owner controls, failures preserved. Friday approved portrait and reviewed caption saved through save_draft; reload and all four live channel previews verified exact caption, 1080x1350 image and Not submitted status. No content published.

## 2026-11-12 — Portrait preview frame

Removed fixed image-height caps from all four channel previews, the weekly slot cards, and shared live preview. Images now render full width at their intrinsic aspect ratio. No crop, padding, image generation, stored asset changes, or publishing. Validation and live release pending.
## 2026-11-12 — CWS-EVERGREEN-BRANDING-20261112

Added branding/README.md and branding/evergreen-generation.md, linked from root and Codex/Claude guidance. Verified public CSS/font/logo sources, positioning copy and current generation/validation code; distinguished suggested visual direction from verified facts and scoped admin tokens separately. Documentation only, no automatic prompt loading or runtime changes. Checks passed: 38 relative links, documented hex values present in inspected sources, all 11 preset sizes/ratios, git diff --check. Isolated checkout based on a1afa67; original CWS checkout untouched. No commit, push, merge, deployment, generation or publication.

Follow-up: Owner authorized committing the guides and opening a review PR; merge and deployment remain unauthorized.

PR #93 release follow-up: owner authorized merge and deployment verification. Merged as 7696188; production dpl_9YDWYMKUe9yPYQHbhQdo1TcbWDB5 READY with live CWS aliases. Post-merge 999 tests, lint/build passed; homepage/admin 200, creative API 401 as expected; no error/fatal runtime logs found for that deployment.

## 2026-11-12 — CWS-EVERGREEN-BRAND-REQUESTS-20261112

Connected both canonical branding guides to the existing idea/image instruction builders, including remakes. Fixed repository paths, bounded file loading and a clear failure before provider calls prevent silent unbranded fallback. Existing text/logo restrictions, presets, validation and owner confirmation remain intact. Explicit Vercel includeFiles bundles the guides; only this review branch has automatic deployment disabled. UI and agent documentation explain the connection. 1006 tests across 98 files, lint, full placeholder-env production build/prerender, relocated server loader check and diff checks passed. No paid generation, database change, merge or deployment; PR preparation only. Live generated-image quality and deployed packaging verification remain release checks after authorization.


## 2026-11-12 — CWS-CONTACT-20261112 contact page review branch

Implemented the owner-approved contact layout using shared site styles/components. Added a validated contact inquiry form using the existing public-lead endpoint and its server-owned workspace flow; email required, optional US phone, honeypot, elapsed-time guard, pending/error/retry/success states and 15-second client timeout. Contact source is distinct from Negocio Listo; identical recent contact submissions are acknowledged without overwriting prior records. Added bounded project type/message columns in an unapplied migration and exposed those details in private Sales. Isolated Trustindex in its own embedded document after verifying a loader issue during React navigation; the supplied rating badge renders. No prices or commitments changed. The existing 15-minute audit copy / 30min scheduling URL mismatch remains unchanged.

1001 tests across 98 files, lint, and full production build/public prerender pass with placeholder client environment. Local PostgreSQL migration check verifies valid insert, constraints and preserved RLS. No live lead insertion, email, production migration, commit, push, merge or deployment. Fresh isolated checkout based on a1afa67; original CWS checkout and its unrelated image edits untouched. Review branch: feat/contact-page-lead-capture.

Owner follow-up authorized committing and pushing the review branch and opening a PR. Merge and migration application remain explicitly prohibited.


## 2026-11-12 — CWS-CONTACT-20261112 PR #94 review

Reviewed capture validation, ownership, duplicate handling, Sales detail projection, form state handling, Trustindex isolation, migration boundaries and CI. Initial tests/build/security/Vercel checks passed; Supabase Preview was skipped. Fixed long Unicode project messages being placed in PostgREST lookup URLs: candidate reads are now workspace/email/source scoped and capped at 20, with exact message/payload comparison on the server. Added long-message, distinct-inquiry and failed-lookup regressions. 1,013 tests across 98 files and lint pass locally. No migration application or merge; final remote checks pending for the fix commit.

## 2026-11-12 — Contact release migration

Owner authorized release of PR #94. Applied contact_page_inquiry_details to production, remote version 20261112200524; matched committed filename. Verified both nullable columns, service/message constraints and enabled RLS. Merge and live verification follow after checks.

## 2026-11-12 — Contact release verified

Applied migration 20261112200524 with exact repository filename and verified constraints/RLS. PR #94 merged as c0a2710 after 1020 tests/99 files, lint/build, security and Vercel checks passed (Supabase Preview skipped). Post-merge Tests passed; production dpl_4ojxW72C7a2di4U6Cccu9a7uWy3U READY with live domains. Live contact form produced receipt confirmation and exactly one synthetic inquiry with correct owner scope/source/type/message and null optional phone. Sales displayed the inquiry; owner UI excluded it as test, verified in database. Trustindex rendered; desktop/mobile inspected, no horizontal overflow at 390px. No pricing/commitment changes or outreach. Final verification notes recorded locally after release.

## 2026-11-12 — Contact owner notification

Added owner-requested email notification to fixed info@cicerowebstudio.xyz after saved contact inquiries, using existing Resend sender and validated visitor Reply-To. Plain-text contact/project details and Sales link; same persisted lead ID keys transient and browser retries. Saved inquiries survive notification failure; form receives retryable error rather than false notification confirmation. No migration, visitor outreach or Negocio Listo email changes. 1,026 tests across 100 files and lint passed; release verification pending.

PR #97 opened; all applicable CI checks passed, including full build and Vercel preview (Supabase Preview skipped). Automatic approval review rejected production merge pending explicit authorization for automatic sending. No merge, production change or notification send occurred. Ready for owner release approval.

## 2026-11-12 — Contact notifications released and delivered

Owner explicitly approved merge and one labeled production email. PR #97 merged as b706bb1; production dpl_6hHsuxEM7poFXcLoUtXfdkDi8bMu READY with live aliases and post-merge Tests passed. Browser contact submission confirmed receipt; Resend reported delivered to the owner inbox at 22:14:06 UTC. Verified labeled test body, Reply-To, project details and Sales link. Owner UI excluded the synthetic lead from live priorities. Exactly one test email sent; no visitor outreach or migration. Final verification notes recorded locally.

## 2026-11-12 — Negocio Listo owner notifications

Extended existing owner notification flow to popup and inline submissions after successful lead insert/merge. Includes phone, optional email/business, plan, business type, website status, form/language and Sales link. Fixed recipient and optional validated Reply-To; no visitor outreach. Stable saved lead ID plus payload hash deduplicates exact retries while notifying changed details. Contact payload/key unchanged. 1032 tests/100 files and lint passed; no migration. CI/release pending.
