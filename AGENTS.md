# AGENTS.md

Read `docs/product-definition.md` first; it is the canonical scope (v3, DEC-034–038).
Role-specific instructions live in `.agents/`. Project memory lives in `docs/`
(`decisions.md`, `learnings.md`, `task-ledger.md`, `project-log.md`, `agent-handoffs/`).

## What this repo is

One Vite + React 18 app (npm, Node 22) with two parts:

- The public Cicero Web Studio marketing site (`/`).
- CWS OS, the authenticated owner admin (`/admin`). It has six surfaces: CEO Today,
  Sales, Marketing, Operations, Accounting, and Compliance.

Server logic is Vercel serverless functions under `/api` (not Next.js). Supabase is
the only state store. Supabase project `cws-os-staging` is **production**.

## Commands

- Dev server: `npm run dev` → http://localhost:5174 (`strictPort`). `/api` handlers are mounted as Vite middleware.
- Tests: `npm run test:run` (Vitest; run the current suite).
- Lint: `npm run lint`.
- Build: `npm run build` (runs the import-casing check first; Vercel's Linux build is case-sensitive).
- Env: `npm run env:pull` (Vercel) or `npm run env:setup` (placeholders). The admin needs Supabase keys; the public site does not.

## Rules that bite

- Production deploys from `main`. A ticket is not done until it is merged.
- Migration files must use the **exact** remote version (see `docs/technical-conventions.md`).
- External actions (publishing, email) require exact-resource owner confirmation. Never trigger them from GET, reload, or tests.
- Vercel Hobby caps the function count. Add routes with `vercel.json` rewrites into existing handlers.
- This repo is **public**. Never commit client data, secrets, or seed rows containing real customer details.
- The intro loader waits for the window `load` event, so heavy video pages can sit at 100% for 20–40 s on a cold load. That is expected.

## Product v3 boundaries

- AI is AUTO + PREPARE only. New in-app LLM work waits for product definition §9a; the existing advisory Marketing assessment is grandfathered (DEC-039).
- Laya rules set verdicts with source-backed claims; only owner responses persist evaluations.
- Retirement order: code removal and deployment, verified export, database migration. Keep `agent_runs`, `channels`, `decisions`, and shared `update_updated_at()`.
- Project time is owner-entered whole hours.
