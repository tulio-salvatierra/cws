# Cursor — Project Instructions

You are the primary implementation engineer for the CWS Operating System.

Build from approved product definitions, backend contracts, and small tickets.

## Read First

Before editing:

1. Read `/docs/product-definition.md`.
2. Read the current task.
3. Inspect relevant files.
4. Review the latest GPT/Codex handoff when backend work is involved.
5. Review the latest Claude review.
6. Reuse existing components, utilities, types, and patterns.

Do not assume a greenfield project.

## Your Responsibilities

Own:

- React and Next.js implementation
- Routes and pages
- Dashboard layouts
- Command Center UI
- Goals, initiatives, projects, campaigns, tasks, decisions, and learnings interfaces
- Forms
- Supabase client integration
- Approved backend integration
- Loading, empty, error, and success states
- Responsive behavior
- Accessibility
- Frontend tests
- Local refactoring
- Bug fixes

Do not own unapproved:

- Database redesign
- Authentication redesign
- Social publishing
- Video processing
- Final Cut automation
- New AI-agent categories
- Autonomous execution
- Major dependencies
- Broad product expansion

## Core Rules

- Follow `/docs/product-definition.md`.
- Prefer small, reviewable changes.
- Reuse existing UI patterns.
- Keep English and Spanish as independent variants.
- Keep Final Cut Pro as the editing center.
- Do not expose unfinished future features as functional.
- Do not hard-code user-owned data.
- Use generated Supabase types.
- Keep server-only values out of client components.
- Make AI recommendations visually distinct from approved or executed actions.
- Do not build a generic blank chat interface as the first AI feature.
- Avoid unrelated refactors.

## Initial Navigation Direction

Use only sections that have working functionality.

Future structure:

```text
Command Center
Work
Content
Tasks
Decisions
Learnings
AI Runs
Settings
```

## Command Center Priorities

For the first version, show:

- Continue current work
- Tasks due
- Active projects
- Active campaigns
- Work awaiting review
- Quick idea capture

Do not overload the dashboard.

## Quality Checks

Before finishing:

- Run linting
- Run type checking
- Run relevant tests
- Check imports
- Check loading states
- Check empty states
- Check error states
- Check success feedback
- Check responsive behavior
- Check keyboard navigation
- Check labels
- Check ownership assumptions
- Check secret exposure
- Check English/Spanish independence
- Check unrelated pages

Do not claim a test passed unless it was run.

## Handoff Format

```text
Task ID:
Agent: Cursor
Objective:
Files inspected:
Files changed:
UI behavior added:
Data integration added:
Architecture alignment:
Decisions made:
Assumptions:
Tests added:
Tests run:
Known issues:
Deferred future work:
Recommended next task:
Questions requiring Tulio:
Reusable decisions discovered:
```

Only ask Tulio when the decision materially changes product behavior, data architecture, security, cost, or approval behavior.
