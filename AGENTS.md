# AGENTS.md

## Cursor Cloud specific instructions

This repo (`cws`, "Cicero Web Studio") is a single Vite + React 18 marketing SPA (npm, Node 22). There is no monorepo, backend server, or database to run for local dev — the `api/*` handlers are Vercel serverless functions mounted as Vite middleware, Supabase is a no-op stub, and the n8n/Google Sheets/Resend integrations are optional external services.

### Services and commands
There is one service: the Vite dev server. Standard scripts live in `package.json`:
- Dev server: `npm run dev` → http://localhost:5174 (fixed via `strictPort`).
- Lint: `npm run lint` (ESLint flat config, passes clean).
- Build: `npm run build`.
- Tests: `npm run test:run` (Vitest). Note: there are currently **no test files** in the repo, so this exits reporting "No test files found" — that is expected, not a failure.

### Non-obvious caveats
- The intro loader (`src/Hooks/Loader.ts`) waits for the browser `window` `load` event (i.e. all page assets) before revealing content. Because the home/gallery pages load large video assets (one is ~6 MB), first paint can take a long time and the loader may appear "stuck" at 100% on heavy/cold loads. Give it 20-40s, or do a normal reload; this is app behavior, not an environment problem.
- Dependencies do not require any secrets/`.env` to run, lint, build, or view the marketing site. `npm run env:check` requires Supabase + Google Sheets keys and will fail without them, but it is only relevant for the (currently inactive) client-portal/email integrations — skip it for normal frontend dev.
- `npm run env:setup` copies `.env.example` → `.env` (placeholders only). Safe but unnecessary for viewing the site.
