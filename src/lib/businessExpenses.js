// Calendar dates stay date-only so billing does not shift with time zones.
export function businessToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function billingDate(anchor, cadence, offset) {
  const [year, month, day] = anchor.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + offset * (cadence === 'annual' ? 12 : 1), 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, last))
  return target.toISOString().slice(0, 10)
}

export function expenseOverview(subscriptions = [], expenses = [], month = businessToday().slice(0, 7)) {
  const expected = []
  for (const subscription of subscriptions.filter((item) => item.status === 'active')) {
    // next_cycle indexes the original billing anchor, preserving Jan 31 / leap-day billing.
    for (let cycle = subscription.next_cycle; cycle < subscription.next_cycle + 1200; cycle += 1) {
      const due = billingDate(subscription.billing_anchor, subscription.cadence, cycle)
      if (due.slice(0, 7) > month) break
      expected.push({ ...subscription, subscription_id: subscription.id, due_on: due, cycle, payable: cycle === subscription.next_cycle })
    }
  }
  const unpaid = expenses.filter((item) => !item.paid_on && item.due_on.slice(0, 7) <= month)
  const paid = expenses.filter((item) => item.paid_on?.slice(0, 7) === month)
  return {
    expected: [...expected, ...unpaid].sort((a, b) => a.due_on.localeCompare(b.due_on)),
    paid,
    monthly_commitment_cents: Math.round(subscriptions.filter((item) => item.status === 'active').reduce((sum, item) => sum + Number(item.amount_cents) / (item.cadence === 'annual' ? 12 : 1), 0)),
    expected_cents: [...expected, ...unpaid].filter((item) => item.due_on.slice(0, 7) === month).reduce((sum, item) => sum + Number(item.amount_cents), 0),
    paid_cents: paid.reduce((sum, item) => sum + Number(item.amount_cents), 0),
  }
}
