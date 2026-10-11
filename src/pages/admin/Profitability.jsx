import { useState } from 'react'
import { profitability } from '../../lib/profitability'
import { businessToday } from '../../lib/businessExpenses'
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100)

export default function Profitability({ receipts, expenses, projectCosts, subscriptions, month, onMonthChange, loaded, busy, onAction }) {
  const [confirming, setConfirming] = useState(null)
  const [paidOn, setPaidOn] = useState(businessToday)
  const result = profitability({ receipts, expenses, projectCosts, subscriptions, month })
  const incomplete = result.unpaid > 0 || result.unconfirmed.length > 0
  return <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Profitability">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Am I making money?</h2><p className="mt-1 text-sm text-slate-400">Monthly cash profit / loss from recorded activity.</p></div><label className="text-sm text-slate-300">Accounting month<input type="month" value={month} max={businessToday().slice(0, 7)} onChange={(event) => { if (event.target.value) onMonthChange(event.target.value) }} className="mt-1 block rounded-xl bg-slate-900 p-3" /></label></div>
    {!loaded ? <p className="mt-4 text-slate-400">Load Accounting data to see your balance.</p> : <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Money received', result.income], ['Expenses paid', result.paid], ['Cash profit / loss', result.net]].map(([label, amount]) => <article key={label} className="rounded-2xl bg-slate-900 p-4"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-semibold ${label === 'Cash profit / loss' ? amount < 0 ? 'text-rose-300' : 'text-emerald-300' : ''}`}>{money(amount)}</p></article>)}</div>
      <p className="mt-4 font-semibold">{result.net > 0 ? 'More money came in than went out.' : result.net < 0 ? 'More money went out than came in.' : 'Recorded cash in and cash out are balanced.'}{incomplete ? ' Some costs still need attention below.' : ''}</p>
      <p className="mt-2 text-sm text-slate-400">Received payments minus confirmed expenses paid in this month. Expected revenue is excluded. Annual expenses count in the month paid. This is not your bank balance or final accounting profit; missing costs, taxes, and unpaid owner time are not included.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><p>Unpaid bills through {month}<strong className="block">{money(result.unpaid)}</strong></p><p>Project costs awaiting confirmation<strong className="block">{money(result.unconfirmedCents)}</strong></p><p>Cash result after covering these costs<strong className="block">{money(result.afterKnownBills)}</strong></p></div>
      <p className="mt-2 text-xs text-slate-400">The last figure is a planning scenario: it subtracts unconfirmed costs and unpaid forecasts through the selected month, including earlier bills. It is not a recorded payment result.</p>
      {result.unconfirmed.length > 0 && <div className="mt-4 space-y-2">{result.unconfirmed.map((cost) => <div key={cost.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3"><p>{cost.description} · {money(Number(cost.amount_cents))} · incurred {cost.incurred_on}</p><button disabled={busy} onClick={() => { setConfirming(cost); setPaidOn(businessToday()) }} className="rounded-xl border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Confirm payment date</button></div>)}</div>}
    </>}
    {confirming && <form className="mt-4 rounded-xl border border-orange-300/30 p-4" onSubmit={async (event) => { event.preventDefault(); if (await onAction({ action: 'mark_project_cost_paid', id: confirming.id, paid_on: paidOn })) setConfirming(null) }}><h3 className="font-semibold">Confirm paid: {confirming.description}</h3><label className="mt-3 block text-sm">Project cost payment date<input required type="date" max={businessToday()} value={paidOn} onChange={(event) => setPaidOn(event.target.value)} className="ml-3 rounded-xl bg-slate-900 p-2" /></label><div className="mt-3 flex gap-3"><button disabled={busy} className="rounded-xl bg-orange-300 px-3 py-2 text-slate-950">Confirm project cost paid</button><button type="button" disabled={busy} onClick={() => setConfirming(null)}>Cancel</button></div></form>}
  </section>
}
