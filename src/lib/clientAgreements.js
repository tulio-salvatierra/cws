import { billingDate, businessToday } from './businessExpenses.js'

export function agreementSummary(agreement, installments = [], obligations = [], receipts = [], today = businessToday()) {
  const byId = new Map(obligations.map(o => [o.id, o]))
  const rows = installments.filter(i => i.agreement_id === agreement.id).map(i => {
    const o = byId.get(i.financial_obligation_id)
    const payments = receipts.filter(r => r.financial_obligation_id === i.financial_obligation_id)
    const received = payments.reduce((sum, r) => sum + Number(r.amount_cents), 0)
    const remaining = o?.status === 'expected' ? Math.max(0, Number(o.amount_cents) - received) : 0
    return { ...i, obligation: o, payments, received, remaining }
  }).sort((a, b) => a.installment - b.installment)
  const received = rows.reduce((sum, r) => sum + r.received, 0)
  const due = rows.filter(r => !r.obligation?.due_date || r.obligation.due_date <= today).reduce((sum, r) => sum + r.remaining, 0)
  const overdue = rows.filter(r => r.obligation?.due_date && r.obligation.due_date < today).reduce((sum, r) => sum + r.remaining, 0)
  const future = agreement.launch_date
    ? rows.filter(r => r.obligation?.due_date > today).reduce((sum, r) => sum + r.remaining, 0)
    : Number(agreement.monthly_cents) * agreement.term_months
  const end = agreement.launch_date ? billingDate(agreement.launch_date, 'monthly', agreement.term_months) : null
  return { rows, received, due, overdue, future, remaining: due + future, total: Number(agreement.setup_cents) + Number(agreement.monthly_cents) * agreement.term_months,
    end, status: !agreement.launch_date ? 'Awaiting website launch' : end <= today ? 'Term completed' : 'Active',
    activeMonthly: agreement.launch_date && agreement.launch_date <= today && end > today ? Number(agreement.monthly_cents) : 0 }
}
