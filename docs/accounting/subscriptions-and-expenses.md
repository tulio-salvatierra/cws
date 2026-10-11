# Subscriptions and expenses

Implemented in Accounting. This change is local until the migration and application are released.

## Release order

1. Confirm the intended hosted database and deploy target from current configuration.
2. Apply `supabase/migrations/20261011185931_business_expenses.sql` before deploying the application. The new Accounting read requires both new tables.
3. Deploy the application and verify with an authenticated workspace owner.

## Owner walkthrough

1. Open Accounting → Subscriptions & expenses → Add subscription.
2. Enter a name, category, amount, monthly/annual frequency, and the first bill you want tracked. Optionally link a project. Save.
3. An annual $240 subscription shows $20/month commitment, with a $240 renewal forecast in the billing month.
4. Use Mark paid on the oldest expected bill, confirm the actual amount and paid date, then save. A variable estimate of $20 can be confirmed as $23.49.
5. Verify the charge appears in the paid month and the next billing cycle advances. Repeating the same confirmation is rejected.
6. Edit the subscription to change its estimated amount or status. Paid records retain their original amount, category, and project link.
7. Add one-time expense for non-recurring costs, then confirm payment in the same way.

## Meaning of the totals

- Current monthly commitment: active monthly plans plus one-twelfth of annual plans. Variable charges use estimates.
- Unpaid forecast this month: unpaid projected bills due in the selected month. Older unconfirmed bills remain in the list but not this month's total.
- Expenses paid this month: actual confirmed payments from this expense register, grouped by payment date.
- These totals are not a consolidated business profit or bank-balance report. Existing Operations costs are not automatically classified as paid expenses.
- A linked confirmed payment creates an absorbed Operations project cost atomically. Do not manually re-enter that same cost in Operations. This version does not initiate client reimbursements.

## Subscription lifecycle

Billing uses the original calendar-day anchor; January 31 becomes February 28 and then March 31. Billing frequency and anchor are immutable after creation. Cancel and create a replacement to change the schedule.

Pausing/canceling stops all unpaid projections, including overdue unconfirmed cycles. If a final bill remains payable, enter it as a one-time expense. Resuming skips paused cycles and starts on the next anchored date on or after today. These status changes only affect CWS records, not the vendor subscription.

Expected cycles are computed when viewed; no scheduler or automatic payment is used. Payment records are persisted. Forecasts use current subscription details and are not historical budget snapshots.

## Validation

- Full Vitest suite: 62 files / 404 tests passed.
- Lint and production build passed (existing bundle-size and lottie eval warnings remain).
- Migration and payment functions executed in an ephemeral PGlite database with minimal prerequisite tables, including duplicate rejection, workspace separation, read policies, owner-only RPC access, project cost linking, and pause/resume.
- Repeat the isolated database check with `node scripts/verify-business-expenses.mjs /absolute/path/to/pglite/dist/index.js` after installing `@electric-sql/pglite` into a temporary directory. This check does not connect to a hosted database and does not substitute for post-release verification against the full schema.
