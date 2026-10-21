# RETIRE-002 verification — 2026-10-21

Production: `cws-os-staging` (`ddbhxqkckzpwzwvnoxqt`). Migration `20261021155615_retire_v1_dormant_layer` applied successfully. No publishing, email, billing, or other external action was performed.

## Private export and restore

The exact archive, typed inspection schema, and manifest are saved in `/Users/tuliosalvatierra/Documents/CWS-backups`, with directory mode 0700 and files 0600. The owner explicitly requires keeping the archive out of GitHub. A clean branch was created from current main without any archive-bearing commit; a gitignore rule prevents accidental inclusion. The original rejected push did not run.

The archive has all 20 tables and 87 rows. Its SHA-256 is `c4c8eaca71e51670e8f1731683d2d03936aad35afda12b4101c6f1ac42a801c7`. Immediately before dropping, every production table count and MD5 of sorted `to_jsonb(row)::text` matched the private manifest in UTC. The exact files were then restored from the private folder into a fresh local PostgreSQL database; every count/hash matched again.

The 2026-10-17 filename is the supplied ticket identifier. Actual source capture time is 2026-10-19T01:44:25.239599Z. Direct IPv6 PostgreSQL access timed out and the pooler rejected CLI temporary credentials, so the export uses a consistent read-only MCP snapshot, exact typed local replica, then native PostgreSQL 17 `pg_dump --data-only --column-inserts --disable-triggers`. This method is disclosed in the private manifest. The inspection schema intentionally omits production constraints/RLS/triggers/defaults: this is a verified data archive, not a full production schema backup. Historical committed migrations preserve the schema history.

## Database verification

All 20 retirement tables and `topic_performance` are gone. All 15 dedicated functions were targeted by explicit DROP FUNCTION statements; no CASCADE was used. Retained: `agent_runs` (24 rows), `channels` (2), `decisions` (1), and `update_updated_at()`. Immediately after retirement, `published_posts` was still 39 rows and `outreach_sends` was still 17. Marketing GET reconciliation during the preview check subsequently recorded four platform results for an existing attempt created at 2026-10-21T11:35:57.535876Z, taking the publication ledger to 43 rows; sends stayed 17. This is database write-back of provider status, not a new publish action. No Marketing attempt was created during retirement or browser verification. All four unused nullable relationship columns remain, all NULL; their four retiring-parent FKs were removed. Newer compliance/email migrations and objects were retained.

The guarded migration locks target/live relationship tables briefly, checks every archived table count/content hash, and aborts on any changed export data or non-NULL live relationship. It uses 5-second lock and 30-second statement timeouts.

Remote history assigned version `20261021155615`; the local file was renamed to match. The remote history contains one statement identical byte-for-byte to the applied local SQL (SHA-256 `69c6e642f786bf7dbd431f75252496ad6092e8625bde1adfa7457f1856287de1`). There are 66 remote migrations and 66 local files. Final committed version-set verification is recorded in the handoff. No migration repair or broad db push was used.

## Tests and advisors

All five repository pgTAP files passed before and after retirement: 46 assertions each run. They ran against the production schema through temporary session functions with rollback subtransactions; fixtures and temporary pgTAP extension changes were rolled back. Corrected unsupported `hasnt_policy` assertions to `policies_are` with empty policy arrays and corrected `table_privs_are` arguments to schema/table/role. These were pre-existing test defects, not permission changes. Docker is unavailable, so the CLI pgTAP wrapper could not run; pgTAP itself did run.

430 Vitest tests in 57 files, ESLint, production build, both landing-page prerenders, and diff checks passed before migration. Post-type-generation validation also passed: 430 tests in 57 files, ESLint, production build, both prerenders and diff checks.

Security advisors are unchanged from the immediate pre-drop baseline. No permission or Auth configuration was changed. Regenerated production database types are in `src/types/supabase.ts` and contain no archived row data.

## Product scope

§6 now records completed retirement and the owner-authorized private backup location. §9a and DEC-039 grandfather only the existing advisory Marketing assessment; new in-app AI features remain gated. The assessment cannot approve or publish.

## Production browser checks

Authenticated Chrome checks after the drop passed for all six surfaces: CEO Today priorities and content reviews; Sales queue; Operations readiness projects; Accounting summaries/registers; Compliance requirements (including newer checklist items); Marketing slots, retained assessment history and channel context. Marketing overview showed the image/caption preview with destinations verified; LinkedIn tab showed both slot image/caption previews and its verified destination. Only navigation and channel-tab controls were used. No publish/send/review-confirmation or owner business-record edit occurred. Existing Marketing GET reconciliation did persist the four previously confirmed destination outcomes described above.
