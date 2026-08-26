# CWS Operating System — Product Definition

## Purpose

The CWS Operating System is an internal workspace for Cicero Web Studio.

It should help the owner:

- Set business direction
- Manage goals, initiatives, projects, campaigns, and tasks
- Track decisions and learnings
- Produce content for Cicero Web Studio and a separate drum-practice channel
- Use AI to recommend, organize, and prepare work
- Keep human control over important decisions and actions

The first active module is **Content Operations**.

The future executive layer should help answer:

- What should I work on next?
- Which work supports revenue growth?
- What is blocked?
- What should be postponed?
- What have I already decided?
- What completed work can become content or a service offering?

## Current Scope

Build now:

- Workspace foundation
- Channels
- Goals
- Initiatives
- Projects
- Campaigns
- Independent English and Spanish content variants
- Tasks
- Decisions
- Learnings
- Agent runs
- Approvals
- Automatic social publishing
- Social OAuth integrations
- CWS intro advertisement pilot
- Future-ready AI command architecture

Do not build yet:

- Video rendering
- Final Cut Pro automation
- Client portals
- Full CRM
- Team-management complexity
- Autonomous business decisions
- Recursive agent loops

## Core Structure

*(Content Operations / Channels module — see DEC-027. Does not govern Goals, Initiatives, or Projects navigation, which is defined separately.)*

```text
Workspace
├── Channels
│   ├── Channel Brief (voice/tone per locale)
│   ├── Topics & Proposals
│   ├── Content Variants (video track + social/text track)
│   └── Published Posts (per platform)
├── Goals
│   └── Initiatives
├── Projects
├── Campaigns (optional grouping across variants)
├── Tasks
├── Decisions
├── Learnings
├── Agent Runs
└── Approvals
```

Every Content Variant belongs to a Channel directly (`content_variants.channel_id`, required). Campaigns are an optional grouping across variants (`content_variants.campaign_id`, nullable), not a required container. A variant may exist under a Channel with no Campaign at all — this is the normal case for routine social/text content, not an exception.

## Initial Workspace

- Name: Cicero Web Studio
- Primary user: Owner
- Main business areas:
  - Web development
  - Website strategy
  - Photography
  - Video production
  - AI automation
  - Local business growth
  - Outreach
  - Content production
  - Internal product development

## Initial Channels

1. Cicero Web Studio
2. Drum Practice Channel

Each channel has its own:

- Audience
- Voice
- Formats
- Production requirements
- Revenue goals
- Success metrics

## Initial Pilot

- Campaign ID: `CWS-001`
- Title: Cicero Web Studio Intro Advertisement
- Stage: Editing
- Editing tool: Final Cut Pro
- Source: English and Spanish recorded during one production session

Variants:

- `CWS-001-EN-MASTER`
- `CWS-001-ES-MASTER`

English and Spanish must remain independent variants with separate:

- Transcripts
- Tone
- Editing notes
- Status
- Titles
- Captions
- Approvals
- Export references
- Future analytics

## Standard Statuses

### Goals

`draft`, `active`, `at_risk`, `paused`, `completed`, `cancelled`

### Initiatives

`idea`, `planned`, `active`, `blocked`, `paused`, `completed`, `cancelled`

### Projects

`idea`, `planned`, `active`, `blocked`, `review`, `completed`, `archived`, `cancelled`

### Campaigns

`idea`, `selected`, `planning`, `preproduction`, `recording`, `editing`, `review`, `ready`, `published`, `measuring`, `archived`

### Content Variants

`draft`, `script_ready`, `ready_to_record`, `recorded`, `rough_cut`, `fine_cut`, `captions_pending`, `ready_for_review`, `approved`, `exported`, `published`, `archived`

*(A shorter status ladder for social/text content is tracked as a follow-up ticket per DEC-027 and not yet implemented.)*

### Tasks

`todo`, `in_progress`, `blocked`, `review`, `completed`, `cancelled`

### Agent Runs

`queued`, `running`, `completed`, `failed`, `needs_review`, `superseded`

### Approvals

`pending`, `approved`, `revision_requested`, `rejected`

Approvals are recorded automatically at publish time as a traceability log, for both video and social/text content — they do not block publishing. This reflects solo-operator use, where the same person drafts and publishes; see DEC-027.

### Decisions

`proposed`, `approved`, `superseded`, `reversed`, `archived`

## AI Command Model

The future AI interface should operate in three levels:

### Ask

Read workspace data and answer questions.

No database changes.

### Propose

Create structured recommendations such as:

- Create tasks
- Change priorities
- Create a goal
- Add an initiative
- Add a decision
- Add a learning
- Connect work to a goal

The user reviews the proposal.

### Execute

Apply only approved actions.

Every action must be:

- Validated
- Authorized
- Traceable, including an automatic approval log entry
- Reversible where practical

The AI must never directly mutate important business data from an open-ended chat response.

## Final Cut Pro

Final Cut Pro remains the primary editing tool.

The dashboard may store:

- Library name
- Project name
- Local reference
- Editing stage
- Export filename
- Export version
- Review notes
- Revision notes
- Transcript
- Caption status

The dashboard must not initially:

- Open Final Cut
- Modify `.fcpbundle` files
- Edit timelines
- Render video
- Replace the human editing process

No video file is ever uploaded to or stored in CWS OS, at any point in the workflow — only references. This is a permanent constraint, not a phase-one limitation.

## Product Principles

Favor:

- Structured data
- Human control at the point of action
- Reversible decisions
- Clear agent boundaries
- Small implementation tickets
- Traceable history
- Solo-operator usability
- One source of truth
- Progressive disclosure
- Reusable learnings

Avoid:

- Scope creep
- Generic AI chat with no structure
- Premature integrations
- Autonomous strategy changes
- Recursive agent conversations
- Complex abstractions before real use
- Treating every idea as a feature

## Decision Hierarchy

When something is unclear:

1. Existing code
2. This document
3. Approved schema
4. Current ticket
5. Existing conventions
6. Simplest reversible decision
7. Ask Tulio only when the decision materially affects architecture, security, cost, approval behavior, or business direction

## Continuous-Improvement Question

At the end of each meaningful work cycle, ask:

> What decisions, assumptions, conventions, or repeated questions surfaced that we can define now to make future work faster and more consistent?

Classify findings as:

- Product definition
- Technical convention
- Agent instruction
- Prompt library
- UI pattern
- Testing checklist
- Business strategy
- Content opportunity
- One-time exception