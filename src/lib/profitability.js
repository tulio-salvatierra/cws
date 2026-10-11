import { businessToday, expenseOverview } from './businessExpenses'

export function profitability({ receipts = [], expenses = [], projectCosts = [], subscriptions = [], month, now = new Date() }) {
  const today = businessToday(now)
  const inMonth = (date) => date && date <= today && date.slice(0, 7) === month
  const linked = new Set(expenses.map((expense) => expense.project_cost_id).filter(Boolean))
  const standalone = projectCosts.filter((cost) => !linked.has(cost.id))
  const sum = (rows) => rows.reduce((total, row) => total + Number(row.amount_cents), 0)
  const income = sum(receipts.filter((row) => inMonth(businessToday(new Date(row.received_at)))))
  const paid = sum(expenses.filter((row) => inMonth(row.paid_on))) + sum(standalone.filter((row) => inMonth(row.paid_on)))
  const unconfirmed = standalone.filter((row) => !row.paid_on && row.incurred_on.slice(0, 7) <= month)
  const forecast = expenseOverview(subscriptions, expenses, month)
  const unpaid = sum(forecast.expected)
  return { income, paid, net: income - paid, unpaid, unconfirmed, unconfirmedCents: sum(unconfirmed), afterKnownBills: income - paid - unpaid - sum(unconfirmed) }
}
