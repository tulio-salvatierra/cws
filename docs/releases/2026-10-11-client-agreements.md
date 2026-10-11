# Client agreements release

Production code: fe80405. Vercel deployment dpl_2aS2VMgjEPDGLXG4pB6uF4NV69z7 reached READY. Verified authenticated custom-domain Accounting UI.

Schema: 20261011214948_client_service_agreements applied to the live database ddbhxqkckzpwzwvnoxqt. Owner-only RPCs create agreements, confirm launch, and record receipts. New tables have workspace-scoped RLS reads and restricted writes. No new security advisor findings; existing project advisories unchanged.

Upholstery of Chicago: custom website/monthly service agreement, $300 setup linked to its existing obligation and receipt, $150/month for 12 months starting on actual website launch. Live UI verified $2,100 contract value, $300 received, $0 due, $1,800 future, $0 overdue, no launch date. No Square subscription created or customer charged.

Usage: Accounting > Client products & agreements > Assign product to client. Select a catalog reference or custom product, enter the customer-specific terms, and link an existing setup bill when applicable. Operations project detail links directly to Accounting with that customer selected. Confirm actual launch only when the website goes live; it creates 12 monthly obligations at original calendar anniversary dates. Record partial/full received payments within Payment schedule & history. Receipts feed existing Accounting and profitability.

Square remains explicitly pending: no credentials, automatic collection, webhook sync, or provider reconciliation is implemented. Setup in Square and its integration require a subsequent release. Catalog draft references remain draft and do not activate products. Agreement term dates and amounts are fixed once saved in this initial release. No automatic renewals or contract cancellation workflow. Contract MRR joins the Accounting summary only during the active term; existing CEO read-model loading has not been expanded to include agreements.

Validation: full existing suite plus balance tests 65 files/418 tests passed; additional UI tests 2/2 passed. Lint and production build passed. PGlite verifies setup reuse, create/launch/receipt idempotency, mismatched retries, cross-client rejection, reused setup rollback, month-end schedule, partial/overpayment protection, and authenticated-role RPC denial. Live service-role launch smoke test confirmed exactly 12 bills totaling $1,800 within a transaction that was rolled back; subsequent read confirmed the real agreement remains prelaunch with only its existing setup bill.

Unrelated concurrent untracked clientProjects files and migration were excluded from the production archive and left untouched.
