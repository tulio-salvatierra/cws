Task ID: CWS-EVERGREEN-BRANDING-20261112
Agent: Codex
Objective: Small, agent-readable Evergreen branding reference grounded in repository sources.
Files inspected: AGENTS.md; Codex/Claude instructions; product definition, technical conventions, decisions, learnings, log, ledger and prior handoff; public CSS, Tailwind, header SVG/import, Problem artwork/import, Hero/Chicago/Negocio Listo copy, admin theme; imageFormats.js, creative.js, image-output.js, existing format documentation.
Files changed: branding/README.md; branding/evergreen-generation.md; AGENTS.md; README.md; .agents/codex-project-instructions.md; .agents/claude-project-instructions.md; this handoff; docs/project-log.md; docs/task-ledger.md.
Database or API changes: None. Markdown is not loaded automatically into generation prompts.
Security decisions: No external mutations or client data; existing confirmation boundaries retained.
Decisions made: Source-linked facts separated from suggested editorial/visual defaults. Existing text-free/logo-free prompt preserved. Runtime code remains authority for presets/validation.
Assumptions: Suggested photo/composition/overlay guidance is not a separately approved brand policy.
Tests added: None; documentation-only change.
Tests run: 38 relative links resolve; every documented hex is present in inspected source files; all 11 current presets match documented ratios and generation/export sizes; git diff --check passed. Application suite/build not run because runtime code is unchanged.
Known issues: Owner authorized commit, push and review PR on 2026-11-12; merge and deployment remain unauthorized. Original /Users/tuliosalvatierra/CWS contains unrelated modified project records and untracked outputs/tools, left untouched.
Recommended next task: Owner review of the documentation PR. Runtime prompt integration is separate scope if requested.
Questions requiring Tulio: None to complete this documentation request.
Project-memory files updated: This handoff, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: Suggested visual direction is explicitly labeled, not recorded as approved policy.
Git diff summary: Nine documentation files (two new), isolated branch codex/evergreen-branding-guide based on a1afa67; no pre-existing edits in this checkout.

Follow-up CWS-STORY-FULL-FRAME-20261110: native 9:16 image tool output and composition-reference remakes implemented; 954 tests, lint and full build passed; PR #90 merged, production READY, reference-based live remake verified at 1080x1920 JPEG with no padding/cropping. Original retained; nothing approved or published. No migration required or publishing authorized.

Current follow-up CWS-FEED-FULL-FRAME-20261110: all presets now request exact model aspect ratios, reject mismatches and allow reference-based legacy/padded draft remake. LinkedIn landscape export 1200x624. 990 tests, lint and build passed; PR #91 merged and production READY. Live private portrait remake and landscape generation verified without padding/cropping; original portrait retained; no approval/publication. No remaining blocker.

2026-11-12 follow-up: CWS-SAVED-SLOT-DRAFTS-20261112 adds private marketing_slot_drafts, safe save_draft action and weekly selection controls. Migration 20261112192039 applied to production; generated path check repaired for slot closure. All publication requires existing separate exact-resource owner confirmation. Release and authenticated Friday review are still pending.

Release follow-up verified: PR #92 merged as 22eb6f2, production READY. Both old failed occurrences resolved as skips; original attempts preserved. Friday draft saved through CWS and restored after reload; exact shared caption and approved 1080x1350 portrait verified on Instagram, Facebook, LinkedIn and Google Business Profile, all Not submitted. No publication.

Portrait preview follow-up: fixed-height contain frames caused white sidebars around unchanged portrait assets. Replaced with full-width auto-height rendering in shared channel component and weekly previews. 999 tests/lint/build pass; release verification pending. No database or image changes.
PR #93 opened for review. Updated branch with main (22eb6f2); preserved concurrent release and saved-slot records in project-log.md/task-ledger.md. The automatic preview for 302842c was canceled; no PR merge or production deployment authorized.
