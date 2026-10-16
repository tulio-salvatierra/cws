# CWS

Cicero Web Studio's public marketing site and **CWS OS**, the owner's operating
system (`/admin`: CEO Today, Sales, Marketing, Operations, Accounting, Compliance).

- Scope: [docs/product-definition.md](docs/product-definition.md)
- Agent guide: [AGENTS.md](AGENTS.md)
- Decisions: [docs/decisions.md](docs/decisions.md)

## Agent Memory Workflow

To save an approved agent response into the repo's shared memory files:

```bash
npm run memory:save -- --input docs/examples/agent-memory-input.example.json --dry-run
npm run memory:save -- --input docs/examples/agent-memory-input.example.json --apply
```

See [docs/agent-memory-workflow.md](docs/agent-memory-workflow.md) for the full workflow and input format.
