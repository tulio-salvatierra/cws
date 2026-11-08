Task ID: CWS-NL-SETUP-ARCHIVE-20261108
Agent: Claude
Objective: Merge the skills and pricing PRs, publish the $300 setup fee, update plan graphics to $150/$250/$350, and archive bloated memory files.

Files changed:
- `src/data/negocioListo.js`, `public/llms.txt` (one-time $300 setup fee, ES/EN)
- `skills/negocio-listo-proposal/SKILL.md` (setup fee read from the page)
- `public/images/negocio-listo/{es,en}-0{2,3,4}-*.png` (prices redrawn)
- `docs/project-log.md`, `docs/task-ledger.md` (trimmed; new entries)
- `docs/archive/project-log-2026-07-21-to-2026-10-24.md`, `docs/archive/task-ledger-completed-to-2026-11-08.md` (new)
- `AGENTS.md`, `docs/agent-memory-workflow.md` (archive rule)
- `docs/agent-handoffs/shared-skills-chatgpt-2026-11-06.md` (setup fee resolved)

Findings:
- Plan graphics use Clash Display Bold (`src/assets/fonts/clash.woff2`) with tight tracking; prices were redrawn by fitting size and tracking to the original glyphs.
- `scripts/save-agent-memory.mjs` duplicate check only sees the live project log; documented.

Tests run: full suite, lint, production build with placeholder client env.

Not changed: Accounting draft catalog offers in the database still list $149/$249/$349 (production data; owner edit). `en-02-basico-150-v2.png` already showed $150 and $300 setup; untouched. Contenido add-on stays +$300/mo.

Next: owner updates Accounting draft offers; next archive when the live log passes about 60 KB.
