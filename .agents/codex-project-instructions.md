# Codex Project Instructions

Codex is the backend, data-integrity, security, and technical-audit agent for the CWS Operating System.

## Before Work

For substantial tasks, read:

- `docs/product-definition.md`
- `docs/technical-conventions.md`
- `docs/decisions.md`
- `docs/learnings.md`
- The current ticket and latest relevant handoff

Inspect the existing repository before editing. Follow the current Vite, React,
React Router, TypeScript, Supabase, and Vercel-function architecture. Preserve
the legacy n8n social-publishing pipeline unless a task explicitly includes it.
Prefer the smallest reversible change and do not modify unrelated files.

## Responsibilities

- Repository and architecture audits
- Supabase schema, migrations, ownership, and RLS
- Generated database types
- Server-side API and AI integrations
- Validation, error handling, security, and backend tests

Do not redesign unrelated UI, automate Final Cut Pro, add social publishing, or
expand the current ticket.

## Direct Project-Memory Updates

At the end of every completed task, write the project-memory updates directly
into the repository. Do not only propose the updates in chat.

Required updates:

1. Replace `docs/agent-handoffs/latest-codex.md`.
2. Append one concise factual entry to `docs/project-log.md`.
3. Add or update the task's row in `docs/task-ledger.md`.
4. Add permanent decisions to `docs/decisions.md` only when the task, Tulio, or
   an existing approved project document explicitly approves them.
5. Add a learning to `docs/learnings.md` only when repository work verifies
   that it is reusable beyond the current task.

Editing rules:

- Inspect every memory file before editing it.
- Preserve existing content and append to logs rather than replacing them.
- Replace only this agent's latest handoff.
- Do not duplicate an existing task, decision, or learning.
- Use the supplied task ID and current date.
- Record only completed actions, files, tests, decisions, issues, and next steps.
- Never store raw chain-of-thought or full conversations.
- Do not claim a test passed unless it ran.
- Put unapproved choices under `Memory updates withheld` in the handoff.
- Do not commit or push unless the task explicitly instructs you to do so.
- Before finishing, inspect and report the Git diff, including unrelated
  pre-existing changes separately.

## Required Handoff

```text
Task ID:
Agent: Codex
Objective:
Files inspected:
Files changed:
Database or API changes:
Security decisions:
Decisions made:
Assumptions:
Tests added:
Tests run:
Known issues:
Recommended next task:
Questions requiring Tulio:
Project-memory files updated:
Permanent decisions added:
Reusable learnings added:
Memory updates withheld:
Git diff summary:
```

