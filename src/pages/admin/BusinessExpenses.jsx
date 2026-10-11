import { useEffect, useRef, useState } from 'react'
import { dollarsToCents } from '../../lib/money'
import { billingDate, businessToday, expenseOverview } from '../../lib/businessExpenses'

const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100)
const button = 'rounded-xl border border-white/20 px-4 py-2 text-sm disabled:opacity-50'
const panel = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5'

export default function BusinessExpenses({ subscriptions = [], expenses = [], projects = [], busy, onAction, selectedMonth, onMonthChange }) {
  const [localMonth, setLocalMonth] = useState(() => businessToday().slice(0, 7))
  const month = selectedMonth || localMonth
  const setMonth = onMonthChange || setLocalMonth
  const [editing, setEditing] = useState(null)
  const [payment, setPayment] = useState(null)
  const [notice, setNotice] = useState('')
  const overview = expenseOverview(subscriptions, expenses, month)
  return <section className="mt-10" aria-label="Business expenses">
    <h2 className="text-2xl font-semibold">Subscriptions & expenses</h2>
    <p className="mt-2 text-sm text-slate-400">Budget for recurring costs and confirm actual charges. All amounts are USD.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <Field label="Expense month" type="month" required value={month} onChange={(value) => { if (value) setMonth(value) }} />
      <button className={button} onClick={() => setEditing({ kind: 'subscription' })}>Add subscription</button>
      <button className={button} onClick={() => setEditing({ kind: 'expense' })}>Add one-time expense</button>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {[['Current monthly commitment', overview.monthly_commitment_cents], ['Unpaid forecast this month', overview.expected_cents], ['Expenses paid this month', overview.paid_cents]].map(([label, amount]) => <div className={panel} key={label}><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold">{money(amount)}</p></div>)}
    </div>
    <p className="mt-2 text-xs text-slate-400">Commitment includes annual plans divided by 12 and estimates for variable charges. Paid totals cover this expense register. Linked payments also appear in project costs; do not enter them again in Operations.</p>
    {editing && <ExpenseForm key={editing.id || editing.kind} item={editing} projects={projects} busy={busy} onCancel={() => setEditing(null)} onSubmit={async (body) => { if (await onAction(body)) setEditing(null) }} />}
    <h3 className="mt-6 text-lg font-semibold">Subscription register</h3>
    <div className="mt-3 space-y-3">{subscriptions.length ? subscriptions.map((item) => <article key={item.id} className={panel}>
      <div className="flex flex-wrap justify-between gap-3"><div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-slate-400">{item.category} · {item.status}{item.variable ? ' · Estimated amount' : ''}</p><p className="mt-1 text-sm">{money(item.amount_cents)} / {item.cadence === 'annual' ? 'year' : 'month'}{item.cadence === 'annual' ? ` · ${money(Math.round(item.amount_cents / 12))}/month budget` : ''}</p><p className="mt-1 text-sm text-slate-400">{item.status === 'active' ? `Next unconfirmed bill: ${billingDate(item.billing_anchor, item.cadence, item.next_cycle)}` : 'Forecast stopped; recorded payments are preserved.'}</p></div><button disabled={busy} className={button} onClick={() => setEditing({ ...item, kind: 'subscription' })}>Edit {item.name}</button></div>
    </article>) : <p className="text-sm text-slate-400">No subscriptions yet. Add the services your business pays for each month.</p>}</div>
    <h3 className="mt-6 text-lg font-semibold">Expected bills through {month}</h3>
    <p className="mt-1 text-sm text-slate-400">Includes earlier unconfirmed bills. Confirm the oldest cycle first. Pausing or canceling removes unpaid subscription forecasts; record any final bill as a one-time expense.</p>
    {notice && <p role="status" className="mt-3 rounded-xl bg-emerald-300/10 p-4 text-emerald-200">{notice}</p>}
    <div className="mt-3 space-y-3">{overview.expected.length ? overview.expected.map((item) => <article className={panel} key={`${item.id}-${item.cycle ?? 'once'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-slate-400">Due {item.due_on}{item.due_on < businessToday() ? ' · Unconfirmed / overdue' : ''}</p></div><span>{money(item.amount_cents)}{item.variable ? ' estimated' : ''}</span><button className={button} disabled={busy || item.payable === false} aria-expanded={payment?.id === item.id && payment?.cycle === item.cycle} onClick={() => { setNotice(''); setPayment(item) }}>Mark {item.name} paid</button></div>
      {payment?.id === item.id && payment?.cycle === item.cycle && <PaymentForm item={payment} busy={busy} onCancel={() => setPayment(null)} onSubmit={async (body) => {
        const result = await onAction(body)
        if (result) {
          setPayment(null)
          setNotice(`${item.name}: ${money(body.amount_cents)} recorded as paid on ${body.paid_on}. See Paid in ${body.paid_on.slice(0, 7)} and the profitability totals above.`)
        }
        return result
      }} />}
    </article>) : <p className="text-sm text-slate-400">No unpaid bills forecast through this month.</p>}</div>
    <h3 className="mt-6 text-lg font-semibold">Paid in {month}</h3>
    <div className="mt-3 space-y-3">{overview.paid.length ? overview.paid.map((item) => <article key={item.id} className={`${panel} flex justify-between gap-3`}><div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-slate-400">Paid {item.paid_on} · Bill dated {item.due_on}{item.project_cost_id ? ' · Included in project costs' : ''}</p></div><span>{money(item.amount_cents)}</span></article>) : <p className="text-sm text-slate-400">No confirmed expense payments this month.</p>}</div>
  </section>
}

function ExpenseForm({ item, projects, busy, onCancel, onSubmit }) {
  const subscription = item.kind === 'subscription'
  const [values, setValues] = useState({ name: item.name || '', category: item.category || 'Software', amount: item.amount_cents ? String(item.amount_cents / 100) : '', cadence: item.cadence || 'monthly', billing_anchor: item.billing_anchor || businessToday(), due_on: businessToday(), status: item.status || 'active', variable: item.variable || false, operations_project_id: item.operations_project_id || '' })
  const [error, setError] = useState('')
  const change = (key) => (value) => setValues((current) => ({ ...current, [key]: value }))
  return <form className={`${panel} mt-5 grid gap-3 md:grid-cols-2`} onSubmit={(event) => {
    event.preventDefault()
    const amount = dollarsToCents(values.amount)
    if (!amount || amount > 1000000000) { setError('Enter a positive amount up to $10,000,000 with at most two decimal places.'); return }
    setError('')
    void onSubmit({ ...values, id: item.id, amount_cents: amount, action: subscription ? 'save_expense_subscription' : 'create_business_expense' })
  }}>
    <h3 className="text-lg font-semibold md:col-span-2">{item.id ? 'Edit subscription' : subscription ? 'New subscription' : 'New one-time expense'}</h3>
    {error && <p role="alert" className="text-rose-200 md:col-span-2">{error}</p>}
    <Field required label="Name / vendor" maxLength={200} value={values.name} onChange={change('name')} />
    <Field required label="Category" maxLength={80} value={values.category} onChange={change('category')} />
    <Field required label={values.variable ? 'Estimated amount (USD)' : 'Amount (USD)'} inputMode="decimal" value={values.amount} onChange={change('amount')} />
    {subscription ? <>
      <Choice label="Billing frequency" disabled={Boolean(item.id)} value={values.cadence} onChange={change('cadence')} options={['monthly', 'annual']} />
      <Field required label="First billing date to track" type="date" min="2000-01-01" max="2100-01-01" disabled={Boolean(item.id)} value={values.billing_anchor} onChange={change('billing_anchor')} />
      <Choice label="Subscription status" value={values.status} onChange={change('status')} options={['active', 'paused', 'canceled']} />
      <label className="text-sm"><input type="checkbox" checked={values.variable} onChange={(event) => change('variable')(event.target.checked)} /> Amount varies each cycle</label>
      <p className="text-xs text-slate-400">Changes apply to unpaid forecasts. Resuming starts at the next billing date on or after today. To change the schedule, cancel this entry and add a new subscription. Status changes here do not cancel the vendor service.</p>
    </> : <Field required label="Expense due date" type="date" value={values.due_on} onChange={change('due_on')} />}
    <label className="text-sm text-slate-300">Project (optional)<select className="mt-1 w-full rounded-xl bg-slate-900 p-3" value={values.operations_project_id} onChange={(event) => change('operations_project_id')(event.target.value)}><option value="">General business expense</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    <p className="text-xs text-slate-400">A linked payment creates an absorbed project cost when confirmed.</p>
    <div className="flex gap-3 md:col-span-2"><button disabled={busy} className={button}>Save {subscription ? 'subscription' : 'expense'}</button><button type="button" disabled={busy} className={button} onClick={onCancel}>Close</button></div>
  </form>
}

function PaymentForm({ item, busy, onCancel, onSubmit }) {
  const heading = useRef(null)
  useEffect(() => { heading.current?.focus() }, [])
  const [amount, setAmount] = useState(String(item.amount_cents / 100))
  const [date, setDate] = useState(businessToday)
  const [error, setError] = useState('')
  return <form aria-label={`Confirm payment: ${item.name}`} className={`${panel} mt-5 grid gap-3 md:grid-cols-2`} onSubmit={async (event) => {
    event.preventDefault()
    const amountCents = dollarsToCents(amount)
    if (!amountCents || amountCents > 1000000000) { setError('Enter a valid positive payment amount.'); return }
    setError('')
    try {
      const result = await onSubmit({ action: 'pay_business_expense', kind: item.subscription_id ? 'subscription' : 'expense', id: item.subscription_id || item.id, cycle: item.cycle, amount_cents: amountCents, paid_on: date })
      if (!result) setError('Payment was not confirmed. Check the Accounting error above and refresh before retrying.')
    } catch {
      setError('Payment could not be confirmed. Refresh to check whether it saved before retrying.')
    }
  }}>
    <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold md:col-span-2">Confirm payment: {item.name}</h3>
    <p className="text-sm text-slate-400 md:col-span-2">Review the amount and date, then confirm below to save this payment. Bill dated {item.due_on}.</p>
    {error && <p role="alert" className="text-rose-200">{error}</p>}
    <Field required label="Actual amount paid (USD)" inputMode="decimal" value={amount} onChange={setAmount} />
    <Field required label="Date paid" type="date" max={businessToday()} value={date} onChange={setDate} />
    <div className="flex gap-3 md:col-span-2"><button disabled={busy} className={button}>{busy ? 'Saving payment…' : 'Confirm expense payment'}</button><button type="button" disabled={busy} className={button} onClick={onCancel}>Close</button></div>
  </form>
}

function Field({ label, onChange, ...props }) { return <label className="text-sm text-slate-300">{label}<input className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white disabled:opacity-50" onChange={(event) => onChange(event.target.value)} {...props} /></label> }
function Choice({ label, options, onChange, ...props }) { return <label className="text-sm text-slate-300">{label}<select className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white disabled:opacity-50" onChange={(event) => onChange(event.target.value)} {...props}>{options.map((value) => <option key={value} value={value}>{value}</option>)}</select></label> }
