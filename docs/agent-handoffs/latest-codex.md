Task ID: CWS-OUTREACH-SUPPRESSION-031
Agent: Codex
Objective: Suppress mailing-list recipients after Resend bounce or complaint events.

Files inspected:
- server/outreach/webhook.js
- server/outreach/mailing-list-send.js
- server/outreach/subscribers.js
- supabase/migrations/20260820150455_clients_leads_outreach_foundation.sql
- .agents/codex-project-instructions.md
- docs/product-definition.md
- docs/technical-conventions.md
- docs/decisions.md
- docs/learnings.md

Files changed:
- server/outreach/webhook.js
- api/__tests__/outreach-webhook.test.js
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Database or API changes:
- Resend webhook processing now looks up the matching outreach send before updating it.
- Bounce and complaint events for subscriber-backed sends set `mailing_list_subscribers.unsubscribed_at` idempotently.
- Lead-backed sends continue to update delivery status only; no lead lifecycle is changed.
- Unknown message IDs remain a successful ignored response.

Security decisions:
- Suppression runs only after the existing signed Resend webhook verification succeeds.
- The existing service-role client and webhook secret requirements are unchanged.
- No new public route, credential, migration, or policy was added.

Decisions made:
- Treat Resend `email.bounced` and `email.complained` as permanent mailing-list suppression signals.

Assumptions:
- `outreach_sends.subscriber_id` is the authoritative link for mailing-list suppression.
- Existing `unsubscribed_at` is the approved suppression field.

Tests added:
- Bounce event updates send status and suppresses the linked subscriber.
- Lead delivery event updates send status without subscriber suppression.

Deployment:
- Production deployment `dpl_DX1V5pfjmX5Ftxyn6afWwBmSxh3i` is READY at
  `https://cws-two.vercel.app`.

Tests run:
- Full Vitest suite: 35 files, 123 tests passed.
- `npm run lint`: passed with the existing `useDrafts` exhaustive-deps warning.
- `npm run build`: passed, including import-casing validation.

Known issues:
- No real Resend webhook was invoked; tests use mocked verification and Supabase calls.

Recommended next task:
- Use a Resend test event or controlled staging webhook to verify suppression without contacting a real recipient.

Questions requiring Tulio:
- None for implementation; Production verification should remain limited to approved/test recipients.

Project-memory files updated:
- docs/agent-handoffs/latest-codex.md
- docs/project-log.md
- docs/task-ledger.md

Permanent decisions added: None.
Reusable learnings added: None.
Memory updates withheld: None.

Git diff summary:
- Added bounce/complaint suppression to the existing signed webhook handler and two focused tests. Other pre-existing local changes remain untouched.
