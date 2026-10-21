# DECISIONS-001 verification — 2026-10-21

## Database

- Production: `cws-os-staging` (`ddbhxqkckzpwzwvnoxqt`).
- Migration `20261021161456_business_decisions.sql` renames the existing table in place. All legacy columns, identity, provenance, timestamps and self-reference survive; no record is activated or invented.
- Existing row: one proposed before/after, zero active. Hash of the legacy column projection matches before/after: `8d63aa6b5e4a485344f99bb597e21730`.
- 67/67 migration versions match; stored migration SQL matches the local file byte-for-byte.
- Members can read their workspace and insert proposed candidates. Only authenticated owners can update. Anonymous access and deletes are denied. Service role can read/prepare, but cannot update or insert active decisions.
- Activation requires review date and nonblank condition; database stamps the actual owner and time. Active terms and activation evidence are immutable. Workspace and provenance cannot be reassigned.
- 18 new pgTAP assertions pass in rollback rehearsal and after apply. Existing 46 assertions also pass after adapting the legacy decision test to the table rename and owner requirement. All synthetic fixtures, extension installation and test writes roll back.
- The MCP migration tool failed twice with `Invalid or expired requestState`, without applying anything. The installed CLI Management API succeeded. Applied schema SQL and its exact history entry in a single transaction, then checked parity.
- Security advisor findings unchanged: existing seven server-only RLS/no-policy information items, create_workspace warning and password-protection warning.

## Application

- CEO Today GET reads decisions only from the current workspace. Decision-read failures leave department priorities available.
- Reviews appear in a separate CEO Today section, without changing department ordering. Dates use Chicago time, inclusive on the review date. Free-text conditions are assessed by the owner; only an explicit recorded observation creates a condition-based review. No free-text/AI inference is performed.
- Owner UI reviews the exact decision and terms before the separate “I activate this decision” action. It writes with the owner's Supabase JWT and an optimistic timestamp check. Opening/reloading/canceling never writes. No agent activated a production record.
- Review dates and observations can be updated by the owner; active terms require a replacement decision. Proposed candidates can be prepared explicitly through authorized database access; chat is never auto-saved. No separate candidate-creation screen or new Laya evaluator is included.
- App suite, lint and placeholder-env build/prerenders pass. Local build without client env correctly fails the existing production-environment guard.
- Release/live verification: pending.

## External actions

No publish or send action. Production posts 43 and sends 17 remain unchanged after database verification. The private retirement archive remains outside GitHub and is unrelated to this branch.
