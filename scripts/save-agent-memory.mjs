import fs from 'node:fs';
import path from 'node:path';

const VALID_AGENTS = new Set(['codex', 'claude', 'cursor']);

function printHelp() {
  console.log(`Usage:
  node scripts/save-agent-memory.mjs --input <path> [--apply]
  node scripts/save-agent-memory.mjs --input <path> --dry-run

Options:
  --input <path>   Path to a JSON file containing a structured memory update.
  --apply          Persist changes to the repository files.
  --dry-run        Show the files that would change without writing them.
  --help           Show this message.

Expected input shape:
{
  "agent": "codex",
  "taskId": "CWS-AUDIT-001",
  "latestHandoff": "# Latest Codex Handoff\\n...",
  "projectLogEntry": "## 2026-07-21 — CWS-AUDIT-001\\n...",
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
}`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: false,
    input: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help') {
      printHelp();
      process.exit(0);
    }

    if (token === '--apply') {
      args.apply = true;
      continue;
    }

    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (token === '--input') {
      args.input = argv[i + 1] ?? null;
      i += 1;
      continue;
    }

    fail(`Unknown argument "${token}"`);
  }

  if (!args.input) {
    fail('Missing required --input argument.');
  }

  if (args.apply && args.dryRun) {
    fail('Use either --apply or --dry-run, not both.');
  }

  if (!args.apply && !args.dryRun) {
    fail('Choose one mode: --apply or --dry-run.');
  }

  return args;
}

function ensureTrailingNewline(value) {
  return value.endsWith('\n') ? value : `${value}\n`;
}

function readJson(inputPath) {
  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (error) {
    fail(`Unable to read or parse JSON input file: ${error.message}`);
  }

  return parsed;
}

function assertString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`Field "${fieldName}" must be a non-empty string.`);
  }
}

function validateInput(payload) {
  assertString(payload.agent, 'agent');
  assertString(payload.taskId, 'taskId');
  assertString(payload.latestHandoff, 'latestHandoff');
  assertString(payload.projectLogEntry, 'projectLogEntry');

  if (!VALID_AGENTS.has(payload.agent)) {
    fail(`Field "agent" must be one of: ${Array.from(VALID_AGENTS).join(', ')}`);
  }

  if (payload.taskLedger !== undefined) {
    if (typeof payload.taskLedger !== 'object' || payload.taskLedger === null) {
      fail('Field "taskLedger" must be an object when provided.');
    }

    assertString(payload.taskLedger.row, 'taskLedger.row');
  }

  validateProposalArray(payload.proposedDecisions, 'proposedDecisions');
  validateProposalArray(payload.proposedLearnings, 'proposedLearnings');
}

function validateProposalArray(items, fieldName) {
  if (items === undefined) {
    return;
  }

  if (!Array.isArray(items)) {
    fail(`Field "${fieldName}" must be an array when provided.`);
  }

  items.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      fail(`Field "${fieldName}[${index}]" must be an object.`);
    }

    assertString(item.title, `${fieldName}[${index}].title`);
    assertString(item.content, `${fieldName}[${index}].content`);
  });
}

function repoPath(...segments) {
  return path.join(process.cwd(), ...segments);
}

function readExisting(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function updateProjectLog(existingContent, taskId, entry) {
  const normalizedEntry = ensureTrailingNewline(entry.trim());

  if (existingContent.includes(taskId)) {
    fail(`docs/project-log.md already contains task "${taskId}". Refusing to append a duplicate entry.`);
  }

  const trimmedExisting = existingContent.trimEnd();

  if (trimmedExisting.length === 0) {
    return `# Project Log\n\n${normalizedEntry}`;
  }

  return `${trimmedExisting}\n\n${normalizedEntry}`;
}

function extractRowTaskId(row) {
  const parts = row
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    fail('Task-ledger row must be a valid markdown table row.');
  }

  return parts[0];
}

function updateTaskLedger(existingContent, newRow) {
  const normalizedRow = ensureTrailingNewline(newRow.trim());
  const newTaskId = extractRowTaskId(newRow);
  const lines = existingContent.length > 0
    ? existingContent.split('\n')
    : [
        '# Task Ledger',
        '',
        '| Task ID | Agent | Status | Result | Next |',
        '| --- | --- | --- | --- | --- |',
      ];

  let replaced = false;
  const updatedLines = lines.map((line) => {
    if (!line.trim().startsWith('|')) {
      return line;
    }

    const lineTaskId = extractRowTaskId(line);

    if (lineTaskId === 'Task ID') {
      return line;
    }

    if (lineTaskId === '---') {
      return line;
    }

    if (lineTaskId === newTaskId) {
      replaced = true;
      return normalizedRow.trimEnd();
    }

    return line;
  });

  if (!replaced) {
    if (updatedLines[updatedLines.length - 1] !== '') {
      updatedLines.push(normalizedRow.trimEnd());
    } else {
      updatedLines.splice(updatedLines.length - 1, 0, normalizedRow.trimEnd());
    }
  }

  return ensureTrailingNewline(updatedLines.join('\n').replace(/\n{3,}/g, '\n\n'));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function buildProposalFile(payload) {
  const decisionCount = payload.proposedDecisions?.length ?? 0;
  const learningCount = payload.proposedLearnings?.length ?? 0;

  if (decisionCount === 0 && learningCount === 0) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const sections = [
    '# Pending Memory Proposals',
    '',
    `- Task ID: ${payload.taskId}`,
    `- Agent: ${payload.agent}`,
    `- Created: ${timestamp}`,
    '',
    'These proposals were captured automatically and still require human review before they are copied into `docs/decisions.md` or `docs/learnings.md`.',
    '',
  ];

  if (decisionCount > 0) {
    sections.push('## Proposed Decisions', '');

    payload.proposedDecisions.forEach((decision, index) => {
      sections.push(`### ${index + 1}. ${decision.title}`, '', decision.content.trim(), '');
    });
  }

  if (learningCount > 0) {
    sections.push('## Proposed Learnings', '');

    payload.proposedLearnings.forEach((learning, index) => {
      sections.push(`### ${index + 1}. ${learning.title}`, '', learning.content.trim(), '');
    });
  }

  return ensureTrailingNewline(sections.join('\n'));
}

function collectUpdates(payload) {
  const updates = [];

  updates.push({
    path: repoPath('docs', 'agent-handoffs', `latest-${payload.agent}.md`),
    content: ensureTrailingNewline(payload.latestHandoff.trim()),
  });

  updates.push({
    path: repoPath('docs', 'project-log.md'),
    content: updateProjectLog(readExisting(repoPath('docs', 'project-log.md')), payload.taskId, payload.projectLogEntry),
  });

  if (payload.taskLedger?.row) {
    updates.push({
      path: repoPath('docs', 'task-ledger.md'),
      content: updateTaskLedger(readExisting(repoPath('docs', 'task-ledger.md')), payload.taskLedger.row),
    });
  }

  const proposalContent = buildProposalFile(payload);

  if (proposalContent) {
    const proposalFileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${payload.taskId}-${slugify(payload.agent)}.md`;
    updates.push({
      path: repoPath('docs', 'memory-proposals', proposalFileName),
      content: proposalContent,
      createOnly: true,
    });
  }

  return updates;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function applyUpdates(updates, dryRun) {
  const label = dryRun ? 'Would update' : 'Updated';

  updates.forEach((update) => {
    if (update.createOnly && fs.existsSync(update.path)) {
      fail(`Proposal file already exists: ${path.relative(process.cwd(), update.path)}`);
    }

    if (!dryRun) {
      ensureParentDir(update.path);
      fs.writeFileSync(update.path, update.content, 'utf8');
    }

    console.log(`${label}: ${path.relative(process.cwd(), update.path)}`);
  });
}

const args = parseArgs(process.argv.slice(2));
const payload = readJson(path.resolve(process.cwd(), args.input));

validateInput(payload);
const updates = collectUpdates(payload);
applyUpdates(updates, args.dryRun);

if (args.dryRun) {
  console.log('');
  console.log('Dry run complete. Re-run with --apply to persist these changes.');
}
