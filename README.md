# CWS

Vite + React application for Cicero Web Studio, including the current marketing site, admin tooling, and the in-progress CWS Operating System workspace.

## Agent Memory Workflow

To save an approved agent response into the repo's shared memory files:

```bash
npm run memory:save -- --input docs/examples/agent-memory-input.example.json --dry-run
npm run memory:save -- --input docs/examples/agent-memory-input.example.json --apply
```

See [docs/agent-memory-workflow.md](docs/agent-memory-workflow.md) for the full workflow and input format.
