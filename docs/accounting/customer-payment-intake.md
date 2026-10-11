# Customer-first payment intake

Released October 11, 2026 to production deployment `dpl_H4prGF9u7CikAegKzk8f4iMGoVjG`.

Accounting → Record payment received now starts with Customer. Payment covers lists only that customer's outstanding items, plus New payment. Changing customers clears the selected item and project.

Existing items retain partial-payment and overpayment checks. New payment records an equal expected amount and receipt atomically, with an optional matching customer project. It represents only the amount entered; it does not infer a larger contract or remaining balance. A stable receipt ID prevents a retried form from creating duplicate records.

Migration: `20261011192034_customer_payment_intake.sql`, applied to the verified live database. Only the server role can call the new function, and it validates workspace ownership and client/project relationships.

Validation: 406 tests passed, lint and build passed, isolated database verification passed, and a live transaction verified creation and retry deduplication before rollback. No actual customer receipt was entered during verification.

Run the isolated SQL verification with `node scripts/verify-customer-payment.mjs /absolute/path/to/pglite/dist/index.js`.
