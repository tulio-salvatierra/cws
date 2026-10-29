# MANUAL-BUSINESS-CARD-LEADS-001 — release handoff, 2026-10-29

- Objective: make the existing authenticated manual lead form easy to reach when the owner has a local business card, without creating a second Sales workflow.
- Change: adds **Add business-card lead** beside **Find prospects** in `/admin/sales`. The link opens the existing `/admin/leads` form.
- Existing form behavior retained: the owner enters a name, company, and at least one phone or email; saving creates only a workspace-scoped lead. It does not inspect a website, prepare a brief, send email, or place a call. Any later outreach remains a separate exact owner action.
- Boundaries: no schema or migration; no new API route; no provider call; no AI call; no Sales ranking change; no lead was created during implementation.
- Verification: focused Sales UI regression plus full suite pass (`788` tests across `77` files); lint and production build pass. Build used the existing local public Supabase build configuration without copying or displaying credentials. `git diff --check` passes.
- Source: `837ceb348e294490ad3dd831fcbc9c1d6a0b5de3` initially contains the runtime/test change. This handoff and the task-ledger update must be included in the merge commit.
- Release verification required: after merge, open authenticated `/admin/sales`, verify the new link resolves to `/admin/leads`, and stop before entering or saving any business-card data. Confirm no provider/outreach activity occurred.
- Release verification complete: PR #55 merged to `main` at `eca76f54664886c60c52e55678852d4873b4b864`. Production deployment `dpl_56EiMMXdUYiWGGnUpzK63Jb8AQxM` reached `READY`; authenticated `/admin/sales` displayed exactly one **Add business-card lead** link with `href="/admin/leads"`. The form was not opened or submitted. No lead data, provider, AI, outreach, or migration action occurred.
