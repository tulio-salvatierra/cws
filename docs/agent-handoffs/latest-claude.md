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
- Negocio Listo pricing conflict resolved by owner: $150 / $250 / $350 monthly. Setup fee is still not published; the proposal skill asks for it.

Follow-up (same day): owner set Negocio Listo monthly prices to $150 / $250 / $350. Branch `claude/nl-pricing` updates `src/data/negocioListo.js` (plans, SEO titles/descriptions, FAQ, JSON-LD offers and priceRange), the hero "from" price in `NegocioListo.jsx`, `public/llms.txt` and the prerender test. Full suite 899/899, lint and build (placeholder client env) pass; built ES/EN pages show only $150/$250/$350 and schema offers 150/250/350.

Tests run: see follow-up above; the skills change itself is Markdown and symlinks only.

Memory updates withheld: no decision or learning added; pricing source of truth needs owner confirmation.

Not changed: Accounting draft catalog offers in the database still say $149/$249/$349 (production data, needs owner-confirmed edit in Accounting); social graphics in `public/images/negocio-listo/` have prices baked in and are not used by the page.

Next: owner reviews and merges both PRs (merging deploys the price change to production), uploads skill zips to claude.ai, adds skills in the ChatGPT desktop app.
