# CWS Operating System — Product Definition

Version: 2 — approved by Tulio 2026-10-16 (DEC-032). Supersedes v1 (Content Operations workspace).
Basis: live audit of `main` @ `9f799c7`, the production Supabase database, and project memory.

---

## 1. Purpose

CWS OS is the private operating system for Cicero Web Studio, run by one owner.

It exists to answer one question every day: **what is the best next move for the business, and is it done?**

It does this by keeping the business's real state in one place (sales, marketing, delivery, money, obligations). It derives priorities from that state. And it lets the owner carry out external actions (posting, emailing) safely, one confirmed action at a time.

It is not a generic project-management tool, CRM, or AI chat.

## 2. What is live today

The admin app (`/admin`) has six surfaces. These are the product.

| Surface | What it does | Key tables |
| --- | --- | --- |
| **CEO Today** (`/admin`) | Deterministic daily command view. Priority order: **urgent → GET MONEY → Marketing → DELIVER**. No scores or weights. | reads from all departments |
| **Sales** | Prospect discovery, owner selection, deterministic command queue, Day 0/4/10 follow-up, owner-confirmed Resend email. Target: 5 initial prospect emails per Chicago business day (DEC-031). | `leads`, `clients`, `outreach_sends`, `sales_*` |
| **Marketing** | Weekly slots, offer catalog, owner-reviewed creative drafts, Laya advisory checks. One owner-confirmed publish to LinkedIn, Facebook, Instagram, and Google Business Profile via bundle.social. Durable per-destination results and write-back to `published_posts`. | `marketing_*`, `offers`, `published_posts` |
| **Operations** | Client delivery projects and their requirements/readiness. | `operations_projects`, `project_requirements`, `client_projects` |
| **Accounting** | Obligations, payment receipts, recurring revenue, expenses and subscriptions, project financials, client service agreements and installments, monthly cash profitability. | `financial_obligations`, `payment_receipts`, `business_expenses`, `client_service_agreements`, … |
| **Compliance** | Verified business obligations and their completions. | `compliance_requirements`, `compliance_completions` |

Also live: the public marketing site (`cicerowebstudio.xyz`). The public client portal is **disabled**; intake runs through Vercel and Google Apps Script.

## 3. Authority model

There is one vocabulary for what the system and its AI may do. It replaces v1's Ask/Propose/Execute.

| Tier | Meaning | Examples |
| --- | --- | --- |
| **AUTO** | Reads, derives, and displays. Never changes business data or the outside world. | CEO Today ordering, missed-slot detection, Day 0/4/10 state, Laya advisory checks |
| **PREPARE** | Creates drafts, proposals, or internal records the owner will review. Nothing leaves the system. | Creative drafts, email drafts, prospect briefs, offer captions |
| **CONFIRM** | Any external mutation. It requires a short-lived, single-use owner confirmation bound to the **exact** resource (slot + asset, or lead + recipient + draft). Every action is recorded before and after it reaches the provider. | Publishing a post, sending an email |

Rules:

- **AI may AUTO and PREPARE.** It never CONFIRMs.
- Reloads, GETs, reconciliation, and "Not now" actions can never trigger a CONFIRM action.
- Time-based state is derived, never stored. Only the owner's decision is persisted (DEC-029).
- **Confirmation ≠ approval.**
  - A *confirmation* is the owner authorizing one exact external action.
  - An *approval* is a content-review record.
  - In the solo-operator model, approvals are logs, not gates (DEC-027). Confirmations are always gates.
- AI must never invent metrics, contact leads, spend money, publish, or change goals on its own.

## 4. Product principles

Favor:

- **Live, observable outcomes over capability.** A feature is done when its real-world metric moves: posts published, emails delivered, payments recorded. It is not done when its tests pass.
- **One department surface per business function.** Don't add a new top-level surface without a decision.
- **Deterministic logic** before scoring, weights, or AI ranking.
- **Small, frozen milestones.** Ship, verify live, freeze, and only then scope the next one.
- **Structured data, traceable history, append-only evidence.**
- **Solo-operator usability:** nothing waits on a second person.

Avoid:

- Generic task, approval, workflow, event, or CRM frameworks.
- Autonomous strategy changes or recursive agent loops.
- Building above a layer whose real-world metric is still zero.

## 5. Language

- CWS sells bilingual (English/Spanish) work. English and Spanish are **independent artifacts**, written separately and never machine-translated.
- **Current live system: English only (owner decision, DEC-032).** No live Marketing or Sales table has a language field yet.
- Supporting Spanish means adding an explicit `lang` field to the relevant records plus separate content. It never means adding a translation step.

## 6. Dormant layer (frozen)

These were built for the v1 "Content Operations" model. They still exist in the database but are **not in the admin navigation**; their routes redirect to `/admin`:

- `goals`, `initiatives`, `projects`, `tasks`, `decisions`, `learnings`
- `channels`, `campaigns`, `content_variants`, `approvals`, `content_variant_exports`, `content_variant_revision_events`
- `channel_brief`, `channel_topics`, `topic_coverage`, `topic_proposals`
- `agent_runs`, plus the `generate-draft` and `review-generated-draft` endpoints

Status: **frozen** (owner decision, DEC-032).

The rule for this layer:

- Data is retained read-only.
- No new work on it without a decision that names which surface it serves.

The pre-OS n8n tables (`research_topics`, `keywords`, `content_drafts`, `platform_posts`, `media_assets`, `post_analytics`) are retired with n8n (DEC-030). Dropping them needs its own authorized migration.

## 7. Final Cut Pro

Final Cut Pro remains the editing tool. CWS OS may store references only: library or project name, export filename and version, notes, transcript, caption status.

It must not open Final Cut, modify `.fcpbundle` files, edit timelines, or render video.

### Active pilot: CWS-001 intro advertisement

The English and Spanish takes are recorded. The remaining work is the final Final Cut Pro edit into publishable masters (owner task).

After export, the ad enters the live system as a **Marketing creative asset**, not as a campaign or variant in the frozen layer. Per §5, English ships first; the Spanish master waits for the `lang` field.

Video publishing through Marketing/bundle.social is not yet verified. It is its own scoped ticket, opened once an export exists.

## 8. Integrations of record

| Integration | Role |
| --- | --- |
| **Supabase** | The only state store. Project `cws-os-staging` (`ddbhxqkckzpwzwvnoxqt`) **is production** despite its name. |
| **Vercel** | Hosting and `/api` serverless functions. Hobby plan, so the function count is capped; consolidate with rewrites before adding functions. |
| **bundle.social** | Social publishing: LinkedIn, Facebook, Instagram, Google Business Profile. |
| **Resend** | Outreach email and signed delivery/bounce webhooks. |
| **Google Sheets + Apps Script** | Client intake relay. |
| **Laya** | Advisory decision evaluator (AUTO tier only). |
| **Retired / not used** | n8n (DEC-030), Ayrshare, Postiz, X. |

## 9. Not building now

- Unconfirmed or scheduled auto-publishing and auto-sending
- Client portal (disabled until separately scoped)
- Full CRM, team/multi-user complexity, generic workflow or approval engines
- Ranking weights or AI scoring in CEO Today
- Video rendering, Final Cut Pro automation
- Reviving any part of the dormant layer without a decision (Section 6)
- Departments-as-schema beyond the six live surfaces

## 10. Definition of done (every ticket)

1. Merged to `main`. Production deploys from `main`.
2. Every applied migration has a committed file whose version **exactly matches** the remote version.
3. One task-ledger row plus the agent's handoff file updated.
4. Live verification recorded, read-only where possible.
5. If the ticket changes scope or authority, this document is updated in the same PR.

## 11. Source-of-truth hierarchy

When sources disagree:

1. Live database and production behavior
2. `main` branch code
3. This document
4. `docs/decisions.md` (approved, non-superseded entries)
5. Current ticket
6. Existing conventions
7. Simplest reversible choice
8. Ask Tulio only when the choice affects architecture, security, recurring cost, authority/confirmation behavior, language, or business direction.

The repo copy of this document is canonical; the Claude Project copy mirrors it. Status vocabularies are defined by the database check constraints and are not duplicated here.

## 12. Continuous-improvement question

At the end of each meaningful work cycle, ask:

> What decisions, assumptions, or repeated questions surfaced that we can define now?

Classify each finding as one of: product definition, technical convention, agent instruction, UI pattern, testing checklist, business strategy, content opportunity, or one-time exception.
