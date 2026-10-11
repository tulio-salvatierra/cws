import { useState } from 'react'
import { agreementSummary } from '../../lib/clientAgreements'
import { businessToday } from '../../lib/businessExpenses'
import { dollarsToCents } from '../../lib/money'
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0) / 100)
const button = 'rounded-xl border border-white/20 px-4 py-2 text-sm disabled:opacity-50'
const input = 'mt-1 w-full rounded-xl bg-slate-900 p-3 text-white'

export default function ClientAgreements({ agreements = [], installments = [], obligations = [], receipts = [], clients = [], offers = [], busy, onAction, initialClientId = '' }) {
  const [adding, setAdding] = useState(Boolean(initialClientId))
  const [notice, setNotice] = useState('')
  return <section id="client-agreements" aria-label="Client agreements" className="mt-10 scroll-mt-8">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-semibold">Client products & agreements</h2><p className="mt-2 text-sm text-slate-400">Agreed customer prices, setup payments, and monthly balances. Billing begins when you confirm the website is live.</p></div><button className={button} onClick={() => setAdding(!adding)}>Assign product to client</button></div>
    {notice && <p role="status" className="mt-3 text-emerald-200">{notice}</p>}
    {adding && <AgreementForm clients={clients} offers={offers} obligations={obligations} installments={installments} initialClientId={initialClientId} busy={busy} onCancel={() => setAdding(false)} onSubmit={async body => { const result = await onAction(body); if (result) { setAdding(false); setNotice('Agreement saved. Monthly billing is waiting for website launch.') } return result }} />}
    <div className="mt-4 space-y-4">{agreements.map(a => <AgreementCard key={a.id} agreement={a} client={clients.find(c => c.id === a.client_id)} summary={agreementSummary(a, installments, obligations, receipts)} busy={busy} onAction={onAction} />)}</div>
    {!agreements.length && <p className="mt-3 text-slate-400">No client agreements yet.</p>}
  </section>
}
function AgreementForm({ clients, offers, obligations, installments, initialClientId, busy, onSubmit, onCancel }) {
  const [id] = useState(() => crypto.randomUUID())
  const [v, setV] = useState({ client_id: initialClientId, offer_id: '', product_name: '', setup: '0', monthly: '', term_months: '12', setup_obligation_id: '' })
  const [error, setError] = useState('')
  const change = key => value => setV(old => ({ ...old, [key]: value }))
  const linkedIds = new Set(installments.map(i => i.financial_obligation_id))
  const eligible = obligations.filter(o => o.client_id === v.client_id && o.status === 'expected' && !linkedIds.has(o.id))
  return <form aria-label="New client agreement" className="mt-4 grid gap-3 rounded-2xl border border-white/20 p-5 md:grid-cols-2" onSubmit={async e => {
    e.preventDefault(); setError('')
    const setup = v.setup.trim() === '0' || Number(v.setup) === 0 && v.setup.trim() ? 0 : dollarsToCents(v.setup)
    const monthly = dollarsToCents(v.monthly)
    if (setup === null || setup === undefined || !monthly) { setError('Enter valid setup and monthly amounts.'); return }
    if (!await onSubmit({ action: 'create_client_agreement', id, client_id: v.client_id, offer_id: v.offer_id, product_name: v.product_name, setup_cents: setup, monthly_cents: monthly, term_months: Number(v.term_months), setup_obligation_id: v.setup_obligation_id })) setError('Agreement was not saved. Check the Accounting error above.')
  }}>
    <label>Customer<select required className={input} value={v.client_id} onChange={e => setV({ ...v, client_id: e.target.value, setup_obligation_id: '' })}><option value="">Choose customer</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Product<select className={input} value={v.offer_id} onChange={e => setV({ ...v, offer_id: e.target.value, product_name: offers.find(o => o.id === e.target.value)?.name || '' })}><option value="">Custom product / agreement</option>{offers.map(o => <option key={o.id} value={o.id}>{o.name}{o.status === 'draft' ? ' (draft reference)' : ''}</option>)}</select></label>
    <Field label="Agreed product / service name" required maxLength={200} value={v.product_name} onChange={change('product_name')} />
    <Field label="Setup fee (USD)" required inputMode="decimal" value={v.setup} onChange={change('setup')} />
    <Field label="Monthly price (USD)" required inputMode="decimal" value={v.monthly} onChange={change('monthly')} />
    <Field label="Commitment (months)" required type="number" min="1" max="60" value={v.term_months} onChange={change('term_months')} />
    <label className="md:col-span-2">Existing setup bill / payment<select className={input} value={v.setup_obligation_id} onChange={e => { const o = eligible.find(o => o.id === e.target.value); setV({ ...v, setup_obligation_id: e.target.value, ...(o ? { setup: String(o.amount_cents / 100) } : {}) }) }}><option value="">Create a new setup bill (if setup fee is above $0)</option>{eligible.map(o => <option key={o.id} value={o.id}>{o.description} — {money(o.amount_cents)}</option>)}</select></label>
    <p className="text-sm text-slate-400 md:col-span-2">Link an existing setup payment to avoid counting it twice. Monthly prices here are customer-specific; catalog prices remain unchanged. Saving does not create a Square subscription or charge the customer.</p>
    {error && <p role="alert" className="text-rose-200 md:col-span-2">{error}</p>}
    <div className="flex gap-3 md:col-span-2"><button disabled={busy} className={button}>Save client agreement</button><button type="button" disabled={busy} className={button} onClick={onCancel}>Close</button></div>
  </form>
}
function AgreementCard({ agreement: a, client, summary: s, busy, onAction }) {
  const [launch, setLaunch] = useState(false)
  const [date, setDate] = useState(businessToday)
  const [paying, setPaying] = useState(null)
  const [message, setMessage] = useState('')
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <h3 className="text-xl font-semibold">{client?.name || 'Client'} · {a.product_name}</h3>
    <p className="mt-2 text-orange-200">{s.status} · {a.term_months} months · {money(a.monthly_cents)}/month</p>
    <p className="mt-1 text-sm text-slate-400">Setup: {money(a.setup_cents)} · {a.launch_date ? `Term: ${a.launch_date} to ${s.end} (end exclusive). Renewal requires review.` : 'Term starts on the website launch date.'}</p>
    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['Contract value',s.total],['Received',s.received],['Due now',s.due],['Future payments',s.future],['Overdue',s.overdue]].map(([label,n]) => <div key={label}><dt className="text-sm text-slate-400">{label}</dt><dd className="mt-1 text-xl">{money(n)}</dd></div>)}</dl>
    <p className="mt-4 text-sm text-slate-300">Square: setup pending. Automatic collection and payment sync are not connected. Record confirmed payments below until connected.</p>
    {!a.launch_date && <button disabled={busy} className={`${button} mt-4`} onClick={() => setLaunch(!launch)}>Website is live — start monthly billing</button>}
    {launch && !a.launch_date && <form className="mt-4 space-y-3" onSubmit={async e => { e.preventDefault(); setMessage(''); const result = await onAction({ action: 'launch_client_agreement', id: a.id, launch_date: date }); setMessage(result ? 'Launch recorded. Monthly bills are ready; Square still needs setup.' : 'Launch was not saved. Check the Accounting error above.'); if (result) setLaunch(false) }}>
      <Field label="Actual website launch date" required type="date" min="2000-01-01" max={businessToday()} value={date} onChange={setDate} />
      <p className="text-sm text-slate-400">Creates {a.term_months} monthly bills of {money(a.monthly_cents)}, starting on this date. It does not charge the customer. Confirm the date carefully; it cannot be changed here after saving.</p>
      <button disabled={busy} className={button}>Confirm launch and billing schedule</button>
    </form>}
    {message && <p role="status" className="mt-3">{message}</p>}
    <details className="mt-4"><summary className="cursor-pointer">Payment schedule & history</summary><div className="mt-3 space-y-3">{s.rows.map(row => <div key={row.installment} className="rounded-xl border border-white/10 p-3">
      <div className="flex flex-wrap justify-between gap-2"><div><p>{row.installment === 0 ? 'Setup fee' : `Month ${row.installment} of ${a.term_months}`} · {row.obligation?.due_date || 'No due date'}</p><p className="text-sm text-slate-400">{money(row.received)} received · {money(row.remaining)} open{row.obligation?.status !== 'expected' ? ` · ${row.obligation?.status}` : row.remaining === 0 ? ' · Paid' : ''}</p></div>{row.remaining > 0 && <button disabled={busy} className={button} onClick={() => setPaying(row)}>Record payment for {row.installment === 0 ? 'setup' : `month ${row.installment}`}</button>}</div>
      {row.payments.map(r => <p key={r.id} className="mt-1 text-sm text-emerald-200">{money(r.amount_cents)} · {String(r.received_at).slice(0,10)} · {r.payment_method}{r.reference_note ? ` · ${r.reference_note}` : ''}</p>)}
      {paying?.financial_obligation_id === row.financial_obligation_id && <AgreementPayment key={row.financial_obligation_id} row={row} busy={busy} onCancel={() => setPaying(null)} onSubmit={async body => { const result = await onAction(body); if (result) { setPaying(null); setMessage('Payment saved. The balance and profitability totals have updated.') } return result }} />}
    </div>)}{!a.launch_date && <p className="text-sm text-slate-400">{a.term_months} monthly payments of {money(a.monthly_cents)} will be dated when the website launches.</p>}</div></details>
  </article>
}
function AgreementPayment({ row, busy, onSubmit, onCancel }) {
  const [id] = useState(() => crypto.randomUUID())
  const [v, setV] = useState({ amount: String(row.remaining / 100), received_at: businessToday(), payment_method: 'square', reference_note: '' })
  const [error, setError] = useState('')
  return <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={async e => { e.preventDefault(); setError(''); const amount = dollarsToCents(v.amount); if (!amount || amount > row.remaining) { setError('Enter an amount up to the open balance.'); return } if (!await onSubmit({ action: 'record_agreement_payment', receipt_id: id, financial_obligation_id: row.financial_obligation_id, amount_cents: amount, received_at: v.received_at, payment_method: v.payment_method, reference_note: v.reference_note })) setError('Payment was not confirmed. Refresh before retrying.') }}>
    <Field label="Payment amount (USD)" required value={v.amount} onChange={amount => setV({ ...v, amount })} />
    <Field label="Payment received date" required type="date" max={businessToday()} value={v.received_at} onChange={received_at => setV({ ...v, received_at })} />
    <label>Payment method<select className={input} value={v.payment_method} onChange={e => setV({ ...v, payment_method: e.target.value })}>{['square','zelle','check','cash','bank_transfer','other'].map(m => <option key={m} value={m}>{m}</option>)}</select></label>
    <Field label="Payment reference / note" value={v.reference_note} maxLength={500} onChange={reference_note => setV({ ...v, reference_note })} />
    <p className="text-sm text-slate-400 md:col-span-2">Record only money already received. Selecting Square here does not charge a card.</p>
    {error && <p role="alert" className="text-rose-200">{error}</p>}
    <div className="flex gap-3 md:col-span-2"><button className={button} disabled={busy}>Confirm received payment</button><button type="button" className={button} disabled={busy} onClick={onCancel}>Close</button></div>
  </form>
}
function Field({ label, onChange, ...props }) { return <label>{label}<input className={input} {...props} onChange={e => onChange(e.target.value)} /></label> }
