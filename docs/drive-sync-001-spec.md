# DRIVE-SYNC-001 — Drive CONTEXT files → OS sync (spec, ready to build)
*Drafted by Cosmo 2026-10-22 at Tulio's approval. Status: spec only — not yet in the task ledger, not built.*

## Problem
V3-ACCEPTANCE-001 found the OS register holds **zero identified Negocio Listo agreements** and stale completeness, because client truth is created in chats and documents and only reaches Supabase if the owner re-types it. The owner should never be the integration layer.

## Source of truth (already live in Google Drive)
Every client folder under `Clients/` in the CWS business Drive holds a `00 CONTEXT.md` whose YAML frontmatter is the machine-readable contract:

```yaml
client, status (prospect|signed|active|past|paused), poc, plan, mrr,
next_action, next_action_due, updated
```

Prospects live in `Sales & Client Management/Prospects/` as `00 CONTEXT — <name>.md`. Master reference: `Agency Marketing & Strategy/OPERATOR BRIEF.md` and `…/00 CONTEXT — TEMPLATE.md`.

## Build (v1, one-way)
1. **Reader job** (Vercel cron function or owner-triggered action): lists `Clients/*` and `Prospects/`, downloads each `00 CONTEXT.md`, parses YAML frontmatter only (prose is never parsed).
2. **Validation:** reject a file on malformed YAML, unknown `status`, or negative `mrr` — report the error, skip that client, continue with the rest. No partial writes for a rejected file.
3. **Upsert into Supabase:** match by normalized client name to the existing lead/client/agreement records the OS already models; update stage/status, plan, MRR, next action + due date, and the source's `updated` stamp. Respect TEST-LEADS-001 exclusions (flagged test leads are never touched). Create a record only when no match exists AND the file's status is `signed` or `active`; prospects stay leads.
4. **Idempotent:** a second run with unchanged files produces zero writes. Store a per-file content hash + last-synced timestamp to prove it.
5. **Owner-visible report:** after each run, a sync summary in the OS (files read, records created/updated, files rejected with reasons). No silent failures.
6. **Dry-run mode first:** report what *would* change; owner flips it live after reviewing the first dry-run.
7. **Credentials:** Google read-only access (Drive `readonly` scope) via env-held credentials in Vercel. **No client data, file contents, or credentials are ever committed to this repo** — data lands only in Supabase; the repo holds code and this spec.

## Explicitly out of scope (v1)
- Writing anything back to Drive (two-way sync is a later ticket).
- Parsing the prose sections of CONTEXT files.
- Invoices/payments ingestion (register doc is human-maintained for now).
- Any LLM involvement in the mapping — deterministic field mapping only.

## Acceptance criteria
- Dry-run against the current Drive state reports exactly the 7 existing CONTEXT files (6 clients + 1 prospect).
- After the live run, the OS register reflects every signed/active CONTEXT file — including the currently signed client whose agreement V3-ACCEPTANCE-001 could not find — with the MRR stated in its file, and goal pace can count it. (No client names or figures in this repo, per AGENTS.md; verify against the Drive files themselves.)
- Re-running sync with no Drive changes = zero writes, verified by hash.
- A deliberately malformed test CONTEXT file is rejected with a named reason and no other client's sync is affected.
- Business-state hashes for unrelated surfaces are unchanged (same standard as prior tickets).

## Proposed task-ledger row
| DRIVE-SYNC-001 | Codex | Spec drafted 2026-10-22 (Cosmo); awaiting owner go to build | One-way Drive CONTEXT YAML → Supabase upsert; dry-run first; deterministic; no repo-held client data | Owner reviews first dry-run before live; activation separate; no external actions |
