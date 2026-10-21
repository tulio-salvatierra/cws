# RETIRE-002 verification — 2026-10-21

Status: prerequisites verified; production retirement not applied.

Production project: `cws-os-staging` (`ddbhxqkckzpwzwvnoxqt`). Current main was `eeacd84` at resumption. All 20 target tables remain after the interrupted rehearsal. No active rehearsal query was found. Live counts: published_posts 39, outreach_sends 17, agent_runs 24, channels 2, decisions 1. Shared update_updated_at() remains.

Pre-existing migration parity: 65 remote versions exactly match 65 committed local versions, including 20261021151033 and 20261021152507. The retirement file is intentionally excluded until applied; no broad db push or migration repair was run.

The archive committed as 2727276 contains all 87 rows from the 20 target tables. Its SHA-256 matches the manifest (`c4c8eaca71e51670e8f1731683d2d03936aad35afda12b4101c6f1ac42a801c7`). Fresh production per-table counts and MD5 hashes of sorted to_jsonb(row)::text match the manifest. A fresh local restore into cws_retire_recheck_20261021 matched every count/hash. Actual snapshot capture time is 2026-10-19T01:44:25.239599Z; the 2026-10-17 filename is the supplied ticket identifier. See archive README for the MCP snapshot → typed local replica → native pg_dump method and its scope. It is not a full production schema backup.

All five pgTAP files ran against the current production schema via temporary functions with rollback subtransactions. All 46 assertions passed; fixtures and temporary pgTAP extension changes were rolled back. Corrected unsupported hasnt_policy calls to policies_are with an empty array and table_privs_are argument order to schema/table/role. These were test defects, not production permission changes. The CLI runner itself could not run because Docker is absent.

Full Vitest suite: 430 tests in 57 files passed. ESLint passed. Production build and both landing-page prerenders passed. No new tests were added for the documentation change.

Archive content review found test/brand drafts, no client-linked project, email, phone, or credential patterns. Despite that review, automatic approval review rejected the remote push because the repository is public and the exact archive contains internal business/content records. User has been asked to approve exact public publication or provide a private backup destination. No bypass or indirect publication was attempted.

The guarded migration aborts on changed export counts/hashes or non-NULL retired live FKs, uses short lock/statement timeouts, and does not use CASCADE. It retains agent_runs, channels, decisions, update_updated_at(), live relationship columns, and all newer compliance/email objects. Do not apply it until backup-destination approval is resolved.

Pending: approved backup destination, migration apply and exact remote-version/content parity, regenerated database types, post-drop counts and object inventory, security advisor comparison, post-drop production six-surface/Marketing-preview checks, PR/merge. No publishing or sending is authorized or performed.
