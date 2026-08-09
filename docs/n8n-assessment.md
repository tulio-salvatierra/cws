# CWS-N8N-ASSESS-006 — Live n8n Assessment

Date: 2026-08-09
Agent: Codex
Mode: Read-only assessment
Instance: `https://ciceroweb.app.n8n.cloud`
Instance version: n8n `2.33.7`
Instance timezone: `America/Chicago`

## Executive verdict

The n8n workspace is online, but the social-publishing pipeline is not
operational.

- Eight workflows exist. Five are published and three are unpublished.
- The instance and every individual workflow show no saved executions. The
  n8n Cloud dashboard reports zero production executions in August.
- Exact 90-day execution totals and historical success/failure timestamps are
  unavailable because this instance retains execution records for only seven
  days (`maxAge: 168` hours). No last successful or failed execution remains.
- WF1 and WF5 are scheduled to run, but nothing is currently scheduled to
  publish to a social network. WF5 only attempts to mark database rows as
  scheduled. The only workflow with social-posting nodes is unpublished and
  contains unresolved placeholders.
- The five published workflows target Supabase project
  `ugxipyozzhvqoqenygiz`, while the current CWS application and assessed live
  schema use project `ddbhxqkckzpwzwvnoxqt`. The old project is not accessible
  through the connected Supabase account, so its schema could not be verified.
- Several workflow writes are incompatible with the current live schema even
  if the database target were corrected.
- Production is missing `VITE_N8N_WF2_WEBHOOK_URL`, so the app cannot start
  WF2. Approving a draft only updates Supabase; it does not call n8n.
- The Settings page's green `active` labels are hardcoded and do not reflect
  workflow publication, executions, failures, or credential health.

## Assessment limits

No workflow was executed, published, unpublished, enabled, disabled, edited,
duplicated, or exported. Credential values were not opened or copied. The
credential overview exposes names and types but no live connection test, so
"no visible error" is not evidence that a key or token works.

The current n8n retention policy prevents a reliable 90-day execution count.
The table below therefore separates publication state, visible execution
history, and operational verdict.

## A. Live workflow inventory

| Workflow | ID | Published / active | Trigger and schedule/path | Last successful execution | Last failed execution | Executions in last 90 days | Credential references | Supabase reads/writes | Platforms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WF1 — Research Agent | `giFkvElDN2S5HbLx` | Yes | Cron `0 6 * * 1-5` (06:00 Mon–Fri, Chicago) | Unknown; no saved execution | Unknown; no saved failure | `0` visible; exact 90-day count unavailable | `OpenAi account 2`, `Anthropic account`, `Header Auth account`; no visible error indicator, not connection-tested | Writes `research_topics` in `ugxipyozzhvqoqenygiz`; then POSTs to WF2 | None | DORMANT |
| WF2 — Copy Agent | `yC03AN4OtjktsalV` | Yes | Unauthenticated POST webhook `/webhook/wf2-copy-agent` | Unknown; no saved execution | Unknown; no saved failure | `0` visible; exact 90-day count unavailable | `Anthropic account`, `Header Auth account`; no visible error indicator, not connection-tested | Reads/updates `research_topics`; writes `content_drafts` and `platform_posts` in `ugxipyozzhvqoqenygiz` | Generates copy for Instagram, Facebook, X, LinkedIn, Pinterest, WhatsApp, and YouTube; publishes none | DORMANT |
| WF3 — Image Agent | `z73lioFUx7ECWJa0` | Yes | Unauthenticated POST webhook `/webhook/wf3-image-agent` | Unknown; no saved execution | Unknown; no saved failure | `0` visible; exact 90-day count unavailable | `OpenAi account 2`, `Header Auth account`; no visible error indicator, not connection-tested | Reads and patches `content_drafts` in `ugxipyozzhvqoqenygiz`; then POSTs to WF4 | None | DORMANT |
| WF4 — Content Compiler & Notifier | `QTzp4UrMPhxMaZXa` | Yes | Unauthenticated POST webhook `/webhook/wf4-notify` | Unknown; no saved execution | Unknown; no saved failure | `0` visible; exact 90-day count unavailable | `Header Auth account`; no visible error indicator, not connection-tested | Reads `content_drafts` and `platform_posts`; writes `notifications` and patches `content_drafts` in `ugxipyozzhvqoqenygiz` | None | DORMANT |
| WF5 — Scheduler | `XJNIrFxnc5lPZKvl` | Yes | Cron `0 7 * * 1-5` (07:00 Mon–Fri, Chicago) | Unknown; no saved execution | Unknown; no saved failure | `0` visible; exact 90-day count unavailable | `Header Auth account`; no visible error indicator, not connection-tested | Reads approved `content_drafts`; patches `platform_posts` and `content_drafts` in `ugxipyozzhvqoqenygiz` | Assigns database schedule times for Instagram, Facebook, LinkedIn, X, Pinterest, YouTube, and WhatsApp; publishes none | DORMANT |
| WF6 – Publisher (X + LinkedIn) | `TCU0bPri5qprzcSo` | No; empty unpublished draft | No trigger or nodes | None | None | `0` | None | None | None | DORMANT |
| Multi-Platform Social Media Content Publisher | `7mbEP3bIwHpobaBi` | No; unpublished | Unauthenticated POST webhook `/webhook/wf4-publisher` | Unknown; no saved execution | Unknown; no saved failure | `0` visible; exact 90-day count unavailable | No named social credential is attached in the visible nodes. Supabase and social calls use inline headers or unresolved placeholders; connection status unknown | Intended to read/update `content_drafts` and `platform_posts`, but update URLs still contain a Supabase project placeholder | Instagram, Facebook, WhatsApp, X, LinkedIn, Pinterest; no live YouTube-ready node | DORMANT |
| My workflow | `xpfqECmBrffLlkzfSv3at` | No; unpublished | Manual trigger | None | None | `0` | `OpenAi account`; no visible error indicator, not connection-tested | None | Generates a sample Sora video; publishes none | DORMANT |

### Active versus recently executed

WF1–WF5 are published. That is configuration state only. None has a saved
execution, and the Cloud dashboard reports zero August production executions.
An enabled workflow with no execution evidence is not a working pipeline.

### Is anything scheduled to publish?

No. WF1 is scheduled to research, and WF5 is scheduled to mutate database
schedule fields. The external social publisher is unpublished and incomplete.
No active workflow posts to a social platform.

## B. Reconciliation with repository documentation

| Documented workflow | Live result | Reconciliation |
| --- | --- | --- |
| WF1 — Research Agent | Exists under the documented name | Live cron is `0 6 * * 1-5`; workflow is published but dormant. |
| WF2 — Copy Agent | Exists under the documented name | Live webhook path is `/webhook/wf2-copy-agent`; workflow is published but dormant. |
| WF3 — Image Agent | Exists under the documented name | Live workflow is materially smaller than the setup document. It uses DALL-E only, patches `content_drafts`, and calls `/webhook/wf4-notify`; it does not upload to Storage, create `media_assets`, use Unsplash, or send WhatsApp. |
| WF4 — Publisher Agent | MISSING under the documented identity | Live WF4 is **Content Compiler & Notifier**, matching the Settings page rather than `n8n/wf4-publisher.md`. An unpublished workflow named **Multi-Platform Social Media Content Publisher** uses `/webhook/wf4-publisher`, but it contains unresolved placeholders and is not an operational replacement. |
| WF5 — Keyword AI Agent | MISSING | Live WF5 is **Scheduler**, matching the Settings page rather than `n8n/wf5-keyword-agent.md`. No keyword workflow exists in the instance. |

The Settings page is closer to the live WF4/WF5 identities than the Markdown
setup files, but its green status labels remain false assurance because they
are constants, not observed health.

## C. Database and status-contract reconciliation

### Database target split

All five published workflows call `ugxipyozzhvqoqenygiz.supabase.co`. The
assessed CWS database is the active `cws-os-staging` project
`ddbhxqkckzpwzwvnoxqt`. The legacy tables in the current project are empty.
The connected Supabase account cannot access project `ugxipyozzhvqoqenygiz`,
so compatibility with the workflows' actual target remains unknown.

The checks below compare the exact live n8n payloads with the current CWS live
schema, as required. They do not claim that the inaccessible old project has
the same schema.

| Workflow / node | Table | Columns and values sent | Current live schema result |
| --- | --- | --- | --- |
| WF1 / Save to Supabase | `research_topics` | `topic`, `keywords` | Compatible. Both columns exist. |
| WF2 / Save Draft | `content_drafts` | `topic`, `research_topic_id`, `status='pending_image'`, `keywords` | Compatible. Columns exist and `pending_image` is accepted. |
| WF2 / Save Platform Posts | `platform_posts` | `draft_id`, `platform`, `copy`, `status='pending'` | Compatible. Columns exist; all seven platform values including `youtube` are accepted; `pending` is accepted. |
| WF3 / Update Draft | `content_drafts` | `image_url`, `image_prompt`, `status='ready'` | Incompatible. `image_url` and `image_prompt` do not exist. `ready` is not accepted by `draft_status`. |
| WF4 / Save Notification | `notifications` | `draft_id`, `type='content_ready'`, `payload`, `seen=false` | Incompatible. `public.notifications` does not exist. |
| WF4 / Mark Review Pending | `content_drafts` | `status='review_pending'` | Incompatible. Accepted values are `pending_image`, `pending_review`, `approved`, `rejected`, `published`. |
| WF5 / Schedule Platform Post | `platform_posts` | `scheduled_at`, `status='scheduled'` | Incompatible. `scheduled_at` does not exist on `platform_posts`, and `scheduled` is not accepted by `post_status`. |
| WF5 / Mark Draft Scheduled | `content_drafts` | `status='scheduled'` | Incompatible. `content_drafts.scheduled_at` exists, but `scheduled` is not accepted by `draft_status`. |
| Multi-Platform Publisher / Update Platform Post | `platform_posts` | `status` of `published` or `failed`, `posted_at` | Payload values and columns are compatible, but the URL still contains an unresolved Supabase project placeholder and the node has no named credential. |
| Multi-Platform Publisher / Mark Draft Published | `content_drafts` | `status='published'` | Status is compatible, but the publisher is unpublished and its database/social configuration is incomplete. |

### Confirmed enum values

- `platform_name`: `instagram`, `facebook`, `x`, `linkedin`, `pinterest`,
  `whatsapp`, `youtube`
- `post_status`: `pending`, `approved`, `published`, `failed`, `youtube_ready`
- `draft_status`: `pending_image`, `pending_review`, `approved`, `rejected`,
  `published`

Migrations `003_add_youtube_platform` and `004_add_youtube_ready_status` are
applied. No YouTube migration is needed.

### Every observed status-string disagreement

| Source | Value used | Database accepts | Result |
| --- | --- | --- | --- |
| WF3 | `ready` on `content_drafts.status` | `pending_image`, `pending_review`, `approved`, `rejected`, `published` | Invalid |
| WF4 and Settings page | `review_pending` on `content_drafts.status` | `pending_review` | Invalid / reversed word order |
| WF5 | `scheduled` on `content_drafts.status` | No `scheduled` value | Invalid |
| WF5 | `scheduled` on `platform_posts.status` | No `scheduled` value | Invalid |
| Settings page | `draft`, `review_pending`, `scheduled` | No matching `draft_status` values | Misleading display contract |
| Analytics page | `review_pending`, `scheduled`, `draft` | No matching `draft_status` values | Queries/counts cannot match valid rows |
| Calendar and Published Card | `scheduled` for platform posts | No matching `post_status` value | Query/display contract mismatch |
| `useDrafts` and Content Queue | `pending_review` | `pending_review` | Correct |

`useYouTubeDrafts` still says YouTube is absent and intentionally returns an
empty list, even though the live enums support `youtube` and `youtube_ready`.

### Approval behavior

Approving a legacy draft calls only:

```text
content_drafts.update({ status: 'approved' }).eq('id', id)
```

There is no n8n webhook call in the approval path and no inbound `/api` route
for n8n. The comment that WF5 picks up approved drafts describes polling, not
an approval-triggered webhook.

### n8n-related application environment variables

| Variable | Expected by | Production status |
| --- | --- | --- |
| `VITE_N8N_WF2_WEBHOOK_URL` | `GenerateButton` in Settings and Content Queue; documented in `.env.example` | **Missing** |

The local Vite proxy also hardcodes `https://ciceroweb.app.n8n.cloud` for
`/webhook`, but no server-side n8n secret, API key, callback secret, or inbound
route exists.

## D. Credential expiry and configuration risk

Credential overview inventory:

- `Header Auth account` — Header Auth; referenced by five workflows
- `Supabase account` — Supabase API; no confirmed live workflow reference
- `OpenAi account 2` — OpenAI; referenced by WF1 and WF3
- `OpenAi account` — OpenAI; referenced by `My workflow`
- `Anthropic account` — Anthropic; referenced by WF1 and WF2
- `n8n free OpenAI API credits` — OpenAI; no confirmed live workflow reference

No credential card shows an error or reauthorization badge. That is not a
connection test, and there are no recent executions to prove validity.

The larger risk is absence, not visible expiry:

- There is no X OAuth credential in the credential inventory.
- There is no LinkedIn OAuth credential in the credential inventory.
- There is no Pinterest OAuth credential in the credential inventory.
- There is no named Meta/Instagram/Facebook/WhatsApp credential in the
  credential inventory.
- The unpublished publisher uses inline headers or unresolved placeholders.
  Its WhatsApp phone-number ID and Supabase project ID are visibly unresolved.
- Social OAuth reauthorization cannot be assessed because the expected social
  OAuth credentials do not exist as credential records.

## E. Dependency-ordered operational checklist

- [ ] **S [REVIVE] Decide revive or retire.** Do not spend time repairing
  credentials or schema until Tulio chooses whether this legacy subsystem is
  still part of the operating model.
- [ ] **S [FIX] Choose the authoritative database.** Confirm whether the old
  `ugxipyozzhvqoqenygiz` project should be recovered or every workflow should
  eventually be retargeted to `ddbhxqkckzpwzwvnoxqt`.
- [ ] **M [REVIVE] Recover read access to the old Supabase project** if it is
  authoritative, then repeat the schema/payload reconciliation against that
  actual target.
- [ ] **M [FIX] Ratify one workflow contract.** Resolve WF4 compiler versus
  publisher and WF5 scheduler versus keyword agent. Retire or rename obsolete
  workflows so identifiers are unambiguous.
- [ ] **M [FIX] Align database payloads before any execution.** Resolve WF3's
  missing image fields and invalid `ready`, WF4's missing `notifications` table
  and invalid `review_pending`, and WF5's missing `platform_posts.scheduled_at`
  plus invalid `scheduled` statuses. This requires a separately approved
  design; this ticket authorizes no migration.
- [ ] **S [REVIVE] Export the selected workflows into version control** only
  after a follow-up ticket authorizes export. Treat the live definitions, not
  the current setup documents, as the starting evidence.
- [ ] **L [REVIVE] Rebuild or reconnect publisher credentials.** Create named,
  least-privilege credentials for only the approved platforms and reauthorize
  social OAuth. Remove inline secrets and all placeholder values.
- [ ] **M [FIX] Repair the publisher configuration.** Correct the unresolved
  Supabase/WhatsApp placeholders, validate external endpoint identifiers, add
  an explicit YouTube-ready contract if YouTube remains in scope, and keep the
  publisher inactive until a non-public test passes.
- [ ] **M [FIX] Add a server-side outbound relay for manual generation.** Do
  not expose an unauthenticated n8n webhook as a browser-bundled secret. The
  relay should authenticate the admin, validate the payload, enforce a timeout,
  and log a correlation ID.
- [ ] **S [REVIVE] Configure the approved Production trigger** after the relay
  exists. The current missing `VITE_N8N_WF2_WEBHOOK_URL` should not be filled
  with a secret webhook URL in the public client bundle.
- [ ] **M [FIX] Replace hardcoded Settings health labels.** Derive status from
  an observed signal such as published state plus a recent execution heartbeat,
  or display `Unknown`. Keep active and recently executed separate.
- [ ] **M [NEW] Add an authenticated inbound Vercel return route.** n8n should
  POST a signed result after each publish, recording workflow/execution ID,
  draft and platform-post IDs, platform, external post ID, outcome, timestamp,
  and a sanitized error. Make it idempotent and reject unsigned callbacks.
- [ ] **M [NEW] Add durable execution observability.** Seven-day n8n retention
  cannot support a 90-day health claim. Store sanitized execution heartbeats
  and outcomes outside n8n or increase retention if the plan supports it.
- [ ] **M [REVIVE] Run a non-publishing staging cycle.** Use dummy rows and
  sandbox credentials to validate WF1 through compilation/scheduling without
  calling live social APIs.
- [ ] **L [REVIVE] Run one controlled publish.** After every preceding item is
  complete, publish one approved test item to explicitly selected test/social
  accounts and verify both outbound posts and the new return records.

## F. Questions requiring Tulio

1. Should this pipeline be **revived or retired**?
2. Is Supabase project `ugxipyozzhvqoqenygiz` still owned and intended to be
   the publishing database, or should the pipeline eventually target the CWS
   project `ddbhxqkckzpwzwvnoxqt`?
3. Should live WF4 remain the compiler/notifier, or should WF4 become the
   publisher described in the repository?
4. Should live WF5 remain the scheduler, or is the documented keyword agent
   still required?
5. Which social platforms should a revived MVP actually publish to?
6. Are sandbox/test accounts available for those platforms?
7. May a follow-up ticket export the selected workflows into version control?
8. Should execution outcomes be retained for at least 90 days outside n8n?

No retained execution proves when the pipeline last succeeded. The current
seven-day retention window means the audit cannot determine whether the last
success immediately preceded suspension or predates it by a long margin. That
missing evidence materially strengthens the case for deciding revive versus
retire before repair work begins.

## Verification performed

- `npm ci` — passed
- Production `npm run build` with valid placeholder client Supabase variables
  — passed; 430 modules transformed
- `npm run lint` — passed with one existing `useDrafts` dependency warning
- `npx vitest run` — 22 files and 68 tests passed
- Live n8n workspace, workflow, execution, trigger, node-configuration, and
  credential-name inspection — read-only
- Live Supabase schema, enum, migration-history, and legacy-table activity
  queries — read-only
- Production Vercel environment-name inspection — read-only

No repository code, database data, workflow configuration, credential, or
Production environment variable was changed.
