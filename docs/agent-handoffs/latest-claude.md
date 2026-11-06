Task ID: CWS-SKILLS-20261106
Agent: Claude
Objective: Centralize agent skills so Claude and ChatGPT/Codex share one copy, and write the first three CWS skills.

Files changed:
- `skills/README.md`, `skills/cws-follow-up/SKILL.md`, `skills/negocio-listo-proposal/SKILL.md`, `skills/client-update/SKILL.md` (new)
- `.claude/skills` and `.agents/skills` (new symlinks to `skills/`)
- `.vercelignore` (excludes `skills`)
- `docs/agent-handoffs/shared-skills-chatgpt-2026-11-06.md` (new, handoff for ChatGPT/Codex)
- `docs/project-log.md`, `docs/task-ledger.md` (appended)

Inspected: `AGENTS.md`, `.agents/claude-project-instructions.md`, `docs/agent-memory-workflow.md`, `docs/product-definition.md` (Sales, Negocio Listo), `docs/accounting/profitability-and-catalog.md`, `server/sales/queue.js`, `server/outreach/templates.js`, `src/data/negocioListo.js`.

Findings:
- CWS OS Sales already derives Day 0/4/10 follow-ups and prepares template drafts with owner-confirmed send, so `cws-follow-up` is scoped to warm conversations only.
- Negocio Listo pricing differs between owner notes ($150/mo + $300 setup) and the public page ($149/$249/$349, setup by plan). The proposal skill reads the page and asks for the setup fee.

Tests run: none needed (Markdown and symlinks only; no app code touched).

Memory updates withheld: no decision or learning added; pricing source of truth needs owner confirmation.

Next: owner confirms pricing, merges the PR, uploads skill zips to claude.ai, adds skills in the ChatGPT desktop app.
