# Monthly profitability and draft services

Production deployment: `dpl_Gw8tcWuMVhvVnRLqNHmcHhWuHjEG` (READY), October 11, 2026. Live: https://www.cicerowebstudio.xyz/admin/accounting

Accounting now shows a shared selected month for profitability and business expenses.

Cash profit/loss = all receipts received in the selected Chicago calendar month, less confirmed business expenses paid that month, less confirmed standalone project costs paid that month. Future receipts/payments are excluded. Linked business expense/project cost records count once. Existing project costs have no assumed payment date; owners can confirm one in Accounting.

A separate planning figure subtracts all unpaid expense forecasts and unconfirmed standalone project costs through the selected month, including earlier bills. This scenario is not accrued accounting profit or a bank balance. Expected customer payments and MRR do not count as received income. Annual costs affect the paid month in full. Missing costs, taxes, and unpaid owner time are not inferred.

Accounting reads complete paginated receipt and cost lists rather than the recent-payment display, avoiding truncation of the monthly total.

Six draft offers were added from the owner-provided Negocio Listo artifact dated October 11, 2026: Básico ($149/month), Crecer ($249/month), Destacado ($349/month), Contenido (+$300/month), extra edits ($95/hour), and additional bilingual pages ($150/page). Setup terms and draft billing uncertainty are preserved in each description. Existing customer agreements were not changed. Drafts are displayed as reference in Accounting and remain ineligible for active marketing selection.

Source: https://claude.ai/artifact/3Su6rxY88qtcLxS3BAe16q#349e6c4a-636a

Migration: 20261011195900_project_cost_payment_dates.sql. Validation: 414 tests, lint and production build passed. The new date column was verified in the live database. Release excludes the separately authored untracked Claude client-context files.
