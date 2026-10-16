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
- Laya advisory evaluator (`/api/laya-assess`), AUTO tier only
- Final Cut Pro for video editing (references only, never automated)
- n8n is retired (DEC-030); do not add or restore any n8n path

Note: this is not Next.js. There is no app router, no server components, and no
Next.js API routes in this repository — server-side logic lives in Vercel
serverless functions under `/api`.

## Row-Level Security

- Legacy tables (`research_topics`, `keywords`, `content_drafts`, `platform_posts`,
  `media_assets`, `post_analytics`) retain their existing blanket
  `to authenticated using (true) with check (true)` policy. Do not extend this
  pattern to new tables — see DEC-007.
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

## Definition of done

See `docs/product-definition.md` §10.

