# CWS shared skills

Agent skills for running Cicero Web Studio, written once and used by both Claude and
ChatGPT/Codex. Each skill is a folder with a `SKILL.md` (YAML frontmatter with `name` and
`description`, then instructions), following the open Agent Skills format.

## Skills

| Skill | Stage | What it does |
| --- | --- | --- |
| `cws-follow-up` | Win · outreach | Drafts warm follow-ups: replies, post-call recaps, stalled proposals. The cold Day 0/4/10 sequence stays in CWS OS Sales. |
| `negocio-listo-proposal` | Win · close | Turns call notes into a one-page Negocio Listo proposal (ES/EN), using prices from `src/data/negocioListo.js`. |
| `client-update` | Keep · care | Turns a client's `00 STATUS.md` into a short plain-language update (ES/EN). |

All three are draft-only: they never send, publish or charge anything. Tulio reviews and sends.

## Where each tool reads them

- **Claude Code**: `.claude/skills` → symlink to `skills/`
- **Codex**: `.agents/skills` → symlink to `skills/`
- **Claude app (claude.ai)**: upload each skill folder as a zip in Settings. Re-upload after edits.
- **ChatGPT desktop app**: add the skill folders from this repo. ChatGPT web and mobile only
  see skills bundled in a plugin.

## Adding a skill

1. Create `skills/<kebab-name>/SKILL.md` with `name` (same as the folder) and a
   `description` that says exactly when to use it.
2. Keep instructions tool-neutral: describe what to read and do, not one assistant's tool names.
3. Keep it draft-only unless Tulio explicitly approves an action (sending, publishing, spending).
4. **This repo is public.** No client names, contact details, prices off the public page,
   credentials or other private data in skill files.
5. Log the change in `docs/project-log.md`.
