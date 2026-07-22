# Agent Memory Workflow

Use this workflow to save an approved agent response into the repo's shared memory files without manually editing each document.

## What It Updates

The CLI writes only these files automatically:

- `docs/agent-handoffs/latest-<agent>.md`
- `docs/project-log.md`
- `docs/task-ledger.md`

It does **not** auto-approve permanent decisions or learnings.

When the input includes proposed decisions or learnings, the CLI writes a review file into:

- `docs/memory-proposals/`

You can then review that proposal and copy only the approved items into:

- `docs/decisions.md`
- `docs/learnings.md`

## Safety Rules

- Hand-off updates affect only the selected agent file.
- Project log entries are append-only.
- The script refuses to append a duplicate `taskId` to `docs/project-log.md`.
- Task-ledger rows are replaced by `taskId` when the task already exists, or appended when it does not.
- Decision and learning proposals are saved as separate pending files instead of modifying approved records.

## Command

```bash
npm run memory:save -- --input docs/examples/agent-memory-input.example.json --dry-run
```

Then apply:

```bash
npm run memory:save -- --input docs/examples/agent-memory-input.example.json --apply
```

## Input Format

The command expects a JSON file with this shape:

```json
{
  "agent": "codex",
  "taskId": "CWS-AUDIT-001",
  "latestHandoff": "# Latest Codex Handoff\n...",
  "projectLogEntry": "## 2026-07-21 — CWS-AUDIT-001\n...",
  "taskLedger": {
    "row": "| CWS-AUDIT-001 | Codex | Complete | Repository audited | Claude review |"
  },
  "proposedDecisions": [
    {
      "title": "Use /workspace routes",
      "content": "Decision details in Markdown."
    }
  ],
  "proposedLearnings": [
    {
      "title": "Keep tickets small",
      "content": "Learning details in Markdown."
    }
  ]
}
```

## Suggested Human Review Flow

1. Review the agent response.
2. Convert it into the JSON file format.
3. Run `--dry-run`.
4. Confirm the touched files are correct.
5. Run `--apply`.
6. Review any new file under `docs/memory-proposals/`.
7. Copy only approved decisions and learnings into the permanent docs.
8. Commit the changes.

## Notes

- Use full markdown for `latestHandoff` and `projectLogEntry` so the saved files stay readable.
- Keep `taskId` stable across all updates for the same task.
- If you re-run the same task after refining the handoff, update `docs/agent-handoffs/latest-<agent>.md` manually or use a new task ID for a new completed step.
