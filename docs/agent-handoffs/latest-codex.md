Task ID: CWS-EVERGREEN-FORMATS-20261109
Agent: Codex
Objective: Add destination-aware image generation/export to existing Evergreen Creative Studio.
Files inspected: Product definition, technical conventions, decisions, learnings, prior handoff; creative API/UI/prompts, offer catalog, publisher upload, existing creative migration/types/tests.
Files changed: See docs/marketing/evergreen-image-formats.md; shared preset module, normalizer, creative API/UI/prompts, upload extension handling, migration/types, dependency lock, tests and project records.
Database or API changes: Prepared 20261109172902_evergreen_image_formats.sql; applied to production with exact remote version. Existing generation accepts format_id; output includes format_id/image_validation. No new endpoint.
Security decisions: Owner/workspace checks retained; invalid presets rejected before generation; no crop; strict raster/size validation; Story/Reel/non-shared variants cannot be approved into the feed scheduler; no external action performed.
Decisions made: Conservative supported generation sizes with destination composition prompts; JPEG exports <=5,000,000 bytes; white contain padding on ratio mismatch; existing model settings preserved.
Assumptions: Shared scheduler still publishes feed images only; 1200x628 LinkedIn landscape is download-only due to shared-feed ratio ceiling.
Tests added: 28 processor, handler and UI cases; original prompt expectations updated.
Tests run: 949 tests / 97 files pass; lint pass; full placeholder-env build and public prerender pass; isolated PostgreSQL migration checks pass; git diff --check pass.
Known issues: Production migration, PR #85 merge and READY production deployment verified. Live authenticated Instagram Story generation/storage verified November 10: exact 1080x1920 JPEG, 430901 bytes, private storage, padded without cropping; ready/needs_review with no approval references. Conservative generation sizes may require padding. Existing 40 dependency advisories unchanged; existing bundle warning.
Recommended next task: None for this release; private draft awaits owner review. No approval or publishing performed.
Questions requiring Tulio: None for local implementation.
Project-memory files updated: latest-codex.md, project-log.md, task-ledger.md.
Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: None; migration/deployment/live verification complete.
Git diff summary: Isolated current-main checkout at 277b1c3, branch codex/evergreen-image-formats; no pre-existing edits; PR #85 merged as 484006a; production dpl_GHbfn7fLBb6EDFLWdaNo6RXLXSiU READY. Original older CWS checkout remains untouched.

Follow-up CWS-STORY-FULL-FRAME-20261110: native 9:16 image tool output and composition-reference remakes implemented; 954 tests, lint and full build passed; PR #90 merged, production READY, reference-based live remake verified at 1080x1920 JPEG with no padding/cropping. Original retained; nothing approved or published. No migration required or publishing authorized.

Current follow-up CWS-FEED-FULL-FRAME-20261110: all presets now request exact model aspect ratios, reject mismatches and allow reference-based legacy/padded draft remake. LinkedIn landscape export 1200x624. 990 tests, lint and build passed; PR #91 merged and production READY. Live private portrait remake and landscape generation verified without padding/cropping; original portrait retained; no approval/publication. No remaining blocker.

2026-11-12 follow-up: CWS-SAVED-SLOT-DRAFTS-20261112 adds private marketing_slot_drafts, safe save_draft action and weekly selection controls. Migration 20261112192039 applied to production; generated path check repaired for slot closure. All publication requires existing separate exact-resource owner confirmation. Release and authenticated Friday review are still pending.

Release follow-up verified: PR #92 merged as 22eb6f2, production READY. Both old failed occurrences resolved as skips; original attempts preserved. Friday draft saved through CWS and restored after reload; exact shared caption and approved 1080x1350 portrait verified on Instagram, Facebook, LinkedIn and Google Business Profile, all Not submitted. No publication.

Portrait preview follow-up: fixed-height contain frames caused white sidebars around unchanged portrait assets. Replaced with full-width auto-height rendering in shared channel component and weekly previews. 999 tests/lint/build pass; release verification pending. No database or image changes.
