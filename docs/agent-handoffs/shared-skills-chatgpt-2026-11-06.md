# Handoff for ChatGPT / Codex: CWS shared skills

Date: 2026-11-06 · From: Claude · Branch: `claude/shared-skills`

## Context

Tulio runs Cicero Web Studio (CWS), a one-person web studio in Chicago. He uses both Claude
and ChatGPT/Codex and wants one shared library of agent skills instead of two copies. Both
products use the same open Agent Skills format: a folder with `SKILL.md` (frontmatter `name`
+ `description`, then instructions).

Working style: casual, concise, give reasoning. Ship over scaffold: smallest version that
works end to end with real data. Collect blockers at the end. No publishing, sending,
spending or client contact without Tulio's explicit OK.

## What exists now

- `skills/` at the repo root is the single source of truth.
- `.claude/skills` and `.agents/skills` are symlinks to `skills/`, so Claude Code and Codex
  load the same files. `skills/` is excluded from Vercel uploads.
- Three draft-only skills, chosen from an end-to-end map of CWS operations as the biggest
  gaps on the money side:

| Skill | Use when | Key rules |
| --- | --- | --- |
| `cws-follow-up` | Replying to a prospect, recapping a demo/call, nudging a stalled proposal | Does **not** replace the CWS OS Sales Day 0/4/10 cold sequence. No unconfirmed prices. Draft only. |
| `negocio-listo-proposal` | Turning call notes into a one-page proposal | Prices come from `src/data/negocioListo.js` every time. Setup fee only as Tulio states it. 12-month minimum. Flags scope creep. |
| `client-update` | Monthly note or progress update to a client | Reads `Clients/<Business>/00 STATUS.md` in Drive. Plain language, client's language, no jargon, no invented numbers. |

## How to use them on your side

- **Codex CLI / IDE**: open the repo; skills load from `.agents/skills`. Mention one with `$`
  or list them with `/skills`.
- **ChatGPT desktop app**: add the three folders from `skills/` as skills, then call one
  with `@`.
- **ChatGPT web/mobile**: only plugin-bundled skills show up there. Don't package a plugin
  unless Tulio asks.

## Rules to keep

1. Read `AGENTS.md` and `.agents/codex-project-instructions.md` before changing anything.
2. This repo is **public**: no client names, contacts, private prices or credentials in skill files.
3. Keep skills tool-neutral (no assistant-specific tool names in the core instructions).
4. Draft-only. CWS OS's authority model is AUTO + PREPARE for AI; Tulio CONFIRMs.
5. Edit skills in `skills/` only, never in the symlinked paths. Log changes in
   `docs/project-log.md`.

## Open items (Tulio's call)

- **Pricing conflict.** Tulio's notes say the standard is $150/mo + $300 setup. The public
  page lists $149 / $249 / $349 tiers with "setup fee by plan". The proposal skill follows
  the page and asks for the setup fee until Tulio confirms which is current.
- Merge PR from `claude/shared-skills`. It doesn't change the app build, and `skills/` is
  excluded from deploys.
- Next candidates on the ops map: mini-audit (prospecting), launch checklist, upsell offer.
  Build only after these three have been used on real work.
