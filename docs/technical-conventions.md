# Technical Conventions

## Stack

- Vite
- React
- React Router
- TypeScript
- Supabase
- Tailwind CSS
- Vercel serverless functions under `/api` (Hobby plan: function count is capped —
  add routes via `vercel.json` rewrites into existing handlers before adding files)
- bundle.social for social publishing (LinkedIn, Facebook, Instagram, Google Business Profile)
- Resend for outreach email and signed delivery/bounce webhooks
- Google Sheets + Apps Script for the client intake relay
- Laya deterministic `decision_review` lives in `server/laya/decision-review.js` and is projected through the existing CEO Today GET. Source claims include table, row ID, workspace, row version and exact fields; the evaluation includes its Chicago date/clock. It performs no I/O or persistence. Verdict fixtures run in GitHub Actions.
- The legacy Marketing `/api/laya-assess` flow remains advisory under §9a/DEC-039; new LLM calls remain gated. Explicit owner responses use the existing CEO Today POST with `action=laya_response`. Server verifies ownership and an owner/workspace-bound signed snapshot/evaluation before append-only insertion into `laya_evaluations`; browser inserts are denied. Reasons are required; review IDs make identical retries idempotent and conflicting retries fail. GET/reload never persist. Activation uses its separate owner-JWT path.
- Final Cut Pro for video editing (references only, never automated)
- n8n is retired (DEC-030); do not add or restore any n8n path

Note: this is not Next.js. There is no app router, no server components, and no
Next.js API routes in this repository — server-side logic lives in Vercel
serverless functions under `/api`.

Goal pace remains a pure read projection in `server/ceo/goal-pace.js`, returned by the existing CEO Today GET. Owner-JWT-only append-only `negocio_listo_evidence` links to exact same-workspace/client agreements. `negocio_listo_completeness` uses a trigger-computed register snapshot (agreement identity/client/product + latest evidence revision), current Chicago date, source note and owner provenance. Submitted snapshot/date must equal the database’s current values or the owner must reload and review again. No service-role writes; no UPDATE/DELETE grants. Completeness requires every NL agreement to be reviewed, known included signature/status evidence, today’s status verification, and at most one included core agreement per client. Unknown/excluded add-ons are explicit owner choices, not guesses. The evaluator compares the snapshot and date, preserves unknown counts on failed/truncated reads (1,000-row cap), and counts signed dates only through the checkpoint. Full evidence history is retained; no provider calls or decision activation. Product §1a remains target provenance.

`server/laya/deal-fit.js` v2 uses owner-JWT append-only deal budgets and a canonical snapshot shared with private invoker `nl_deal_snapshot`. Existing CEO GET adds scoped budget/project-cost reads; failed or 1,000-row-capped sources withhold deal fit. Budget labor and direct costs cover the entire recorded term. Exact cents-vs-hours multiplication tests the $50 floor; no rounded-rate pass. Capacity applies only to the owner’s dated window and explicit complete workload declaration. Snapshots include all agreement economics, other-deal plan content including availability/commitments (not review revision), project versions and cost rows; own plan is supplied by the new evidence. Same-content re-reviews avoid circular invalidation. Snapshot/date equality, exact client/workspace links, positive whole hours, explicit complete declarations, actual-hours/cost lower bounds and provenance are enforced in the database. No UPDATE/DELETE or service-role write grants. Decisions/response persistence remain separate.

## Row-Level Security

- The dormant v1/n8n tables were dropped by migration `20261021155615`. Their historical blanket authenticated RLS pattern must not be reused (DEC-007).
- New CWS Operating System tables use explicit `workspace_id` / `created_by`
  ownership columns with workspace-authorized RLS policies, per DEC-007.

## Environments

- Supabase project `cws-os-staging` (`ddbhxqkckzpwzwvnoxqt`) **is production**,
  despite its name. Treat every migration and write against it as a Production change.
- Production deploys from `main`. Work may happen on branches, but a ticket is not
  done until it is merged to `main`.

## Migrations

- Every migration applied to the database must have a committed file in
  `supabase/migrations/` whose version prefix **exactly matches** the remote
  version recorded in `supabase_migrations.schema_migrations`. When an apply
  operation assigns a different remote timestamp, rename the local file to match
  before committing.
- Verify parity after every apply: the remote migration list and the local
  files must have zero differences.
- Never use `supabase migration repair` or a broad `db push` to paper over drift.

## Lifecycle and project time

- `server/lifecycle/negocio-listo.js` is a pure source-based projection. Explicit intake/product identifiers and project/agreement foreign keys govern membership; never match names or infer signatures/provider status.
- Time is entered with the authenticated owner JWT into `project_time_entries`. Server/agent writes are denied. `actual_hours` is a guarded derived cache used by existing financial views, synchronized by a non-exposed owner-checked trigger with per-project transaction locking. Direct total/decimal writes are rejected.

## Definition of done

See `docs/product-definition.md` §10.

